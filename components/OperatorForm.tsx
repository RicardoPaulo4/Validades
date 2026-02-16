
import React, { useState, useEffect, useRef } from 'react';
import { User, ProductTemplate, SessionData, ValidityRecord } from '../types';
import { supabaseService } from '../services/supabaseService';
import { analyzeProductLabel } from '../services/geminiService';
import StatusBadge from './StatusBadge';

interface OperatorFormProps {
  user: User;
  session: SessionData;
  activeTab?: 'task' | 'history';
  onFinishTask: () => void;
}

const OperatorForm: React.FC<OperatorFormProps> = ({ user, session, activeTab = 'task', onFinishTask }) => {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [sessionRecords, setSessionRecords] = useState<ValidityRecord[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alertExpired, setAlertExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showReport, setShowReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabaseService.getTemplates().then(all => {
      setTemplates(all.filter(t => t.periodos.includes(session.period)));
    });
  }, [session.period]);

  const handleSelectTemplate = (t: ProductTemplate) => {
    setSelectedTemplate(t);
    const suggestion = new Date();
    suggestion.setDate(suggestion.getDate() + (t.tempo_vida_dias || 1));
    setExpiryDate(suggestion.toISOString().split('T')[0]);
    setManualTime('');
    setNoTime(false);
  };

  const handleDateChange = (date: string) => {
    setExpiryDate(date);
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    setAlertExpired(selected < today);
  };

  const handleAIAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await analyzeProductLabel(base64);
        
        if (result && result.expiryDate) {
          handleDateChange(result.expiryDate);
          if (result.productName) {
            const normalizedAI = result.productName.toLowerCase();
            const match = templates.find(t => 
              normalizedAI.includes(t.nome.toLowerCase()) ||
              t.nome.toLowerCase().includes(normalizedAI)
            );
            if (match) setSelectedTemplate(match);
            else setSearchTerm(result.productName);
          }
        } else {
          alert('Não foi possível detetar a data. Tente focar melhor no rótulo.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !expiryDate || (!manualTime && !noTime)) return;

    setIsSubmitting(true);
    try {
      const newRecord = await supabaseService.addRecord({
        template_id: selectedTemplate.id,
        nome_produto: selectedTemplate.nome,
        imagem_url: selectedTemplate.imagem_url,
        data_validade: expiryDate,
        hora_registo: noTime ? 'Sem hora' : manualTime,
        periodo: session.period,
        criado_por_id: user.id,
        criado_por_nome: session.operatorName,
        criado_por_email: session.reportEmail
      });

      setSessionRecords([newRecord, ...sessionRecords]);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedTemplate(null);
        setExpiryDate('');
        setManualTime('');
        setNoTime(false);
        setSearchTerm('');
      }, 1200);
    } catch (err) {
      alert('Erro ao guardar registo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFromHistory = async (id: string) => {
    if (confirm('Eliminar este registo da sessão atual?')) {
      await supabaseService.deleteRecord(id, user);
      setSessionRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeTab === 'history') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-24 animate-fade-in">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registos da Sessão</h2>
          <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full">{sessionRecords.length} TOTAL</span>
        </div>

        <div className="grid gap-4">
          {sessionRecords.length === 0 ? (
            <div className="bg-white p-12 rounded-[40px] border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-400 font-bold text-sm">Ainda não fez registos nesta sessão.</p>
            </div>
          ) : sessionRecords.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <img src={r.imagem_url} className="w-14 h-14 rounded-2xl object-cover shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{r.nome_produto}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.data_validade).toLocaleDateString('pt-PT')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                <button onClick={() => handleDeleteFromHistory(r.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-32">
      {/* Scanning Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white">
          <div className="relative w-64 h-64 border-2 border-indigo-400/30 rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-indigo-500/20">
            <div className="scan-line"></div>
            <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-16 h-16 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Analisando Rótulo...</h3>
          <p className="text-slate-400 text-sm text-center">A IA está a extrair a validade automaticamente.</p>
        </div>
      )}

      {!selectedTemplate ? (
        <div className="space-y-8 animate-fade-in px-2">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">{session.period}</h2>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-4">{session.operatorName}</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm px-5 py-3 rounded-2xl flex items-center gap-3">
              <span className="text-2xl font-black text-indigo-600">{sessionRecords.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Registos<br/>Sessão</span>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <input 
                type="text" placeholder="Procurar produto..."
                className="w-full p-5 bg-white border border-slate-200 rounded-[28px] shadow-sm pl-14 font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
              <svg className="w-6 h-6 absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-5 bg-indigo-600 text-white rounded-[28px] shadow-xl shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAIAnalyze} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredTemplates.map(t => (
              <button 
                key={t.id} 
                onClick={() => handleSelectTemplate(t)} 
                className="bg-white p-2.5 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-95 transition-all text-left group"
              >
                <div className="aspect-square rounded-[28px] overflow-hidden mb-3 relative">
                  <img src={t.imagem_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={t.nome} />
                  <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-10 transition-opacity"></div>
                </div>
                <p className="font-bold text-slate-800 text-xs px-2 truncate leading-tight pb-1">{t.nome}</p>
              </button>
            ))}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none sm:static sm:px-0">
            <button 
              onClick={() => setShowReport(true)}
              className="pointer-events-auto w-full max-w-sm py-5 bg-slate-900 text-white rounded-[30px] font-extrabold text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finalizar Tarefa
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6 px-4">
          <button 
            onClick={() => { setSelectedTemplate(null); setSearchTerm(''); }} 
            className="group inline-flex items-center gap-2 text-slate-400 font-bold text-sm px-2 py-2 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao catálogo
          </button>

          <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-2xl space-y-8 relative overflow-hidden">
             <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-xl border border-white">
                  <img src={selectedTemplate.imagem_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{selectedTemplate.nome}</h3>
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    Registo em curso
                  </div>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Expiração</label>
                  <input 
                    type="date" required 
                    className={`w-full p-6 text-2xl font-black rounded-3xl border-2 outline-none transition-all ${alertExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-500 focus:bg-white shadow-inner'}`} 
                    value={expiryDate} onChange={e => handleDateChange(e.target.value)} 
                  />
                  {alertExpired && (
                    <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest px-1 animate-pulse">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Atenção: Produto expirado
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hora (Opcional)</label>
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase cursor-pointer select-none">
                      <input type="checkbox" checked={noTime} onChange={e => setNoTime(e.target.checked)} className="rounded-lg border-slate-300 text-indigo-600 w-6 h-6 transition-all" />
                      Sem hora
                    </label>
                  </div>
                  {!noTime && (
                    <input 
                      type="time" required 
                      className="w-full p-7 text-5xl font-black rounded-[40px] bg-slate-50 border-2 border-slate-100 outline-none text-center focus:border-indigo-500 focus:bg-white transition-all shadow-inner tracking-tight" 
                      value={manualTime} onChange={e => setManualTime(e.target.value)} 
                    />
                  )}
                </div>

                <button 
                  disabled={isSubmitting || success} 
                  className={`w-full py-7 rounded-[32px] font-black text-xl shadow-2xl transition-all ${success ? 'bg-emerald-500 text-white scale-[1.02] shadow-emerald-200' : 'bg-slate-900 text-white active:scale-95 shadow-slate-200'}`}
                >
                  {success ? 'CONCLUÍDO ✓' : isSubmitting ? 'A GUARDAR...' : 'CONFIRMAR VALIDADE'}
                </button>
             </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[56px] p-10 space-y-8 animate-scale-in border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[30px] flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900">Relatório</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Sumário de atividade</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Total<br/>Registos</span>
                  <span className="font-black text-4xl text-slate-900">{sessionRecords.length}</span>
               </div>
               <div className="flex justify-between items-center p-6 bg-red-50 rounded-[32px] border border-red-100">
                  <span className="font-bold text-red-400 text-[10px] uppercase tracking-widest leading-none">Expirados<br/>Detetados</span>
                  <span className="font-black text-4xl text-red-600">{sessionRecords.filter(r => r.status === 'expired').length}</span>
               </div>
            </div>

            <div className="pt-4 space-y-4">
              <button 
                onClick={async () => {
                  setSendingReport(true);
                  await new Promise(r => setTimeout(r, 2000));
                  setSendingReport(false);
                  setShowReport(false);
                  onFinishTask();
                }} 
                disabled={sendingReport} 
                className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {sendingReport ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ENVIANDO...
                  </>
                ) : 'ENVIAR RELATÓRIO'}
              </button>
              <button 
                onClick={() => setShowReport(false)} 
                className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Voltar aos registos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorForm;
