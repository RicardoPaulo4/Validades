
import React, { useState, useEffect, useRef } from 'react';
import { User, ProductTemplate, Period, SessionData, ValidityRecord } from '../types';
import { supabaseService } from '../services/supabaseService';
import { analyzeProductLabel } from '../services/geminiService';

interface OperatorFormProps {
  user: User;
  session: SessionData;
  onFinishTask: () => void;
}

const OperatorForm: React.FC<OperatorFormProps> = ({ user, session, onFinishTask }) => {
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
    suggestion.setDate(suggestion.getDate() + t.tempo_vida_dias);
    setExpiryDate(suggestion.toISOString().split('T')[0]);
    setManualTime('');
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
          setExpiryDate(result.expiryDate);
          // Try to match template name
          if (result.productName) {
            const match = templates.find(t => 
              result.productName.toLowerCase().includes(t.nome.toLowerCase()) ||
              t.nome.toLowerCase().includes(result.productName.toLowerCase())
            );
            if (match) setSelectedTemplate(match);
          }
        } else {
          alert('Não foi possível detetar a data automaticamente. Por favor, insira manualmente.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !expiryDate || (!manualTime && !noTime)) {
      if (!manualTime && !noTime) alert('Por favor, introduza a hora manualmente ou selecione "Sem hora".');
      return;
    }

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
      }, 1500);
    } catch (err) {
      alert('Erro ao guardar registo de validade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSession = () => {
    if (sessionRecords.length === 0) {
      if (confirm('Ainda não fez nenhum registo. Deseja sair?')) {
        onFinishTask();
      }
      return;
    }
    setShowReport(true);
  };

  const sendReport = () => {
    setSendingReport(true);
    setTimeout(() => {
      setSendingReport(false);
      alert(`O relatório foi gerado e enviado com sucesso para ${session.reportEmail}`);
      onFinishTask();
    }, 2800);
  };

  const filteredTemplates = templates.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-md mx-auto space-y-6 pb-28">
      {!selectedTemplate ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{session.period}</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Op: {session.operatorName}</p>
            </div>
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-lg shadow-indigo-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              {sessionRecords.length} REGISTOS
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input 
                type="text" placeholder="Pesquisar catálogo..."
                className="w-full p-5 bg-white border border-slate-200 rounded-3xl shadow-sm pl-14 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
              <svg className="w-6 h-6 absolute left-5 top-4.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 bg-indigo-600 text-white rounded-3xl shadow-lg active:scale-95 transition-all ${isAnalyzing ? 'animate-pulse opacity-70' : ''}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAIAnalyze} />
            </button>
          </div>

          {isAnalyzing && (
            <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
               <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
               <p className="text-indigo-700 text-xs font-bold uppercase tracking-wider">A extrair dados com IA...</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => handleSelectTemplate(t)} className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm active:scale-95 transition-all text-left group">
                <div className="aspect-square rounded-[24px] overflow-hidden mb-2 relative">
                  <img src={t.imagem_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  <div className="absolute inset-0 bg-indigo-900/0 group-active:bg-indigo-900/20 transition-colors"></div>
                </div>
                <p className="font-bold text-slate-800 text-[11px] px-2 truncate leading-tight mb-1">{t.nome}</p>
              </button>
            ))}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-8 flex justify-center pointer-events-none z-40">
            <button 
              onClick={handleFinishSession}
              className="pointer-events-auto w-full max-w-xs py-4.5 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all transform"
            >
              <div className="bg-emerald-500 p-1 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              Finalizar e Relatório
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 font-bold flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors px-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Cancelar e Voltar
          </button>

          <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-2xl space-y-7 relative overflow-hidden">
             <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-inner border border-slate-100 shrink-0">
                  <img src={selectedTemplate.imagem_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedTemplate.nome}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Registo Operacional</p>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Data de Validade Final</label>
                  <input 
                    type="date" required 
                    className={`w-full p-5 text-2xl font-black rounded-3xl border-2 transition-all outline-none ${alertExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-500 focus:bg-white'}`} 
                    value={expiryDate} onChange={e => handleDateChange(e.target.value)} 
                  />
                  {alertExpired && (
                    <div className="flex items-center gap-2 text-red-600 text-[11px] font-black uppercase tracking-widest px-2 animate-pulse">
                       <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                       ATENÇÃO: Produto já caducado!
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora da Validade (Manual)</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={noTime} 
                        onChange={e => setNoTime(e.target.checked)} 
                        className="rounded border-slate-300 text-indigo-600 w-5 h-5 transition-all" 
                      />
                      Sem hora
                    </label>
                  </div>
                  {!noTime ? (
                    <input 
                      type="time" 
                      required={!noTime} 
                      className="w-full p-6 text-4xl font-black rounded-[32px] bg-slate-50 border-2 border-slate-100 outline-none text-center focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
                      value={manualTime} 
                      onChange={e => setManualTime(e.target.value)} 
                    />
                  ) : (
                    <div className="w-full p-8 text-center bg-slate-100 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black uppercase text-xs tracking-[0.2em]">
                      Hora não solicitada
                    </div>
                  )}
                </div>

                {success ? (
                  <div className="bg-emerald-500 text-white p-6 rounded-[32px] font-black text-center shadow-xl shadow-emerald-100 animate-scale-in flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    REGISTO CONCLUÍDO
                  </div>
                ) : (
                  <button 
                    disabled={isSubmitting} 
                    className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'A GUARDAR...' : 'GRAVAR VALIDADE'}
                  </button>
                )}
             </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 space-y-8 animate-scale-in border border-white/20 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Tarefa Concluída</h3>
              <p className="text-slate-500 font-medium">Relatório da Sessão: {session.period}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Total Produtos</span>
                  <span className="font-black text-2xl text-slate-900">{sessionRecords.length}</span>
               </div>
               <div className="flex justify-between items-center p-5 bg-amber-50 rounded-3xl border border-amber-100">
                  <span className="font-bold text-amber-600/60 text-[10px] uppercase tracking-widest">A Caducar (7 dias)</span>
                  <span className="font-black text-2xl text-amber-600">{sessionRecords.filter(r => r.status === 'expiring_soon').length}</span>
               </div>
               <div className="flex justify-between items-center p-5 bg-red-50 rounded-3xl border border-red-100">
                  <span className="font-bold text-red-600/60 text-[10px] uppercase tracking-widest">Expirados</span>
                  <span className="font-black text-2xl text-red-600">{sessionRecords.filter(r => r.status === 'expired').length}</span>
               </div>
            </div>

            <div className="text-center space-y-1 py-2">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Email de Destino</p>
               <p className="text-sm font-black text-indigo-600">{session.reportEmail}</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={sendReport}
                disabled={sendingReport}
                className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {sendingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    A ENVIAR...
                  </>
                ) : 'ENVIAR RELATÓRIO'}
              </button>
              
              {!sendingReport && (
                <button 
                  onClick={() => setShowReport(false)} 
                  className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Continuar a registar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorForm;
