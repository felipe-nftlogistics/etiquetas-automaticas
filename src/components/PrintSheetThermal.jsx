import React from 'react';
import LabelCardThermal from './LabelCardThermal';

export default function PrintSheetThermal({ label, operationType, sheetNumber, totalSheets, isPrintMode = false }) {
  if (!label) return null;

  return (
    <div 
      className={`print-sheet-thermal relative bg-white mx-auto flex items-center justify-center overflow-hidden ${
        isPrintMode
          ? 'w-[100mm] h-[150mm]'
          : 'preview-sheet-thermal border border-slate-300 rounded-lg shadow-lg mb-6'
      }`}
      style={{
        width: '100mm',
        height: '150mm',
        boxSizing: 'border-box',
      }}
    >
      <div 
        className="w-[100mm] h-[150mm] box-border p-[3mm] flex items-center justify-center"
        style={{ width: '100mm', height: '150mm' }}
      >
        <LabelCardThermal
          item={label}
          operationType={operationType}
          isPrintMode={true}
        />
      </div>
    </div>
  );
}
