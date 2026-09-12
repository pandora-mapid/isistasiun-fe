import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "operator@example.com",
  role: "operator",
};

const stations = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Manggarai",
    code: "MRI",
    operator: "KAI",
    area_type: "mixed",
    latitude: -6.21,
    longitude: 106.85,
    entrance_count: 4,
  },
];

const analysis = {
  station: stations[0],
  spending_gap: [
    {
      time_slot: "morning",
      potential: { p10: 1_000_000, p90: 1_400_000 },
      captured: { p10: 300_000, p90: 500_000 },
      gap: { p10: 700_000, p90: 900_000 },
      computed_at: "2026-09-12T00:00:00Z",
    },
  ],
  totals: {
    potential: { p10: 1_000_000, p90: 1_400_000 },
    captured: { p10: 300_000, p90: 500_000 },
    gap: { p10: 700_000, p90: 900_000 },
    slots_with_data: 1,
    slots_expected: 4,
    capture_rate_p50: 0.33,
  },
  category_gaps: [
    {
      category: "apotek",
      demand_in_area: true,
      available_in_station: false,
      missing: true,
    },
  ],
  rent_flow_plots: [
    {
      plot_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      offered_rent: 5_000_000,
      measured_flow: 700,
      index: 7142,
      is_outlier: true,
    },
  ],
  event_potential: [],
  confidence: [
    {
      zone_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      sample_count: 12,
      is_thin_sample: false,
      confidence_score: 0.84,
    },
  ],
  coverage: {
    thin_sample_zones: 0,
    total_zones: 1,
    struk_total: 20,
    struk_ambiguous: 2,
    struk_usable: 18,
    has_complete_slots: false,
  },
};

function envelope<T>(data: T, message = "ok") {
  return { success: true, message, data };
}

async function fulfillJSON(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockPremiumData(page: Page) {
  await page.route("**/api/v1/stations", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await fulfillJSON(route, envelope(stations));
  });
  await page.route("**/api/v1/premium/deep-analysis/*", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await fulfillJSON(route, envelope(analysis));
  });
}

test("pengunjung anonim dialihkan dari premium ke login", async ({ page }) => {
  await page.goto("/premium");
  await expect(page).toHaveURL(/\/login\?next=%2Fpremium$/);
  await expect(
    page.getByRole("heading", {
      name: "Masuk untuk membaca lapisan yang lebih dalam.",
    }),
  ).toBeVisible();
});

test("operator dapat login dan membuka deep analysis", async ({ page }) => {
  await mockPremiumData(page);
  await page.route("**/api/v1/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: user.email,
      password: "correct-password",
    });
    await fulfillJSON(
      route,
      envelope({ access_token: "access-one", expires_in: 900, user }),
    );
  });

  await page.goto("/login?next=/premium");
  await page.getByLabel("Email operator").fill(user.email);
  await page.getByLabel("Kata sandi").fill("correct-password");
  await page.getByRole("button", { name: "Masuk ke analisis premium" }).click();

  await expect(page).toHaveURL(/\/premium$/);
  await expect(
    page.getByRole("heading", { name: "Deep analysis per simpul" }),
  ).toBeVisible();
  await expect(page.getByText("Peluang yang belum terisi")).toBeVisible();
  await expect(page.getByText("apotek", { exact: true })).toBeVisible();
});

test("sesi dipulihkan dan request 401 direfresh satu kali", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("isi_stasiun_session", "1");
  });

  let refreshCount = 0;
  await page.route("**/api/v1/auth/refresh", async (route) => {
    refreshCount += 1;
    await fulfillJSON(
      route,
      envelope({
        access_token: `access-${refreshCount}`,
        expires_in: 900,
        user,
      }),
    );
  });
  await page.route("**/api/v1/stations", async (route) => {
    await fulfillJSON(route, envelope(stations));
  });

  let analysisCount = 0;
  await page.route("**/api/v1/premium/deep-analysis/*", async (route) => {
    analysisCount += 1;
    if (analysisCount === 1) {
      await fulfillJSON(
        route,
        { success: false, message: "expired", data: null },
        401,
      );
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer access-2");
    await fulfillJSON(route, envelope(analysis));
  });

  await page.goto("/premium");
  await expect(page.getByText("Bukti struk layak")).toBeVisible();
  expect(refreshCount).toBe(2);
  expect(analysisCount).toBe(2);
});
