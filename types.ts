
export type UserRole = 'admin' | 'operator' | 'gerente';
export type Period = 'abertura' | 'transicao' | 'fecho';
export type ProductGroup = 'Frescos' | 'Pão' | 'Molhos' | 'Coberturas' | 'McCafé' | 'Outros';
export type Loja = 'Guarda' | 'Covilhã Drive' | 'Serra Shopping' | 'Castelo Branco Drive' | 'Fórum Castelo Branco' | 'Portalegre';

export const LOJAS_DISPONIVEIS: Loja[] = [
  'Guarda',
  'Covilhã Drive',
  'Serra Shopping',
  'Castelo Branco Drive',
  'Fórum Castelo Branco',
  'Portalegre'
];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  loja: Loja;
  approved: boolean;
}

export interface SessionData {
  operatorName: string;
  period: Period;
  loja: Loja;
}

export interface ProductTemplate {
  id: string;
  nome: string;
  imagem_url: string;
  tempo_vida_dias: number;
  periodos: Period[];
  grupo: ProductGroup;
}

export interface ValidityRecord {
  id: string;
  template_id: string;
  nome_produto: string;
  imagem_url: string;
  data_validade: string;
  hora_registo: string;
  periodo: Period;
  grupo?: ProductGroup;
  loja: Loja;
  criado_por_id: string;
  criado_por_nome: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface AuthState {
  user: User | null;
  session: SessionData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
