
import { createClient } from '@supabase/supabase-js';
import { ValidityRecord, ProductTemplate, User, UserRole } from '../types.ts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpemxxdpbndazwwmbpyt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZW14eGRwYm5kYXp3d21icHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTEzMDIsImV4cCI6MjA4Njc2NzMwMn0.QH2dDFql8ywlZZiJHLo7QkbOLjyxEsT5JAiS5FSHHgA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function calculateStatus(r: any): ValidityRecord {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(r.data_validade);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: ValidityRecord['status'] = 'valid';
  if (diffDays < 0) status = 'expired';
  else if (diffDays <= 7) status = 'expiring_soon';
  
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
        { id: '1', email: 'admin@valida.com', role: 'admin', name: 'Administrador', approved: true },
        { id: '2', email: 'op@valida.com', role: 'operator', name: 'Operador Loja', approved: true }
      ];
    }
  },

  registerUser: async (userData: Omit<User, 'id' | 'approved'>): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      approved: userData.role === 'admin'
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
      return stored ? JSON.parse(stored) : [];
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

  // --- Registos ---
  getRecords: async (): Promise<ValidityRecord[]> => {
    try {
      const { data, error } = await supabase.from('registos').select('*').order('data_validade', { ascending: true });
      if (error) throw error;
      return (data || []).map(calculateStatus);
    } catch (err) {
      const stored = localStorage.getItem('vc_records');
      return (stored ? JSON.parse(stored) : []).map(calculateStatus);
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
      const filePath = `public/${Date.now()}_${fileName}`;
      const { data, error } = await supabase.storage.from('produtos_fotos').upload(filePath, blob);
      if (error) throw error;
      return supabase.storage.from('produtos_fotos').getPublicUrl(data.path).data.publicUrl;
    } catch (err) {
      return `https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=200&auto=format&fit=crop`;
    }
  }
};
