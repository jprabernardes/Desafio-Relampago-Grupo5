export interface Plan {
  id?: number;
  code: string;                 // "fit", "fit_pro"...
  name: string;                 // "Fit Pro"
  price_cents: number;
  duration_days: number;
  description?: string | null;
  benefits_json?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}
