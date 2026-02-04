export interface User {
  id?: number;
  name: string;
  /**
   * Campo legado: alguns payloads/consultas podem trazer "nome" ao invés de "name".
   */
  nome?: string;
  email: string;
  password: string;
  role: 'administrador' | 'recepcionista' | 'instrutor' | 'aluno';
  document: string;
  phone?: string;
  created_at?: string;
}
