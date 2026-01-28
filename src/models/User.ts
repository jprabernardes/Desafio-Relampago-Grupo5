export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'administrador' | 'recepcionista' | 'instrutor' | 'aluno';
  document: string;
  created_at?: string;
}
  