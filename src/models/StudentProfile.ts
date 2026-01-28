export interface StudentProfile {
  user_id: number;
  plan_type: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  active: boolean;
}
