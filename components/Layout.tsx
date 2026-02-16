
import React from 'react';
import { User, Period } from '../types';

interface LayoutProps {
  user: User;
  currentPeriod: Period | null;
  activeTab?: 'task' | 'history';
  onTabChange?: (tab: 'task' | 'history') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  currentPeriod, 
  activeTab = 'task', 
  onTabChange, 
  onLogout, 
  children 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 tracking-tight leading-none mb-0.5">Valida<span className="text-indigo-600">Control</span></span>
                {currentPeriod && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{currentPeriod}</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-slate-900">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
              </div>
              <button 
                onClick={onLogout} 
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Modern Glassy Bottom Nav for Operators */}
      {user.role === 'operator' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200 sm:hidden flex justify-around items-center h-20 safe-bottom z-50 px-8">
          <button 
            onClick={() => onTabChange?.('task')}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'task' ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === 'task' ? 'bg-indigo-50' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Tarefa</span>
          </button>
          
          <button 
            onClick={() => onTabChange?.('history')}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-300'}`}
          >
             <div className={`p-2 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Sessão</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
