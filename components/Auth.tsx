
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (email === 'admin@valida.com' && password === 'admin123') {
        onLogin({ id: '1', email, role: 'admin', name: 'Administrador' });
      } else if (email === 'op@valida.com' && password === 'op123') {
        onLogin({ id: '2', email, role: 'operator', name: 'Operador Loja' });
      } else {
        setError('Credenciais inválidas. Use os dados demo abaixo.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfdff] px-6">
      <div className="w-full max-w-sm space-y-10 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 animate-float">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Valida<span className="text-indigo-600">Control</span></h1>
            <p className="mt-2 text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Smart Expiry Systems</p>
          </div>
        </div>

        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 rounded-[48px] border border-slate-100 space-y-8">
          <form className="space-y-8" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest p-4 rounded-2xl border border-red-100 text-center animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Empresarial</label>
              <input
                type="email"
                required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                placeholder="ex: joao@loja.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Palavra-passe</label>
              <input
                type="password"
                required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-lg shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Entrar na Loja'
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3">
           <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center mb-2">Credenciais de Demonstração</p>
             <div className="flex justify-around">
               <div className="text-[10px] font-bold text-slate-600">Admin: <span className="text-indigo-600">admin@valida.com</span> / admin123</div>
             </div>
             <div className="flex justify-around mt-1">
               <div className="text-[10px] font-bold text-slate-600">Op: <span className="text-indigo-600">op@valida.com</span> / op123</div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
