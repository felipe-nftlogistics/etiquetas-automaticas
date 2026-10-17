import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { NFT_LOGO_LOGIN } from '../assets/loginLogo';
import { authenticate, checkBruteForceLockout } from '../../auth/auth';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [honeypot, setHoneypot] = useState(''); // Campo anti-robô
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Monitora e atualiza o contador de bloqueio de brute force
  useEffect(() => {
    const checkLock = () => {
      const lock = checkBruteForceLockout();
      if (lock.isLocked) {
        setLockoutSeconds(lock.remainingSeconds);
      } else {
        setLockoutSeconds(0);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (lockoutSeconds > 0) {
      setErrorMessage(`Acesso bloqueado por segurança. Aguarde ${lockoutSeconds} segundos.`);
      return;
    }

    if (!username.trim() || !password) {
      setErrorMessage('Credenciais inválidas.');
      return;
    }

    setIsLoading(true);

    try {
      // Pequena latência artificial para evitar ataques automatizados de dicionário
      await new Promise((r) => setTimeout(r, 450));
      const session = await authenticate(username, password, rememberMe, honeypot);
      onLoginSuccess(session);
    } catch (err) {
      setErrorMessage(err.message || 'Credenciais inválidas.');
      const lock = checkBruteForceLockout();
      if (lock.isLocked) {
        setLockoutSeconds(lock.remainingSeconds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Card Principal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          
          {/* Logo e Cabeçalho do Card (Logo Branco sem fundo) */}
          <div className="text-center space-y-4">
            <div className="flex justify-center py-1">
              <img
                src={NFT_LOGO_LOGIN}
                alt="NFT Logistics"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Controle de Acesso
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Sistema de Gestão e Emissão de Etiquetas de Feiras
              </p>
            </div>
          </div>

          {/* Alerta de Bloqueio por Brute Force */}
          {lockoutSeconds > 0 && (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Muitas tentativas inválidas. Bloqueado temporariamente por <strong>{lockoutSeconds}s</strong> para evitar ataques.
              </span>
            </div>
          )}

          {/* Alerta de Erro Genérico */}
          {errorMessage && lockoutSeconds === 0 && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário com Honeypot invisível */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ======================================================== */}
            {/* HONEYPOT INVISÍVEL ANTI-BOT / ANTI-BRUTE FORCE           */}
            {/* ======================================================== */}
            <div className="opacity-0 absolute -left-[9999px] h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <label htmlFor="hp_security_field">Leave this empty</label>
              <input
                type="text"
                id="hp_security_field"
                name="hp_security_field"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Campo Usuário */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                E-mail ou Usuário:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu e-mail ou usuário"
                  autoComplete="username"
                  disabled={lockoutSeconds > 0}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 disabled:opacity-50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#ea5b27] focus:ring-1 focus:ring-[#ea5b27] transition"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Senha de Acesso:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={lockoutSeconds > 0}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 disabled:opacity-50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#ea5b27] focus:ring-1 focus:ring-[#ea5b27] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Lembrar-me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 bg-slate-950 border-slate-700 focus:ring-orange-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-medium">Lembrar meu acesso</span>
              </label>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 + Honeypot</span>
              </span>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-950/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : lockoutSeconds > 0 ? (
                <span>Bloqueado ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Rodapé Seguro */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
            NFT LOGISTICS SOLUTIONS • CONEXÃO CRIPTOGRAFADA
          </p>
        </div>

      </div>

    </div>
  );
}
