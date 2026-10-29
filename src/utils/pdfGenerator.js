import { jsPDF } from 'jspdf';
import { NFT_LOGO_FULL } from '../assets/logos';

/**
 * Cache em memória da fonte Unicode Base64 para evitar refetching em exportações sucessivas.
 */
let cachedFontBase64 = null;

/**
 * Carrega a fonte TrueType NotoSansSC-Bold com suporte a caracteres chineses,
 * japoneses, cirílico, acentuações e caracteres ocidentais para o jsPDF.
 */
async function ensureUnicodeFont(doc) {
  try {
    if (!cachedFontBase64) {
      let fontBuffer = null;

      // 1. Tenta carregar do diretório público local
      try {
        const response = await fetch('/fonts/NotoSansSC-Bold.ttf');
        if (response.ok) {
          fontBuffer = await response.arrayBuffer();
        }
      } catch {
        // Ignora erro local e tenta fallback
      }

      // 2. Fallback para Google Fonts CDN caso o arquivo local não responda
      if (!fontBuffer) {
        const fallbackUrl = 'https://fonts.gstatic.com/s/notosanssc/v41/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGzjCnYxNavzT.ttf';
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          fontBuffer = await fallbackRes.arrayBuffer();
        }
      }

      if (fontBuffer) {
        const bytes = new Uint8Array(fontBuffer);
        let binary = '';
        const chunkSize = 16384;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
        }
        cachedFontBase64 = btoa(binary);
      }
    }

    if (cachedFontBase64) {
      doc.addFileToVFS('NotoSansSC-Bold.ttf', cachedFontBase64);
      doc.addFont('NotoSansSC-Bold.ttf', 'NotoSansSC', 'normal');
      doc.addFont('NotoSansSC-Bold.ttf', 'NotoSansSC', 'bold');
      return 'NotoSansSC';
    }
  } catch (err) {
    console.warn('Não foi possível carregar a fonte Unicode NotoSansSC, utilizando helvetica:', err);
  }
  return 'helvetica';
}

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
 * Sem bordas externas ou centrais que atrapalhem o corte da guilhotina/tesoura.
 */
