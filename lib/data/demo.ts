import type { MockDemoData } from "./types";

export const MOCK_DEMO_DATA: MockDemoData = {
  retail: [
    { id: "mgg-famima", name: "Famima Manggarai", kind: "existing", station_id: 1, latitude: -6.2102422, longitude: 106.8502918, status: "tersedia", category: "ritel", note: "Retail tersedia di sisi utara kawasan Stasiun Manggarai." },
    { id: "mgg-indomaret", name: "Indomaret Manggarai", kind: "existing", station_id: 1, latitude: -6.2100029, longitude: 106.8502013, status: "tersedia", category: "ritel", note: "Retail kebutuhan harian yang sudah beroperasi." },
    { id: "mgg-potential-1", name: "Potensi toko 1", kind: "potential", station_id: 1, latitude: -6.2102975, longitude: 106.8506663, status: "kandidat", category: "apotek", note: "Kandidat gerai apotek berformat kecil; estimasi pendapatan belum tersedia." },
    { id: "mgg-potential-2", name: "Potensi toko 2", kind: "potential", station_id: 1, latitude: -6.2104435, longitude: 106.8508145, status: "kandidat", category: "fnb", note: "Kandidat gerai makanan dan minuman cepat saji." },
    { id: "mgg-potential-3", name: "Potensi toko 3", kind: "potential", station_id: 1, latitude: -6.2105242, longitude: 106.8507756, status: "kandidat", category: "jasa", note: "Kandidat layanan titip atau kurir." },
    { id: "mgg-potential-4", name: "Potensi toko 4", kind: "potential", station_id: 1, latitude: -6.2104545, longitude: 106.8508085, status: "kandidat", category: "ritel", note: "Kandidat retail kemasan; perlu validasi ukuran petak." },
    { id: "mgg-potential-5", name: "Potensi toko 5", kind: "potential", station_id: 1, latitude: -6.2105015, longitude: 106.8508356, status: "kandidat", category: null, note: "Estimasi potensi pendapatan belum tersedia; kategori kandidat belum dipilih." },
    { id: "mgg-shopfront-1", name: "Ruko depan Stasiun Manggarai 1", kind: "shopfront", station_id: 1, latitude: -6.2097402, longitude: 106.8502965, status: "perlu_verifikasi", category: null, note: "Status ketersediaan dan harga sewa belum diverifikasi." },
    { id: "mgg-shopfront-2", name: "Ruko depan Stasiun Manggarai 2", kind: "shopfront", station_id: 1, latitude: -6.2096379, longitude: 106.8504967, status: "perlu_verifikasi", category: null, note: "Ruko kawasan depan stasiun; perlu survei properti lanjutan." },
    { id: "mgg-shopfront-3", name: "Ruko depan Stasiun Manggarai 3", kind: "shopfront", station_id: 1, latitude: -6.2100542, longitude: 106.8510737, status: "perlu_verifikasi", category: null, note: "Ruko kawasan depan stasiun; belum masuk perhitungan spending gap." },
  ],
  // Angka nyata: demand_share = demand_count POI (dalam 800 m) dinormalisasi
  // per simpul; gerai_count = gerai di dalam stasiun (amatan konversi lapangan);
  // status mengikuti ambang gerai (>=3 terisi, 1-2 kurang, 0 kosong).
  // Manggarai total demand 93 POI; Sudirman 125 POI.
  category_statuses: [
    { station_id: 1, category: "fnb", status: "kurang", demand_share: 0.2258, gerai_count: 1 },
    { station_id: 1, category: "ritel", status: "terisi", demand_share: 0.043, gerai_count: 3 },
    { station_id: 1, category: "apotek", status: "kosong", demand_share: 0.1398, gerai_count: 0 },
    { station_id: 1, category: "jasa", status: "kosong", demand_share: 0.5914, gerai_count: 0 },
    { station_id: 1, category: "lainnya", status: "kosong", demand_share: 0, gerai_count: 0 },
    { station_id: 2, category: "fnb", status: "terisi", demand_share: 0.24, gerai_count: 4 },
    { station_id: 2, category: "ritel", status: "kurang", demand_share: 0.16, gerai_count: 1 },
    { station_id: 2, category: "apotek", status: "kosong", demand_share: 0.032, gerai_count: 0 },
    { station_id: 2, category: "jasa", status: "kosong", demand_share: 0.568, gerai_count: 0 },
    { station_id: 2, category: "lainnya", status: "kurang", demand_share: 0, gerai_count: 1 },
  ],
  recommendations: [
    { id: "rec-mgg-1", station_id: 1, point_id: 11, retail_location_id: "mgg-potential-1", title: "Uji gerai apotek berformat kecil", category: "apotek", slot: "pagi", gap_p50: 1180000, confidence: 0.86, sampel_tipis: false, reason: "Permintaan kebutuhan mendesak terbaca, sementara belum ada gerai apotek di dalam simpul.", next_measurement: "Ukur ulang setelah 6 minggu" },
    { id: "rec-sdr-1", station_id: 2, point_id: 24, retail_location_id: null, title: "Tambah retail kebutuhan cepat", category: "ritel", slot: "sore", gap_p50: 940000, confidence: 0.82, sampel_tipis: false, reason: "Arus pulang kerja tinggi dan pasokan retail masih terbatas di pintu ini.", next_measurement: "Ukur ulang setelah 6 minggu" },
    { id: "rec-mgg-2", station_id: 1, point_id: 12, retail_location_id: "mgg-potential-3", title: "Uji layanan titip dan kurir", category: "jasa", slot: "siang", gap_p50: 710000, confidence: 0.76, sampel_tipis: false, reason: "Koridor transit memiliki dwell-time tinggi dan kategori jasa masih kurang.", next_measurement: "Ukur ulang setelah 8 minggu" },
    { id: "rec-sdr-2", station_id: 2, point_id: 23, retail_location_id: null, title: "Lengkapi sampel pintu 3", category: "apotek", slot: "malam", gap_p50: null, confidence: 0.48, sampel_tipis: true, reason: "Data malam belum memadai sehingga lokasi belum layak diberi estimasi.", next_measurement: "Tambah 2 blok pencacahan" },
  ],
  evidence: [
    [11, 31, 27, 4, 0.77], [12, 25, 22, 3, 0.72], [13, 9, 7, 2, 0.49],
    [21, 34, 30, 4, 0.82], [22, 28, 24, 4, 0.75], [23, 8, 6, 2, 0.48],
    [24, 36, 32, 4, 0.84],
  ].map(([pointId, total, readable, ambiguous, confidence]) => ({
    point_id: pointId,
    types: ["struk", "gerai", "properti"],
    sources: ["MAPID Community Maps", "Struk Go", "Survei lapangan"],
    dataset: "Isi Stasiun Prototype Survey v0.1",
    surveyed_at: pointId < 20 ? "2026-08-23T08:30:00+07:00" : "2026-08-24T08:30:00+07:00",
    photo_label: "Foto sumber telah disiapkan; identitas pribadi diredaksi",
    receipt_total: total,
    receipt_readable: readable,
    receipt_ambiguous: ambiguous,
    confidence,
    mock: true,
  })),
};
