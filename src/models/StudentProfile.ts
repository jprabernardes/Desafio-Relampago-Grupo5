export interface StudentProfile {
  user_id: number;
  plan_id: number;      // FK para plans.id
  active: boolean;
}
