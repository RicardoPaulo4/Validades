
import { createClient } from '@supabase/supabase-js';
import { ValidityRecord, ProductTemplate, User } from '../types';

const SUPABASE_URL = (process.env as any).NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = (process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isMocked = !SUPABASE_URL || SUPABASE_URL.includes('your-project');

const supabase = !isMocked ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const supabaseService = {
  getTemplates: async (): Promise<ProductTemplate[]> => {
    if (isMocked) {
      const stored = localStorage.getItem('vc_templates');
      return stored ? JSON.parse(stored) : [];
    }
    const { data, error } = await supabase!.from('templates').select('*');
    if (error) throw error;
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
    if (error) throw error;
    return (data || []).map(calculateStatus);
  },

  addRecord: async (record: Omit<ValidityRecord, 'id' | 'status'>): Promise<ValidityRecord> => {
    if (isMocked) {
      const records = await supabaseService.getRecords();
      const newR: ValidityRecord = { ...record, id: Math.random().toString(36).substr(2, 9), status: 'valid' };
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
    if (isMocked) return URL.createObjectURL(blob);
    const { data, error } = await supabase!.storage.from('produtos_fotos').upload(`${Date.now()}_${fileName}`, blob);
    if (error) throw error;
    return supabase!.storage.from('produtos_fotos').getPublicUrl(data.path).data.publicUrl;
  }
};

function calculateStatus(r: any): ValidityRecord {
  const now = new Date();
  now.setHours(0,0,0,0);
  const expiry = new Date(r.data_validade);
  expiry.setHours(0,0,0,0);
  
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: ValidityRecord['status'] = 'valid';
  if (diffDays < 0) status = 'expired';
  else if (diffDays <= 7) status = 'expiring_soon';
  
  return { ...r, status };
}
