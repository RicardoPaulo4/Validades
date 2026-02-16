
import React, { useState, useEffect, useRef } from 'react';
import { ValidityRecord, ProductTemplate, User, Period } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';
import { compressImage, base64ToBlob } from '../utils/imageUtils.ts';
import StatusBadge from './StatusBadge.tsx';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<ValidityRecord[]>([]);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [view, setView] = useState<'records' | 'catalog'>('records');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newTName, setNewTName] = useState('');
  const [newTLife, setNewTLife] = useState(30);
  const [newTImage, setNewTImage] = useState<string | null>(null);
  const [newTPeriods, setNewTPeriods] = useState<Period[]>(['abertura', 'transicao', 'fecho']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [recData, tempData] = await Promise.all([
      supabaseService.getRecords(),
      supabaseService.getTemplates()
    ]);
    setRecords(recData);
    setTemplates(tempData);
    setIsLoading(false);
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTImage || !newTName || newTPeriods.length === 0) return;
    setIsSubmitting(true);
    try {
      const compressed = await compressImage(newTImage);
      const blob = base64ToBlob(compressed);
      const url = await supabaseService.uploadImage(blob, `cat_${newTName}.jpg`);
      
      const newT = await supabaseService.addTemplate({
        nome: newTName,
        imagem_url: url,
        tempo_vida_dias: newTLife,
        periodos: newTPeriods
      });
      
      setTemplates([...templates, newT]);
      setIsAddingTemplate(false);
      resetForm();
    } catch (err) {
      alert('Erro ao criar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTName('');
    setNewTLife(30);
    setNewTImage(null);
    setNewTPeriods(['abertura', 'transicao', 'fecho']);
  };

  const togglePeriod = (p: Period) => {
    setNewTPeriods(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Deseja eliminar este registo permanentemente?')) {
      await supabaseService.deleteRecord(id, user);
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const expiringCount = records.filter(r => r.status === 'expiring_soon').length;
  const expiredCount = records.filter(r => r.status === 'expired').length;
  const riskLevel = records.length > 0 ? (expiredCount / records.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Sincronizando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-4xl mx-auto">
      <div className="flex bg-white/70 p-1.5 rounded-[28px] border border-slate-200 shadow-sm backdrop-blur-md">
        <button onClick={() => setView('records')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'records' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Registos</button>
        <button onClick={() => setView('catalog')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'catalog' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Catálogo</button>
      </div>

      {view === 'records' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Próximos
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black text-slate-900 tracking-tighter group-hover:scale-105 transition-transform origin-left">{expiringCount}</p>
                  <span className="text-slate-300 font-bold text-sm">unid.</span>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Expirados
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black text-slate-900 tracking-tighter group-hover:scale-105 transition-transform origin-left">{expiredCount}</p>
                  <span className="text-slate-300 font-bold text-sm">unid.</span>
                </div>
             </div>
             <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-200 group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Risco de Stock</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <p className="text-6xl font-black text-white tracking-tighter">{riskLevel.toFixed(0)}%</p>
                </div>
                <div className="mt-4 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min(riskLevel, 100)}%` }}></div>
                </div>
             </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Actividade Recente</h3>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{records.length} registos totais</span>
            </div>
            
            <div className="grid gap-4">
              {records.length === 0 ? (
                <div className="bg-white p-16 rounded-[48px] border-2 border-dashed border-slate-100 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900 font-black text-lg">Sem registos activos</p>
                    <p className="text-slate-400 text-sm font-medium">Os novos registos de operadores aparecerão aqui.</p>
                  </div>
                </div>
              ) : records.map(r => (
                <div key={r.id} className="group bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm flex gap-6 items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative w-20 h-20 rounded-[30px] overflow-hidden shrink-0 shadow-lg border-2 border-white">
                    <img src={r.imagem_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-slate-900 truncate text-lg leading-tight tracking-tight">{r.nome_produto}</h4>
                      <div className="hidden sm:block">
                         <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                      <div className="flex items-center gap-2">
                        <p className={`text-[12px] font-black uppercase tracking-wider ${r.status === 'expired' ? 'text-red-500' : 'text-slate-500'}`}>
                          {new Date(r.data_validade).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-black text-indigo-500 uppercase tracking-widest">{r.hora_registo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-slate-400 truncate max-w-[120px]">{r.criado_por_nome}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                    <button 
                      onClick={() => handleDeleteRecord(r.id)} 
                      className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-[18px] transition-all active:scale-90"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-slide-up">
          <button 
            onClick={() => setIsAddingTemplate(true)} 
            className="w-full py-7 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 active:scale-[0.98] transition-all hover:bg-indigo-700"
          >
            Novo Produto no Catálogo
          </button>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {templates.map(t => (
              <div key={t.id} className="group bg-white p-5 rounded-[44px] border border-slate-100 text-center shadow-sm hover:shadow-xl transition-all">
                <div className="relative aspect-square rounded-[36px] overflow-hidden mb-5">
                  <img src={t.imagem_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                </div>
                <h5 className="font-black text-slate-900 text-[12px] truncate px-3">{t.nome}</h5>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
