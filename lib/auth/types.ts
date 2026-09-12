export type AuthRole = "operator" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
};

export type AuthSession = {
  access_token: string;
  expires_in: number;
  user: AuthUser;
};

export type BackendStation = {
  id: string;
  name: string;
  code: string;
  operator: string;
  area_type: string;
  latitude: number;
  longitude: number;
  entrance_count: number;
};

export type PremiumRange = { p10: number; p90: number };

export type DeepAnalysis = {
  station: {
    id: string;
    name: string;
    code: string;
    operator: string;
    area_type: string;
    entrance_count: number;
  };
  spending_gap: Array<{
    time_slot: string;
    potential: PremiumRange;
    captured: PremiumRange;
    gap: PremiumRange;
    computed_at: string;
  }>;
  totals: {
    potential: PremiumRange;
    captured: PremiumRange;
    gap: PremiumRange;
    slots_with_data: number;
    slots_expected: number;
    capture_rate_p50: number | null;
  };
  category_gaps: Array<{
    category: string;
    demand_in_area: boolean;
    available_in_station: boolean;
    missing: boolean;
  }>;
  rent_flow_plots: Array<{
    plot_id: string;
    offered_rent: number;
    measured_flow: number;
    index: number;
    is_outlier: boolean;
  }>;
  event_potential: Array<{
    zone_id: string;
    activation_score: number;
    recommended_slot: string;
  }>;
  confidence: Array<{
    zone_id: string;
    sample_count: number;
    is_thin_sample: boolean;
    confidence_score: number;
  }>;
  coverage: {
    thin_sample_zones: number;
    total_zones: number;
    struk_total: number;
    struk_ambiguous: number;
    struk_usable: number;
    has_complete_slots: boolean;
  };
};
