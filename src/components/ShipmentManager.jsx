import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Printer, 
  CheckSquare, 
  Square, 
  Eye, 
  Sparkles,
  Building2,
  PlaneTakeoff,
  AlertCircle
} from 'lucide-react';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelParser';

export default function ShipmentManager({ 
  operationType, 
  shipments, 
  setShipments, 
  onPreview, 
  totalSelectedLabels,
  totalSheets,
  paperSize = 'a4',
  setPaperSize 
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Item sendo editado individualmente no popup

  // Formulário Manual (criação)
  const [manualForm, setManualForm] = useState({
    expositor: '',
    volumes: 40,
    referencia: `NFT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    tipoCarga: 'Temporary',
    feira: '',
    estande: '',
    consignatario: '',
    destino: '',
    observacoes: '',
    dta: '',
    notaFiscal: '',
  });

  // Formulário de Edição Individual
  const [editForm, setEditForm] = useState({
    id: '',
    expositor: '',
    volumes: 1,
    referencia: '',
    tipoCarga: 'Temporary',
    feira: '',
    estande: '',
    observacoes: '',
    dta: '',
    notaFiscal: '',
  });

  const isImport = operationType === 'importacao';

  // Manipulador de upload de arquivo Excel
  const handleFileUpload = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setIsLoadingFile(true);

    try {
      const parsedData = await parseExcelFile(file, operationType);
      setShipments(parsedData);
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao processar planilha Excel.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Toggle de seleção
  const toggleSelectAll = () => {
    const allSelected = shipments.every((s) => s.selected);
    setShipments(shipments.map((s) => ({ ...s, selected: !allSelected })));
  };

  const toggleSelectOne = (id) => {
    setShipments(
      shipments.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // Exclusão de registro
  const handleDeleteRow = (id) => {
    setShipments(shipments.filter((s) => s.id !== id));
  };

  // Edição inline de volume ou texto
  const handleUpdateField = (id, field, value) => {
    setShipments(
      shipments.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            [field]: field === 'volumes' ? Math.max(1, parseInt(value, 10) || 1) : value,
          };
        }
        return s;
      })
    );
  };

  // Abre popup para editar item individual
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      id: item.id,
      expositor: item.expositor || '',
      volumes: item.volumes || 1,
      referencia: item.referencia || '',
      tipoCarga: item.tipoCarga || 'Temporary',
      feira: item.feira || '',
      estande: item.estande || '',
      observacoes: item.observacoes || '',
      dta: item.dta || '',
      notaFiscal: item.notaFiscal || '',
    });
  };

  // Salva alterações do popup de edição
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.expositor.trim()) {
      alert('Por favor, informe o nome do expositor.');
      return;
    }

    setShipments(
      shipments.map((s) => {
        if (s.id === editForm.id) {
          return {
            ...s,
            expositor: editForm.expositor.trim(),
            volumes: Math.max(1, parseInt(editForm.volumes, 10) || 1),
            referencia: editForm.referencia.trim(),
            tipoCarga: editForm.tipoCarga || 'Temporary',
            feira: editForm.feira.trim(),
            estande: editForm.estande.trim(),
            observacoes: editForm.observacoes.trim(),
            dta: editForm.dta.trim(),
            notaFiscal: editForm.notaFiscal.trim(),
          };
        }
        return s;
      })
    );
    setEditingItem(null);
  };

  // Submissão do formulário manual
  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualForm.expositor.trim()) {
      alert('Por favor, informe o nome do expositor.');
      return;
    }

    const newShipment = {
      id: `manual-${Date.now()}`,
      selected: true,
      expositor: manualForm.expositor.trim(),
      volumes: Math.max(1, parseInt(manualForm.volumes, 10) || 1),
      referencia: manualForm.referencia.trim(),
      tipoCarga: manualForm.tipoCarga || 'Temporary',
      feira: manualForm.feira.trim(),
      estande: manualForm.estande.trim(),
      consignatario: '',
      destino: '',
      observacoes: manualForm.observacoes.trim(),
      dta: manualForm.dta.trim(),
      notaFiscal: manualForm.notaFiscal.trim(),
    };

    setShipments([...shipments, newShipment]);
    setIsManualModalOpen(false);

    // Reseta form
    setManualForm({
      expositor: '',
      volumes: 40,
      referencia: `NFT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tipoCarga: 'Temporary',
      feira: '',
      estande: '',
      consignatario: '',
      destino: '',
      observacoes: '',
      dta: '',
      notaFiscal: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Cabeçalho da Operação Selecionada & Seletor de Tamanho */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isImport ? 'bg-orange-100 text-[#ea5b27]' : 'bg-slate-900 text-white'
            }`}>
              {isImport ? <Building2 className="w-6 h-6" /> : <PlaneTakeoff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {isImport ? 'Importação • Entrega na Feira' : 'Exportação • Devolução Temporária'}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  isImport ? 'bg-orange-100 text-[#ea5b27]' : 'bg-slate-100 text-slate-800'
                }`}>
                  {isImport ? 'Entrada no Pavilhão' : 'Retorno ao Exterior'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isImport 
                  ? 'Geração de etiquetas para caixas que chegam do exterior com destino aos estandes das feiras.'
                  : 'Geração de etiquetas para caixas recolhidas após o término da feira para devolução aduaneira.'
                }
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadExcelTemplate(operationType)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Baixar Modelo Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>Adicionar Expositor Manual</span>
            </button>
          </div>
        </div>

        {/* CAMPO NO CABEÇALHO PARA ALTERAR O TAMANHO DA FOLHA */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#ea5b27]" />
            <span className="text-xs font-bold text-slate-700">Tamanho da Folha / Formato de Impressão:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize && setPaperSize(e.target.value)}
              className="bg-white border-2 border-slate-300 hover:border-orange-400 focus:border-[#ea5b27] text-slate-900 font-bold text-xs rounded-xl px-3.5 py-2 focus:outline-none transition shadow-2xs cursor-pointer min-w-[280px]"
            >
              <option value="a4">Padrão A4 com duas etiquetas A5 por folha</option>
              <option value="10x15">Padrão 10cm x 15cm por etiqueta individual (Térmica)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerta de Erro caso ocorra */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ÁREA DE UPLOAD DRAG & DROP */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
          isDragging 
            ? 'border-[#ea5b27] bg-orange-50/50 scale-[1.01]' 
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-[#ea5b27]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isLoadingFile ? 'Processando planilha Excel...' : 'Arraste sua planilha Excel ou clique para selecionar'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Formatos suportados: <strong>.xlsx</strong> e <strong>.xls</strong>. O sistema identifica automaticamente as colunas de expositor, volumes e processo.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Mapeamento inteligente de colunas ativado</span>
          </div>
        </div>
      </div>

      {/* LISTA / TABELA DE EXPOSITORES E CARGAS */}
      {shipments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Barra de Ações da Tabela */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {shipments.every((s) => s.selected) ? (
                  <CheckSquare className="w-4 h-4 text-[#ea5b27]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Selecionar Todos ({shipments.length})</span>
              </button>

              <span className="text-slate-300">|</span>

              <span className="text-xs font-medium text-slate-500">
                Selecionados: <strong className="text-slate-800">{shipments.filter((s) => s.selected).length}</strong>
              </span>
            </div>

            {/* Resumo Rápido */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Layers className="w-4 h-4 text-[#ea5b27]" />
                <span>{totalSelectedLabels} etiquetas totais</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>
                  {paperSize === '10x15'
                    ? `${totalSheets} etiquetas térmicas (10x15 cm individual)`
                    : `${totalSheets} folhas A4 (2 por folha)`}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela Responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Sel.</th>
                  <th className="py-3 px-4">Expositor / Cliente</th>
                  {isImport && <th className="py-3 px-4">Feira / Estande</th>}
                  {!isImport && <th className="py-3 px-4 w-44">Retorno (Feira)</th>}
                  <th className="py-3 px-3 w-36 text-center">Categoria</th>
                  <th className="py-3 px-4 w-28 text-center">Qtd Volumes</th>
                  <th className="py-3 px-4 w-36">Ref. Interna</th>
                  <th className="py-3 px-4 w-28">DTA</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 w-20 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {shipments.map((row) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-slate-50/80 transition ${row.selected ? 'bg-orange-50/20' : 'opacity-60'}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSelectOne(row.id)}
                        className="cursor-pointer text-slate-400 hover:text-slate-600"
                      >
                        {row.selected ? (
                          <CheckSquare className="w-4 h-4 text-[#ea5b27]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Expositor */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.expositor}
                        onChange={(e) => handleUpdateField(row.id, 'expositor', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white font-bold text-slate-900 rounded px-1.5 py-0.5 outline-hidden"
                      />
                    </td>

                    {/* Feira / Estande (Importação) OU Indicador de Retorno Manual (Exportação) */}
                    {isImport ? (
                      <td className="py-3 px-4">
                        <div>
                          <input
                            type="text"
                            value={row.feira}
                            placeholder="Nome da Feira"
                            onChange={(e) => handleUpdateField(row.id, 'feira', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white font-semibold text-orange-700 rounded px-1.5 py-0.5 outline-hidden"
                          />
                          <input
                            type="text"
                            value={row.estande}
                            placeholder="Estande / Pavilhão (opcional)"
                            onChange={(e) => handleUpdateField(row.id, 'estande', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white text-[11px] text-slate-500 rounded px-1.5 py-0.5 outline-hidden"
                          />
                        </div>
                      </td>
                    ) : (
                      <td className="py-3 px-4">
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-[#ea5b27]">Return:</span> Campo aberto p/ preenchimento manual
                        </div>
                      </td>
                    )}

                    {/* Categoria (antigo Status Central) */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={row.tipoCarga || 'Temporary'}
                        onChange={(e) => handleUpdateField(row.id, 'tipoCarga', e.target.value)}
                        className={`text-xs font-black rounded-lg px-2 py-1 border transition outline-hidden cursor-pointer ${
                          (row.tipoCarga || 'Temporary') === 'Fragile'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : (row.tipoCarga || 'Temporary') === 'Empty'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : (row.tipoCarga || 'Temporary') === 'Definitive'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : (row.tipoCarga || 'Temporary') === 'Full'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-orange-50 text-[#ea5b27] border-orange-200'
                        }`}
                      >
                        <option value="Temporary">Temporary</option>
                        <option value="Definitive">Definitive</option>
                        <option value="Empty">Empty</option>
                        <option value="Full">Full</option>
                        <option value="Fragile">Fragile</option>
                      </select>
                    </td>

                    {/* Quantidade de Volumes */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={row.volumes}
                          onChange={(e) => handleUpdateField(row.id, 'volumes', e.target.value)}
                          className="w-16 text-center font-black text-slate-900 bg-white rounded border border-slate-300 py-1 text-xs focus:ring-1 focus:ring-orange-500 outline-hidden"
                        />
                        <span className="text-[10px] font-bold text-slate-500 pr-1">cx</span>
                      </div>
                    </td>

                    {/* Referência Interna */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.referencia}
                        onChange={(e) => handleUpdateField(row.id, 'referencia', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white font-mono text-xs text-slate-700 rounded px-1.5 py-0.5 outline-hidden"
                      />
                    </td>

                    {/* DTA */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.dta || ''}
                        placeholder="Nº DTA"
                        onChange={(e) => handleUpdateField(row.id, 'dta', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white font-mono text-xs text-orange-950 rounded px-1.5 py-0.5 outline-hidden"
                      />
                    </td>

                    {/* Observações (+ NF tag se houver) */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={row.observacoes}
                          placeholder="Instruções ou notas"
                          onChange={(e) => handleUpdateField(row.id, 'observacoes', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ea5b27] focus:bg-white text-slate-500 text-[11px] rounded px-1.5 py-0.5 outline-hidden"
                        />
                        {row.notaFiscal && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                            NF: <strong>{row.notaFiscal}</strong>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ações: Editar Individual & Excluir */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1.5 rounded text-slate-500 hover:text-[#ea5b27] hover:bg-orange-50 transition cursor-pointer"
                          title="Editar item individualmente"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Barra de Ação Inferior */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Total a imprimir: <strong className="text-slate-900">{totalSelectedLabels} caixas</strong> (distribuídas em <strong>{totalSheets} folhas A4</strong>).
            </div>

            <button
              onClick={onPreview}
              disabled={totalSelectedLabels === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-900/10 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar Etiquetas & Imprimir</span>
            </button>
          </div>

        </div>
      )}

      {/* MODAL PARA ADICIONAR MANUALMENTE */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Adicionar Expositor Manualmente
                </h3>
                <p className="text-xs text-slate-500">
                  {isImport ? 'Importação • Entrega na Feira' : 'Exportação • Devolução Temporária'}
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-4">
              {/* Nome do Expositor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Expositor / Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Siemens Energy AG"
                  value={manualForm.expositor}
                  onChange={(e) => setManualForm({ ...manualForm, expositor: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                />
              </div>

              {/* Quantidade de Volumes & Referência */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Qtd. Volumes (Caixas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    required
                    value={manualForm.volumes}
                    onChange={(e) => setManualForm({ ...manualForm, volumes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Gera Vol. 1 de {manualForm.volumes || 1}...
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Referência Interna / NFT
                  </label>
                  <input
                    type="text"
                    value={manualForm.referencia}
                    onChange={(e) => setManualForm({ ...manualForm, referencia: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Opção Central Solicitada: Temporary, Definitive, Empty, Full, Fragile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria (Destaque Central da Etiqueta) *
                </label>
                <select
                  value={manualForm.tipoCarga}
                  onChange={(e) => setManualForm({ ...manualForm, tipoCarga: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold bg-white focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                >
                  <option value="Temporary">Temporary (Admissão Temporária / Eventos)</option>
                  <option value="Definitive">Definitive (Importação / Exportação Definitiva)</option>
                  <option value="Empty">Empty (Engradados ou Caixas Vazias)</option>
                  <option value="Full">Full (Volumes Carregados)</option>
                  <option value="Fragile">Fragile (Carga Frágil / Alta Atenção)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Esta categoria é impressa em tamanho gigante bem no centro da etiqueta.
                </span>
              </div>

              {/* Campos específicos por Modo */}
              {isImport ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nome da Feira *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: FEIMEC 2026"
                      value={manualForm.feira}
                      onChange={(e) => setManualForm({ ...manualForm, feira: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Estande / Pavilhão
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pavilhão 2 - Stand B-45"
                      value={manualForm.estande}
                      onChange={(e) => setManualForm({ ...manualForm, estande: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl text-xs text-orange-950">
                  <strong>Destino da Carga:</strong> Será impresso como <strong>RETURN</strong> com espaço pautado aberto para preenchimento manual na feira.
                </div>
              )}

              {/* DTA e Nota Fiscal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número DTA (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 26/0123456-7"
                    value={manualForm.dta}
                    onChange={(e) => setManualForm({ ...manualForm, dta: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
                {isImport && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nota Fiscal (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12345"
                      value={manualForm.notaFiscal}
                      onChange={(e) => setManualForm({ ...manualForm, notaFiscal: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Só aparece na etiqueta se preenchida.
                    </span>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações de Carga (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mostruário frágil com bateria"
                  value={manualForm.observacoes}
                  onChange={(e) => setManualForm({ ...manualForm, observacoes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] text-white text-xs font-bold shadow-md shadow-orange-950/20 transition cursor-pointer"
                >
                  Adicionar Carga
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL POPUP PARA EDITAR ITEM INDIVIDUAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Editar Item de {isImport ? 'Importação' : 'Exportação'}
                </h3>
                <p className="text-xs text-slate-500">
                  Atualize as informações individuais deste expositor/carga
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Nome do Expositor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Expositor / Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.expositor}
                  onChange={(e) => setEditForm({ ...editForm, expositor: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                />
              </div>

              {/* Quantidade de Volumes & Referência */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Qtd. Volumes (Caixas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    required
                    value={editForm.volumes}
                    onChange={(e) => setEditForm({ ...editForm, volumes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Referência Interna / NFT
                  </label>
                  <input
                    type="text"
                    value={editForm.referencia}
                    onChange={(e) => setEditForm({ ...editForm, referencia: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Categoria (Destaque Central da Etiqueta) *
                </label>
                <select
                  value={editForm.tipoCarga}
                  onChange={(e) => setEditForm({ ...editForm, tipoCarga: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold bg-white focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                >
                  <option value="Temporary">Temporary (Admissão Temporária / Eventos)</option>
                  <option value="Definitive">Definitive (Importação / Exportação Definitiva)</option>
                  <option value="Empty">Empty (Engradados ou Caixas Vazias)</option>
                  <option value="Full">Full (Volumes Carregados)</option>
                  <option value="Fragile">Fragile (Carga Frágil / Alta Atenção)</option>
                </select>
              </div>

              {/* Campos específicos por Modo */}
              {isImport ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nome da Feira
                    </label>
                    <input
                      type="text"
                      value={editForm.feira}
                      onChange={(e) => setEditForm({ ...editForm, feira: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Estande / Pavilhão
                    </label>
                    <input
                      type="text"
                      value={editForm.estande}
                      onChange={(e) => setEditForm({ ...editForm, estande: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl text-xs text-orange-950">
                  <strong>Destino da Carga:</strong> Impresso como <strong>RETURN</strong> com espaço pautado aberto para escrita à mão na feira.
                </div>
              )}

              {/* DTA e Nota Fiscal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número DTA (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 26/0123456-7"
                    value={editForm.dta}
                    onChange={(e) => setEditForm({ ...editForm, dta: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
                {isImport && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nota Fiscal (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12345"
                      value={editForm.notaFiscal}
                      onChange={(e) => setEditForm({ ...editForm, notaFiscal: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Só aparece na etiqueta se preenchida.
                    </span>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações de Carga (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mostruário frágil com bateria"
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#ea5b27] focus:ring-1 focus:ring-orange-500 outline-hidden"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] text-white text-xs font-bold shadow-md shadow-orange-950/20 transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
