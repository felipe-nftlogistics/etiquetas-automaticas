import React from 'react';
import { NFT_LOGO_FULL } from '../assets/logos';

export default function LabelCard({ item, operationType, isPrintMode = false }) {
  const isImport = operationType === 'importacao';
  const tipoCarga = (item.tipoCarga || 'Temporary').toUpperCase();

  return (
    <div 
      className={`print-label-a5 relative bg-white border border-slate-300 flex flex-col justify-between overflow-hidden box-border select-none ${
        isPrintMode 
          ? 'w-[210mm] h-[148.5mm] p-[5mm]' 
          : 'w-full aspect-[210/148.5] p-3 sm:p-4 rounded-xl shadow-md'
      }`}
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* ========================================================= */}
      {/* 1. CABEÇALHO: LOGO NFT COMPLETO (ESQ) + CAIXA REF CENTRALIZADA (DIR) */}
      {/* (Removida a tarja de operação central conforme solicitado) */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-4 pb-2 pt-0.5">
        
        {/* Logo NFT Completo (nft_logo_completo-black.png) */}
        <div className="flex items-center">
          <img
            src={NFT_LOGO_FULL}
            alt="NFT Logistics"
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </div>

        {/* Caixa de Referência (Borda Laranja, sem tag REF, centralizada e com fonte maior) */}
        <div className="border-2 border-[#ea5b27] rounded-lg px-4 py-1.5 bg-white flex items-center justify-center min-w-[200px] sm:min-w-[240px] shadow-2xs">
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight text-center">
            {item.referencia || 'NFT-REF-0000'}
          </span>
        </div>

      </div>

      {/* Linha Divisória Preta Marcante */}
      <div className="w-full h-0.5 bg-slate-900 my-0.5" />

      {/* ========================================================= */}
      {/* 2. DADOS DO CLIENTE & EVENTO / DESTINO */}
      {/* ========================================================= */}
      <div className="grid grid-cols-12 gap-3 py-1 items-start">
        
        {/* Coluna Esquerda: Expositor & Evento/Destino (8 colunas) */}
        <div className="col-span-8 space-y-1">
          {/* Expositor */}
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
              EXPOSITOR / EXHIBITOR (CLIENTE):
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase leading-snug line-clamp-2">
              {item.expositor || 'NOME DO EXPOSITOR'}
            </h3>
          </div>

          {/* Feira ou Retorno Aberto para preenchimento manual */}
          {isImport ? (
            <div className="space-y-0.5">
              <div>
                <span className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  FEIRA / EVENTO (DESTINATION EVENT):
                </span>
                <span className="text-xs sm:text-sm font-black text-[#ea5b27] uppercase leading-tight block line-clamp-2">
                  {item.feira || 'FEIRA INTERNACIONAL'}
                </span>
              </div>
              {item.estande && (
                <div>
                  <span className="text-[8.5px] font-bold text-slate-800 line-clamp-1">
                    ESTANDE / LOCAL: <strong className="text-slate-900">{item.estande}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 pt-0.5">
              <span className="text-[9px] font-black text-[#ea5b27] uppercase tracking-wider block">
                RETURN:
              </span>
              {/* Campo aberto para escrita à mão na feira (mesma largura e altura para 3 linhas) */}
              <div className="w-full border-2 border-dashed border-slate-400 bg-white rounded-md p-1.5 min-h-[46px] flex flex-col justify-between">
                <div className="w-full border-b border-slate-200 h-3"></div>
                <div className="w-full border-b border-slate-200 h-3"></div>
                <div className="w-full h-3"></div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Card de Observações / Notas com DTA e Nota Fiscal */}
        <div className="col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[9px] flex flex-col justify-between min-h-[58px]">
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">
              OBSERVAÇÕES / NOTAS:
            </span>
            <p className="text-[9.5px] text-slate-700 font-medium leading-snug line-clamp-2">
              {item.observacoes || 'Sem observações adicionais'}
            </p>
          </div>

          {/* Tags de DTA e Nota Fiscal (se preenchidos) */}
          {(item.dta || item.notaFiscal) && (
            <div className="mt-1 pt-1 border-t border-slate-200/80 flex flex-wrap gap-1.5 text-[8.5px] font-mono">
              {item.dta && (
                <span className="bg-orange-100/80 text-orange-950 font-bold px-1.5 py-0.5 rounded">
                  DTA: <span className="font-extrabold">{item.dta}</span>
                </span>
              )}
              {item.notaFiscal && (
                <span className="bg-blue-100/80 text-blue-950 font-bold px-1.5 py-0.5 rounded">
                  NF: <span className="font-extrabold">{item.notaFiscal}</span>
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. DESTAQUE CENTRAL: "TEMPORARY", "DEFINITIVE", "EMPTY", "FULL", "FRAGILE" */}
      {/* Pegando a largura toda da etiqueta, bem no centro, bem visível! */}
      {/* (Subtítulo com logo e 'international logistics' removido a pedido) */}
      {/* ========================================================= */}
      <div className="my-auto py-2 text-center w-full">
        <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase leading-none">
          {tipoCarga}
        </h2>
      </div>

      {/* ========================================================= */}
      {/* 4. PARTE INFERIOR: VOLUMES EM LARGURA TOTAL */}
      {/* (Sem borda laranja externa, sem QR code, números maiores) */}
      {/* ========================================================= */}
      <div className="w-full">
        <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-1 px-0.5">
          VOLUMES
        </div>
        <div className="grid grid-cols-11 items-center gap-2 sm:gap-3">
          
          {/* Box Volume Atual (Quase metade da largura) */}
          <div className="col-span-5 border-2 border-slate-300 rounded-xl py-2 sm:py-3.5 text-center bg-white shadow-2xs">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">
              {item.volumeAtual}
            </span>
          </div>

          {/* "OF" Central */}
          <div className="col-span-1 text-center font-black text-base sm:text-lg text-slate-900">
            OF
          </div>

          {/* Box Total Volumes (Quase metade da largura) */}
          <div className="col-span-5 border-2 border-slate-300 rounded-xl py-2 sm:py-3.5 text-center bg-white shadow-2xs">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">
              {item.totalVolumes}
            </span>
          </div>

        </div>
      </div>

      {/* Rodapé de conformidade aduaneira removido a pedido */}

    </div>
  );
}
