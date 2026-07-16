# ♻️ Itapeva Recicla (EcoRecycle) - Gestão de Cooperativas

O **Itapeva Recicla** é um sistema completo (Fullstack) desenvolvido para a gestão operacional e financeira de cooperativas de reciclagem. O projeto atende e gerencia duas cooperativas principais: **Santa Maria** e **Coopersel**.

Ele centraliza desde o registro operacional no chão de fábrica (recepção de caminhões, triagem de bags, prensagem de fardos e vendas/compras do bazar) até a consolidação desses dados em painéis administrativos avançados (dashboards) com recursos de filtragem e exportação para contabilidade (Excel/PDF).

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido de forma limpa entre frontend e backend:

```
Cooperativas/
├── Backend/                 # API baseada em Flask e Supabase
│   ├── app.py               # Servidor Python Flask (Rotas e Regras de Negócio)
│   ├── openapi.yaml         # Especificação de documentação Swagger/OpenAPI
│   ├── requirements.txt     # Dependências Python
│   └── vercel.json          # Configurações de Deploy Vercel
│
└── Frontend/                # Interface do Usuário (Vanilla HTML, Tailwind & JS)
    ├── index.html           # Página de Login Centralizada
    ├── script.js            # Validador de Acesso e Roteador de Sessão
    ├── dashboard_adm.html   # Painel Consolidado Global (Administração Geral)
    │
    ├── Santa Maria/         # Área exclusiva da Cooperativa Santa Maria
    │   ├── recepcao.html    # Entrada de materiais
    │   ├── triagem.html     # Controle de bags por mesa e rejeitos
    │   ├── prensa.html      # Registro de fardos prensados
    │   ├── bazar.html       # Entradas e Saídas do Bazar
    │   └── dashboard.html   # Painel financeiro/operacional local (Tesouraria)
    │
    ├── Coopersel/           # Área exclusiva da Cooperativa Coopersel
    │   ├── recepcao.html
    │   ├── triagem.html
    │   ├── prensa.html
    │   ├── bazar.html
    │   └── dashboard.html
    │
    └── js/                  # Módulos JS de Chão de Fábrica e Dashboards
        ├── recepcao.js
        ├── triagem.js
        ├── prensa.js
        ├── bazar.js
        ├── dashboard.js
        └── dashboard_adm.js
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **Python 3.10+** com **Flask** (Framework web leve e ágil)
* **Supabase Client** (Integração direta com Banco de Dados PostgreSQL remoto)
* **Flask-CORS** (Habilitação de chamadas assíncronas cross-origin)
* **Flasgger / Swagger UI** (Documentação automática e interativa das APIs)
* **Vercel Serverless Functions** (Hospedagem em nuvem auto-escalável)

### Frontend
* **HTML5 semântico** & **TailwindCSS (v4 via CDN)** para estilização premium e responsiva.
* **JavaScript Moderno (ES6+)** para controle assíncrono de sessão (`sessionStorage`) e requisições HTTP (`Fetch API`).
* **SheetJS (xlsx.full.min.js)** para conversão direta das tabelas HTML em planilhas Excel (.xlsx) profissionais.
* **jsPDF & jsPDF-AutoTable** para relatórios formatados de auditoria em formato paisagem PDF.

---

## 🔑 Níveis de Acesso e Perfis do Sistema

Todos os colaboradores acessam a plataforma através de uma única tela de entrada (`index.html`). O sistema realiza a leitura de credenciais e redireciona automaticamente:

1. **Administração Geral (ADM)** (ex: usuário `flavia`):
   * Acesso completo a todas as tabelas de ambas as cooperativas (Santa Maria e Coopersel) em um único painel unificado.
   * Filtros por cooperativa e exportação unificada de relatórios.
2. **Tesouraria Local (Tesoureiras)** (ex: usuários `vitoria` e `regina`):
   * Acesso exclusivo aos painéis locais de suas respectivas cooperativas.
   * Visualização detalhada das tabelas operacionais e balanço líquido do bazar.
3. **Operadores Operacionais**:
   * **Recepção**: Registro de placa, procedência, peso total e material que entra.
   * **Triagem**: Classificação por mesa de triagem, bags produzidas e rejeitos de peso.
   * **Prensa**: Produção final em fardos prensados com peso líquido consolidado.
   * **Bazar**: Controle interno de despesas e vendas de produtos seminovos.

---

## 🚀 Como Iniciar o Projeto Localmente

### 1. Backend
Navegue até a pasta `Backend/`, configure suas variáveis de ambiente no arquivo `.env` (contendo as chaves `url` e `key` do Supabase) e instale os pacotes:

```bash
cd Backend
pip install -r requirements.txt
python app.py
```
A API iniciará localmente por padrão em `http://127.0.0.1:5000/`. A documentação das rotas estará visível no Swagger em `http://127.0.0.1:5000/apidocs/`.

### 2. Frontend
Não necessita de compilação ou servidores complexos (Vanilla JS). Basta rodar um servidor estático simples na pasta raiz para testar os redirecionamentos locais ou abrir diretamente o `index.html` via **Live Server** no seu editor de código.

---

## 🔐 Configurações Adicionais e Banco de Dados

* O banco de dados PostgreSQL roda hospedado no Supabase.
* As senhas e dados de conexões de teste estão descritos no arquivo local `Frontend/senhas.txt`.
