import * as XLSX from 'xlsx';

// Sanitiza strings para proteção contra XSS e injeção de fórmulas
function sanitizeInput(str) {
  if (str === null || str === undefined) return '';
  let clean = String(str).trim();
  // Previne injeção de fórmulas maliciosas em planilhas (=, +, -, @)
  if (/^[=+\-@]/.test(clean)) {
    clean = "'" + clean;
  }
  // Remove tags HTML/scripts suspeitas
  clean = clean.replace(/<[^>]*>?/gm, '');
  return clean;
}

// Normaliza strings para comparação flexível de cabeçalhos
function normalizeHeader(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '');      // remove pontuação e espaços
}

// Normaliza tipo de carga para as 5 opções oficiais: "Temporary", "Definitive", "Empty", "Full", "Fragile"
export function normalizeCargoType(val) {
  if (!val) return 'Temporary';
  const s = String(val).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.startsWith('temp') || s.includes('temporar')) return 'Temporary';
  if (s.startsWith('def') || s.includes('definitiv')) return 'Definitive';
  if (s.startsWith('emp') || s.includes('vazi')) return 'Empty';
  if (s.startsWith('ful') || s.includes('chei')) return 'Full';
  if (s.startsWith('fra') || s.includes('fragil')) return 'Fragile';
  return 'Temporary';
}

// Busca coluna na lista de cabeçalhos disponíveis com prioridade exata e filtros de exclusão
function findColumnKey(availableKeys, exactList, fuzzyList = [], excludeList = []) {
  const normKeys = availableKeys.map((k) => ({ original: k, norm: normalizeHeader(k) }));

  // 1. Prioridade 1: Match Exato (respeitando a ordem de prioridade de exactList)
  for (const ex of exactList) {
    const normTarget = normalizeHeader(ex);
    const found = normKeys.find((item) => item.norm === normTarget);
    if (found) return found.original;
  }

  // 2. Prioridade 2: Match Parcial / Contém (respeitando fuzzyList e filtros de exclusão)
  for (const fz of fuzzyList) {
    const normFz = normalizeHeader(fz);
    const found = normKeys.find((item) => {
      const hasExclude = excludeList.some((ex) => item.norm.includes(normalizeHeader(ex)));
      if (hasExclude) return false;
      return item.norm.includes(normFz);
    });
    if (found) return found.original;
  }

  return null;
}

