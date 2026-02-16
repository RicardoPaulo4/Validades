
import React, { useState, useEffect, useRef } from 'react';
import { User, ProductTemplate, SessionData, ValidityRecord } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';
import { analyzeProductLabel } from '../services/geminiService.ts';
import StatusBadge from './StatusBadge.tsx';

interface OperatorFormProps {
  user: User;
  session: SessionData;
  activeTab?: 'task' | 'history';
  onFinishTask: () => void;
}

export default function OperatorForm({ user, session, activeTab = 'task', onFinishTask }: OperatorFormProps) {
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
  const [aiDetected, setAiDetected] = useState(false);
  
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
    if (!aiDetected) {
      const suggestion = new Date();
      suggestion.setDate(suggestion.getDate() + (t.tempo_vida_dias || 1));
      setExpiryDate(suggestion.toISOString().split('T')[0]);
    }
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
    setAiDetected(false);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await analyzeProductLabel(base64);
        
        if (result && result.expiryDate) {
          handleDateChange(result.expiryDate);
          setAiDetected(true);
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
          alert('Não foi possível detetar a data automaticamente. Introduza manualmente.');
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
      setAiDetected(false);
      setTimeout(() => {
        setSuccess(false);
        setSelectedTemplate(null);
        setExpiryDate('');
        setManualTime('');
        setNoTime(false);
        setSearchTerm('');
      }, 1000);
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
      <div className="max-w-xl mx-auto space-y-8 pb-32 animate-fade-in px-2">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Minha Sessão</h2>
          </div>
          <div className="bg-slate-900 text-white w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-xl shadow-lg">
            {sessionRecords.length}
          </div>
        </div>

        <div className="grid gap-4">
          {sessionRecords.length === 0 ? (
            <div className="bg-white p-16 rounded-[48px] border-2 border-dashed border-slate-100 text-center space-y-4">
              <p className="text-slate-400 font-bold text-sm">Nenhum registo efectuado nesta sessão.</p>
            </div>
          ) : sessionRecords.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-[36px] border border-slate-100 shadow-sm flex items-center gap-5 group">
              <div className="w-16 h-16 rounded-[24px] overflow-hidden shrink-0 shadow-inner">
                <img src={r.imagem_url} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight mb-1">{r.nome_produto}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.data_validade).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <StatusBadge status={r.status} />
                <button onClick={() => handleDeleteFromHistory(r.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 active:scale-90">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-40 px-2">
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-white animate-fade-in">
          <div className="relative w-72 h-72 border-2 border-indigo-400/40 rounded-[56px] overflow-hidden mb-10 shadow-2xl">
            <div className="scan-line"></div>
          </div>
          <h3 className="text-2xl font-black tracking-tight">IA a Ler Rótulo...</h3>
        </div>
      )}

      {!selectedTemplate ? (
        <div className="space-y-10 animate-fade-in">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter capitalize">{session.period}</h2>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] ml-5">{session.operatorName}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" placeholder="Procurar ou digitar nome..."
              className="w-full p-6 bg-white border-2 border-slate-100 rounded-[32px] shadow-sm pl-16 font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-lg"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 bg-indigo-600 text-white rounded-[32px] shadow-2xl active:scale-90 transition-all hover:bg-indigo-700 flex-shrink-0"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAIAnalyze} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => handleSelectTemplate(t)} className="bg-white p-3 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
                <div className="aspect-square rounded-[36px] overflow-hidden mb-4 relative shadow-inner">
                  <img src={t.imagem_url} className="w-full h-full object-cover" alt={t.nome} />
                </div>
                <p className="font-black text-slate-800 text-xs px-3 truncate">{t.nome}</p>
              </button>
            ))}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none sm:static sm:px-0">
            <button 
              onClick={() => setShowReport(true)}
              className="pointer-events-auto w-full max-w-sm py-6 bg-slate-900 text-white rounded-[36px] font-black text-xl shadow-2xl active:scale-95 transition-all"
            >
              Finalizar Tarefa
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-8">
          <button onClick={() => { setSelectedTemplate(null); setSearchTerm(''); setAiDetected(false); }} className="px-4 py-3 bg-white rounded-full border border-slate-200 shadow-sm font-black text-[10px] uppercase tracking-widest active:scale-95">
            ← Voltar
          </button>

          <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-2xl space-y-10 relative overflow-hidden">
             <div className="flex items-center gap-8">
                <div className="w-28 h-28 rounded-[38px] overflow-hidden shadow-2xl border-4 border-white rotate-2">
                  <img src={selectedTemplate.imagem_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">{selectedTemplate.nome}</h3>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-10">
                <input 
                  type="date" required 
                  className={`w-full p-8 text-3xl font-black rounded-[40px] border-3 outline-none transition-all ${alertExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-500 focus:bg-white'}`} 
                  value={expiryDate} onChange={e => handleDateChange(e.target.value)} 
                />
                
                <button 
                  disabled={isSubmitting || success} 
                  className={`w-full py-8 rounded-[40px] font-black text-2xl shadow-2xl transition-all duration-500 ${success ? 'bg-emerald-500 text-white scale-[1.05]' : 'bg-slate-900 text-white active:scale-95'}`}
                >
                  {success ? 'SUCESSO ✓' : isSubmitting ? 'A GUARDAR...' : 'CONFIRMAR REGISTO'}
                </button>
             </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[64px] p-12 space-y-10 animate-scale-in">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter text-center">Relatório</h3>
            <div className="space-y-5">
               <div className="flex justify-between items-center p-7 bg-slate-50 rounded-[36px] border border-slate-100 shadow-inner">
                  <span className="font-black text-slate-400 text-[11px] uppercase tracking-widest leading-tight">Registos</span>
                  <span className="font-black text-5xl text-slate-900 tracking-tighter">{sessionRecords.length}</span>
               </div>
            </div>
            <button 
              onClick={async () => {
                setSendingReport(true);
                await new Promise(r => setTimeout(r, 2000));
                setSendingReport(false);
                setShowReport(false);
                onFinishTask();
              }} 
              disabled={sendingReport} 
              className="w-full py-7 bg-indigo-600 text-white rounded-[36px] font-black text-xl shadow-2xl active:scale-95 transition-all"
            >
              {sendingReport ? 'ENVIANDO...' : 'ENVIAR RELATÓRIO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
