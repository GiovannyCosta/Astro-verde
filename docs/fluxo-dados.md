# Fluxo de Dados — Astro Verde

## Modo Mock (padrão — sem backend)

```
DOMContentLoaded
      ↓
  Charts.init()          → inicializa gráfico Chart.js
  MockSimulator.start()  → inicia setInterval(3000ms)
      ↓
[a cada 3 segundos]
      ↓
  MockSimulator._tick()
      ├── _updatePh()           → AppState.sensors.ph += ±0.1
      ├── _updateEc()           → AppState.sensors.ec += ±0.05
      ├── _updateTemperature()  → AppState.sensors.temperature += ±0.3
      ├── _updateHumidity()     → AppState.sensors.humidity += ±1.5
      ├── _updateLuminosity()   → AppState.sensors.luminosity (baseado no comando)
      ├── _updateWaterLevel()   → AppState.sensors.waterLevel -= 0.1 (lento)
      └── _updateLightingState()→ AppState.actuators.lightingState (derivado)
      ↓
  BusinessRules.evaluate()
      ├── _checkPh()       → Alerts.raise('ph_out_of_range') ou resolve
      ├── _checkEc()       → Alerts.raise('ec_sensor_failure') ou resolve
      ├── _checkNftFlow()  → Alerts.raise('nft_flow_failure') ou resolve
      ├── _checkLighting() → Alerts.raise('light_burned') ou resolve
      └── _checkTemperature()
              ├── temp > 30 → desliga luz, ativa resfriamento, alerta critical
              ├── temp > 26 → reduz potência luz para 60%, alerta warning
              ├── temp < 18 → ativa aquecimento, alerta warning
              └── ideal    → normaliza atuadores, resolve alertas
      ↓
  Dashboard.refresh()
      ├── _updatePh()           → atualiza #phValue, #phStatus, .card#cardPh
      ├── _updateEc()           → atualiza #ecValue, #tdsValue
      ├── _updateTemperature()  → atualiza #tempValue, #tempStatus
      ├── _updateNft()          → atualiza #nftStatusVal, #nftStatusSub
      ├── _updateLighting()     → atualiza #lightingState, #lightingSub
      ├── _updateWaterLevel()   → atualiza #waterLevel
      ├── _updateActuatorIndicators() → atualiza #coolingStatus, #heatingStatus
      ├── Alerts.render()       → atualiza #alertsBanner
      └── Charts.addDataPoint() → adiciona ponto no gráfico
```

## Modo API (backend rodando)

```
ApiService.syncState()  (a cada 3 segundos)
      ↓
  GET /api/sensors/latest
      ↓
  Object.assign(AppState.sensors, data.sensors)
  Object.assign(AppState.actuators, data.actuators)
      ↓
  Dashboard.refresh()   (mesmo fluxo acima)
```
