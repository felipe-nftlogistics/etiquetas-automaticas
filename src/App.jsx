import React, { useState, lazy, Suspense } from 'react';
import Login from './components/Login';
import { getActiveSession, logout } from '../auth/auth';

// O Dashboard inteiro e todos os seus submódulos e dados de clientes são carregados sob demanda
// O bundle público inicial só possui o Login e nenhuma menção aos dados internos do sistema
const Dashboard = lazy(() => import('./pages/Dashboard'));

export default function App() {
  const [session, setSession] = useState(() => getActiveSession());

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  // Se o visitante não está autenticado, renderiza exclusivamente o Login
  if (!session) {
    return <Login onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  // Somente após login bem-sucedido o chunk com todo o sistema é requisitado e baixado
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            Iniciando sessão segura...
          </span>
        </div>
      }
    >
      <Dashboard session={session} onLogout={handleLogout} />
    </Suspense>
  );
}
