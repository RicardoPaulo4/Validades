
import React, { useState, useEffect, useRef } from 'react';
import { ValidityRecord, ProductTemplate, User, Period } from '../types';
import { supabaseService } from '../services/supabaseService';
import { compressImage, base64ToBlob } from '../utils/imageUtils';
import StatusBadge from './StatusBadge';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<ValidityRecord[]>([]);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [view, setView] = useState<'records' | 'catalog'>('records');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form Template
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex bg-white/50 p-1.5 rounded-[24px] border border-slate-200 shadow-sm backdrop-blur-sm">
        <button onClick={() => setView('records')} className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-[18px] transition-all ${view === 'records' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>Monitorização</button>
        <button onClick={() => setView('catalog')} className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-[18px] transition-all ${view === 'catalog' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>Catálogo</button>
      </div>

      {view === 'records' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-7 rounded-[40px] border border-slate-200 shadow-sm space-y-2">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Próximos</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{records.filter(r => r.status === 'expiring_soon').length}</p>
             </div>
             <div className="bg-white p-7 rounded-[40px] border border-slate-200 shadow-sm space-y-2">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">Expirados</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{records.filter(r => r.status === 'expired').length}</p>
             </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Registos Recentes</h3>
            <div className="grid gap-4">
              {records.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Nenhum registo encontrado</p>
                </div>
              ) : records.map(r => (
                <div key={r.id} className="group bg-white p-5 rounded-[36px] border border-slate-100 shadow-sm flex gap-5 items-center hover:shadow-md transition-all">
                  <div className="relative w-16 h-16 rounded-[24px] overflow-hidden shrink-0 shadow-inner">
                    <img src={r.imagem_url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[24px]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-900 truncate leading-tight mb-1">{r.nome_produto}</h4>
                    <div className="flex items-center gap-3">
                      <p className={`text-[11px] font-black uppercase tracking-wider ${r.status === 'expired' ? 'text-red-500' : 'text-slate-400'}`}>
                        {new Date(r.data_validade).toLocaleDateString('pt-PT')}
                      </p>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase leading-none">{r.hora_registo}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={r.status} />
                    <button onClick={() => handleDeleteRecord(r.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          <button 
            onClick={() => setIsAddingTemplate(true)} 
            className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <div className="bg-white/20 p-1 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            Novo Produto no Catálogo
          </button>

          {isAddingTemplate && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-t-[48px] sm:rounded-[48px] p-10 space-y-8 animate-slide-up max-h-[92vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Novo Produto</h3>
                  <button onClick={() => setIsAddingTemplate(false)} className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition-colors">✕</button>
                </div>

                <form onSubmit={handleAddTemplate} className="space-y-8">
                   <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="aspect-video bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-100 transition-all hover:border-indigo-300 group"
                   >
                     {newTImage ? (
                       <img src={newTImage} className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                           <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </div>
                         <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Adicionar Foto</span>
                       </>
                     )}
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                       const f = e.target.files?.[0];
                       if (f) {
                         const r = new FileReader();
                         r.onload = () => setNewTImage(r.result as string);
                         r.readAsDataURL(f);
                       }
                     }} />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome do Produto</label>
                     <input type="text" required placeholder="Ex: Queijo Fatiado 200g" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" value={newTName} onChange={e => setNewTName(e.target.value)} />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tempo de Vida Padrão (Dias)</label>
                     <input type="number" required className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-2xl shadow-inner outline-none focus:border-indigo-500" value={newTLife} onChange={e => setNewTLife(Number(e.target.value))} />
                   </div>

                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Listas Disponíveis</label>
                     <div className="grid grid-cols-3 gap-3">
                       {(['abertura', 'transicao', 'fecho'] as Period[]).map(p => (
                         <button
                           key={p} type="button" onClick={() => togglePeriod(p)}
                           className={`py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all ${newTPeriods.includes(p) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                         >
                           {p}
                         </button>
                       ))}
                     </div>
                   </div>

                   <button disabled={isSubmitting} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> CRIANDO...</>
                    ) : 'Guardar no Catálogo'}
                   </button>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {templates.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-[40px] border border-slate-200 text-center shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-square rounded-[32px] overflow-hidden mb-4 shadow-sm border border-slate-50">
                  <img src={t.imagem_url} className="w-full h-full object-cover" alt="" />
                </div>
                <h5 className="font-black text-slate-900 text-[11px] truncate px-2 mb-3">{t.nome}</h5>
                <div className="flex justify-center gap-1.5 pb-2">
                  {t.periodos.map(p => {
                    const colors = { abertura: 'bg-amber-400', transicao: 'bg-indigo-400', fecho: 'bg-slate-900' };
                    return <div key={p} className={`w-1.5 h-1.5 rounded-full ${colors[p]}`} title={p}></div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
