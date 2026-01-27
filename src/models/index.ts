// src/models/index.ts

/**
 * Interface para Usuário
 */
export interface User {
  id?: number;
  nome: string;
  email: string;
  senha: string;
  role: 'administrador' | 'recepcionista' | 'instrutor' | 'aluno';
  cpf: string;
  created_at?: string;
}

/**
 * Interface para Exercício (parte de um treino)
 */
export interface Exercise {
  nomeExercicio: string;
  series: number;
  repeticoes: number;
  carga: string;
  descanso: string;
}

/**
 * Interface para Treino (A/B/C)
 */
export interface Training {
  id?: number;
  student_id: number;
  instructor_id: number;
  training_type: 'A' | 'B' | 'C';
  exercises: Exercise[];  // Armazenado como JSON no banco
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para Aula
 */
export interface Class {
  id?: number;
  nome_aula: string;
  data: string;  // Formato: YYYY-MM-DD
  hora: string;  // Formato: HH:MM
  limite_vagas: number;
  instrutor_id: number;
  created_at?: string;
}

/**
 * Interface para Inscrição em Aula
 */
export interface Enrollment {
  id?: number;
  student_id: number;
  class_id: number;
  enrolled_at?: string;
}

/**
 * Interface para Check-in
 */
export interface CheckIn {
  id?: number;
  student_id: number;
  training_id?: number;
  checkin_at?: string;
}

/**
 * Interface para resposta de login
 */
export interface LoginResponse {
  token: string;
  user: Omit<User, 'senha'>;
}

/**
 * Interface para métricas do dashboard
 */
export interface DashboardMetrics {
  totalStudents?: number;
  totalInstructors?: number;
  totalReceptionists?: number;
  totalAdmins?: number;
  totalCheckins?: number;
  checkinsToday?: number;
}
