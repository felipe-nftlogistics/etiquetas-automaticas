import React, { useState } from 'react';
import { 
  Printer, 
  FileDown, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Layers
} from 'lucide-react';
import PrintSheetA4 from './PrintSheetA4';
import PrintSheetThermal from './PrintSheetThermal';

export default function LabelPreview({ 
  operationType, 
  generatedLabels, 
  onBackToTable, 
  onExportPDF, 
  onPrint, 
  isGenerating,
  progress,
  paperSize = 'a4',
  setPaperSize
}) {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(85); // 85% para visualização confortável
  const [viewMode, setViewMode] = useState('single'); // 'single' ou 'all'

  const isThermal = paperSize === '10x15';

  // Configura a lista de folhas de acordo com o formato escolhido
  const sheets = [];
  if (isThermal) {
    // Modo Térmica 10x15: 1 etiqueta individual por página
    for (let i = 0; i < generatedLabels.length; i++) {
      sheets.push({
        sheetNumber: i + 1,
        label: generatedLabels[i],
      });
    }
  } else {
    // Modo A4: Agrupa etiquetas de 2 em 2 para cada folha A4
    for (let i = 0; i < generatedLabels.length; i += 2) {
      sheets.push({
        sheetNumber: Math.floor(i / 2) + 1,
        topLabel: generatedLabels[i],
        bottomLabel: generatedLabels[i + 1] || null,
      });
    }
  }

  const totalSheets = sheets.length;
  const currentSheet = sheets[currentSheetIndex] || sheets[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* BARRA SUPERIOR DE CONTROLE E IMPRESSÃO (NO-PRINT) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5 no-print">
        
        {/* LINHA 1: NAVEGAÇÃO DE RETORNO, RESUMO E SELEÇÃO DE FORMATO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Lado Esquerdo: Voltar & Indicador de Quantidade */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onBackToTable}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Editar Dados</span>
            </button>

            <div className="border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium block">Total de Etiquetas:</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {generatedLabels.length} {generatedLabels.length === 1 ? 'etiqueta' : 'etiquetas'} •{' '}
                <span className="text-[#ea5b27]">
                  {isThermal ? `${totalSheets} páginas (10x15cm)` : `${totalSheets} folhas A4`}
                </span>
              </span>
            </div>
          </div>

          {/* Lado Direito: Seletor de Formato de Impressão */}
          {setPaperSize && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-slate-600 hidden md:inline">Formato de Saída:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('a4');
                    setCurrentSheetIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    !isThermal 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Padrão A4 (2 A5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('10x15');
                    setCurrentSheetIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isThermal 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2.5 h-3.5 border-2 border-orange-500 rounded-2xs inline-block" />
                  <span>Térmica 10x15 cm</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* LINHA 2: CONTROLES DE PÁGINA, VISUALIZAÇÃO, ZOOM E AÇÕES */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-0.5">
          
          {/* Lado Esquerdo: Navegação de Páginas e Modo de Visualização */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            
            {/* Paginação */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrentSheetIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSheetIndex === 0 || viewMode === 'all'}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 transition cursor-pointer"
                title="Folha anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-xs font-bold text-slate-800 px-3 min-w-[130px] text-center">
                {viewMode === 'all' ? (
                  <span>Todas ({totalSheets})</span>
                ) : (
                  <span>
                    {isThermal ? 'Etiqueta' : 'Folha'} {currentSheetIndex + 1} de {totalSheets}
                  </span>
                )}
              </div>

              <button
                onClick={() => setCurrentSheetIndex((prev) => Math.min(totalSheets - 1, prev + 1))}
                disabled={currentSheetIndex >= totalSheets - 1 || viewMode === 'all'}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 transition cursor-pointer"
                title="Próxima folha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Alternar modo de visualização */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Página
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
            </div>

          </div>

          {/* Lado Direito: Zoom & Botões de Ação */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            
            {/* Zoom */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-600">
              <button
                onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
                className="p-1 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botão Imprimir Direto */}
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-orange-400" />
              <span>{isThermal ? 'Imprimir 10x15' : 'Imprimir A4'}</span>
            </button>

            {/* Botão Exportar PDF */}
            <button
              onClick={onExportPDF}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-orange-950/20 transition cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isGenerating 
                  ? `Gerando (${progress}%)...` 
                  : isThermal ? 'Baixar PDF 10x15' : 'Baixar PDF A4'}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* ÁREA DE VISUALIZAÇÃO COM ZOOM (ESCALA INTERATIVA) */}
      <div className="w-full overflow-auto py-8 bg-slate-200/60 rounded-3xl border border-slate-300 flex justify-center min-h-[600px] no-print">
        <div 
          style={{ 
            transform: `scale(${zoomLevel / 100})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="space-y-10"
        >
          {isThermal ? (
            /* VISUALIZAÇÃO TÉRMICA 10x15cm */
            viewMode === 'single' ? (
              currentSheet && currentSheet.label && (
                <div>
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Etiqueta Térmica: {currentSheet.sheetNumber} de {totalSheets} • Vol. {currentSheet.label.volumeAtual} de {currentSheet.label.totalVolumes}
                    </span>
                  </div>
                  <PrintSheetThermal
                    label={currentSheet.label}
                    operationType={operationType}
                    sheetNumber={currentSheet.sheetNumber}
                    totalSheets={totalSheets}
                    isPrintMode={false}
                  />
                </div>
              )
            ) : (
              sheets.map((sheet) => (
                <div key={`thermal-sheet-${sheet.sheetNumber}`}>
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Etiqueta Térmica: {sheet.sheetNumber} de {totalSheets} • Vol. {sheet.label.volumeAtual} de {sheet.label.totalVolumes}
                    </span>
                  </div>
                  <PrintSheetThermal
                    label={sheet.label}
                    operationType={operationType}
                    sheetNumber={sheet.sheetNumber}
                    totalSheets={totalSheets}
                    isPrintMode={false}
                  />
                </div>
              ))
            )
          ) : (
            /* VISUALIZAÇÃO A4 COM 2 ETIQUETAS A5 */
            viewMode === 'single' ? (
              currentSheet && (
                <div>
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Folha A4: {currentSheet.sheetNumber} de {totalSheets} • {currentSheet.topLabel ? `Vol. ${currentSheet.topLabel.volumeAtual} de ${currentSheet.topLabel.totalVolumes}` : ''} {currentSheet.bottomLabel ? `e Vol. ${currentSheet.bottomLabel.volumeAtual} de ${currentSheet.bottomLabel.totalVolumes}` : ''}
                    </span>
                  </div>
                  <PrintSheetA4
                    topLabel={currentSheet.topLabel}
                    bottomLabel={currentSheet.bottomLabel}
                    operationType={operationType}
                    sheetNumber={currentSheet.sheetNumber}
                    totalSheets={totalSheets}
                    isPrintMode={false}
                  />
                </div>
              )
            ) : (
              sheets.map((sheet) => (
                <div key={`sheet-${sheet.sheetNumber}`}>
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Folha A4: {sheet.sheetNumber} de {totalSheets}
                    </span>
                  </div>
                  <PrintSheetA4
                    topLabel={sheet.topLabel}
                    bottomLabel={sheet.bottomLabel}
                    operationType={operationType}
                    sheetNumber={sheet.sheetNumber}
                    totalSheets={totalSheets}
                    isPrintMode={false}
                  />
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTAINER EXCLUSIVO DE IMPRESSÃO (@media print) */}
      {/* ======================================================== */}
      <div className="hidden print:block">
        {isThermal ? (
          generatedLabels.map((lbl, idx) => (
            <PrintSheetThermal
              key={`print-thermal-${idx}`}
              label={lbl}
              operationType={operationType}
              sheetNumber={idx + 1}
              totalSheets={generatedLabels.length}
              isPrintMode={true}
            />
          ))
        ) : (
          sheets.map((sheet) => (
            <PrintSheetA4
              key={`print-sheet-${sheet.sheetNumber}`}
              topLabel={sheet.topLabel}
              bottomLabel={sheet.bottomLabel}
              operationType={operationType}
              sheetNumber={sheet.sheetNumber}
              totalSheets={totalSheets}
              isPrintMode={true}
            />
          ))
        )}
      </div>

    </div>
  );
}