async function generateA4PDF(labelsData, operationType, onProgress) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Carrega e registra fonte universal com suporte a caracteres chineses e multilíngues
  const fontName = await ensureUnicodeFont(doc);

  const pageWidth = 210;
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

    // NOTA: Borda externa e linha de corte central foram removidas conforme solicitado
    // para não interferir nem deixar marcas no corte das folhas A4 ao meio.

    // ==========================================
    // 1. CABEÇALHO (LOGO COMPLETO NFT + CAIXA REF CENTRALIZADA)
    // ==========================================
    const headerY = originY + 2.5;

    // Logo NFT Completo (nft | International Logistics Solutions)
    try {
      doc.addImage(NFT_LOGO_FULL, 'PNG', originX + 4, headerY + 1.5, 58, 9.5);
    } catch {
      doc.setFont(fontName, 'bold');
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

    doc.setFont(fontName, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    const refStr = String(item.referencia || 'NFT-REF-0000');
    doc.text(refStr, refX + refWidth / 2, refY + 9.5, { align: 'center' });

    // ==========================================
    // 2. LINHA HORIZONTAL DIVISÓRIA (PRETA MARCANTE)
    // ==========================================
    const lineY = headerY + 16.5;
    doc.setDrawColor(18, 22, 31);
    doc.setLineWidth(0.55);
    doc.line(originX + 2, lineY, originX + contentWidth - 2, lineY);

    // ==========================================
    // 3. DISTRIBUIÇÃO DAS INFORMAÇÕES DO CLIENTE E EVENTO
    // ==========================================
    const isImport = operationType === 'importacao';
    const infoY = lineY + 1.5;

    if (isImport) {
      // Coluna Esquerda (Importação): Expositor e Evento/Destino
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('EXPOSITOR / EXHIBITOR (CLIENTE):', originX + 4, infoY + 3.5);

      const expositorText = String(item.expositor || 'EXPOSITOR').toUpperCase();
      doc.setFont(fontName, 'bold');
      const expositorLines = doc.splitTextToSize(expositorText, 124);

      let expositorFontSize = 13;
      if (expositorLines.length > 2 || expositorText.length > 50) {
        expositorFontSize = 10;
      } else if (expositorLines.length === 2 || expositorText.length > 30) {
        expositorFontSize = 11.5;
      }
      doc.setFontSize(expositorFontSize);
      doc.setTextColor(15, 23, 42);

      const lineSpacing = expositorFontSize * 0.42;
      const maxLines = Math.min(expositorLines.length, 3);
      let curExpY = infoY + 8;
      for (let l = 0; l < maxLines; l++) {
        doc.text(expositorLines[l], originX + 4, curExpY);
        curExpY += lineSpacing;
      }
      const afterExpY = Math.max(curExpY + 1.5, infoY + 15);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('FEIRA / EVENTO (DESTINATION EVENT):', originX + 4, afterExpY);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(234, 91, 39);
      const feiraLines = doc.splitTextToSize(String(item.feira || 'FEIRA INTERNACIONAL').toUpperCase(), 124);
      doc.text(feiraLines[0], originX + 4, afterExpY + 4.2);
      let afterFeiraY = afterExpY + 8;
      if (feiraLines[1]) {
        doc.text(feiraLines[1], originX + 4, afterExpY + 8.2);
        afterFeiraY = afterExpY + 12;
      }

      if (item.estande) {
        doc.setFont(fontName, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`ESTANDE / LOCAL: ${item.estande}`.slice(0, 48), originX + 4, afterFeiraY);
      }
    } else {
      // Coluna Esquerda (Exportação): CONSIGNEE + Endereço e EXPORTER + Endereço
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('CONSIGNEE:', originX + 4, infoY + 3.5);

      const consigneeText = String(item.consignee || item.expositor || 'CONSIGNEE').toUpperCase();
      doc.setFont(fontName, 'bold');
      const consigneeLines = doc.splitTextToSize(consigneeText, 124);

      let consigneeFontSize = 12;
      if (consigneeLines.length > 2 || consigneeText.length > 45) {
        consigneeFontSize = 10;
      } else if (consigneeLines.length === 2 || consigneeText.length > 25) {
        consigneeFontSize = 11;
      }
      doc.setFontSize(consigneeFontSize);
      doc.setTextColor(15, 23, 42);

      let curConsY = infoY + 7.5;
      for (let l = 0; l < Math.min(consigneeLines.length, 2); l++) {
        doc.text(consigneeLines[l], originX + 4, curConsY);
        curConsY += consigneeFontSize * 0.4;
      }

      // Endereço completo do Consignee (fonte menor que o nome)
      if (item.consigneeAddress) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const addrLines = doc.splitTextToSize(String(item.consigneeAddress), 124);
        for (let l = 0; l < Math.min(addrLines.length, 2); l++) {
          doc.text(addrLines[l], originX + 4, curConsY);
          curConsY += 3.2;
        }
      }

      const exporterStartY = Math.max(curConsY + 1.5, infoY + 16);

      // EXPORTER
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('EXPORTER:', originX + 4, exporterStartY);

      const exporterText = String(item.exporter || 'EXPORTER').toUpperCase();
      doc.setFont(fontName, 'bold');
      const exporterLines = doc.splitTextToSize(exporterText, 124);
      let exporterFontSize = 11;
      if (exporterLines.length > 2 || exporterText.length > 45) {
        exporterFontSize = 9.5;
      }
      doc.setFontSize(exporterFontSize);
      doc.setTextColor(15, 23, 42);

      let curExpY = exporterStartY + 4.2;
      for (let l = 0; l < Math.min(exporterLines.length, 2); l++) {
        doc.text(exporterLines[l], originX + 4, curExpY);
        curExpY += exporterFontSize * 0.4;
      }

      // Endereço completo do Exporter (fonte menor que o nome)
      if (item.exporterAddress) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const expAddrLines = doc.splitTextToSize(String(item.exporterAddress), 124);
        for (let l = 0; l < Math.min(expAddrLines.length, 2); l++) {
          doc.text(expAddrLines[l], originX + 4, curExpY);
          curExpY += 3.2;
        }
      }
    }

    // Coluna Direita: Card de Observações / Notas com DTA e Nota Fiscal
    const cardX = originX + contentWidth - 64;
    const cardY = infoY + 1;
    const cardW = 60;
    const cardH = 21;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

    doc.setFont(fontName, 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVAÇÕES / NOTAS:', cardX + 3, cardY + 4.2);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const obsLines = doc.splitTextToSize(String(item.observacoes || 'Sem observações adicionais'), cardW - 6);
    doc.text(obsLines[0] || '', cardX + 3, cardY + 8);
    if (obsLines[1] && (!item.dta && !item.notaFiscal)) {
      doc.text(obsLines[1], cardX + 3, cardY + 11.5);
    }

    // Linha de DTA e NF dentro do card de observações (DTA exclusivo para importação)
    if ((isImport && item.dta) || item.notaFiscal) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      let extraText = '';
      if (isImport && item.dta) extraText += `DTA: ${item.dta}   `;
      if (item.notaFiscal) extraText += `NF: ${item.notaFiscal}`;
      doc.text(extraText.trim(), cardX + 3, cardY + 17.5);
    }

    // ==========================================
    // 4. DESTAQUE CENTRAL: "TEMPORARY", "DEFINITIVE", "EMPTY", "FULL" OU "FRAGILE"
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const hasObsImp = !isImport && Boolean(item.observacoesImportantes);
    const hasBooking = !isImport && Boolean(item.booking);
    const centerY = originY + (hasObsImp ? (hasBooking ? 77 : 74) : (hasBooking ? 82 : 80));

    // Em Exportação: Campo BOOKING/RESERVA centralizado, acima da categoria com fonte menor
    if (hasBooking) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105);
      const bkgText = `BOOKING/RESERVA: ${String(item.booking).toUpperCase()}`;
      doc.text(bkgText, originX + contentWidth / 2, centerY - (hasObsImp ? 13 : 14), { align: 'center' });
    }

    doc.setFont(fontName, 'bold');
    doc.setFontSize(hasObsImp ? (hasBooking ? 42 : 46) : (hasBooking ? 46 : 50));
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

    // Em Exportação: Campo de Observações Importantes centralizado, sem título, fonte igual ao Consignee
    if (hasObsImp) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(12); // Tamanho da fonte igual ao Consignee
      doc.setTextColor(15, 23, 42);
      const obsImpText = String(item.observacoesImportantes).toUpperCase();
      const obsImpLines = doc.splitTextToSize(obsImpText, contentWidth - 20);
      let obsY = centerY + 7.5;
      for (let l = 0; l < Math.min(obsImpLines.length, 2); l++) {
        doc.text(obsImpLines[l], originX + contentWidth / 2, obsY, { align: 'center' });
        obsY += 4.5;
      }
    }

    // ==========================================
    // 5. PARTE INFERIOR: VOLUMES LARGURA TOTAL ALINHADOS AO BOTTOM
    // ==========================================
    const volBoxX = originX + 4;
    const volBoxWidth = contentWidth - 8;

    const bGap = 18; // Espaço central para o "OF"
    const bW = (volBoxWidth - bGap) / 2;
    const bH = 29;
    
    const bottomMargin = 4;
    const bY = originY + contentHeight - bottomMargin - bH;

    // Título VOLUMES logo acima das caixas
    doc.setFont(fontName, 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(18, 22, 31);
    doc.text('VOLUMES', volBoxX + 1, bY - 2.5);

    // Sub-box 1 (Volume Atual)
    const b1X = volBoxX;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b1X, bY, bW, bH, 3, 3, 'FD');

    // Número do Volume Atual
    doc.setFont(fontName, 'bold');
    doc.setFontSize(40);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.volumeAtual), b1X + bW / 2, bY + 20.5, { align: 'center' });

    // "OF" Central
    doc.setFont(fontName, 'bold');
    doc.setFontSize(16);
    doc.setTextColor(18, 22, 31);
    doc.text('OF', volBoxX + bW + bGap / 2, bY + 18.5, { align: 'center' });

    // Sub-box 2 (Total Volumes)
    const b2X = volBoxX + bW + bGap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    doc.roundedRect(b2X, bY, bW, bH, 3, 3, 'FD');

    // Número do Total de Volumes
    doc.setFont(fontName, 'bold');
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
 * Sem moldura externa retangular nas bordas.
 */
