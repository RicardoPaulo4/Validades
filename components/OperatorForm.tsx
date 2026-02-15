
import React, { useState, useEffect } from 'react';
import { User, ProductTemplate, Period, SessionData, ValidityRecord } from '../types';
import { supabaseService } from '../services/supabaseService';

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
  const [success, setSuccess] = useState(false);
  const [alertExpired, setAlertExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showReport, setShowReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

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
      }, 2000);
    } catch (err) {
      alert('Erro ao guardar registo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSession = () => {
    if (sessionRecords.length === 0) {
      onFinishTask();
      return;
    }
    setShowReport(true);
  };

  const sendReport = () => {
    setSendingReport(true);
    // Simulação de envio de email
    setTimeout(() => {
      setSendingReport(false);
      alert(`Relatório enviado com sucesso para ${session.reportEmail}`);
      onFinishTask();
    }, 2500);
  };

  const filteredTemplates = templates.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      {!selectedTemplate ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-end px-1">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{session.period}</h2>
              <p className="text-slate-500 text-xs font-medium">Operador: {session.operatorName}</p>
            </div>
            <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100">
              {sessionRecords.length} Items
            </div>
          </div>

          <div className="relative">
            <input 
              type="text" placeholder="Procurar produto..."
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm pl-12 font-medium outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-4 top-4.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => handleSelectTemplate(t)} className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-all text-left">
                <img src={t.imagem_url} className="w-full aspect-square rounded-2xl object-cover mb-2" alt="" />
                <p className="font-bold text-slate-800 text-xs px-1 truncate">{t.nome}</p>
              </button>
            ))}
          </div>

          {/* Floating Finish Button */}
          <div className="fixed bottom-20 left-0 right-0 px-6 flex justify-center pointer-events-none">
            <button 
              onClick={handleFinishSession}
              className="pointer-events-auto px-8 py-4 bg-slate-900 text-white rounded-full font-black shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Finalizar Tarefa
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 font-bold flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            Voltar
          </button>

          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl space-y-6">
             <div className="flex items-center gap-4">
                <img src={selectedTemplate.imagem_url} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedTemplate.nome}</h3>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-widest">Data de Validade</label>
                  <input type="date" required className={`w-full p-5 text-xl font-black rounded-2xl border-2 transition-all outline-none ${alertExpired ? 'bg-red-50 border-red-300 text-red-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} value={expiryDate} onChange={e => handleDateChange(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hora</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase cursor-pointer">
                      <input type="checkbox" checked={noTime} onChange={e => setNoTime(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                      Sem hora
                    </label>
                  </div>
                  {!noTime && <input type="time" required={!noTime} className="w-full p-5 text-2xl font-black rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none text-center" value={manualTime} onChange={e => setManualTime(e.target.value)} />}
                </div>

                {success ? (
                  <div className="bg-emerald-500 text-white p-5 rounded-[24px] font-black text-center shadow-lg animate-bounce">✓ Registado!</div>
                ) : (
                  <button disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all">
                    {isSubmitting ? 'A guardar...' : 'Confirmar Registo'}
                  </button>
                )}
             </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 2v-6m-9-3H9m12 0h-3.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0015.586 3H8.414a1 1 0 00-.707.293L6.293 4.707A1 1 0 015.586 5H2a2 2 0 00-2 2v12a2 2 0 002 2h20a2 2 0 002-2V7a2 2 0 00-2-2z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Resumo da Tarefa</h3>
              <p className="text-slate-500 text-sm mt-1">Tarefa concluída com sucesso</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
               <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Total Registos</span>
                  <span className="font-black text-slate-900">{sessionRecords.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Em Alerta</span>
                  <span className="font-black text-amber-600">{sessionRecords.filter(r => r.status === 'expiring_soon').length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Expirados</span>
                  <span className="font-black text-red-600">{sessionRecords.filter(r => r.status === 'expired').length}</span>
               </div>
            </div>

            <div className="text-center space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Enviar relatório para:</p>
               <p className="text-sm font-black text-indigo-600">{session.reportEmail}</p>
            </div>

            <button 
              onClick={sendReport}
              disabled={sendingReport}
              className="w-full py-5 bg-indigo-600 text-white rounded-[28px] font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              {sendingReport ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  A enviar...
                </>
              ) : 'Enviar e Sair'}
            </button>
            
            {!sendingReport && (
              <button onClick={() => setShowReport(false)} className="w-full py-2 text-slate-400 font-bold text-sm">Continuar a registar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorForm;
