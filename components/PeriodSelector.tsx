
import React, { useState } from 'react';
import { User, Period, SessionData } from '../types';

interface PeriodSelectorProps {
  user: User;
  onStart: (session: SessionData) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ user, onStart }) => {
  const [operatorName, setOperatorName] = useState(user.name);
  const [reportEmail, setReportEmail] = useState(user.email);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  const periods: { id: Period; label: string; icon: string; time: string; color: string }[] = [
    { id: 'abertura', label: 'Abertura', icon: '🌅', time: '07:00 - 12:00', color: 'from-orange-400 to-amber-500' },
    { id: 'transicao', label: 'Transição', icon: '☀️', time: '12:00 - 21:00', color: 'from-indigo-400 to-blue-500' },
    { id: 'fecho', label: 'Fecho', icon: '🌙', time: '21:00 - 01:00', color: 'from-slate-700 to-slate-900' }
  ];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPeriod && operatorName && reportEmail) {
      onStart({
        operatorName,
        reportEmail,
        period: selectedPeriod
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900">Configurar Tarefa</h1>
          <p className="text-slate-500 mt-2">Identifique-se para começar o registo</p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O seu Nome</label>
              <input 
                type="text" required 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                value={operatorName} onChange={e => setOperatorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email para Relatório</label>
              <input 
                type="email" required 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                value={reportEmail} onChange={e => setReportEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Escolha o Período</label>
            <div className="grid grid-cols-1 gap-3">
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`relative group overflow-hidden bg-white p-4 rounded-3xl border transition-all active:scale-95 text-left flex items-center gap-4 ${selectedPeriod === p.id ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-lg' : 'border-slate-200 shadow-sm'}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-xl shadow-inner shrink-0`}>
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{p.label}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{p.time}</p>
                  </div>
                  {selectedPeriod === p.id && (
                    <div className="bg-indigo-600 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!selectedPeriod}
            className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            Começar Tarefa
          </button>
        </form>
      </div>
    </div>
  );
};

export default PeriodSelector;
