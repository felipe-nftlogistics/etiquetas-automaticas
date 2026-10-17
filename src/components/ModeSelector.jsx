import React from 'react';
import { 
  Building2, 
  PlaneTakeoff, 
  ArrowRight, 
  FileSpreadsheet, 
  Layers, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Truck
} from 'lucide-react';
import { downloadExcelTemplate } from '../utils/excelParser';

export default function ModeSelector({ onSelectMode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      
      {/* Apresentação / Hero */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold mb-4">
          <Truck className="w-4 h-4 text-[#ea5b27]" />
          NFT Logistics • Operações de Feiras e Eventos Internacionais
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Sistema de Impressão de Etiquetas para Caixas
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Gere etiquetas padronizadas para volumes de comércio exterior em formato <strong>A4 (2 etiquetas A5 por folha)</strong> com contagem sequencial automática (<span className="text-[#ea5b27] font-semibold">Vol. 1 of 40, Vol. 2 of 40...</span>).
        </p>
      </div>

      {/* Seleção de Modo (Cards Principais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* CARD 1: IMPORTAÇÃO */}
        <div 
          onClick={() => onSelectMode('importacao')}
          className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-[#ea5b27] p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
            <span className="bg-[#ea5b27] text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider uppercase">
              Entrada no Brasil
            </span>
          </div>

          <div>
            <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea5b27] mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 group-hover:text-[#ea5b27] transition-colors">
              Importação
            </h2>
            <p className="text-sm font-semibold text-orange-600 mt-1 mb-4">
              Entrega na Feira / Pavilhão
            </p>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Para cargas e caixas que chegam do exterior e precisam ser entregues diretamente no pavilhão e estande da feira.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-6">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Campos integrados do Excel:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Nome do Expositor</strong> (Identificação em destaque)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Nome da Feira</strong> (Ex: FEIMEC, EXPOMAFE, HOSPITALAR)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Quantidade de Volumes</strong> (Gera Vol. 1 of N...)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Referência Interna</strong> (Processo NFT)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Layout A5 Paisagem • 2 por Folha A4
            </span>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-[#ea5b27] group-hover:translate-x-1 transition-transform">
              <span>Acessar Modo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: EXPORTAÇÃO */}
        <div 
          onClick={() => onSelectMode('exportacao')}
          className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider uppercase">
              Retorno ao Exterior
            </span>
          </div>

          <div>
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-6 group-hover:scale-110 transition-transform">
              <PlaneTakeoff className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
              Exportação
            </h2>
            <p className="text-sm font-semibold text-slate-700 mt-1 mb-4">
              Devolução de Admissão Temporária
            </p>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Para materiais e mostruários expostos que precisam ser coletados no estande e devolvidos ao consignatário de origem no exterior.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-6">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Campos integrados do Excel:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Nome do Expositor</strong> (Remetente no Brasil)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Consignatário da Carga</strong> (Destinatário Internacional)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Quantidade de Volumes</strong> (Gera Vol. 1 of N...)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Referência Interna</strong> (Processo NFT / D.I.)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Layout A5 Paisagem • 2 por Folha A4
            </span>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
              <span>Acessar Modo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Seção de Recursos e Modelos de Planilha */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Planilhas Modelo para Importação Automática
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Baixe as planilhas de exemplo prontas para preencher com seus expositores e caixas.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadExcelTemplate('importacao')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#ea5b27] border border-orange-200 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Modelo Excel (Importação)</span>
            </button>
            <button
              onClick={() => downloadExcelTemplate('exportacao')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Modelo Excel (Exportação)</span>
            </button>
          </div>
        </div>

        {/* Especificações de Impressão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-[#ea5b27]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase">2 Etiquetas A5 por Folha A4</h4>
              <p className="text-xs text-slate-500 mt-1">
                Aproveitamento exato da folha A4 dividida ao meio (148,5 x 210 mm cada etiqueta), com linha guia de corte central.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase">Sequência Automática</h4>
              <p className="text-xs text-slate-500 mt-1">
                Se o expositor tem 40 caixas, são geradas 40 etiquetas sequenciais (<span className="text-slate-700 font-semibold">Vol. 1 of 40 até 40 of 40</span>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase">Padrão Internacional COMEX</h4>
              <p className="text-xs text-slate-500 mt-1">
                Layout com QR Code, advertências de manuseio e branding oficial da NFT Logistics.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
