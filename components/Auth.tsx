
import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');

    try {
      const users = await supabaseService.getUsers();
      
      if (mode === 'login') {
        const user = users.find(u => u.email === email);
        if (user) {
          // Nota: Em produção aqui haveria validação de password real via Auth Provider
          if (!user.approved) {
            setError('A sua conta ainda não foi aprovada pelo administrador.');
          } else {
            onLogin(user);
          }
        } else {
          setError('Utilizador não encontrado.');
        }
      } else {
        // Registo
        if (users.some(u => u.email === email)) {
          setError('Este email já está registado.');
        } else {
          await supabaseService.registerUser({ email, name, role });
          setInfo('Solicitação enviada! Aguarde a aprovação do administrador.');
          setMode('login');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex bg-slate-50 p-1.5 rounded-3xl">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Registo
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest p-4 rounded-2xl border border-red-100 text-center">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest p-4 rounded-2xl border border-emerald-100 text-center">
                {info}
              </div>
            )}
            
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                  <input
                    type="text" required
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                    placeholder="ex: João Silva"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Função Pretendida</label>
                  <select 
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none"
                    value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="operator">Operador de Loja</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
              <input
                type="email" required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                placeholder="ex: joao@loja.pt"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Palavra-passe</label>
              <input
                type="password" required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-lg shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                mode === 'login' ? 'Entrar na Loja' : 'Solicitar Acesso'
              )}
            </button>
          </form>
        </div>

        {mode === 'login' && (
          <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50 text-center">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Acesso Rápido Demo</p>
             <div className="text-[10px] font-bold text-slate-600">Admin: admin@valida.com / admin123</div>
             <div className="text-[10px] font-bold text-slate-600">Op: op@valida.com / op123</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
