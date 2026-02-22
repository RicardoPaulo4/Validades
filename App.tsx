
// v1.0.1 - PDF Report Update
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AuthState, SessionData } from './types.ts';
import Auth from './components/Auth.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import OperatorForm from './components/OperatorForm.tsx';
import Layout from './components/Layout.tsx';
import PeriodSelector from './components/PeriodSelector.tsx';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  const [operatorTab, setOperatorTab] = useState<'task' | 'history'>('task');

  useEffect(() => {
    const savedUser = localStorage.getItem('v_user');
    const savedSession = localStorage.getItem('v_session');
    if (savedUser) {
      try {
        setAuthState({
          user: JSON.parse(savedUser),
          session: savedSession ? JSON.parse(savedSession) : null,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
        localStorage.removeItem('v_user');
        localStorage.removeItem('v_session');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem('v_user', JSON.stringify(user));
    setAuthState({
      ...authState,
      user,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const startSession = (session: SessionData) => {
    localStorage.setItem('v_session', JSON.stringify(session));
    setAuthState(prev => ({ ...prev, session }));
  };

  const endSession = () => {
    localStorage.removeItem('v_session');
    setAuthState(prev => ({ ...prev, session: null }));
    setOperatorTab('task');
  };

  const logout = () => {
    localStorage.removeItem('v_user');
    localStorage.removeItem('v_session');
    setAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sincronizando...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!authState.isAuthenticated ? <Auth onLogin={login} /> : <Navigate to="/" />} 
        />
        
        <Route path="/" element={
          authState.isAuthenticated ? (
            authState.user?.role === 'operator' && !authState.session ? (
              <PeriodSelector onStart={startSession} user={authState.user} />
            ) : (
              <Layout 
                user={authState.user!} 
                currentPeriod={authState.session?.period || null} 
                activeTab={operatorTab}
                onTabChange={setOperatorTab}
                onLogout={logout}
              >
                {/* Admin e Gerente usam o AdminDashboard (Gerente tem restrições dentro do componente) */}
                {authState.user?.role === 'admin' || authState.user?.role === 'gerente' ? (
                  <AdminDashboard user={authState.user!} />
                ) : (
                  <OperatorForm 
                    user={authState.user!} 
                    session={authState.session!} 
                    activeTab={operatorTab}
                    onFinishTask={endSession}
                  />
                )}
              </Layout>
            )
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
