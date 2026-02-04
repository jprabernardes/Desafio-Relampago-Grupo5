export interface StudentProfile {
  user_id: number;
  plan_type: string; // ex: "fit", "fit_pro", "fit_diamond"
  active: boolean;
  payment_day?: number;
  paid_until?: string | null;
  last_payment_at?: string | null;
}
