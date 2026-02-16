
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
      // Filtra templates pelo período da sessão
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
            if (match) {
              setSelectedTemplate(match);
            } else {
              setSearchTerm(result.productName);
            }
          }
        } else {
          alert('IA: Não consegui ler a validade. Tente uma foto mais aproximada e com luz.');
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
    if (!selectedTemplate || !expiryDate || (!manualTime && !noTime)) {
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
        setSearchTerm('');
      }, 1500);
    } catch (err) {
      alert('Erro ao guardar registo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fix: handleFinishSession to open the summary modal
  const handleFinishSession = () => {
    setShowReport(true);
  };

  // Fix: sendReport to simulate final report submission
  const sendReport = async () => {
    setSendingReport(true);
    // Simulate sending report
    setTimeout(() => {
      setSendingReport(false);
      setShowReport(false);
      onFinishTask();
    }, 2000);
  };

  const filteredTemplates = templates.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                type="text" placeholder="Procurar no catálogo..."
                className="w-full p-5 bg-white border border-slate-200 rounded-3xl shadow-sm pl-14 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
              <svg className="w-6 h-6 absolute left-5 top-4.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className={`p-5 bg-indigo-600 text-white rounded-3xl shadow-lg active:scale-95 transition-all ${isAnalyzing ? 'opacity-50' : ''}`}
            >
              {isAnalyzing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAIAnalyze} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => handleSelectTemplate(t)} className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm active:scale-95 transition-all text-left group">
                <div className="aspect-square rounded-[24px] overflow-hidden mb-2 relative">
                  <img src={t.imagem_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={t.nome} />
                </div>
                <p className="font-bold text-slate-800 text-[11px] px-2 truncate leading-tight mb-1">{t.nome}</p>
              </button>
            ))}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-8 flex justify-center pointer-events-none z-40">
            <button 
              onClick={handleFinishSession}
              className="pointer-events-auto w-full max-w-xs py-4.5 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Finalizar e Relatório
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          <button onClick={() => { setSelectedTemplate(null); setSearchTerm(''); }} className="text-slate-400 font-bold flex items-center gap-2 text-sm px-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Voltar ao Catálogo
          </button>

          <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-2xl space-y-7 relative overflow-hidden">
             <div className="flex items-center gap-5">
                <img src={selectedTemplate.imagem_url} className="w-20 h-20 rounded-[28px] object-cover shadow-inner border border-slate-100" alt="" />
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedTemplate.nome}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Dados da Validade</p>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Expiração</label>
                  <input 
                    type="date" required 
                    className={`w-full p-5 text-2xl font-black rounded-3xl border-2 outline-none transition-all ${alertExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} 
                    value={expiryDate} onChange={e => handleDateChange(e.target.value)} 
                  />
                  {alertExpired && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest px-1">Produto Expirado!</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase cursor-pointer">
                      <input type="checkbox" checked={noTime} onChange={e => setNoTime(e.target.checked)} className="rounded border-slate-300 text-indigo-600 w-5 h-5" />
                      Sem hora
                    </label>
                  </div>
                  {!noTime && (
                    <input 
                      type="time" required 
                      className="w-full p-6 text-4xl font-black rounded-[32px] bg-slate-50 border-2 border-slate-100 outline-none text-center focus:border-indigo-500 shadow-inner" 
                      value={manualTime} onChange={e => setManualTime(e.target.value)} 
                    />
                  )}
                </div>

                <button 
                  disabled={isSubmitting || success} 
                  className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl transition-all ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white active:scale-95'}`}
                >
                  {success ? 'REGISTADO ✓' : isSubmitting ? 'A GUARDAR...' : 'GRAVAR VALIDADE'}
                </button>
             </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 space-y-8 animate-scale-in">
            <h3 className="text-3xl font-black text-slate-900 text-center">Resumo da Sessão</h3>
            <div className="space-y-4">
               <div className="flex justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Registos</span>
                  <span className="font-black text-2xl">{sessionRecords.length}</span>
               </div>
            </div>
            <button onClick={sendReport} disabled={sendingReport} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl active:scale-95">
              {sendingReport ? 'A ENVIAR...' : 'ENVIAR RELATÓRIO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorForm;
