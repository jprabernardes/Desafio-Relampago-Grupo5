export interface Plan {
  id: number;
  name: string;
  price_cents: number;
  duration_days: number;
  description?: string | null;
  benefits_json?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}
