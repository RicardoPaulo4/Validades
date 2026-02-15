
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
    if (!newTImage || !newTName || newTPeriods.length === 0) {
      if (newTPeriods.length === 0) alert('Selecione pelo menos um período de disponibilidade');
      return;
    }
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
      alert('Erro ao criar produto no catálogo.');
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
    if (confirm('Deseja eliminar este registo?')) {
      await supabaseService.deleteRecord(id, user);
      setRecords(records.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => setView('records')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${view === 'records' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Monitorização</button>
        <button onClick={() => setView('catalog')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${view === 'catalog' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Catálogo</button>
      </div>

      {view === 'records' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Em Alerta</p>
                <p className="text-3xl font-black text-amber-600">{records.filter(r => r.status === 'expiring_soon').length}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expirados</p>
                <p className="text-3xl font-black text-red-600">{records.filter(r => r.status === 'expired').length}</p>
             </div>
          </div>
          
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-3xl border border-slate-200 flex gap-4 items-center">
                <img src={r.imagem_url} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate leading-tight">{r.nome_produto}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs font-black ${r.status === 'expired' ? 'text-red-600' : 'text-slate-600'}`}>
                      {new Date(r.data_validade).toLocaleDateString('pt-PT')}
                    </p>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{r.hora_registo}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  <button onClick={() => handleDeleteRecord(r.id)} className="p-1 text-slate-300 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setIsAddingTemplate(true)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Adicionar ao Catálogo
          </button>

          {isAddingTemplate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900">Novo Produto</h3>
                  <button onClick={() => setIsAddingTemplate(false)} className="bg-slate-100 p-2 rounded-full text-slate-400">✕</button>
                </div>

                <form onSubmit={handleAddTemplate} className="space-y-6">
                   <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors">
                     {newTImage ? (
                       <img src={newTImage} className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         <span className="text-slate-400 font-bold text-sm">Tocar para adicionar foto</span>
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

                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nome do Produto</label>
                     <input type="text" required placeholder="Ex: Iogurte Natural" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={newTName} onChange={e => setNewTName(e.target.value)} />
                   </div>

                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Duração Padrão (Dias)</label>
                     <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={newTLife} onChange={e => setNewTLife(Number(e.target.value))} />
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Listas / Períodos</label>
                     <div className="grid grid-cols-3 gap-2">
                       {(['abertura', 'transicao', 'fecho'] as Period[]).map(p => (
                         <button
                           key={p} type="button" onClick={() => togglePeriod(p)}
                           className={`py-3 text-[10px] font-black uppercase rounded-2xl border-2 transition-all ${newTPeriods.includes(p) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                         >
                           {p}
                         </button>
                       ))}
                     </div>
                   </div>

                   <button disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg active:scale-95 transition-all shadow-xl">{isSubmitting ? 'A criar...' : 'Guardar Ficha Técnica'}</button>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white p-3 rounded-[32px] border border-slate-200 text-center shadow-sm">
                <img src={t.imagem_url} className="w-full aspect-square rounded-[24px] object-cover mb-3" alt="" />
                <h5 className="font-bold text-slate-800 text-xs truncate px-1">{t.nome}</h5>
                <div className="flex justify-center gap-1.5 mt-2">
                  {t.periodos.map(p => {
                    const colors = { abertura: 'bg-orange-400', transicao: 'bg-indigo-400', fecho: 'bg-slate-800' };
                    return <div key={p} className={`w-2 h-2 rounded-full ${colors[p]}`} title={p}></div>;
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
