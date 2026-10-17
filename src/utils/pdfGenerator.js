import { jsPDF } from 'jspdf';
import { NFT_LOGO_FULL } from '../assets/logos';

/**
 * Gera PDF de Etiquetas da NFT Logistics.
 * Suporta dois formatos:
 *  - 'a4': Padrão A4 (210 x 297 mm) contendo 2 etiquetas A5 por folha (210 x 148.5 mm).
 *  - '10x15': Padrão 10cm x 15cm (100 x 150 mm) individual adaptado para impressora térmica.
 */
export async function generateLabelsPDF(labelsData, operationType, onProgress, paperSize = 'a4') {
  if (paperSize === '10x15') {
    return generateThermal10x15PDF(labelsData, operationType, onProgress);
  } else {
    return generateA4PDF(labelsData, operationType, onProgress);
  }
}

/**
 * Gera PDF Padrão A4 com 2 etiquetas A5 por folha.
 */
async function generateA4PDF(labelsData, operationType, onProgress) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const labelHeight = 148.5; // Metade da A4
  const marginX = 6;
  const marginY = 5;
  const contentWidth = pageWidth - marginX * 2; // 198 mm
  const contentHeight = labelHeight - marginY * 2; // 138.5 mm

  const totalLabels = labelsData.length;
  let currentLabelIndex = 0;

  for (let i = 0; i < totalLabels; i++) {
    const item = labelsData[i];
    const isTop = i % 2 === 0;

    // Se não for o primeiro item e for o topo da página, adiciona nova folha A4
    if (i > 0 && isTop) {
      doc.addPage('a4', 'portrait');
    }

    // Posição base Y para a etiqueta atual (0 para o topo, 148.5 para a base)
    const baseY = isTop ? 0 : labelHeight;
    const originY = baseY + marginY;
    const originX = marginX;

    // Desenha a linha de corte no meio da folha A4 quando estamos no topo
    if (isTop) {
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([3, 3], 0);
      doc.setLineWidth(0.4);
      doc.line(4, labelHeight, pageWidth - 4, labelHeight);
      doc.setLineDashPattern([], 0); // reseta
    }

    // ==========================================
    // 1. MOLDURA EXTERNA DA ETIQUETA A5
    // ==========================================
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.roundedRect(originX, originY, contentWidth, contentHeight, 2.5, 2.5, 'FD');

    // ==========================================
    // 2. CABEÇALHO (LOGO COMPLETO NFT + CAIXA REF CENTRALIZADA)
    // ==========================================
    const headerY = originY + 2.5;

    // Logo NFT Completo (nft | International Logistics Solutions)
    try {
      doc.addImage(NFT_LOGO_FULL, 'PNG', originX + 4, headerY + 1.5, 58, 9.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(18, 22, 31);
      doc.text('NFT LOGISTICS', originX + 4, headerY + 9);
    }

    // Caixa de Referência no Topo Direito (sem texto REF, fonte ampliada, centralizada)
    const refWidth = 105;
    const refHeight = 13.5;
    const refX = originX + contentWidth - refWidth - 4;
    const refY = headerY;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(234, 91, 39);
    doc.setLineWidth(0.65);
    doc.roundedRect(refX, refY, refWidth, refHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    const refStr = String(item.referencia || 'NFT-REF-0000');
    doc.text(refStr, refX + refWidth / 2, refY + 9.5, { align: 'center' });

    // ==========================================
    // 3. LINHA HORIZONTAL DIVISÓRIA (PRETA MARCANTE)
    // ==========================================
    const lineY = headerY + 16.5;
    doc.setDrawColor(18, 22, 31);
    doc.setLineWidth(0.55);
    doc.line(originX + 2, lineY, originX + contentWidth - 2, lineY);

    // ==========================================
    // 4. DISTRIBUIÇÃO DAS INFORMAÇÕES DO CLIENTE E EVENTO
    // ==========================================
    const isImport = operationType === 'importacao';
    const infoY = lineY + 1.5;

    // Coluna Esquerda: Expositor e Evento/Destino
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('EXPOSITOR / EXHIBITOR (CLIENTE):', originX + 4, infoY + 3.5);

    const expositorText = (item.expositor || 'EXPOSITOR').toUpperCase();
    doc.setFont('helvetica', 'bold');
    const expositorFontSize = expositorText.length > 32 ? 11.5 : 13.5;
    doc.setFontSize(expositorFontSize);
    doc.setTextColor(15, 23, 42);
    const expositorLines = doc.splitTextToSize(expositorText, 124);
    doc.text(expositorLines[0], originX + 4, infoY + 8.5);
    let afterExpY = infoY + 12.5;
    if (expositorLines[1]) {
      doc.text(expositorLines[1], originX + 4, infoY + 13);
      afterExpY = infoY + 17;
    }

    if (isImport) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('FEIRA / EVENTO (DESTINATION EVENT):', originX + 4, afterExpY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(234, 91, 39);
      const feiraLines = doc.splitTextToSize((item.feira || 'FEIRA INTERNACIONAL').toUpperCase(), 124);
      doc.text(feiraLines[0], originX + 4, afterExpY + 4.2);
      let afterFeiraY = afterExpY + 8;
      if (feiraLines[1]) {
        doc.text(feiraLines[1], originX + 4, afterExpY + 8.2);
        afterFeiraY = afterExpY + 12;
      }

      if (item.estande) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`ESTANDE / LOCAL: ${item.estande}`.slice(0, 48), originX + 4, afterFeiraY);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CONSIGNATÁRIO / CONSIGNEE (DESTINATÁRIO NO EXTERIOR):', originX + 4, afterExpY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const consignatarioLines = doc.splitTextToSize((item.consignatario || 'DESTINATÁRIO INTERNACIONAL').toUpperCase(), 124);
      doc.text(consignatarioLines[0], originX + 4, afterExpY + 4.2);
      let afterConsY = afterExpY + 8;
      if (consignatarioLines[1]) {
        doc.text(consignatarioLines[1], originX + 4, afterExpY + 8.2);
        afterConsY = afterExpY + 12;
      }

      if (item.destino) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(234, 91, 39);
        doc.text(`DESTINO FINAL: ${item.destino.toUpperCase()}`.slice(0, 44), originX + 4, afterConsY);
      }
    }

    // Coluna Direita: Card de Observações / Notas (Regime Aduaneiro removido)
    const cardX = originX + contentWidth - 64;
    const cardY = infoY + 1;
    const cardW = 60;
    const cardH = 21;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVAÇÕES / NOTAS:', cardX + 3, cardY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const obsLines = doc.splitTextToSize(item.observacoes || 'Sem observações adicionais', cardW - 6);
    doc.text(obsLines[0] || '', cardX + 3, cardY + 9.5);
    if (obsLines[1]) {
      doc.text(obsLines[1], cardX + 3, cardY + 13.5);
    }

    // ==========================================
    // 5. O DESTAQUE CENTRAL: "TEMPORARY", "DEFINITIVE", "EMPTY", "FULL" OU "FRAGILE"
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const centerY = originY + 80;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

    // ==========================================
    // 6. PARTE INFERIOR: VOLUMES LARGURA TOTAL ALINHADOS AO BOTTOM
    // Margem inferior de 4mm, idêntica às margens laterais de 4mm
    // ==========================================
    const volBoxX = originX + 4;
    const volBoxWidth = contentWidth - 8; // 4mm de cada lado

    const bGap = 18; // Espaço central para o "OF"
    const bW = (volBoxWidth - bGap) / 2;
    const bH = 29;
    
    // Alinhado ao bottom com 4mm de distância da borda inferior
    const bottomMargin = 4;
    const bY = originY + contentHeight - bottomMargin - bH;

    // Título VOLUMES logo acima das caixas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(18, 22, 31);
    doc.text('VOLUMES', volBoxX + 1, bY - 2.5);

    // Sub-box 1 (Volume Atual)
    const b1X = volBoxX;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b1X, bY, bW, bH, 3, 3, 'FD');

    // Número do Volume Atual AINDA MAIOR (40pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.volumeAtual), b1X + bW / 2, bY + 20.5, { align: 'center' });

    // "OF" Central
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(18, 22, 31);
    doc.text('OF', volBoxX + bW + bGap / 2, bY + 18.5, { align: 'center' });

    // Sub-box 2 (Total Volumes)
    const b2X = volBoxX + bW + bGap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b2X, bY, bW, bH, 3, 3, 'FD');

    // Número do Total de Volumes AINDA MAIOR (40pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.totalVolumes), b2X + bW / 2, bY + 20.5, { align: 'center' });

    // Notifica progresso
    currentLabelIndex++;
    if (onProgress) {
      onProgress(Math.round((currentLabelIndex / totalLabels) * 100));
    }
  }

  // Define nome do arquivo exportado
  const dateStr = new Date().toISOString().slice(0, 10);
  const modeStr = operationType === 'importacao' ? 'Importacao_Feira' : 'Exportacao_Devolucao';
  const fileName = `Etiquetas_NFT_${modeStr}_A4_${totalLabels}_volumes_${dateStr}.pdf`;

  // Salva o PDF
  doc.save(fileName);
  return fileName;
}

