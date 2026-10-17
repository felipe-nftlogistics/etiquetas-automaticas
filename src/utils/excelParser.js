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

// Mapeia colunas do Excel para campos do sistema com validações de segurança
export function parseExcelFile(file, operationType) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Nenhum arquivo foi selecionado.'));
    }

    // 1. Validação de Tamanho Máximo (10 MB) para prevenir travamento de memória (DoS)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return reject(new Error('O arquivo excede o limite máximo permitido de 10 MB.'));
    }

    // 2. Validação de Extensão Permitida
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      return reject(new Error('Formato inválido. Por favor, envie uma planilha .xlsx, .xls ou .csv.'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('A planilha está vazia ou não contém dados legíveis.');
        }

        // Limita a 1000 linhas por arquivo para garantir fluidez
        const limitedRows = jsonData.slice(0, 1000);

        const parsedRows = limitedRows.map((row, index) => {
          // Proteção contra Prototype Pollution
          const rowKeys = Object.keys(row).filter(
            (k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype'
          );

          const findValue = (possibleNames) => {
            for (const name of possibleNames) {
              const target = normalizeHeader(name);
              const foundKey = rowKeys.find((k) => normalizeHeader(k).includes(target) || target.includes(normalizeHeader(k)));
              if (
                foundKey && 
                Object.prototype.hasOwnProperty.call(row, foundKey) && 
                row[foundKey] !== undefined && 
                row[foundKey] !== ''
              ) {
                return row[foundKey];
              }
            }
            return '';
          };

          // Campos universais
          const expositor = findValue(['nome do expositor', 'expositor', 'cliente', 'exhibitor', 'shipper', 'empresa', 'remetente']);
          const rawVolumes = findValue(['quantidade de volumes', 'qtd volumes', 'volumes', 'total volumes', 'volume', 'qtd', 'caixas', 'boxes', 'packages']);
          const referencia = findValue(['referencia interna', 'referencia', 'ref interna', 'ref nft', 'processo', 'ref', 'internal ref', 'process']);
          const observacoes = findValue(['observacoes', 'observacao', 'notas', 'notes', 'remarks', 'detalhes']);
          const rawTipoCarga = findValue(['tipo de carga', 'tipo carga', 'tipo', 'status', 'categoria', 'category', 'regime', 'modalidade', 'condicao', 'condition', 'status central']);
          const tipoCarga = normalizeCargoType(rawTipoCarga);

          // Converte quantidade de volumes para número seguro (1 a 2000)
          let volumes = parseInt(rawVolumes, 10);
          if (isNaN(volumes) || volumes < 1) {
            volumes = 1;
          } else if (volumes > 2000) {
            volumes = 2000; // Trava máxima de proteção
          }

          // Campos específicos por operação
          let feira = '';
          let estande = '';
          let consignatario = '';
          let destino = '';

          if (operationType === 'importacao') {
            feira = findValue(['nome da feira', 'feira', 'evento', 'nome do evento', 'fair', 'event', 'trade show', 'exposicao']);
            estande = findValue(['estande / local', 'estande', 'stand', 'booth', 'pavilhao', 'local']);
          } else {
            consignatario = findValue(['consignatario da carga', 'consignatario', 'destinatario', 'consignee', 'receiver', 'destinatario final']);
            destino = findValue(['pais de destino', 'destino', 'cidade', 'pais', 'aeroporto', 'destination', 'country']);
          }

          return {
            id: `row-${Date.now()}-${index}`,
            selected: true,
            expositor: sanitizeInput(expositor || `Expositor ${index + 1}`),
            volumes: volumes,
            referencia: sanitizeInput(referencia || `NFT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`),
            tipoCarga: tipoCarga,
            feira: sanitizeInput(feira),
            estande: sanitizeInput(estande),
            consignatario: sanitizeInput(consignatario),
            destino: sanitizeInput(destino),
            observacoes: sanitizeInput(observacoes),
          };
        });

        resolve(parsedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo Excel.'));
    reader.readAsArrayBuffer(file);
  });
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
      'Tipo de Carga',
      'Nome da Feira',
      'Estande / Local',
      'Observacoes'
    ];
    sampleData = [
      {
        'Nome do Expositor': 'Siemens Energy AG',
        'Quantidade de Volumes': 40,
        'Referencia Interna': 'NFT-2026-IMP-0104',
        'Tipo de Carga': 'Temporary',
        'Nome da Feira': 'FEIMEC 2026',
        'Estande / Local': 'Pavilhão 3 - Stand D-120',
        'Observacoes': 'Equipamentos elétricos sensíveis'
      },
      {
        'Nome do Expositor': 'Bosch Rexroth Brasil',
        'Quantidade de Volumes': 12,
        'Referencia Interna': 'NFT-2026-IMP-0108',
        'Tipo de Carga': 'Fragile',
        'Nome da Feira': 'EXPOMAFE 2026',
        'Estande / Local': 'Pavilhão 2 - Stand B-45',
        'Observacoes': 'Peças hidráulicas para demonstração'
      },
      {
        'Nome do Expositor': 'Medtronic Health Tech',
        'Quantidade de Volumes': 6,
        'Referencia Interna': 'NFT-2026-IMP-0112',
        'Tipo de Carga': 'Definitive',
        'Nome da Feira': 'HOSPITALAR 2026',
        'Estande / Local': 'Pavilhão Branco - Stand F-18',
        'Observacoes': 'Material promocional e catálogos'
      }
    ];
    fileName = 'NFT_Logistics_Modelo_Importacao_Feira.xlsx';
  } else {
    headers = [
      'Nome do Expositor',
      'Consignatario da Carga',
      'Quantidade de Volumes',
      'Referencia Interna',
      'Tipo de Carga',
      'Pais de Destino',
      'Observacoes'
    ];
    sampleData = [
      {
        'Nome do Expositor': 'Siemens Energy AG',
        'Consignatario da Carga': 'Siemens Energy Headquarters GmbH (Nuremberg, Germany)',
        'Quantidade de Volumes': 40,
        'Referencia Interna': 'NFT-2026-EXP-0104',
        'Tipo de Carga': 'Temporary',
        'Pais de Destino': 'Alemanha',
        'Observacoes': 'Devolução de Admissão Temporária após FEIMEC'
      },
      {
        'Nome do Expositor': 'Bosch Rexroth Brasil',
        'Consignatario da Carga': 'Bosch Rexroth AG (Lohr am Main, Germany)',
        'Quantidade de Volumes': 12,
        'Referencia Interna': 'NFT-2026-EXP-0108',
        'Tipo de Carga': 'Empty',
        'Pais de Destino': 'Alemanha',
        'Observacoes': 'Engradados e caixas vazias para retorno'
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

