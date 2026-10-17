import React from 'react';
import LabelCard from './LabelCard';

export default function PrintSheetA4({ topLabel, bottomLabel, operationType, sheetNumber, totalSheets, isPrintMode = false }) {
  return (
    <div 
      className={`print-sheet relative bg-white mx-auto flex flex-col justify-between overflow-hidden ${
        isPrintMode
          ? 'w-[210mm] h-[297mm]'
          : 'preview-sheet-a4 border border-slate-300 rounded-lg shadow-lg mb-8'
      }`}
      style={{
        width: '210mm',
        height: '297mm',
        boxSizing: 'border-box',
      }}
    >
      {/* ======================================================== */}
      {/* METADE SUPERIOR (ETIQUETA A5 - 148.5 mm de altura) */}
      {/* ======================================================== */}
      <div 
        className="w-[210mm] h-[148.5mm] box-border p-[5mm] flex items-center justify-center"
        style={{ height: '148.5mm' }}
      >
        {topLabel && (
          <LabelCard
            item={topLabel}
            operationType={operationType}
            isPrintMode={true}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* LINHA DE CORTE CENTRAL (GUIA DISCRETO NA METADE DA A4) */}
      {/* ======================================================== */}
      <div className="relative w-full h-0 flex items-center justify-center z-10">
        <div className="absolute left-2 right-2 border-t border-dashed border-slate-300" />
      </div>

      {/* ======================================================== */}
      {/* METADE INFERIOR (ETIQUETA A5 - 148.5 mm de altura) */}
      {/* ======================================================== */}
      <div 
        className="w-[210mm] h-[148.5mm] box-border p-[5mm] flex items-center justify-center"
        style={{ height: '148.5mm' }}
      >
        {bottomLabel ? (
          <LabelCard
            item={bottomLabel}
            operationType={operationType}
            isPrintMode={true}
          />
        ) : (
          <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 p-6 text-center select-none">
            <span className="text-xs font-bold uppercase tracking-wider">Espaço Vazio (Folha Impar)</span>
            <span className="text-[10px] text-slate-400 mt-1">Nenhuma etiqueta adicional para esta folha</span>
          </div>
        )}
      </div>

    </div>
  );
}
