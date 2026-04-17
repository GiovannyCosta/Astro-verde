# Integração com Hardware Real (ESP32/Arduino)

## Como o Sistema Está Preparado

O frontend e o backend foram projetados para que a troca de mock por hardware real seja simples e não quebre nada.

---

## Passo a Passo para Integrar o ESP32

### 1. Desative o simulador no backend

Em `server/src/server.js`, comente a linha:
```js
// simulator.start();  // desativa o mock
```

### 2. Configure o ESP32 para enviar telemetria

O ESP32 deve fazer `POST http://<ip-do-servidor>:3001/api/telemetry` a cada 5–30 segundos com o payload:

```json
{
  "device_id": "astroverde-node-01",
  "ph": 6.18,
  "ec": 1.74,
  "tds": 870,
  "temperature": 23.5,
  "humidity": 65,
  "luminosity": 820,
  "water_temp": 24.1,
  "reservoir_level_pct": 82,
  "nft_flow": true,
  "is_retransmit": false,
  "firmware_version": "1.2.0"
}
```

### 3. O frontend não muda

O frontend lê o estado via `GET /api/sensors/latest`.
Com o simulador desativado, o endpoint passa a retornar o dado mais recente persistido pelo ESP32.

---

## Migração para MQTT (futuro)

MQTT é mais eficiente para IoT que HTTP/REST porque:
- menor overhead de rede
- modelo publish/subscribe (o ESP32 publica, o servidor assina)
- suporte a conexões intermitentes (QoS 1 e 2)

**Arquitetura futura com MQTT:**

```
ESP32 → publica em "astroverde/telemetry" → Broker MQTT
                                                  ↓
                                  servidor Node.js (subscriber)
                                                  ↓
                                          banco SQLite/Postgres
                                                  ↓
                                        frontend via REST/WebSocket
```

Para implementar, instale o pacote `mqtt` no servidor:
```bash
npm install mqtt
```

E substitua o `sensorSimulator.js` por um subscriber MQTT.

---

## Controle de Atuadores via Hardware

O ESP32 pode receber comandos via:

**REST (pull):** o ESP32 consulta periodicamente
```
GET http://<servidor>:3001/api/actuators
```

**MQTT (push):** o servidor publica no tópico
```
astroverde/actuators/lighting  →  { "command": "off", "power": 0 }
astroverde/actuators/temperature → { "mode": "cooling" }
```
