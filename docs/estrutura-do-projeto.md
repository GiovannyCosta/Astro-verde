# Estrutura do Projeto — Astro Verde

## O que cada arquivo faz

### Frontend — HTML

| Arquivo | Propósito |
|---------|-----------|
| `index.html` | Estrutura da página: sidebar, topbar, 4 views (dashboard/estoque/safras/log), modal |

### Frontend — CSS

| Arquivo | Conteúdo |
|---------|----------|
| `variables.css` | Tokens: cores, fontes, tamanhos — mude aqui para reestilizar o sistema inteiro |
| `base.css` | Reset CSS, animações globais (fadeIn, pulsing) |
| `layout.css` | Sidebar, topbar, content-area — estrutura da página |
| `components.css` | Cards, botões, badges, modal, listas — blocos reutilizáveis |
| `dashboard.css` | Estilos específicos do dashboard: grid, light-state, alertas, logs |

### Frontend — JavaScript

| Arquivo | Conteúdo |
|---------|----------|
| `state.js` | `AppState` — objeto central com sensores, atuadores, config, alertas, logs |
| `mock-data.js` | `MockSimulator` — gera variações nos sensores e expõe ações manuais |
| `modules/alerts.js` | `BusinessRules` (avalia limites) + `Alerts` (cria/remove/exibe) |
| `modules/logs.js` | `Logger` — registra e exibe log de eventos |
| `modules/dashboard.js` | `Dashboard` — atualiza os KPIs e indicadores na tela |
| `modules/inventory.js` | `Inventory` — renderiza lista de insumos |
| `modules/harvest.js` | `Harvest` — renderiza lista de safras |
| `charts.js` | `Charts` — Chart.js (gráfico temperatura/umidade com scroll de pontos) |
| `router.js` | `Router` — troca de abas (mostra/oculta sections) |
| `services/api.js` | `ApiService` — requisições HTTP para o backend |
| `main.js` | Ponto de entrada: `DOMContentLoaded`, funções globais para botões HTML |

### Backend — Node.js

| Arquivo | Conteúdo |
|---------|----------|
| `server.js` | Cria app, inicia simulador, abre porta HTTP |
| `app.js` | Configura Express, injeta dependências, registra rotas |
| `config/index.js` | Constantes: porta, limites, intervalos |
| `database/schema.sql` | DDL: cria tabelas devices, sensors, readings, actuators, alerts, logs, etc. |
| `database/seed.js` | Inicializa banco, insere dados de exemplo |
| `mocks/sensorSimulator.js` | Gera leituras, aplica regras, persiste no banco |
| `repositories/*.js` | Acesso ao banco (queries SQL isoladas) |
| `services/*.js` | Lógica de negócio (validações, composições) |
| `controllers/*.js` | Recebe req HTTP, chama service, responde JSON |
| `routes/*.js` | Define URLs e associa ao controller |
