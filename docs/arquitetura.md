# Arquitetura do Sistema Astro Verde

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│  HARDWARE (futuro)                                               │
│                                                                  │
│  [Sensores pH/EC/Temp/Lux] → [Arduino] → [ESP32] ──────────┐   │
└──────────────────────────────────────────────────────────────┼───┘
                                                               │
                                              POST /api/telemetry
                                                               │
┌──────────────────────────────────────────────────────────────▼───┐
│  BACKEND (Node.js + Express)                                      │
│                                                                   │
│  server.js → app.js                                               │
│      ↓                                                            │
│  Routes → Controllers → Services → Repositories → SQLite         │
│                                                                   │
│  sensorSimulator.js  (mock — substitui o hardware hoje)          │
└──────────────────────────────────────────────────────────────┬───┘
                                                               │
                                              GET /api/sensors/latest
                                                               │
┌──────────────────────────────────────────────────────────────▼───┐
│  FRONTEND (HTML + CSS + JS modular)                               │
│                                                                   │
│  main.js → MockSimulator (modo mock)                             │
│         → ApiService    (modo api)                               │
│                ↓                                                  │
│         AppState (estado global)                                  │
│                ↓                                                  │
│  BusinessRules → Alerts → Dashboard → Charts                     │
└───────────────────────────────────────────────────────────────────┘
```

## Camadas do Backend

| Camada | Responsabilidade | Exemplo |
|--------|-----------------|---------|
| Routes | Define URLs e verbos HTTP | `GET /api/sensors/latest` |
| Controllers | Recebe req, responde res | `sensorsController.getLatest()` |
| Services | Regras de negócio | `sensorsService.getLatestReading()` |
| Repositories | Acesso ao banco | `sensorsRepo.getLatest()` |
| Database | SQLite (schema + seed) | `schema.sql`, `seed.js` |
| Mocks | Simulação sem hardware | `sensorSimulator.js` |

## Módulos do Frontend

| Módulo | Responsabilidade |
|--------|-----------------|
| `state.js` | Estado global — fonte de verdade dos dados |
| `mock-data.js` | Gera leituras simuladas e atualiza AppState |
| `alerts.js` | BusinessRules + Alerts — verifica limites e cria alertas |
| `dashboard.js` | Lê AppState e atualiza o DOM do dashboard |
| `charts.js` | Inicializa e atualiza gráficos Chart.js |
| `router.js` | Troca de abas (dashboard/estoque/safras/log) |
| `logs.js` | Logger + renderiza log de eventos |
| `api.js` | Cliente HTTP — usado no modo API (backend rodando) |
| `main.js` | Cola tudo: inicializa, expõe funções globais para o HTML |
