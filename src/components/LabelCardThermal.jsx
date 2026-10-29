import React from 'react';
import { NFT_LOGO_FULL } from '../assets/logos';

export default function LabelCardThermal({ item, operationType, isPrintMode = false }) {
  const isImport = operationType === 'importacao';
  const tipoCarga = (item.tipoCarga || 'Temporary').toUpperCase();

  return (
    <div 
      className={`print-label-thermal relative bg-white flex flex-col justify-between overflow-hidden box-border select-none ${
        isPrintMode 
          ? 'w-[100mm] h-[150mm] p-[3.5mm]' 
          : 'w-full max-w-[380px] aspect-[100/150] p-4 rounded-xl shadow-md border border-slate-200 mx-auto'
      }`}
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* ========================================================= */}
      {/* 1. CABEÇALHO DISTRIBUÍDO: LOGO (LINHA 1) + REF (LINHA 2) */}
      {/* ========================================================= */}
      <div>
        {/* Linha 1: Logo NFT Centralizado e com excelente respiro */}
        <div className="flex items-center justify-center pt-0.5 pb-1.5">
          <img
            src={NFT_LOGO_FULL}
            alt="NFT Logistics"
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </div>

        {/* Linha 2: Caixa da Referência Interna em Destaque (Largura Total) */}
        <div className="border-2 border-[#ea5b27] rounded-lg px-3 py-1 bg-white flex items-center justify-center w-full shadow-2xs">
          <span className="text-xs sm:text-sm font-black text-slate-900 font-mono tracking-wider text-center">
            {item.referencia || 'NFT-REF-0000'}
          </span>
        </div>

        {/* Linha Divisória Marcante */}
        <div className="w-full h-0.5 bg-slate-900 my-1.5" />
      </div>

      {/* ========================================================= */}
      {/* 2. DADOS DO CLIENTE & EVENTO COM QUEBRA DE LINHA */}
      {/* ========================================================= */}
      <div className="space-y-1.5 py-0.5">
        {isImport ? (
          <>
            {/* Expositor com suporte a múltiplas linhas (ex: caracteres chineses + inglês) */}
            <div>
              <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                EXPOSITOR / EXHIBITOR (CLIENTE):
              </span>
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 uppercase leading-snug line-clamp-3 whitespace-pre-line">
                {item.expositor || 'NOME DO EXPOSITOR'}
              </h3>
            </div>

            {/* Feira / Evento */}
            <div className="space-y-0.5">
              <div>
                <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  FEIRA / EVENTO (DESTINATION EVENT):
                </span>
                <span className="text-[11px] sm:text-xs font-black text-[#ea5b27] uppercase leading-tight block line-clamp-2">
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
          </>
        ) : (
          <>
            {/* EXPORTAÇÃO: CONSIGNEE + ENDEREÇO */}
            <div className="space-y-0.5">
              <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                CONSIGNEE:
              </span>
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 uppercase leading-snug line-clamp-2 whitespace-pre-line">
                {item.consignee || item.expositor || 'NOME DO CONSIGNEE'}
              </h3>
              {item.consigneeAddress && (
                <p className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-600 leading-tight whitespace-pre-line">
                  {item.consigneeAddress}
                </p>
              )}
            </div>

            {/* EXPORTAÇÃO: EXPORTER + ENDEREÇO */}
            <div className="space-y-0.5 pt-0.5">
              <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
                EXPORTER:
              </span>
              <h3 className="text-[11px] sm:text-xs font-black text-slate-900 uppercase leading-snug line-clamp-2 whitespace-pre-line">
                {item.exporter || 'NOME DO EXPORTADOR'}
              </h3>
              {item.exporterAddress && (
                <p className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-600 leading-tight whitespace-pre-line">
                  {item.exporterAddress}
                </p>
              )}
            </div>
          </>
        )}

        {/* Card de Observações / Notas com DTA (apenas import) e Nota Fiscal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[8.5px] flex flex-col justify-between">
          <div>
            <span className="text-[7.5px] font-bold text-slate-500 uppercase block mb-0.5">
              OBSERVAÇÕES / NOTAS:
            </span>
            <p className="text-[8.5px] text-slate-700 font-medium leading-relaxed line-clamp-2">
              {item.observacoes || 'Sem observações adicionais'}
            </p>
          </div>

          {((isImport && item.dta) || item.notaFiscal) && (
            <div className="mt-1 pt-1 border-t border-slate-200/80 flex flex-wrap gap-1 text-[8px] font-mono">
              {isImport && item.dta && (
                <span className="bg-orange-100/80 text-orange-950 font-bold px-1 py-0.2 rounded">
                  DTA: <span className="font-extrabold">{item.dta}</span>
                </span>
              )}
              {item.notaFiscal && (
                <span className="bg-blue-100/80 text-blue-950 font-bold px-1 py-0.2 rounded">
                  NF: <span className="font-extrabold">{item.notaFiscal}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DESTAQUE CENTRAL: STATUS DA CARGA */}
      {/* ========================================================= */}
      <div className="my-auto py-1 text-center w-full flex flex-col items-center justify-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
          {tipoCarga}
        </h2>

        {/* Em Exportação: Campo de observações importantes centralizado, sem título, fonte igual ao Consignee */}
        {!isImport && item.observacoesImportantes && (
          <div className="w-full text-center mt-1">
            <p className="text-xs sm:text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight px-2">
              {item.observacoesImportantes}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. PARTE INFERIOR: VOLUMES ALINHADOS AO BOTTOM */}
      {/* ========================================================= */}
      <div className="w-full">
        <div className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-wider mb-1 px-0.5">
          VOLUMES
        </div>
        <div className="grid grid-cols-11 items-center gap-1.5 sm:gap-2">
          
          {/* Box Volume Atual */}
          <div className="col-span-5 border-2 border-slate-300 rounded-lg py-2 sm:py-2.5 text-center bg-white shadow-2xs">
            <span className="text-3xl sm:text-[34px] font-black text-slate-900 leading-none">
              {item.volumeAtual}
            </span>
          </div>

          {/* "OF" Central */}
          <div className="col-span-1 text-center font-black text-xs sm:text-sm text-slate-900">
            OF
          </div>

          {/* Box Total Volumes */}
          <div className="col-span-5 border-2 border-slate-300 rounded-lg py-2 sm:py-2.5 text-center bg-white shadow-2xs">
            <span className="text-3xl sm:text-[34px] font-black text-slate-900 leading-none">
              {item.totalVolumes}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
