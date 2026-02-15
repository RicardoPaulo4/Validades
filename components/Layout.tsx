
import React from 'react';
import { User, Period } from '../types';

interface LayoutProps {
  user: User;
  currentPeriod: Period | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, currentPeriod, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 leading-tight">Valida<span className="text-indigo-600">Control</span></span>
                {currentPeriod && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">{currentPeriod}</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{user.name.split(' ')[0]}</p>
                <div className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-400 uppercase">{user.role}</div>
              </div>
              <button onClick={onLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 sm:hidden flex justify-around items-center h-16 safe-bottom z-50 px-6">
        <div className="flex flex-col items-center text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[9px] font-black uppercase mt-1">Tarefa</span>
        </div>
        <div className="flex flex-col items-center text-slate-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[9px] font-black uppercase mt-1">Histórico</span>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
