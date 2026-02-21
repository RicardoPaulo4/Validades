
import React, { useState } from 'react';
import { User, Period, SessionData } from '../types.ts';

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
    if (selectedPeriod && operatorName) {
      onStart({
        operatorName,
        reportEmail: '', // No longer used
        period: selectedPeriod,
        loja: user.loja
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12 safe-top safe-bottom">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lista de Validades Diária</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">{user.loja}</p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Operador</label>
              <input 
                type="text" required 
                placeholder="Ex: João Silva"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                value={operatorName} onChange={e => setOperatorName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPeriod(p.id)}
                className={`p-4 rounded-3xl border transition-all flex items-center gap-4 ${selectedPeriod === p.id ? 'border-indigo-600 bg-white ring-2 ring-indigo-50' : 'bg-white border-slate-200'}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-inner`}>{p.icon}</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{p.label}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">{p.time}</p>
                </div>
              </button>
            ))}
          </div>

          <button disabled={!selectedPeriod} className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50">
            Iniciar Registo {user.loja}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PeriodSelector;
