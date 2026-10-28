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

    // Coluna Esquerda: Expositor e Evento/Destino
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

    if (isImport) {
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
      // Exportação: RETURN + Campo aberto para escrever à mão na feira (3 linhas)
      doc.setFont(fontName, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 91, 39);
      doc.text('RETURN:', originX + 4, afterExpY);

      const retBoxX = originX + 4;
      const retBoxY = afterExpY + 1.5;
      const retBoxW = 124;
      const retBoxH = 14;

      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.35);
      doc.setLineDashPattern([2, 2], 0);
      doc.roundedRect(retBoxX, retBoxY, retBoxW, retBoxH, 1.5, 1.5, 'FD');

      // 2 Linhas pautadas internas para guiar escrita à mão
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(retBoxX + 2, retBoxY + 4.6, retBoxX + retBoxW - 2, retBoxY + 4.6);
      doc.line(retBoxX + 2, retBoxY + 9.2, retBoxX + retBoxW - 2, retBoxY + 9.2);
      doc.setLineDashPattern([], 0); // reseta
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

    // Linha de DTA e NF dentro do card de observações
    if (item.dta || item.notaFiscal) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      let extraText = '';
      if (item.dta) extraText += `DTA: ${item.dta}   `;
      if (item.notaFiscal) extraText += `NF: ${item.notaFiscal}`;
      doc.text(extraText.trim(), cardX + 3, cardY + 17.5);
    }

    // ==========================================
    // 4. DESTAQUE CENTRAL: "TEMPORARY", "DEFINITIVE", "EMPTY", "FULL" OU "FRAGILE"
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const centerY = originY + 80;

    doc.setFont(fontName, 'bold');
    doc.setFontSize(50);
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

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

    // Feira ou Consignatário (com quebra em até 2 linhas)
    if (isImport) {
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
      // Exportação Térmica: RETURN + Caixa de escrita à mão na feira (3 linhas)
      doc.setFont(fontName, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(234, 91, 39);
      doc.text('RETURN:', originX + 3, nextY);

      const retBoxX = originX + 3;
      const retBoxY = nextY + 1.2;
      const retBoxW = contentWidth - 6;
      const retBoxH = 12.5;

      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.35);
      doc.setLineDashPattern([2, 2], 0);
      doc.roundedRect(retBoxX, retBoxY, retBoxW, retBoxH, 1.5, 1.5, 'FD');

      // 2 Linhas pautadas internas
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(retBoxX + 2, retBoxY + 4.1, retBoxX + retBoxW - 2, retBoxY + 4.1);
      doc.line(retBoxX + 2, retBoxY + 8.2, retBoxX + retBoxW - 2, retBoxY + 8.2);
      doc.setLineDashPattern([], 0); // reseta
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

    if (item.dta || item.notaFiscal) {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      let extraText = '';
      if (item.dta) extraText += `DTA: ${item.dta}   `;
      if (item.notaFiscal) extraText += `NF: ${item.notaFiscal}`;
      doc.text(extraText.trim(), cardX + 2.5, cardY + 11.6);
    }

    // ==========================================
    // 3. DESTAQUE CENTRAL: STATUS DA CARGA (36pt)
    // ==========================================
    const statusText = (item.tipoCarga || 'Temporary').toUpperCase();
    const centerY = originY + 84;

    doc.setFont(fontName, 'bold');
    doc.setFontSize(36);
    doc.setTextColor(18, 22, 31);
    doc.text(statusText, originX + contentWidth / 2, centerY, { align: 'center' });

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
