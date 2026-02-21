
import React, { useState, useEffect, useRef } from 'react';
import { User, ProductTemplate, SessionData, ValidityRecord, ProductGroup } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';
import StatusBadge from './StatusBadge.tsx';

interface OperatorFormProps {
  user: User;
  session: SessionData;
  activeTab?: 'task' | 'history';
  onFinishTask: () => void;
}

const PRODUCT_GROUPS: ProductGroup[] = ['Frescos', 'Pão', 'Molhos', 'Coberturas', 'McCafé', 'Outros'];

export default function OperatorForm({ user, session, activeTab = 'task', onFinishTask }: OperatorFormProps) {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [sessionRecords, setSessionRecords] = useState<ValidityRecord[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [isNoTime, setIsNoTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alertStatus, setAlertStatus] = useState<'none' | 'expired' | 'warning'>('none');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showReport, setShowReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    supabaseService.getTemplates().then(all => {
      setTemplates(all.filter(t => t.periodos.includes(session.period)));
    });
  }, [session.period]);

  const validateExpiry = (date: string, time: string, noTime: boolean) => {
    if (!date) return;
    
    const now = new Date();
    const selected = new Date(date);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    selected.setHours(0,0,0,0);

    if (selected < today) {
      setAlertStatus('expired');
    } else if (selected.getTime() === today.getTime()) {
      if (!noTime && time) {
        const [h, m] = time.split(':').map(Number);
        const nowH = now.getHours();
        const nowM = now.getMinutes();
        if (h < nowH || (h === nowH && m < nowM)) {
          setAlertStatus('expired');
          return;
        }
      }
      setAlertStatus('warning');
    } else {
      setAlertStatus('none');
    }
  };

  const handleDateChange = (date: string) => {
    setExpiryDate(date);
    validateExpiry(date, manualTime, isNoTime);
  };

  const handleTimeChange = (time: string) => {
    setManualTime(time);
    setIsNoTime(false);
    validateExpiry(expiryDate, time, false);
  };

  const toggleNoTime = () => {
    const newVal = !isNoTime;
    setIsNoTime(newVal);
    if (newVal) setManualTime('');
    validateExpiry(expiryDate, '', newVal);
  };

  const handleSelectTemplate = (t: ProductTemplate) => {
    setSelectedTemplate(t);
    setExpiryDate('');
    setManualTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
    setIsNoTime(false);
    setAlertStatus('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !expiryDate || (!manualTime && !isNoTime)) return;

    setIsSubmitting(true);
    try {
      const newRecord = await supabaseService.addRecord({
        template_id: selectedTemplate.id,
        nome_produto: selectedTemplate.nome,
        imagem_url: selectedTemplate.imagem_url,
        data_validade: expiryDate,
        hora_registo: isNoTime ? 'N/A' : manualTime,
        periodo: session.period,
        loja: session.loja,
        criado_por_id: user.id,
        criado_por_nome: session.operatorName,
        criado_por_email: session.reportEmail,
        grupo: selectedTemplate.grupo
      });

      setSessionRecords([newRecord, ...sessionRecords]);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setSelectedTemplate(null);
        setExpiryDate('');
        setManualTime('');
        setIsNoTime(false);
        setSearchTerm('');
      }, 1500);
    } catch (err) {
      alert('Erro ao guardar registo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeTab === 'history') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-32 animate-fade-in px-2">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Sessão Atual</h2>
          <div className="bg-indigo-600 text-white px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest">
            {sessionRecords.length} itens
          </div>
        </div>

        <div className="grid gap-3">
          {sessionRecords.length === 0 ? (
            <div className="bg-white p-12 rounded-[40px] text-center text-slate-400 font-bold border-2 border-dashed border-slate-100">
              Nenhum registo efetuado.
            </div>
          ) : sessionRecords.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4">
              <img src={r.imagem_url} referrerPolicy="no-referrer" className="w-14 h-14 rounded-2xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{r.nome_produto}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(r.data_validade).toLocaleDateString('pt-PT')} @ {r.hora_registo}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-40 px-2">
      {!selectedTemplate ? (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{session.period}</h2>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{session.loja}</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{session.operatorName}</p>
            </div>
          </div>

          <div className="relative group sticky top-20 z-30">
            <input 
              type="text" placeholder="Pesquisar produto..."
              className="w-full p-6 bg-white/80 backdrop-blur-md border-2 border-slate-100 rounded-[32px] shadow-lg pl-16 font-bold outline-none focus:border-indigo-500 transition-all text-lg"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-6 top-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="space-y-12">
            {PRODUCT_GROUPS.map(group => {
              const groupTemplates = filteredTemplates.filter(t => t.grupo === group);
              if (groupTemplates.length === 0) return null;

              return (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{group}</h3>
                    <div className="h-px bg-slate-200 w-full"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {groupTemplates.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => handleSelectTemplate(t)} 
                        className="bg-white p-3 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group active:scale-95"
                      >
                        <div className="aspect-square rounded-[28px] overflow-hidden mb-3">
                          <img src={t.imagem_url} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={t.nome} />
                        </div>
                        <p className="font-black text-slate-800 text-xs px-2 truncate">{t.nome}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-0.5">{t.tempo_vida_dias} dias</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {filteredTemplates.length === 0 && (
              <div className="py-20 text-center">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum produto encontrado</p>
              </div>
            )}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center z-40 sm:static sm:px-0">
            <button 
              onClick={() => setShowReport(true)}
              className="w-full max-w-sm py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Finalizar Relatório
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          <button 
            onClick={() => setSelectedTemplate(null)} 
            className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Cancelar
          </button>

          <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-2xl space-y-8">
             <div className="flex items-center gap-6">
                <img src={selectedTemplate.imagem_url} referrerPolicy="no-referrer" className="w-24 h-24 rounded-[32px] object-cover shadow-xl border-2 border-white" alt="" />
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">{selectedTemplate.nome}</h3>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedTemplate.grupo}</span>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Data de Validade</label>
                  <input 
                    type="date" required 
                    className={`w-full p-6 text-2xl font-black rounded-[32px] border-4 outline-none transition-all ${alertStatus === 'expired' ? 'bg-red-50 border-red-500 text-red-600' : alertStatus === 'warning' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} 
                    value={expiryDate} onChange={e => handleDateChange(e.target.value)} 
                  />
                  {alertStatus === 'expired' && (
                    <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest px-4 animate-shake">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Atenção: Produto Caducado!
                    </div>
                  )}
                  {alertStatus === 'warning' && (
                    <div className="text-amber-600 text-[10px] font-black uppercase tracking-widest px-4">
                      Atenção: Expira Hoje!
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hora de Verificação</label>
                    <button 
                      type="button" 
                      onClick={toggleNoTime}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isNoTime ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {isNoTime ? 'SEM HORA ✓' : 'SEM HORA'}
                    </button>
                  </div>
                  
                  {!isNoTime ? (
                    <input 
                      type="time" required 
                      className="w-full p-6 text-4xl font-black rounded-[32px] bg-slate-50 border-4 border-slate-100 outline-none text-center focus:border-indigo-500 transition-all tabular-nums" 
                      value={manualTime} onChange={e => handleTimeChange(e.target.value)} 
                    />
                  ) : (
                    <div className="w-full p-10 bg-indigo-50 rounded-[32px] border-4 border-indigo-100 flex items-center justify-center">
                      <span className="text-xl font-black text-indigo-400 uppercase tracking-widest">Apenas Data</span>
                    </div>
                  )}
                </div>

                <button 
                  disabled={isSubmitting || success} 
                  className={`w-full py-7 rounded-[32px] font-black text-xl shadow-2xl transition-all duration-500 ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white active:scale-95'}`}
                >
                  {success ? 'REGISTADO ✓' : isSubmitting ? 'A GUARDAR...' : 'CONFIRMAR'}
                </button>
             </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[56px] p-10 space-y-8 animate-scale-in border border-white/20">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Finalizar Turno</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">Resumo do período de {session.period} - {session.loja}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                  <span className="block font-black text-3xl text-slate-900">{sessionRecords.length}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
               </div>
               <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 text-center">
                  <span className="block font-black text-3xl text-red-600">{sessionRecords.filter(r => r.status === 'expired').length}</span>
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Caducados</span>
               </div>
            </div>

            <div className="pt-4 space-y-4">
              <button 
                onClick={async () => {
                  setSendingReport(true);
                  try {
                    const response = await fetch('/api/send-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: session.reportEmail,
                        session: session,
                        records: sessionRecords
                      })
                    });
                    
                    if (!response.ok) {
                      let errorMessage = 'Erro ao enviar email';
                      try {
                        const errData = await response.json();
                        errorMessage = errData.error || errorMessage;
                      } catch (e) {
                        // Se não for JSON, tenta ler como texto ou usa o status
                        const textError = await response.text();
                        console.error('Resposta não-JSON do servidor:', textError);
                        errorMessage = `Erro do Servidor (${response.status}): O serviço de email não respondeu corretamente.`;
                      }
                      throw new Error(errorMessage);
                    }
                    
                    const successData = await response.json();
                    alert(successData.message || 'Relatório enviado com sucesso para ' + session.reportEmail);
                  } catch (err: any) {
                    console.error('Erro ao enviar relatório:', err);
                    alert('Erro ao enviar email: ' + err.message + '\n\nO registo foi guardado no sistema, mas o email falhou.');
                  } finally {
                    setSendingReport(false);
                    setShowReport(false);
                    onFinishTask();
                  }
                }} 
                disabled={sendingReport} 
                className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {sendingReport ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    A ENVIAR...
                  </>
                ) : 'ENVIAR RELATÓRIO EMAIL'}
              </button>
              <button 
                onClick={() => setShowReport(false)} 
                className="w-full text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Voltar à Edição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
