# Astro Verde — Sistema de Monitoramento de Fazenda Vertical Hidropônica

Sistema de monitoramento e controle para cultivo hidropônico NFT (Nutrient Film Technique), com dashboard em tempo real, simulação de sensores IoT e preparação para integração com hardware físico (ESP32/Arduino).

---

## Como Executar

### Opção 1 — Somente o Frontend (mais simples)

Abra o arquivo `index.html` com a extensão **Live Server** no VS Code, ou use qualquer servidor HTTP local:

```bash
# Com Python (se instalado)
python -m http.server 5500

# Com Node.js (se instalado)
npx serve .
```

Acesse: `http://localhost:5500`

O sistema inicia automaticamente no **modo mock** — dados simulados sem precisar de backend.

---

### Opção 2 — Frontend + Backend Node.js (completo)

**Pré-requisitos:**
- Node.js 18+ instalado (`node --version`)

**Passos:**

```bash
# 1. Entre na pasta do servidor
cd server

# 2. Instale as dependências (só na primeira vez)
npm install

# 3. Inicie o servidor
npm start
```

Acesse: `http://localhost:3001`

O servidor:
- serve o frontend automaticamente
- inicia o simulador de sensores
- cria o banco SQLite automaticamente
- expõe a API REST em `/api`

---

## Estrutura do Projeto

```
INOVATECH Astro Verde/
├── index.html                   # HTML principal (refatorado)
├── ASTRO.png                    # Logo do projeto
│
├── assets/
│   ├── css/
│   │   ├── variables.css        # Tokens de design (cores, fontes, tamanhos)
│   │   ├── base.css             # Reset e animações globais
│   │   ├── layout.css           # Sidebar, topbar, content-area
│   │   ├── components.css       # Cards, buttons, badges, modal
│   │   └── dashboard.css        # Estilos específicos do dashboard
│   │
│   └── js/
│       ├── state.js             # Estado global da aplicação (AppState)
│       ├── charts.js            # Gráficos Chart.js
│       ├── router.js            # Navegação entre abas
│       ├── mock-data.js         # Simulador de sensores IoT
│       ├── main.js              # Inicialização e funções globais
│       ├── services/
│       │   └── api.js           # Cliente HTTP para o backend
│       └── modules/
│           ├── dashboard.js     # Atualização do dashboard
│           ├── alerts.js        # Motor de regras + gerenciamento de alertas
│           ├── logs.js          # Log de eventos
│           ├── inventory.js     # Gestão de insumos
│           └── harvest.js       # Planejamento de safras
│
├── server/
│   ├── package.json
│   └── src/
│       ├── server.js            # Ponto de entrada — abre a porta
│       ├── app.js               # Configura Express + injeta dependências
│       ├── config/index.js      # Configurações centralizadas
│       ├── routes/              # Definição dos endpoints HTTP
│       ├── controllers/         # Recebe req, chama service, responde
│       ├── services/            # Regras de negócio
│       ├── repositories/        # Acesso ao banco de dados
│       ├── database/
│       │   ├── schema.sql       # Estrutura do banco de dados
│       │   └── seed.js          # Inicialização e dados de exemplo
│       └── mocks/
│           └── sensorSimulator.js # Simulador de sensores no backend
│
└── docs/
    ├── arquitetura.md
    ├── fluxo-dados.md
    ├── regras-negocio.md
    ├── integracao-hardware-futura.md
    └── estrutura-do-projeto.md
```

---

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api` | Lista todos os endpoints |
| GET | `/api/sensors/latest` | Estado atual dos sensores |
| GET | `/api/sensors/export/csv` | Exporta histórico CSV |
| POST | `/api/telemetry` | **Integração ESP32** — recebe dados do hardware |
| GET | `/api/alerts` | Alertas ativos |
| GET | `/api/alerts/history` | Histórico de alertas |
| POST | `/api/alerts/:type/resolve` | Fecha um alerta |
| GET | `/api/actuators` | Estado dos atuadores |
| POST | `/api/actuators/lighting` | Controla iluminação |
| POST | `/api/actuators/temperature` | Controla temperatura |
| GET | `/api/logs` | Log de eventos |

---

## Regras de Negócio Implementadas

| Sensor | Faixa Ideal | Ação |
|--------|-------------|------|
| pH | 5.5 – 6.5 | Alerta e permite correção via bomba dosadora |
| EC | 1.2 – 2.5 mS/cm | Alerta; EC=0 persistente → falha de sensor |
| Temperatura | 18 – 26°C | >26°C: reduz luz; >30°C: desliga luz (proteção); <18°C: aquecimento |
| Iluminação | — | Acesa / Apagada / Queimada (comando vs. sensor de lux) |
| Fluxo NFT | Circulando | Falha → alerta crítico |

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript (modular, sem framework) |
| Gráficos | Chart.js |
| Ícones | Phosphor Icons |
| Backend | Node.js + Express |
| Banco (dev) | SQLite via better-sqlite3 |
| Banco (prod) | PostgreSQL (migração futura) |
| IoT futuro | ESP32 + MQTT ou REST |
