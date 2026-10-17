# NFT Logistics — Sistema de Impressão de Etiquetas para Feiras & Eventos (COMEX)

Sistema especializado para geração e impressão de etiquetas de caixas e volumes para comércio exterior, focado em operações de **admissão temporária** para **feiras e eventos internacionais** com posterior **devolução/exportação**.

---

## 🔐 Acesso e Autenticação

O sistema conta com tela de login protegida e autenticação com hash criptográfico **SHA-256** (Web Crypto API):

### Credenciais Padrão (Ambiente Local):
- **Usuário:** `admin` (ou `operacional`, `comex`)
- **Senha:** `nft@2026`

### Como alterar as credenciais:
- **Localmente:** Crie um arquivo `.env` na raiz do projeto (baseado em `.env.example`):
  ```env
  VITE_AUTH_USER=seu_usuario
  VITE_AUTH_PASSWORD=sua_senha_secreta
  ```
- **Na Vercel:** Acesse seu projeto em **Settings > Environment Variables** e adicione `VITE_AUTH_USER` e `VITE_AUTH_PASSWORD`.

---

## 🚀 Como Iniciar o Sistema

### 1. Modo Interface Web Interativa (Recomendado)
Dê um duplo clique no arquivo **`iniciar_sistema.bat`** ou execute no terminal:
```bash
npm.cmd run dev
```
O sistema abrirá automaticamente no seu navegador em `http://localhost:3000`.

### 2. Modo Linha de Comando / Script Python Direto
Dê um duplo clique em **`gerar_via_python.bat`** ou execute no terminal:
```bash
# Para Importação (Entrega na Feira):
python gerar_etiquetas_pdf.py --planilha modelo_importacao_exemplo.xlsx --operacao importacao

# Para Exportação (Devolução de Admissão Temporária):
python gerar_etiquetas_pdf.py --planilha modelo_exportacao_exemplo.xlsx --operacao exportacao
```

---

## 📦 Especificações de Impressão e Layout

- **Formato da Folha:** Padrão A4 Retrato (`210 mm x 297 mm`).
- **Quantidade por Folha:** **2 etiquetas tamanho A5** por folha (`210 mm x 148,5 mm` cada).
- **Linha de Corte:** Linha guia tracejada no meio da folha A4 com marcação `✂ LINHA DE CORTE (TAMANHO A5) / CUT HERE`.
- **Contagem Sequencial Automática:**
  - Se o expositor possui **40 volumes**, o sistema gera 40 etiquetas sequenciais:
    - `VOL. 1 OF 40` (Folha 1 - Superior)
    - `VOL. 2 OF 40` (Folha 1 - Inferior)
    - `VOL. 3 OF 40` (Folha 2 - Superior)
    - ...
    - `VOL. 40 OF 40` (Folha 20 - Inferior)
- **Rastreabilidade e Segurança Aduaneira:**
  - QR Code dinâmico com payload logístico contendo processo, volume e expositor.
  - Símbolos internacionais de manuseio: Carga Frágil, Proteger de Umidade, Este Lado Para Cima.
  - Indicação oficial de Regime Aduaneiro Especial de Admissão Temporária.

---

## 📋 Estrutura das Planilhas Excel (.xlsx)

O sistema conta com mapeamento inteligente de colunas (não diferencia maiúsculas/minúsculas nem acentos).

### Modo 1: Importação (Entrega na Feira)
| Nome da Coluna no Excel | Descrição | Exemplo |
| :--- | :--- | :--- |
| **Nome do Expositor** | Razão social ou marca do expositor | Siemens Energy AG |
| **Quantidade de Volumes** | Total de caixas do cliente | 40 |
| **Referência Interna** | Número do processo ou ref. NFT | NFT-2026-IMP-0104 |
| **Tipo de Carga** *(novo)* | Destaque central: `Temporary`, `Definitive`, `Empty`, `Full`, `Fragile` | Temporary |
| **Nome da Feira** | Nome da feira ou evento internacional | FEIMEC 2026 |
| **Estande / Local** *(opcional)* | Pavilhão e número do estande | Pavilhão 3 - Stand D-120 |
| **Observações** *(opcional)* | Notas sobre manuseio da carga | Mostruário elétrico sensível |

### Modo 2: Exportação (Devolução de Admissão Temporária)
| Nome da Coluna no Excel | Descrição | Exemplo |
| :--- | :--- | :--- |
| **Nome do Expositor** | Remetente da carga no Brasil | Siemens Energy AG |
| **Consignatário da Carga** | Destinatário da carga no exterior | Siemens Energy Headquarters GmbH |
| **Quantidade de Volumes** | Total de caixas a devolver | 40 |
| **Referência Interna** | Processo NFT / D.I. de Admissão | NFT-2026-EXP-0104 |
| **Tipo de Carga** *(novo)* | Destaque central: `Temporary`, `Definitive`, `Empty`, `Full`, `Fragile` | Temporary |
| **País de Destino** *(opcional)* | País ou local de destino no exterior | Alemanha |
| **Observações** *(opcional)* | Instruções de devolução | Retorno após término da FEIMEC |

*Obs: Você pode baixar planilhas modelo prontas em Excel (.xlsx) com 1 clique direto na tela inicial do sistema.*

---

## 🎨 Identidade Visual e Branding

Utiliza a identidade oficial da **NFT Logistics**:
- **Laranja NFT:** `#EA5B27` (Vibrante, contraste industrial para armazém e pavilhão)
- **Preto / Grafite:** `#12161F` / `#0F172A`
- **Fundo / Destaques:** `#F8FAFC` e `#FFF7ED`
- Logotipo oficial vetorizado e incorporado em alta definição nos arquivos PDF.
