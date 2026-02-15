
import { createClient } from '@supabase/supabase-js';
import { ValidityRecord, ProductTemplate, User } from '../types';

// O SDK injeta as variáveis no process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verifica se estamos em modo mock ou real
const isMocked = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseAnonKey;

const supabase = !isMocked ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Função auxiliar para calcular o status baseado na data
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
  getTemplates: async (): Promise<ProductTemplate[]> => {
    if (isMocked) {
      const stored = localStorage.getItem('vc_templates');
      return stored ? JSON.parse(stored) : [];
    }
    const { data, error } = await supabase!.from('templates').select('*');
    if (error) {
      console.warn("Erro ao buscar templates, usando local:", error);
      return [];
    }
    return data || [];
  },

  addTemplate: async (template: Omit<ProductTemplate, 'id'>): Promise<ProductTemplate> => {
    if (isMocked) {
      const templates = await supabaseService.getTemplates();
      const newT: ProductTemplate = { ...template, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('vc_templates', JSON.stringify([...templates, newT]));
      return newT;
    }
    const { data, error } = await supabase!.from('templates').insert([template]).select().single();
    if (error) throw error;
    return data;
  },

  getRecords: async (): Promise<ValidityRecord[]> => {
    if (isMocked) {
      const stored = localStorage.getItem('vc_records');
      const records = stored ? JSON.parse(stored) : [];
      return records.map(calculateStatus);
    }
    const { data, error } = await supabase!.from('registos').select('*').order('data_validade', { ascending: true });
    if (error) {
      console.warn("Erro ao buscar registos:", error);
      return [];
    }
    return (data || []).map(calculateStatus);
  },

  addRecord: async (record: Omit<ValidityRecord, 'id' | 'status'>): Promise<ValidityRecord> => {
    if (isMocked) {
      const records = await supabaseService.getRecords();
      const newR: ValidityRecord = { 
        ...record, 
        id: Math.random().toString(36).substr(2, 9),
        status: 'valid' // Será recalculado
      };
      const updatedRecords = [newR, ...records];
      localStorage.setItem('vc_records', JSON.stringify(updatedRecords));
      return calculateStatus(newR);
    }
    const { data, error } = await supabase!.from('registos').insert([record]).select().single();
    if (error) throw error;
    return calculateStatus(data);
  },

  deleteRecord: async (id: string, user: User): Promise<boolean> => {
    if (user.role !== 'admin') return false;
    if (isMocked) {
      const records = JSON.parse(localStorage.getItem('vc_records') || '[]');
      localStorage.setItem('vc_records', JSON.stringify(records.filter((r: any) => r.id !== id)));
      return true;
    }
    const { error } = await supabase!.from('registos').delete().eq('id', id);
    return !error;
  },

  uploadImage: async (blob: Blob, fileName: string): Promise<string> => {
    // Para simplificar no modo web puro, usamos ObjectURL se for mock
    if (isMocked) return URL.createObjectURL(blob);
    
    const { data, error } = await supabase!.storage.from('produtos_fotos').upload(`${Date.now()}_${fileName}`, blob);
    if (error) throw error;
    return supabase!.storage.from('produtos_fotos').getPublicUrl(data.path).data.publicUrl;
  }
};
