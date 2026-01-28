export interface Training {
  id?: number;
  instructor_id: number;
  name: string;
  finish: boolean;
  completed_date?: string;
}

export interface TrainingExercise {
  exercise_id: number;
  training_id: number;
}

export interface TrainingUser {
  training_id: number;
  user_id: number;
}
