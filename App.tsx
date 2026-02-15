
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AuthState, SessionData } from './types';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import OperatorForm from './components/OperatorForm';
import Layout from './components/Layout';
import PeriodSelector from './components/PeriodSelector';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('v_user');
    const savedSession = localStorage.getItem('v_session');
    if (savedUser) {
      setAuthState({
        user: JSON.parse(savedUser),
        session: savedSession ? JSON.parse(savedSession) : null,
        isAuthenticated: true,
        isLoading: false
      });
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              <Layout user={authState.user!} currentPeriod={authState.session?.period || null} onLogout={logout}>
                {authState.user?.role === 'admin' ? (
                  <AdminDashboard user={authState.user} />
                ) : (
                  <OperatorForm 
                    user={authState.user!} 
                    session={authState.session!} 
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
