import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import ModeSelector from '../components/ModeSelector';
import ShipmentManager from '../components/ShipmentManager';
import LabelPreview from '../components/LabelPreview';
import UserManagerModal from '../components/UserManagerModal';

export default function Dashboard({ session, onLogout }) {
  // Estado do Modal de Gestão de Usuários (Administrador)
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  // Estado do Modo: null (tela inicial) | 'importacao' | 'exportacao'
  const [currentMode, setCurrentMode] = useState(null);

  // Visualização ativa no modo: 'table' (gerenciador/upload) | 'preview' (folhas A4)
  const [activeView, setActiveView] = useState('table');

  // Formato da Folha / Tamanho de Saída: 'a4' (2 por folha) | '10x15' (individual térmica)
  const [paperSize, setPaperSize] = useState('a4');

  // Lista de expositores/cargas carregadas
  const [shipments, setShipments] = useState([]);

  // Estado de geração do PDF
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Seleciona o modo na tela inicial - sempre inicia com lista vazia conforme solicitado
  const handleSelectMode = (mode) => {
    setCurrentMode(mode);
    setActiveView('table');
    setShipments([]);
  };

  // Voltar para a tela inicial de seleção de operação
  const handleBackToHome = () => {
    setCurrentMode(null);
    setActiveView('table');
    setShipments([]);
  };

  // Expande cada expositor na quantidade de etiquetas correspondente
  const generatedLabels = useMemo(() => {
    const labels = [];
    const selectedShipments = shipments.filter((s) => s.selected);

    for (const ship of selectedShipments) {
      const totalVol = Math.max(1, parseInt(ship.volumes, 10) || 1);
      for (let v = 1; v <= totalVol; v++) {
        labels.push({
          id: `${ship.id}-vol-${v}`,
          shipmentId: ship.id,
          expositor: ship.expositor || ship.consignee || '',
          consignee: ship.consignee || ship.expositor || '',
          consigneeAddress: ship.consigneeAddress || '',
          exporter: ship.exporter || '',
          exporterAddress: ship.exporterAddress || '',
          observacoesImportantes: ship.observacoesImportantes || '',
          referencia: ship.referencia,
          tipoCarga: ship.tipoCarga || 'Temporary',
          feira: ship.feira || '',
          estande: ship.estande || '',
          consignatario: ship.consignatario || '',
          destino: ship.destino || '',
          observacoes: ship.observacoes || '',
          dta: ship.dta || '',
          notaFiscal: ship.notaFiscal || '',
          volumeAtual: v,
          totalVolumes: totalVol,
        });
      }
    }
    return labels;
  }, [shipments]);

  const totalSelectedLabels = generatedLabels.length;
  const totalSheets = paperSize === '10x15' ? totalSelectedLabels : Math.ceil(totalSelectedLabels / 2);

  // Dispara impressão direta pelo navegador
  const handlePrint = () => {
    if (paperSize === '10x15') {
      document.body.classList.add('thermal-print');
      document.body.classList.remove('a4-print');
    } else {
      document.body.classList.add('a4-print');
      document.body.classList.remove('thermal-print');
    }
    window.print();
  };

  // Dispara geração do arquivo PDF com import dinâmico sob demanda
  const handleExportPDF = async () => {
    if (generatedLabels.length === 0) {
      alert('Nenhuma etiqueta selecionada para exportação.');
      return;
    }

    setIsGenerating(true);
    setPdfProgress(0);

    try {
      const { generateLabelsPDF } = await import('../utils/pdfGenerator');
      await generateLabelsPDF(generatedLabels, currentMode, (prog) => {
        setPdfProgress(prog);
      }, paperSize);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
    } finally {
      setIsGenerating(false);
      setPdfProgress(0);
    }
  };

  // Validação de permissões de Administrador
  const isAdmin = Boolean(
    session?.role === 'admin' || 
    session?.isMaster || 
    (session?.user || '').toLowerCase() === 'felipe@nftlogistics.com.br'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Barra de Navegação Superior com Perfil, Acesso Admin e Logout */}
        <Header
          currentMode={currentMode}
          onBackToHome={handleBackToHome}
          totalLabels={totalSelectedLabels}
          currentUser={session.user}
          isAdmin={isAdmin}
          onOpenUsers={() => setIsUserManagerOpen(true)}
          onLogout={onLogout}
        />

        {/* Conteúdo Principal */}
        <main>
          {!currentMode ? (
            // TELA INICIAL: SELETOR DE MODO
            <ModeSelector onSelectMode={handleSelectMode} />
          ) : activeView === 'table' ? (
            // TELA DE GERENCIAMENTO DA PLANILHA / TABELA COM SELETOR DE TAMANHO
            <ShipmentManager
              operationType={currentMode}
              shipments={shipments}
              setShipments={setShipments}
              onPreview={() => setActiveView('preview')}
              totalSelectedLabels={totalSelectedLabels}
              totalSheets={totalSheets}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
            />
          ) : (
            // TELA DE VISUALIZAÇÃO DAS ETIQUETAS (A4 ou 10x15cm)
            <LabelPreview
              operationType={currentMode}
              generatedLabels={generatedLabels}
              onBackToTable={() => setActiveView('table')}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              isGenerating={isGenerating}
              progress={pdfProgress}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
            />
          )}
        </main>
      </div>

      {/* Modal de Gestão de Usuários (Apenas Administrador) */}
      {isAdmin && (
        <UserManagerModal
          isOpen={isUserManagerOpen}
          onClose={() => setIsUserManagerOpen(false)}
          currentSessionUser={session}
        />
      )}

      {/* Rodapé da Aplicação (Oculto na Impressão) */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 no-print mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NFT LOGISTICS • Sistema Especializado de Comércio Exterior para Feiras & Eventos</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {paperSize === '10x15'
              ? 'Padrão Térmica • 10cm x 15cm por etiqueta individual'
              : 'Padrão Folha A4 • 2 Etiquetas A5 (210 x 148,5 mm)'}
          </span>
        </div>
      </footer>
    </div>
  );
}
