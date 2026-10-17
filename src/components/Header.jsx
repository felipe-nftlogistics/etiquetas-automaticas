import React from 'react';
import { ArrowLeft, LogOut, User, Users } from 'lucide-react';
import { NFT_LOGO_WHITE } from '../assets/logos';

export default function Header({ 
  currentMode, 
  onBackToHome, 
  totalLabels, 
  currentUser,
  isAdmin,
  onOpenUsers,
  onLogout
}) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Logo & Título */}
        <div className="flex items-center gap-4">
          {currentMode && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Voltar para a seleção de operação"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Início</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                src={NFT_LOGO_WHITE}
                alt="NFT Logistics"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
            <div className="border-l border-slate-700 pl-3 hidden sm:block">
              <span className="font-bold text-sm tracking-wide text-white">
                SISTEMA DE ETIQUETAS
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Operação + Usuário + Logout */}
        <div className="flex items-center gap-3">
          {/* Indicador de Operação Selecionada */}
          {currentMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                {currentMode === 'importacao' ? 'Importação' : 'Exportação'}
              </span>
              {totalLabels > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-600 text-white">
                  {totalLabels} {totalLabels === 1 ? 'etiqueta' : 'etiquetas'}
                </span>
              )}
            </div>
          )}

          {/* Usuário, Painel Admin e Botão de Sair */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {isAdmin && onOpenUsers && (
              <button
                onClick={onOpenUsers}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:border-orange-500/50 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Painel do Administrador - Gestão de Usuários"
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Usuários</span>
              </button>
            )}

            {currentUser && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-200 truncate max-w-[140px]">{currentUser}</span>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/70 hover:border-red-500/30 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Encerrar sessão com segurança"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