/**
 * Gera PDF Padrão 10cm x 15cm (100 x 150 mm) adaptado para impressoras térmicas (1 etiqueta por página).
 */
async function generateThermal10x15PDF(labelsData, operationType, onProgress) {
  // Inicializa o documento 100 x 150 mm Retrato
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
    compress: true,
  });

  const pageWidth = 100;
  const pageHeight = 150;
  const marginX = 3.5;
  const marginY = 3.5;
  const contentWidth = pageWidth - marginX * 2; // 93 mm
  const contentHeight = pageHeight - marginY * 2; // 143 mm

  const totalLabels = labelsData.length;
  let currentLabelIndex = 0;

  for (let i = 0; i < totalLabels; i++) {
    const item = labelsData[i];

    if (i > 0) {
      doc.addPage([100, 150], 'portrait');
    }

    const originX = marginX;
    const originY = marginY;

    // ==========================================
    // 1. MOLDURA EXTERNA DA ETIQUETA TÉRMICA (10x15 cm)
    // ==========================================
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.roundedRect(originX, originY, contentWidth, contentHeight, 2, 2, 'FD');

    // ==========================================
    // 2. CABEÇALHO DISTRIBUÍDO: LOGO (LINHA 1) + CAIXA REF (LINHA 2)
    // ==========================================
    // Linha 1: Logo NFT Centralizado
    const logoW = 48;
    const logoH = 7.8;
    const logoX = originX + (contentWidth - logoW) / 2;
    const logoY = originY + 2.5;

    try {
      doc.addImage(NFT_LOGO_FULL, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(18, 22, 31);
      doc.text('NFT LOGISTICS', originX + contentWidth / 2, logoY + 6.5, { align: 'center' });
    }

    // Linha 2: Caixa da Referência Interna em Destaque (Largura Total)
    const refW = contentWidth - 5;
    const refH = 9.5;
    const refX = originX + 2.5;
    const refY = originY + 12;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(234, 91, 39);
    doc.setLineWidth(0.65);
    doc.roundedRect(refX, refY, refW, refH, 2, 2, 'FD');

    const refStr = String(item.referencia || 'NFT-REF-0000');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(refStr.length > 20 ? 10 : 13);
    doc.setTextColor(15, 23, 42);
    doc.text(refStr, refX + refW / 2, refY + 6.6, { align: 'center' });

    // Linha Divisória Marcante
    const lineY = refY + refH + 2.2;
    doc.setDrawColor(18, 22, 31);
    doc.setLineWidth(0.5);
    doc.line(originX + 2, lineY, originX + contentWidth - 2, lineY);

    // ==========================================
    // 3. DISTRIBUIÇÃO DAS INFORMAÇÕES COM QUEBRA DE LINHA
    // ==========================================
    const isImport = operationType === 'importacao';
    const infoY = lineY + 1.2;

    // Expositor (com quebra em até 2 linhas)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('EXPOSITOR / EXHIBITOR (CLIENTE):', originX + 3, infoY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const expositorLines = doc.splitTextToSize((item.expositor || 'EXPOSITOR').toUpperCase(), contentWidth - 6);
    doc.text(expositorLines[0] || '', originX + 3, infoY + 6.8);
    let nextY = infoY + 10.5;
    if (expositorLines[1]) {
      doc.text(expositorLines[1], originX + 3, infoY + 10.3);
      nextY = infoY + 13.8;
    }

    // Feira ou Consignatário (com quebra em até 2 linhas)
    if (isImport) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('FEIRA / EVENTO (DESTINATION EVENT):', originX + 3, nextY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(234, 91, 39);
      const feiraLines = doc.splitTextToSize((item.feira || 'FEIRA INTERNACIONAL').toUpperCase(), contentWidth - 6);
      doc.text(feiraLines[0] || '', originX + 3, nextY + 3.6);
      let afterFeiraY = nextY + 7.2;
      if (feiraLines[1]) {
        doc.text(feiraLines[1], originX + 3, nextY + 7.1);
        afterFeiraY = nextY + 10.5;
      }

      if (item.estande) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`ESTANDE / LOCAL: ${item.estande}`.slice(0, 48), originX + 3, afterFeiraY);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CONSIGNATÁRIO / CONSIGNEE (EXTERIOR):', originX + 3, nextY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const consignatarioLines = doc.splitTextToSize((item.consignatario || 'DESTINATÁRIO INTERNACIONAL').toUpperCase(), contentWidth - 6);
      doc.text(consignatarioLines[0] || '', originX + 3, nextY + 3.6);
      let afterConsY = nextY + 7.2;
      if (consignatarioLines[1]) {
        doc.text(consignatarioLines[1], originX + 3, nextY + 7.1);
        afterConsY = nextY + 10.5;
      }

      if (item.destino) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(234, 91, 39);
        doc.text(`DESTINO FINAL: ${item.destino.toUpperCase()}`.slice(0, 42), originX + 3, afterConsY);
      }
    }

    // Card de Observações / Notas
    const cardX = originX + 2.5;
    const cardY = originY + 54;
    const cardW = contentWidth - 5;
    const cardH = 13.5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVAÇÕES / NOTAS:', cardX + 2.5, cardY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const obsLines = doc.splitTextToSize(item.observacoes || 'Sem observações adicionais', cardW - 5);
    doc.text(obsLines[0] || '', cardX + 2.5, cardY + 7.5);
    if (obsLines[1]) {
      doc.text(obsLines[1], cardX + 2.5, cardY + 11);
    }

    // ==========================================
    // 4. DESTAQUE CENTRAL: STATUS DA CARGA (36pt)
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const centerY = originY + 84;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

    // ==========================================
    // 5. PARTE INFERIOR: VOLUMES ALINHADOS AO BOTTOM
    // ==========================================
    const bottomMargin = 3.5;
    const bH = 30;
    const bY = originY + contentHeight - bottomMargin - bH;
    const volBoxX = originX + 2.5;
    const volBoxWidth = contentWidth - 5; // 88mm

    // Título VOLUMES
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 22, 31);
    doc.text('VOLUMES', volBoxX + 1, bY - 2.5);

    const bGap = 14;
    const bW = (volBoxWidth - bGap) / 2; // ~37mm

    // Sub-box 1 (Volume Atual)
    const b1X = volBoxX;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b1X, bY, bW, bH, 2.5, 2.5, 'FD');

    // Número do Volume Atual (36pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.volumeAtual), b1X + bW / 2, bY + 21, { align: 'center' });

    // "OF" Central
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(18, 22, 31);
    doc.text('OF', volBoxX + bW + bGap / 2, bY + 19, { align: 'center' });

    // Sub-box 2 (Total Volumes)
    const b2X = volBoxX + bW + bGap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b2X, bY, bW, bH, 2.5, 2.5, 'FD');

    // Número do Total de Volumes (36pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.totalVolumes), b2X + bW / 2, bY + 21, { align: 'center' });

    // Notifica progresso
    currentLabelIndex++;
    if (onProgress) {
      onProgress(Math.round((currentLabelIndex / totalLabels) * 100));
    }
  }

  // Define nome do arquivo exportado
  const dateStr = new Date().toISOString().slice(0, 10);
  const modeStr = operationType === 'importacao' ? 'Importacao_Feira' : 'Exportacao_Devolucao';
  const fileName = `Etiquetas_NFT_${modeStr}_Termica_10x15cm_${totalLabels}_volumes_${dateStr}.pdf`;

  // Salva o PDF
  doc.save(fileName);
  return fileName;
}