// Mapeia colunas do Excel para campos do sistema com validações de segurança
export async function parseExcelFile(file, operationType) {
  if (!file) {
    throw new Error('Nenhum arquivo foi selecionado.');
  }

  // 1. Validação de Tamanho Máximo (10 MB) para prevenir travamento de memória (DoS)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('O arquivo excede o limite máximo permitido de 10 MB.');
  }

  // 2. Validação de Extensão Permitida
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = (file.name || '').toLowerCase();
  const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExt) {
    throw new Error('Formato inválido. Por favor, envie uma planilha .xlsx, .xls ou .csv.');
  }

  let arrayBufferData;
  if (typeof file.arrayBuffer === 'function') {
    arrayBufferData = await file.arrayBuffer();
  } else {
    arrayBufferData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo Excel.'));
      reader.readAsArrayBuffer(file);
    });
  }

  const data = new Uint8Array(arrayBufferData);
  const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('A planilha está vazia ou não contém dados legíveis.');
  }

        // Limita a 1000 linhas por arquivo para garantir fluidez
        const limitedRows = jsonData.slice(0, 1000);

        // Chaves únicas presentes na planilha (protegidas contra Prototype Pollution)
        const allKeys = Array.from(
          new Set(limitedRows.flatMap((r) => Object.keys(r)))
        ).filter((k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype');

        const ADDRESS_WORDS = ['endereco', 'address', 'addr', 'morada', 'rua', 'street', 'localizacao'];
        const CONSIGNEE_WORDS = ['consignee', 'consignatario', 'destinatario'];
        const EXPORTER_WORDS = ['exporter', 'exportador', 'shipper', 'remetente'];

        // Mapeamento de colunas universais
        const colVolumes = findColumnKey(
          allKeys,
          ['quantidade de volumes', 'qtd volumes', 'total volumes', 'volumes', 'volume', 'qtd', 'caixas', 'boxes', 'packages'],
          ['quantidadedevolumes', 'qtdvolumes', 'totalvolumes', 'volumes', 'volume', 'qtd']
        );

        const colReferencia = findColumnKey(
          allKeys,
          ['referencia interna', 'ref interna', 'referencia', 'ref nft', 'processo', 'ref', 'internal ref', 'process'],
          ['referenciainterna', 'refinterna', 'referencia', 'processo']
        );

        const colTipoCarga = findColumnKey(
          allKeys,
          ['categoria', 'category', 'tipo de carga', 'tipo carga', 'tipo', 'status', 'regime', 'modalidade', 'condicao', 'condition', 'status central'],
          ['tipocarga', 'categoria', 'category', 'regime', 'modalidade']
        );

        const colNotaFiscal = findColumnKey(
          allKeys,
          ['nota fiscal', 'nf', 'numero nf', 'no nf', 'n nf', 'danfe', 'invoice', 'nota'],
          ['notafiscal', 'danfe', 'invoice']
        );

        // Mapeamento de observações gerais (exclui observações importantes)
        const colObservacoes = findColumnKey(
          allKeys,
          ['observacoes', 'observacao', 'notas', 'notes', 'remarks', 'detalhes'],
          ['observacoes', 'observacao', 'notas', 'notes', 'remarks'],
          ['importante', 'important']
        );

        // Mapeamentos específicos por operação
        let colExpositor = null;
        let colFeira = null;
        let colEstande = null;
        let colDta = null;
        let colConsignee = null;
        let colConsigneeAddress = null;
        let colExporter = null;
        let colExporterAddress = null;
        let colBooking = null;
        let colObsImp = null;

        if (operationType === 'importacao') {
          colExpositor = findColumnKey(
            allKeys,
            ['nome do expositor', 'expositor', 'cliente', 'exhibitor', 'shipper', 'empresa', 'remetente'],
            ['expositor', 'exhibitor', 'cliente'],
            ['feira', 'estande', 'endereco']
          );
          colFeira = findColumnKey(
            allKeys,
            ['nome da feira', 'feira', 'evento', 'nome do evento', 'fair', 'event', 'trade show', 'exposicao'],
            ['nomedafeira', 'feira', 'evento', 'fair', 'event']
          );
          colEstande = findColumnKey(
            allKeys,
            ['estande / local', 'estande', 'stand', 'booth', 'pavilhao', 'local'],
            ['estande', 'stand', 'booth', 'pavilhao']
          );
          colDta = findColumnKey(
            allKeys,
            ['dta', 'numero dta', 'no dta', 'n dta', 'num dta', 'dta no'],
            ['dta']
          );
        } else {
          // EXPORTAÇÃO
          // 1. Consignee (Nome do Destinatário Internacional) - Nunca puxa endereço
          colConsignee = findColumnKey(
            allKeys,
            ['consignee', 'nome do consignee', 'consignee name', 'consignatario da carga', 'consignatario', 'destinatario', 'nome do expositor', 'expositor', 'cliente'],
            ['consignee', 'consignatario', 'destinatario'],
            [...ADDRESS_WORDS, ...EXPORTER_WORDS]
          ) || findColumnKey(
            allKeys,
            ['nome do expositor', 'expositor', 'cliente'],
            ['expositor', 'cliente'],
            [...ADDRESS_WORDS, ...EXPORTER_WORDS]
          );

          // 2. Endereço Consignee - Deve ser endereço do Consignee, nunca de Exporter
          colConsigneeAddress = findColumnKey(
            allKeys,
            [
              'endereco consignee', 'endereco do consignee', 'endereco completo consignee',
              'consignee address', 'address consignee', 'consignee full address',
              'endereco consignatario', 'endereco do consignatario', 'endereco completo consignatario',
              'endereco destinatario', 'endereco do destinatario',
              'endereco', 'address'
            ],
            ['enderecoconsignee', 'consigneeaddress', 'enderecoconsignatario', 'enderecodestinatario'],
            EXPORTER_WORDS
          );

          // 3. Exporter (Nome do Exportador/Remetente) - Nunca puxa endereço nem consignee
          colExporter = findColumnKey(
            allKeys,
            ['exporter', 'nome do exporter', 'exporter name', 'exportador', 'nome do exportador', 'shipper', 'shipper name', 'remetente', 'nome do remetente'],
            ['exporter', 'exportador', 'shipper', 'remetente'],
            [...ADDRESS_WORDS, ...CONSIGNEE_WORDS]
          ) || (
            colConsignee && normalizeHeader(colConsignee).includes('consignatario')
              ? findColumnKey(allKeys, ['nome do expositor', 'expositor'], ['expositor'], [...ADDRESS_WORDS, ...CONSIGNEE_WORDS])
              : null
          );

          // 4. Endereço Exporter - Deve ser endereço do Exportador, nunca de Consignee
          colExporterAddress = findColumnKey(
            allKeys,
            [
              'endereco exporter', 'endereco do exporter', 'endereco completo exporter',
              'exporter address', 'address exporter', 'exporter full address',
              'endereco exportador', 'endereco do exportador', 'endereco completo exportador',
              'endereco shipper', 'shipper address', 'address shipper',
              'endereco remetente', 'endereco do remetente'
            ],
            ['enderecoexporter', 'exporteraddress', 'enderecoexportador', 'enderecoshipper', 'enderecoremetente'],
            CONSIGNEE_WORDS
          );

          // 5. Booking/Reserva
          colBooking = findColumnKey(
            allKeys,
            ['booking/reserva', 'booking / reserva', 'booking', 'reserva', 'bkg', 'booking no', 'reserva no', 'numero da reserva', 'numero de reserva'],
            ['booking', 'reserva', 'bkg']
          );

          // 6. Observações Importantes (Destaque Central)
          colObsImp = findColumnKey(
            allKeys,
            ['observacoes importantes', 'observacao importante', 'important notes', 'obs importantes', 'obs importante', 'nota importante'],
            ['observacoesimportantes', 'observacaoimportante', 'importantnotes', 'obsimportantes', 'notaimportante']
          );
        }

        // Função auxiliar para obter valor seguro de uma linha
        const getCellString = (row, col) => {
          if (!col || !Object.prototype.hasOwnProperty.call(row, col)) return '';
          const val = row[col];
          if (val === null || val === undefined) return '';
          return String(val).trim();
        };

        const parsedRows = limitedRows.map((row, index) => {
          // Campos universais
          const rawVolumes = getCellString(row, colVolumes);
          const referencia = getCellString(row, colReferencia);
          const rawTipoCarga = getCellString(row, colTipoCarga);
          const tipoCarga = normalizeCargoType(rawTipoCarga);
          const observacoes = getCellString(row, colObservacoes);
          const notaFiscal = getCellString(row, colNotaFiscal);

          // Converte quantidade de volumes para número seguro (1 a 2000)
          let volumes = parseInt(rawVolumes, 10);
          if (isNaN(volumes) || volumes < 1) {
            volumes = 1;
          } else if (volumes > 2000) {
            volumes = 2000; // Trava máxima de proteção
          }

          let expositor = '';
          let feira = '';
          let estande = '';
          let consignatario = '';
          let destino = '';
          let consignee = '';
          let consigneeAddress = '';
          let exporter = '';
          let exporterAddress = '';
          let booking = '';
          let observacoesImportantes = '';
          let dta = '';

          if (operationType === 'importacao') {
            expositor = getCellString(row, colExpositor) || `Expositor ${index + 1}`;
            feira = getCellString(row, colFeira);
            estande = getCellString(row, colEstande);
            dta = getCellString(row, colDta);
          } else {
            consignee = getCellString(row, colConsignee);
            consigneeAddress = getCellString(row, colConsigneeAddress);
            exporter = getCellString(row, colExporter);
            exporterAddress = getCellString(row, colExporterAddress);
            booking = getCellString(row, colBooking);
            observacoesImportantes = getCellString(row, colObsImp);

            // Trava de segurança anti-duplicação:
            // Se o endereço foi mapeado para a mesma coluna do nome (ou tem valor idêntico por coluna errada), limpa o endereço
            if (colConsignee && colConsigneeAddress && colConsignee === colConsigneeAddress) {
              consigneeAddress = '';
            }
            if (colExporter && colExporterAddress && colExporter === colExporterAddress) {
              exporterAddress = '';
            }

            // Expositor padrão de exibição em listas
            expositor = consignee || exporter || `Consignee ${index + 1}`;
          }

          return {
            id: `row-${Date.now()}-${index}`,
            selected: true,
            expositor: sanitizeInput(expositor),
            consignee: sanitizeInput(consignee),
            consigneeAddress: sanitizeInput(consigneeAddress),
            exporter: sanitizeInput(exporter),
            exporterAddress: sanitizeInput(exporterAddress),
            booking: sanitizeInput(booking),
            observacoesImportantes: sanitizeInput(observacoesImportantes),
            volumes: volumes,
            referencia: sanitizeInput(referencia || `NFT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`),
            tipoCarga: tipoCarga,
            feira: sanitizeInput(feira),
            estande: sanitizeInput(estande),
            consignatario: sanitizeInput(consignatario),
            destino: sanitizeInput(destino),
            observacoes: sanitizeInput(observacoes),
            dta: operationType === 'importacao' ? sanitizeInput(dta) : '',
            notaFiscal: sanitizeInput(notaFiscal),
          };
        });

  return parsedRows;
}

// Gera e faz download de uma planilha modelo (.xlsx)
export function downloadExcelTemplate(operationType) {
  let headers = [];
  let sampleData = [];
  let fileName = '';

  if (operationType === 'importacao') {
    headers = [
      'Nome do Expositor',
      'Quantidade de Volumes',
      'Referencia Interna',
      'Categoria',
      'Nome da Feira',
      'Estande / Local',
      'DTA',
      'Nota Fiscal',
      'Observacoes'
    ];
    sampleData = [
      {
        'Nome do Expositor': 'Siemens Energy AG',
        'Quantidade de Volumes': 40,
        'Referencia Interna': 'NFT-2026-IMP-0104',
        'Categoria': 'Temporary',
        'Nome da Feira': 'FEIMEC 2026',
        'Estande / Local': 'Pavilhão 3 - Stand D-120',
        'DTA': '26/0123456-7',
        'Nota Fiscal': '12345',
        'Observacoes': 'Equipamentos elétricos sensíveis'
      },
      {
        'Nome do Expositor': 'Bosch Rexroth Brasil',
        'Quantidade de Volumes': 12,
        'Referencia Interna': 'NFT-2026-IMP-0108',
        'Categoria': 'Fragile',
        'Nome da Feira': 'EXPOMAFE 2026',
        'Estande / Local': 'Pavilhão 2 - Stand B-45',
        'DTA': '26/0987654-3',
        'Nota Fiscal': '',
        'Observacoes': 'Peças hidráulicas para demonstração'
      }
    ];
    fileName = 'NFT_Logistics_Modelo_Importacao_Feira.xlsx';
  } else {
    headers = [
      'Consignee',
      'Endereço Consignee',
      'Exporter',
      'Endereço Exporter',
      'Booking/Reserva',
      'Categoria',
      'Observações Importantes',
      'Quantidade de Volumes',
      'Referencia Interna',
      'Observacoes'
    ];
    sampleData = [
      {
        'Consignee': 'Siemens Energy AG',
        'Endereço Consignee': 'Otto-Hahn-Ring 6, 81739 Munich, Germany',
        'Exporter': 'Siemens Brasil Ltda',
        'Endereço Exporter': 'Av. Mutinga, 3800 - Pirituba, São Paulo - SP, Brasil',
        'Booking/Reserva': 'BKG-2026-98765',
        'Categoria': 'Temporary',
        'Observações Importantes': 'RETORNO DE DEMONSTRAÇÃO',
        'Quantidade de Volumes': 40,
        'Referencia Interna': 'NFT-2026-EXP-0104',
        'Observacoes': 'Devolução após feira'
      },
      {
        'Consignee': 'Bosch Rexroth AG',
        'Endereço Consignee': 'Maria-Theresien-Str. 23, 97816 Lohr am Main, Germany',
        'Exporter': 'Bosch Rexroth Brasil',
        'Endereço Exporter': 'Av. Tégula, 888 - Atibaia - SP, Brasil',
        'Booking/Reserva': 'BKG-2026-12345',
        'Categoria': 'Empty',
        'Observações Importantes': 'VOLUMES VAZIOS',
        'Quantidade de Volumes': 12,
        'Referencia Interna': 'NFT-2026-EXP-0108',
        'Observacoes': 'Caixas vazias'
      }
    ];
    fileName = 'NFT_Logistics_Modelo_Exportacao_Devolucao.xlsx';
  }

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Ajusta largura das colunas
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 5, 22) }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, fileName);
}

