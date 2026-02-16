
import { createClient } from '@supabase/supabase-js';
import { ValidityRecord, ProductTemplate, User } from '../types';

const supabaseUrl = 'https://jpemxxdpbndazwwmbpyt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZW14eGRwYm5kYXp3d21icHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTEzMDIsImV4cCI6MjA4Njc2NzMwMn0.QH2dDFql8ywlZZiJHLo7QkbOLjyxEsT5JAiS5FSHHgA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to calculate status locally
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
    const { data, error } = await supabase.from('templates').select('*');
    if (error) {
      console.warn("Error fetching templates, falling back to local storage:", error);
      const stored = localStorage.getItem('vc_templates');
      return stored ? JSON.parse(stored) : [];
    }
    return data || [];
  },

  addTemplate: async (template: Omit<ProductTemplate, 'id'>): Promise<ProductTemplate> => {
    const { data, error } = await supabase.from('templates').insert([template]).select().single();
    if (error) {
      console.warn("Error adding template to Supabase, saving locally:", error);
      const templates = JSON.parse(localStorage.getItem('vc_templates') || '[]');
      const newT = { ...template, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('vc_templates', JSON.stringify([...templates, newT]));
      return newT;
    }
    return data;
  },

  getRecords: async (): Promise<ValidityRecord[]> => {
    const { data, error } = await supabase.from('registos').select('*').order('data_validade', { ascending: true });
    if (error) {
      console.warn("Error fetching records, falling back to local storage:", error);
      const stored = localStorage.getItem('vc_records');
      return (stored ? JSON.parse(stored) : []).map(calculateStatus);
    }
    return (data || []).map(calculateStatus);
  },

  addRecord: async (record: Omit<ValidityRecord, 'id' | 'status'>): Promise<ValidityRecord> => {
    const { data, error } = await supabase.from('registos').insert([record]).select().single();
    if (error) {
      console.warn("Error adding record to Supabase, saving locally:", error);
      const records = JSON.parse(localStorage.getItem('vc_records') || '[]');
      const newR = { ...record, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('vc_records', JSON.stringify([newR, ...records]));
      return calculateStatus(newR);
    }
    return calculateStatus(data);
  },

  deleteRecord: async (id: string, user: User): Promise<boolean> => {
    if (user.role !== 'admin') return false;
    const { error } = await supabase.from('registos').delete().eq('id', id);
    if (error) {
      console.warn("Error deleting record from Supabase, removing locally:", error);
      const records = JSON.parse(localStorage.getItem('vc_records') || '[]');
      localStorage.setItem('vc_records', JSON.stringify(records.filter((r: any) => r.id !== id)));
      return true;
    }
    return true;
  },

  uploadImage: async (blob: Blob, fileName: string): Promise<string> => {
    const filePath = `${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage.from('produtos_fotos').upload(filePath, blob);
    if (error) {
      console.warn("Error uploading image, using local blob URL:", error);
      return URL.createObjectURL(blob);
    }
    return supabase.storage.from('produtos_fotos').getPublicUrl(data.path).data.publicUrl;
  }
};
