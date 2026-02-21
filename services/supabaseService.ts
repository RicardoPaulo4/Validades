
import { createClient } from '@supabase/supabase-js';
import { ValidityRecord, ProductTemplate, User, UserRole, Loja } from '../types.ts';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && rawUrl.trim().startsWith('http')) 
  ? rawUrl.trim() 
  : 'https://ehstardbwrddkxieojiqi.supabase.co';

const supabaseAnonKey = (rawKey && rawKey.trim().length > 20) 
  ? rawKey.trim() 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc3RhcmRid3Jka3hpZW9qaWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAxNzEsImV4cCI6MjA4NzI2NjE3MX0.ix24lr8fujGqZ1P0yV2vvf3OEXqn3rpAiFrFUYXa8Cs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = 'ricardo.maio.paulo@gmail.com';

// Mock Data para Simulação
const MOCK_TEMPLATES: ProductTemplate[] = [
  { id: 't1', nome: 'Pão Big Mac', imagem_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=200&auto=format&fit=crop', tempo_vida_dias: 3, periodos: ['abertura', 'transicao', 'fecho'], grupo: 'Pão' },
  { id: 't2', nome: 'Carne 10:1', imagem_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=200&auto=format&fit=crop', tempo_vida_dias: 2, periodos: ['abertura', 'fecho'], grupo: 'Frescos' },
  { id: 't3', nome: 'Alface Iceberg', imagem_url: 'https://images.unsplash.com/photo-1556801712-76c8220706df?q=80&w=200&auto=format&fit=crop', tempo_vida_dias: 1, periodos: ['abertura', 'transicao', 'fecho'], grupo: 'Frescos' },
  { id: 't4', nome: 'Molho Big Mac', imagem_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=200&auto=format&fit=crop', tempo_vida_dias: 7, periodos: ['transicao'], grupo: 'Molhos' },
  { id: 't5', nome: 'Mistura Sundae', imagem_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=200&auto=format&fit=crop', tempo_vida_dias: 5, periodos: ['abertura', 'fecho'], grupo: 'McCafé' }
];

const MOCK_RECORDS: Omit<ValidityRecord, 'status'>[] = [
  { id: 'r1', template_id: 't1', nome_produto: 'Pão Big Mac', imagem_url: MOCK_TEMPLATES[0].imagem_url, data_validade: new Date(Date.now() - 86400000).toISOString().split('T')[0], hora_registo: '08:30', periodo: 'abertura', loja: 'Guarda', criado_por_id: '2', criado_por_nome: 'Operador Demo', criado_por_email: 'op@valida.com', grupo: 'Pão' },
  { id: 'r2', template_id: 't2', nome_produto: 'Carne 10:1', imagem_url: MOCK_TEMPLATES[1].imagem_url, data_validade: new Date(Date.now() + 86400000).toISOString().split('T')[0], hora_registo: '22:15', periodo: 'fecho', loja: 'Guarda', criado_por_id: '2', criado_por_nome: 'Operador Demo', criado_por_email: 'op@valida.com', grupo: 'Frescos' },
  { id: 'r3', template_id: 't3', nome_produto: 'Alface Iceberg', imagem_url: MOCK_TEMPLATES[2].imagem_url, data_validade: new Date().toISOString().split('T')[0], hora_registo: '12:00', periodo: 'transicao', loja: 'Covilhã Drive', criado_por_id: '3', criado_por_nome: 'Gerente Demo', criado_por_email: 'gerente@valida.com', grupo: 'Frescos' }
];

function calculateStatus(r: any): ValidityRecord {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(r.data_validade);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: ValidityRecord['status'] = 'valid';
  if (diffDays < 0) status = 'expired';
  else if (diffDays <= 1) status = 'expiring_soon';
  
  return { ...r, status };
}

export const supabaseService = {
  // --- Utilizadores ---
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('utilizadores').select('*');
      if (error) throw error;
      return data || [];
    } catch (err) {
      const stored = localStorage.getItem('vc_users');
      return stored ? JSON.parse(stored) : [
        { id: '1', email: ADMIN_EMAIL, role: 'admin', name: 'Ricardo Paulo', approved: true, loja: 'Guarda' },
        { id: '2', email: 'op@valida.com', role: 'operator', name: 'Operador Demo', approved: true, loja: 'Guarda' },
        { id: '3', email: 'gerente@valida.com', role: 'gerente', name: 'Gerente Demo', approved: true, loja: 'Covilhã Drive' }
      ];
    }
  },

  registerUser: async (userData: Omit<User, 'id' | 'approved'>): Promise<User> => {
    const isMainAdmin = userData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      role: isMainAdmin ? 'admin' : userData.role,
      approved: isMainAdmin 
    };
    
    try {
      const { data, error } = await supabase.from('utilizadores').insert([newUser]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      const users = JSON.parse(localStorage.getItem('vc_users') || '[]');
      const updated = [...users, newUser];
      localStorage.setItem('vc_users', JSON.stringify(updated));
      return newUser;
    }
  },

  updateUserStatus: async (userId: string, approved: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase.from('utilizadores').update({ approved }).eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      const users = JSON.parse(localStorage.getItem('vc_users') || '[]');
      const updated = users.map((u: User) => u.id === userId ? { ...u, approved } : u);
      localStorage.setItem('vc_users', JSON.stringify(updated));
      return true;
    }
  },

  removeUser: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('utilizadores').delete().eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      const users = JSON.parse(localStorage.getItem('vc_users') || '[]');
      localStorage.setItem('vc_users', JSON.stringify(users.filter((u: User) => u.id !== userId)));
      return true;
    }
  },

  // --- Catálogo ---
  getTemplates: async (): Promise<ProductTemplate[]> => {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) throw error;
      return data || [];
    } catch (err) {
      const stored = localStorage.getItem('vc_templates');
      if (stored) return JSON.parse(stored);
      localStorage.setItem('vc_templates', JSON.stringify(MOCK_TEMPLATES));
      return MOCK_TEMPLATES;
    }
  },

  addTemplate: async (template: Omit<ProductTemplate, 'id'>): Promise<ProductTemplate> => {
    try {
      const { data, error } = await supabase.from('templates').insert([template]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      const templates = JSON.parse(localStorage.getItem('vc_templates') || '[]');
      const newT = { ...template, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('vc_templates', JSON.stringify([...templates, newT]));
      return newT as ProductTemplate;
    }
  },

  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      const templates = JSON.parse(localStorage.getItem('vc_templates') || '[]');
      localStorage.setItem('vc_templates', JSON.stringify(templates.filter((t: any) => t.id !== id)));
      return true;
    }
  },

  // --- Registos ---
  getRecords: async (): Promise<ValidityRecord[]> => {
    try {
      const { data, error } = await supabase.from('registos').select('*').order('data_validade', { ascending: true });
      if (error) throw error;
      return (data || []).map(calculateStatus);
    } catch (err) {
      const stored = localStorage.getItem('vc_records');
      if (stored) return (JSON.parse(stored) as any[]).map(calculateStatus);
      localStorage.setItem('vc_records', JSON.stringify(MOCK_RECORDS));
      return MOCK_RECORDS.map(calculateStatus);
    }
  },

  addRecord: async (record: Omit<ValidityRecord, 'id' | 'status'>): Promise<ValidityRecord> => {
    try {
      const { data, error } = await supabase.from('registos').insert([record]).select().single();
      if (error) throw error;
      return calculateStatus(data);
    } catch (err) {
      const records = JSON.parse(localStorage.getItem('vc_records') || '[]');
      const newR = { ...record, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('vc_records', JSON.stringify([newR, ...records]));
      return calculateStatus(newR);
    }
  },

  deleteRecord: async (id: string, user: User): Promise<boolean> => {
    if (user.role !== 'admin') return false;
    try {
      const { error } = await supabase.from('registos').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      const records = JSON.parse(localStorage.getItem('vc_records') || '[]');
      localStorage.setItem('vc_records', JSON.stringify(records.filter((r: any) => r.id !== id)));
      return true;
    }
  },

  uploadImage: async (blob: Blob, fileName: string): Promise<string> => {
    try {
      const filePath = `${Date.now()}_${fileName}`;
      const { data, error } = await supabase.storage.from('produtos_fotos').upload(filePath, blob);
      if (error) throw error;
      return supabase.storage.from('produtos_fotos').getPublicUrl(data.path).data.publicUrl;
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      throw err;
    }
  }
};
