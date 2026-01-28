export interface GymClass {
  id?: number;
  name: string;
  date: string;
  time: string;
  slots_limit: number;
  instructor_id: number;
  created_at?: string;
}
