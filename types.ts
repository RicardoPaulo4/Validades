
export type UserRole = 'admin' | 'operator';
export type Period = 'abertura' | 'transicao' | 'fecho';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface SessionData {
  operatorName: string;
  reportEmail: string;
  period: Period;
}

export interface ProductTemplate {
  id: string;
  nome: string;
  imagem_url: string;
  tempo_vida_dias: number;
  periodos: Period[];
}

export interface ValidityRecord {
  id: string;
  template_id: string;
  nome_produto: string;
  imagem_url: string;
  data_validade: string;
  hora_registo: string;
  periodo: Period;
  criado_por_id: string;
  criado_por_nome: string;
  criado_por_email: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface AuthState {
  user: User | null;
  session: SessionData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
