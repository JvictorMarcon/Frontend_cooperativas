# ♻️ Itapeva Recicla — Gestão de Cooperativas

O **Itapeva Recicla** é um sistema Fullstack desenvolvido para a gestão operacional e financeira de cooperativas de reciclagem. O projeto atende e gerencia duas cooperativas: **Santa Maria** e **Coopersel (Itapeva)**.

Centraliza desde o registro do chão de fábrica (recepção de materiais, triagem, prensagem e bazar) até painéis administrativos com filtros, exportações (Excel/PDF) e Demonstrativo de Resultado do Exercício (DRE).

---

## 🏗️ Arquitetura do Projeto

```
Cooperativas/
├── Backend/                        # API Flask principal (operacional)
│   ├── app.py                      # Rotas e regras de negócio
│   ├── openapi.yaml                # Documentação Swagger/OpenAPI
│   ├── requirements.txt            # Dependências Python
│   └── vercel.json                 # Deploy Vercel
│
├── Sistema DRE/
│   └── Backend/                    # API Flask do DRE (financeiro)
│       ├── app.py
│       ├── openapi.yaml
│       ├── requirements.txt
│       └── vercel.json
│
└── Frontend/                       # Interface (Vanilla HTML + Tailwind + JS)
    ├── index.html                  # Tela de Login centralizada
    ├── script.js                   # Validação de acesso e roteamento de sessão
    ├── dashboard_adm.html          # Painel consolidado (ADM geral - Flávia)
    ├── dre.html                    # DRE — Demonstrativo de Resultado do Exercício
    ├── cadastrar_cooperado.html    # Cadastro de cooperados
    ├── senhas.txt                  # Credenciais dos usuários do sistema
    │
    ├── Santa Maria/                # Área exclusiva da Cooperativa Santa Maria
    │   ├── recepcao.html           # Entrada de materiais (coleta / mercado)
    │   ├── triagem.html            # Controle de bags e rejeitos
    │   ├── prensa.html             # Registro de fardos prensados
    │   ├── bazar.html              # Entradas e saídas do Bazar
    │   └── dashboard.html          # Painel da Vitória (tesouraria local)
    │
    ├── Coopersel/                  # Área exclusiva da Cooperativa Coopersel
    │   ├── recepcao.html           # Entrada de materiais (coleta / doação PEV)
    │   │                           #  → Cidade: Itapeva ou Nova Campina
    │   │                           #  → Nova Campina registra peso de rejeito
    │   ├── catadores.html          # Recepção de materiais de catadores autônomos
    │   │                           #  → Calcula e exibe valor a pagar ao catador
    │   ├── triagem.html
    │   ├── prensa.html
    │   ├── bazar.html
    │   └── dashboard.html          # Painel da Regina (tesouraria local)
    │                               #  → Filtros por cidade e tipo/procedência
    │                               #  → Exibe coluna "A Pagar (Catador)" p/ Itapeva
    │                               #  → Exibe coluna "Rejeito" p/ Nova Campina
    │
    └── js/                         # Módulos JS compartilhados
        ├── recepcao.js             # Submissão do formulário de recepção
        ├── triagem.js
        ├── prensa.js
        ├── bazar.js
        ├── dre.js                  # DRE com cálculo de partilha cooperados (20%)
        ├── dashboard.js            # Renderização e filtros dos painéis locais
        └── dashboard_adm.js        # Renderização do painel ADM global
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.10+** com **Flask**
- **Supabase** (PostgreSQL remoto via client Python)
- **Flask-CORS** (chamadas cross-origin do frontend)
- **Flasgger / Swagger UI** (documentação interativa das rotas)
- **Vercel** (deploy serverless)

### Frontend
- **HTML5** + **TailwindCSS v4 (via CDN)**
- **JavaScript ES6+** com `sessionStorage` para controle de sessão e `Fetch API` para chamadas assíncronas
- **SheetJS** (`xlsx.full.min.js`) — exportação de tabelas para Excel `.xlsx`
- **jsPDF + AutoTable** — exportação de relatórios em PDF formato paisagem

---

## 🔑 Perfis de Acesso

Todos os usuários entram pela mesma tela (`index.html`). O sistema lê o cargo e a cooperativa e redireciona automaticamente.

| Cargo | Usuário(s) | Destino |
|---|---|---|
| **ADM Global** | `flavia` | `dashboard_adm.html` (ambas cooperativas) |
| **ADM Santa Maria** | `vitoria` | `Santa Maria/dashboard.html` |
| **ADM Coopersel** | `regina` | `Coopersel/dashboard.html` |
| **Recepção SM** | `recepcao_sm` | `Santa Maria/recepcao.html` |
| **Triagem SM** | `triagem_sm` | `Santa Maria/triagem.html` |
| **Prensa SM** | `prensa_sm` | `Santa Maria/prensa.html` |
| **Recepção Coopersel** | `recepcao_cp` | `Coopersel/recepcao.html` |
| **Triagem Coopersel** | `triagem_cp` | `Coopersel/triagem.html` |
| **Prensa Coopersel** | `prensa_cp` | `Coopersel/prensa.html` |
| **Catadores Coopersel** | `catadores_cp` | `Coopersel/catadores.html` |

---

## 📦 Materiais Aceitos

Os 27 tipos de materiais registrados no sistema:

`Alumínio` · `Arquivo` · `Bloco` · `Caixaria` · `Cobre c/ Capa` · `Cobre Mel` · `Cristal` · `Latinha` · `Metal` · `Motor de Geladeira` · `Motorzinho` · `Óleo` · `Panela` · `Parachoque` · `PEAD` · `PEAD Colorido` · `PP` · `PP Branco` · `PP Preto` · `PVC` · `Sacolinha` · `Sucata` · `Terceira` · `Papelão` · `Plástico Misto` · `PET` · `PET Óleo`

---

## 🚀 Rodando Localmente

### Backend Principal (Operacional)
```bash
cd Backend
pip install -r requirements.txt
python app.py
# API em http://127.0.0.1:5000/
# Swagger em http://127.0.0.1:5000/apidocs/
```

### Backend do DRE (Financeiro)
```bash
cd "Sistema DRE/Backend"
pip install -r requirements.txt
python app.py
```

### Frontend
Sem compilação necessária. Abra o `index.html` com **Live Server** no VS Code ou qualquer servidor estático.

---

## 🗄️ Banco de Dados (Supabase)

Para adicionar as colunas necessárias às novas funcionalidades, rode no editor SQL do Supabase:

```sql
-- Novas colunas na tabela recebimento
ALTER TABLE recebimento
  ADD COLUMN IF NOT EXISTS nome_mercado   TEXT,
  ADD COLUMN IF NOT EXISTS cidade         TEXT,
  ADD COLUMN IF NOT EXISTS peso_rejeito   FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nome_catador   TEXT,
  ADD COLUMN IF NOT EXISTS preco_kg       FLOAT,
  ADD COLUMN IF NOT EXISTS valor_pago     FLOAT;

-- Usuário catadores Coopersel
INSERT INTO usuarios (nome, "user", senha, cargo, cooperativa)
VALUES ('Catadores Coopersel', 'catadores_cp', 'catadores_cp', 'catadores', 2);
```

---

## 🔐 Configuração do Ambiente

Crie um arquivo `.env` dentro de `Backend/` e `Sistema DRE/Backend/` com as credenciais do Supabase:

```env
url=https://SEU_PROJETO.supabase.co
key=SUA_CHAVE_ANON_PUBLICA
```
