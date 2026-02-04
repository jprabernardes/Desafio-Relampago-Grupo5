export interface StudentProfile {
  user_id: number;
  plan_type: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  active: boolean;
  payment_day?: number;
  paid_until?: string | null;
  last_payment_at?: string | null;
}