async function generateThermal10x15PDF(labelsData, operationType, onProgress) {
  // Inicializa o documento 100 x 150 mm Retrato
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
    compress: true,
  });

  const fontName = await ensureUnicodeFont(doc);

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

    // NOTA: Moldura externa foi removida para facilitar etiquetas pré-cortadas térmicas.

    // ==========================================
    // 1. CABEÇALHO DISTRIBUÍDO: LOGO (LINHA 1) + CAIXA REF (LINHA 2)
    // ==========================================
    // Linha 1: Logo NFT Centralizado
    const logoW = 48;
    const logoH = 7.8;
    const logoX = originX + (contentWidth - logoW) / 2;
    const logoY = originY + 2.5;

    try {
      doc.addImage(NFT_LOGO_FULL, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      doc.setFont(fontName, 'bold');
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
    doc.setFont(fontName, 'bold');
    doc.setFontSize(refStr.length > 20 ? 10 : 13);
    doc.setTextColor(15, 23, 42);
    doc.text(refStr, refX + refW / 2, refY + 6.6, { align: 'center' });

    // Linha Divisória Marcante
    const lineY = refY + refH + 2.2;
    doc.setDrawColor(18, 22, 31);
    doc.setLineWidth(0.5);
    doc.line(originX + 2, lineY, originX + contentWidth - 2, lineY);

    // ==========================================
    // 2. DISTRIBUIÇÃO DAS INFORMAÇÕES COM QUEBRA DE LINHA
    // ==========================================
    const isImport = operationType === 'importacao';
    const infoY = lineY + 1.2;

    if (isImport) {
      // Expositor (com quebra em até 3 linhas)
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('EXPOSITOR / EXHIBITOR (CLIENTE):', originX + 3, infoY + 3);

      const expositorText = String(item.expositor || 'EXPOSITOR').toUpperCase();
      doc.setFont(fontName, 'bold');
      const expositorLines = doc.splitTextToSize(expositorText, contentWidth - 6);

      let expFontSize = 9.5;
      if (expositorLines.length > 2 || expositorText.length > 40) {
        expFontSize = 8;
      }
      doc.setFontSize(expFontSize);
      doc.setTextColor(15, 23, 42);

      const lineSpacing = expFontSize * 0.42;
      const maxLines = Math.min(expositorLines.length, 3);
      let curExpY = infoY + 6.8;
      for (let l = 0; l < maxLines; l++) {
        doc.text(expositorLines[l], originX + 3, curExpY);
        curExpY += lineSpacing;
      }
      const nextY = Math.max(curExpY + 1.5, infoY + 13.5);

      // Feira / Evento
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('FEIRA / EVENTO (DESTINATION EVENT):', originX + 3, nextY);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(234, 91, 39);
      const feiraLines = doc.splitTextToSize(String(item.feira || 'FEIRA INTERNACIONAL').toUpperCase(), contentWidth - 6);
      doc.text(feiraLines[0] || '', originX + 3, nextY + 3.6);
      let afterFeiraY = nextY + 7.2;
      if (feiraLines[1]) {
        doc.text(feiraLines[1], originX + 3, nextY + 7.1);
        afterFeiraY = nextY + 10.5;
      }

      if (item.estande) {
        doc.setFont(fontName, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`ESTANDE / LOCAL: ${item.estande}`.slice(0, 48), originX + 3, afterFeiraY);
      }
    } else {
      // Exportação Térmica: CONSIGNEE + Endereço e EXPORTER + Endereço
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CONSIGNEE:', originX + 3, infoY + 3);

      const consigneeText = String(item.consignee || item.expositor || 'CONSIGNEE').toUpperCase();
      doc.setFont(fontName, 'bold');
      const consigneeLines = doc.splitTextToSize(consigneeText, contentWidth - 6);

      let expFontSize = 9.5;
      if (consigneeLines.length > 2 || consigneeText.length > 35) {
        expFontSize = 8.5;
      }
      doc.setFontSize(expFontSize);
      doc.setTextColor(15, 23, 42);

      let curExpY = infoY + 6.5;
      for (let l = 0; l < Math.min(consigneeLines.length, 2); l++) {
        doc.text(consigneeLines[l], originX + 3, curExpY);
        curExpY += expFontSize * 0.42;
      }

      if (item.consigneeAddress) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const addrLines = doc.splitTextToSize(String(item.consigneeAddress), contentWidth - 6);
        for (let l = 0; l < Math.min(addrLines.length, 2); l++) {
          doc.text(addrLines[l], originX + 3, curExpY);
          curExpY += 3;
        }
      }

      const exporterStartY = Math.max(curExpY + 1.2, infoY + 14.5);

      // EXPORTER
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('EXPORTER:', originX + 3, exporterStartY);

      const exporterText = String(item.exporter || 'EXPORTER').toUpperCase();
      doc.setFont(fontName, 'bold');
      const exporterLines = doc.splitTextToSize(exporterText, contentWidth - 6);
      let exporterFontSize = 9;
      if (exporterLines.length > 2 || exporterText.length > 35) {
        exporterFontSize = 8;
      }
      doc.setFontSize(exporterFontSize);
      doc.setTextColor(15, 23, 42);

      let curExpY2 = exporterStartY + 3.8;
      for (let l = 0; l < Math.min(exporterLines.length, 2); l++) {
        doc.text(exporterLines[l], originX + 3, curExpY2);
        curExpY2 += exporterFontSize * 0.42;
      }

      if (item.exporterAddress) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const expAddrLines = doc.splitTextToSize(String(item.exporterAddress), contentWidth - 6);
        for (let l = 0; l < Math.min(expAddrLines.length, 2); l++) {
          doc.text(expAddrLines[l], originX + 3, curExpY2);
          curExpY2 += 3;
        }
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

    doc.setFont(fontName, 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVAÇÕES / NOTAS:', cardX + 2.5, cardY + 3.4);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    const obsLines = doc.splitTextToSize(String(item.observacoes || 'Sem observações adicionais'), cardW - 5);
    doc.text(obsLines[0] || '', cardX + 2.5, cardY + 6.8);
    if (obsLines[1] && (!item.dta && !item.notaFiscal)) {
      doc.text(obsLines[1], cardX + 2.5, cardY + 9.8);
    }

    if ((isImport && item.dta) || item.notaFiscal) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      let extraText = '';
      if (isImport && item.dta) extraText += `DTA: ${item.dta}   `;
      if (item.notaFiscal) extraText += `NF: ${item.notaFiscal}`;
      doc.text(extraText.trim(), cardX + 2.5, cardY + 11.6);
    }

    // ==========================================
    // 3. DESTAQUE CENTRAL: STATUS DA CARGA (36pt)
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const hasObsImp = !isImport && Boolean(item.observacoesImportantes);
    const hasBooking = !isImport && Boolean(item.booking);
    const centerY = originY + (hasObsImp ? (hasBooking ? 81 : 80) : (hasBooking ? 85 : 84));

    // Em Exportação Térmica: Campo BOOKING/RESERVA centralizado, acima da categoria com fonte menor
    if (hasBooking) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const bkgText = `BOOKING/RESERVA: ${String(item.booking).toUpperCase()}`;
      doc.text(bkgText, originX + contentWidth / 2, centerY - (hasObsImp ? 9.5 : 10), { align: 'center' });
    }

    doc.setFont(fontName, 'bold');
    doc.setFontSize(hasObsImp ? (hasBooking ? 29 : 32) : (hasBooking ? 32 : 36));
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

    // Em Exportação: Observações Importantes centralizado, sem título, fonte igual ao Consignee
    if (hasObsImp) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(9.5); // Tamanho da fonte igual ao Consignee na térmica
      doc.setTextColor(15, 23, 42);
      const obsImpText = String(item.observacoesImportantes).toUpperCase();
      const obsImpLines = doc.splitTextToSize(obsImpText, contentWidth - 10);
      let obsY = centerY + 6.5;
      for (let l = 0; l < Math.min(obsImpLines.length, 2); l++) {
        doc.text(obsImpLines[l], originX + contentWidth / 2, obsY, { align: 'center' });
        obsY += 3.8;
      }
    }

    // ==========================================
    // 4. PARTE INFERIOR: VOLUMES ALINHADOS AO BOTTOM
    // ==========================================
    const bottomMargin = 3.5;
    const bH = 30;
    const bY = originY + contentHeight - bottomMargin - bH;
    const volBoxX = originX + 2.5;
    const volBoxWidth = contentWidth - 5; // 88mm

    // Título VOLUMES
    doc.setFont(fontName, 'bold');
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
    doc.setFont(fontName, 'bold');
    doc.setFontSize(36);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.volumeAtual), b1X + bW / 2, bY + 21, { align: 'center' });

    // "OF" Central
    doc.setFont(fontName, 'bold');
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
    doc.setFont(fontName, 'bold');
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
