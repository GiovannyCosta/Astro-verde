# Automação da Bomba e Notificações WhatsApp — Astro Verde
**Camada:** IoT / Edge Computing  
**Autor:** Arquitetura de Soluções — INOVATECH  
**Data:** 2026-04-17  
**Destinatário:** Equipe de Resultados e Discussões

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HARDWARE EDGE (ESP32)                                                   │
│                                                                          │
│  [Sensor pH]  ──┐                                                        │
│  [Sensor EC]  ──┤→ [Arduino Nano] → UART → [ESP32]                      │
│  [Sensor Temp]──┤                            │                           │
│  [Sensor Fluxo]─┘                            │ GPIO → [Relé Bomba]      │
│                                              │                           │
│                                    ┌─────────┘                          │
│                                    │ RTC DS3231 (I²C)                   │
└────────────────────────────────────┼───────────────────────────────────-┘
                                     │
                          Wi-Fi / HTTPS (POST)
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│  BACKEND Node.js — Astro Verde                                           │
│                                                                          │
│  POST /api/telemetry  →  sensorsController  →  sensorsService           │
│  POST /api/bomba/evento  →  bombaController  →  notificacaoService      │
│                                          │                               │
│                              HTTP Webhook (Twilio / Evolution API)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                          HTTPS → WhatsApp Business API
                                     │
                          ┌──────────▼──────────┐
                          │  Celular do Operador │
                          │  (WhatsApp)          │
                          └─────────────────────-┘
```

---

## 2. Automação do Ciclo da Bomba

### 2.1 Lógica de Temporização com RTC DS3231 + NTP

O ESP32 usa **dupla fonte de tempo** para garantir confiabilidade:

| Fonte | Uso | Fallback |
|-------|-----|----------|
| NTP Server (`pool.ntp.org`) | Sincronização ao conectar Wi-Fi | Nunca usar sozinho |
| RTC DS3231 (hardware, bateria CR2032) | Fonte primária local | Mantém tempo sem energia e sem Wi-Fi |

**Fluxo de inicialização do tempo:**

```
ESP32 Liga
    │
    ├─→ Lê hora do RTC DS3231 (I²C)
    │       │
    │       ├─→ RTC válido? ──SIM──→ Usa hora do RTC
    │       │                              │
    │       └─→ NÃO ──────────────→ Aguarda Wi-Fi → Sincroniza NTP → Grava no RTC
    │
    └─→ Conecta Wi-Fi (não bloqueante)
            │
            └─→ Conectou? ──SIM──→ Sincroniza NTP → Atualiza RTC (drift correction)
```

### 2.2 Ciclo Padrão: 16h Ligada / 8h Desligada

```
Hora de início configurável (padrão: 06:00)
│
├── 06:00 → Liga bomba   (duração: 16h)
│
└── 22:00 → Desliga bomba (duração: 8h)
     │
     └── 06:00 → Repete
```

> **Configuração via POST /api/config** — os horários podem ser ajustados remotamente pelo painel web sem reflashing do firmware.

### 2.3 Persistência de Estado Após Queda de Energia

O ESP32 armazena o estado do ciclo na **EEPROM interna** + confirma com o RTC:

```
Queda de energia ocorre
    │
ESP32 reinicia
    │
    ├─→ Lê RTC → hora atual = 14:30
    ├─→ Lê EEPROM → ciclo iniciou às 06:00 (estado = LIGADA)
    │
    ├─→ Calcula: 14:30 - 06:00 = 8h30min dentro do ciclo LIGADA (max 16h)
    │
    ├─→ Conclusão: bomba DEVE estar ligada → Liga bomba
    │
    └─→ Envia WhatsApp: "⚡ Queda de energia detectada. Bomba religada às 14:30.
                         Ciclo retomado normalmente."
```

**Proteção contra transbordamento:**

```
Se (hora_atual - hora_inicio_ciclo) > 16h E bomba LIGADA:
    → Desliga bomba imediatamente
    → Envia alerta: "⚠️ Ciclo excedido. Bomba desligada por segurança."
    → Grava novo início de ciclo DESLIGADA
```

---

## 3. Integração WhatsApp — Fluxo de Notificações

### 3.1 Opções de API Recomendadas

| API | Custo | Confiabilidade | Complexidade | Recomendação |
|-----|-------|---------------|-------------|-------------|
| **Twilio WhatsApp** | Pago (US$ 0,005/msg) | Alta (SLA 99,9%) | Baixa | Produção |
| **Evolution API** (self-hosted) | Gratuito | Média | Média | Desenvolvimento |
| **Z-API** | Freemium | Alta | Baixa | MVP rápido |
| **WhatsApp Business Cloud API** | Gratuito até 1k msg/mês | Muito Alta | Alta | Escala |

**Recomendação para Astro Verde:** Evolution API em desenvolvimento → Twilio em produção.

### 3.2 Gatilhos e Payloads de Mensagem

#### Gatilho 1 — Bomba Ligada
```
Condição: hora_atual == hora_inicio_ciclo_LIGADA
Mensagem:
  "🟢 [Astro Verde] Bomba LIGADA
   Horário: 06:00 | 17/04/2026
   Próximo desligamento: 22:00
   Ciclo: 16h ON / 8h OFF"
```

#### Gatilho 2 — Bomba Desligada
```
Condição: hora_atual == hora_inicio_ciclo_DESLIGADA
Mensagem:
  "🔴 [Astro Verde] Bomba DESLIGADA
   Horário: 22:00 | 17/04/2026
   Próximo acionamento: 06:00 (amanhã)
   Tempo total operado hoje: 16h"
```

#### Gatilho 3 — Sensor com Problema
```
Condição:
  pH < 4.5 OR pH > 8.0         → fora da faixa lógica hidropônica
  EC < 0.1 OR EC > 5.0 mS/cm  → fora da faixa lógica
  Ausência de leitura > 60s    → sensor sem sinal

Mensagem:
  "⚠️ [Astro Verde] ALERTA DE SENSOR
   Sensor: pH
   Leitura: 3.2 (fora da faixa: 5.5–7.0)
   Timestamp: 14:35 | 17/04/2026
   Ação: Verificar solução nutritiva imediatamente."
```

#### Gatilho 4 — Falha na Bomba
```
Condição:
  Estado esperado = LIGADA
  AND sensor_fluxo < limiar_minimo (< 0.5 L/min)
  AND corrente_bomba < 0.1A (INA219)
  AND tempo_sem_fluxo > 30s

Mensagem:
  "🚨 [Astro Verde] FALHA CRÍTICA NA BOMBA
   Bomba deveria estar LIGADA desde 06:00
   Sensor de fluxo: 0.0 L/min (esperado: >2 L/min)
   Corrente: 0.0A (esperado: >0.5A)
   Ação imediata necessária. Sistema em modo seguro."
```

#### Gatilho 5 — Queda de Wi-Fi (mensagem enfileirada)
```
Mensagem (enviada ao reconectar):
  "📶 [Astro Verde] Conectividade restaurada
   Wi-Fi offline por: 2h15min
   Eventos ocorridos offline: [lista]
   Todos os dados foram preservados localmente."
```

### 3.3 Diagrama de Fluxo — Envio de Notificação

```
ESP32 detecta evento (gatilho)
    │
    ├─→ Formata payload JSON
    │       {
    │         "tipo": "BOMBA_LIGADA",
    │         "timestamp": "2026-04-17T06:00:00",
    │         "dados": { ... },
    │         "mensagem": "🟢 Bomba LIGADA..."
    │       }
    │
    ├─→ Wi-Fi disponível?
    │       │
    │       ├─SIM→ POST /api/bomba/evento
    │       │           │
    │       │           └─→ Backend → Twilio API → WhatsApp ✓
    │       │
    │       └─NÃO→ Salva na fila local (SPIFFS/LittleFS, max 50 eventos)
    │                   │
    │                   └─→ Ao reconectar Wi-Fi:
    │                           Drena fila em ordem cronológica
    │                           POST cada evento com flag "offline_queued: true"
    │
    └─→ Backend confirma recebimento (HTTP 200)
            │
            └─→ Remove da fila local
```

---

## 4. Arquitetura Lógica — Firmware ESP32 (C++)

### 4.1 Estrutura de Estados

```cpp
// estados_bomba.h

enum EstadoBomba {
  BOMBA_LIGADA,
  BOMBA_DESLIGADA,
  BOMBA_FALHA,
  BOMBA_MANUTENCAO
};

enum EstadoSensor {
  SENSOR_OK,
  SENSOR_FORA_FAIXA,
  SENSOR_SEM_SINAL,
  SENSOR_ERRO_LEITURA
};

struct CicloBomba {
  uint8_t hora_liga;       // padrão: 6
  uint8_t hora_desliga;    // padrão: 22
  time_t  ultimo_liga;
  time_t  ultimo_desliga;
  EstadoBomba estado_atual;
};

struct LeituraSensor {
  float ph;
  float ec;
  float temperatura;
  float fluxo_lmin;
  float corrente_a;
  time_t timestamp;
  EstadoSensor status;
};
```

### 4.2 Loop Principal — Máquina de Estados

```cpp
// main_loop.cpp

#include <RTClib.h>
#include <EEPROM.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <LittleFS.h>

RTC_DS3231 rtc;
CicloBomba ciclo;
QueueHandle_t filaEventos;  // FreeRTOS queue

void loop() {
  DateTime agora = rtc.now();
  LeituraSensor leitura = lerSensores();

  // ── 1. Verificação do ciclo de tempo ──────────────────────────
  verificarCicloBomba(agora, ciclo);

  // ── 2. Verificação dos sensores ───────────────────────────────
  EstadoSensor estadoSensor = avaliarSensor(leitura);
  if (estadoSensor != SENSOR_OK) {
    enfileirarEvento("SENSOR_ALERTA", leitura);
  }

  // ── 3. Verificação de falha da bomba ─────────────────────────
  if (ciclo.estado_atual == BOMBA_LIGADA) {
    if (leitura.fluxo_lmin < FLUXO_MINIMO && leitura.corrente_a < CORRENTE_MINIMA) {
      if (tempoSemFluxo() > 30) {
        ciclo.estado_atual = BOMBA_FALHA;
        acionarModoSeguro();
        enfileirarEvento("BOMBA_FALHA", leitura);
      }
    }
  }

  // ── 4. Drena fila de eventos ──────────────────────────────────
  if (WiFi.status() == WL_CONNECTED) {
    drenaFilaEventos();
  }

  vTaskDelay(pdMS_TO_TICKS(1000));  // ciclo a cada 1 segundo
}

// ── Controle do ciclo de tempo ────────────────────────────────────
void verificarCicloBomba(DateTime agora, CicloBomba& ciclo) {
  uint8_t hora = agora.hour();
  uint8_t minuto = agora.minute();

  bool deveEstarLigada = (hora >= ciclo.hora_liga && hora < ciclo.hora_desliga);

  if (deveEstarLigada && ciclo.estado_atual == BOMBA_DESLIGADA) {
    ligarBomba();
    ciclo.estado_atual = BOMBA_LIGADA;
    ciclo.ultimo_liga = agora.unixtime();
    salvarEstadoEEPROM(ciclo);
    enfileirarEvento("BOMBA_LIGADA", {});
  }

  if (!deveEstarLigada && ciclo.estado_atual == BOMBA_LIGADA) {
    desligarBomba();
    ciclo.estado_atual = BOMBA_DESLIGADA;
    ciclo.ultimo_desliga = agora.unixtime();
    salvarEstadoEEPROM(ciclo);
    enfileirarEvento("BOMBA_DESLIGADA", {});
  }
}

// ── Envio de evento ao backend ────────────────────────────────────
void enviarEvento(Evento evento) {
  HTTPClient http;
  http.begin(BACKEND_URL "/api/bomba/evento");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  StaticJsonDocument<256> doc;
  doc["tipo"]      = evento.tipo;
  doc["timestamp"] = evento.timestamp;
  doc["offline_queued"] = evento.offline;

  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);

  if (httpCode != 200) {
    // falha → salva em LittleFS para reenvio
    salvarEventoLocal(evento);
  }
  http.end();
}

// ── Avaliação de sensor ───────────────────────────────────────────
EstadoSensor avaliarSensor(LeituraSensor& s) {
  if (s.ph < 4.5 || s.ph > 8.0)   return SENSOR_FORA_FAIXA;
  if (s.ec < 0.1 || s.ec > 5.0)   return SENSOR_FORA_FAIXA;
  if (s.temperatura < 10 || s.temperatura > 40) return SENSOR_FORA_FAIXA;
  if ((millis() - s.timestamp) > 60000) return SENSOR_SEM_SINAL;
  return SENSOR_OK;
}
```

### 4.3 Backend Node.js — Rota de Eventos + Disparo WhatsApp

```javascript
// server/src/controllers/bombaController.js

const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const WHATSAPP_TO  = `whatsapp:${process.env.OPERADOR_NUMERO}`;
const WHATSAPP_FROM = 'whatsapp:+14155238886';  // número Twilio sandbox

const MENSAGENS = {
  BOMBA_LIGADA:    (d) => `🟢 [Astro Verde] Bomba LIGADA\nHorário: ${d.timestamp}\nPróximo desligamento: 22:00`,
  BOMBA_DESLIGADA: (d) => `🔴 [Astro Verde] Bomba DESLIGADA\nHorário: ${d.timestamp}\nPróximo acionamento: 06:00`,
  SENSOR_ALERTA:   (d) => `⚠️ [Astro Verde] ALERTA SENSOR\nSensor: ${d.sensor}\nLeitura: ${d.valor}\nFaixa esperada: ${d.faixa}`,
  BOMBA_FALHA:     (d) => `🚨 [Astro Verde] FALHA CRÍTICA\nBomba sem fluxo detectado!\nFluxo: ${d.fluxo} L/min\nAção imediata necessária.`,
};

exports.registrarEvento = async (req, res) => {
  const { tipo, timestamp, dados, offline_queued } = req.body;

  // Persiste no banco independente de WhatsApp
  await bombaService.salvarEvento({ tipo, timestamp, dados, offline_queued });

  // Dispara WhatsApp (não bloqueia a resposta ao ESP32)
  const mensagem = MENSAGENS[tipo]?.({ ...dados, timestamp });
  if (mensagem) {
    twilioClient.messages
      .create({ body: mensagem, from: WHATSAPP_FROM, to: WHATSAPP_TO })
      .catch(err => logger.error('WhatsApp falhou:', err.message));
  }

  res.json({ ok: true, evento_id: evento.id });
};
```

---

## 5. Resultados e Discussões

### 5.1 Métricas de Sucesso — O que Coletar

| Métrica | Como Coletar | Indicador de Sucesso |
|---------|-------------|---------------------|
| **Desvio do ciclo** | `(hora_real_liga - hora_programada)` em segundos | < 5 segundos |
| **Uptime da bomba** | Contagem de horas no estado LIGADA por semana | ≥ 99% do tempo programado |
| **Taxa de falhas detectadas** | Eventos BOMBA_FALHA / total de ciclos | < 0,5% |
| **Latência de notificação** | `(timestamp_whatsapp) - (timestamp_evento_esp32)` | < 10 segundos |
| **Taxa de entrega offline** | Eventos enfileirados que chegaram após reconexão | 100% (tolerância zero) |
| **Consumo de energia** | Sensor de corrente INA219 na bomba | Linha base + desvio < 5% |
| **Qualidade da água** | pH, EC, Temp dentro da faixa por % do tempo | > 95% do tempo operacional |

### 5.2 Cenários de Erro — Análise de Resiliência

#### Cenário A: Wi-Fi cai no momento do disparo

```
Sequência:
  06:00 → Liga bomba
  06:00 → Tenta POST /api/bomba/evento
  06:00 → Wi-Fi: timeout após 5s
  06:00 → Salva evento em LittleFS: { tipo: "BOMBA_LIGADA", ts: "06:00", offline: true }
  08:45 → Wi-Fi reconecta (roteador voltou)
  08:45 → ESP32 drena fila → POST /api/bomba/evento com offline_queued: true
  08:45 → Backend envia WhatsApp com nota: "⚠️ Mensagem atrasada (offline por 2h45)"

Garantia: nenhum evento é perdido. O operador pode ver no dashboard que houve período offline.
```

#### Cenário B: Backend Node.js fora do ar

```
Sequência:
  Evento ocorre → ESP32 tenta POST → HTTP 503
  ESP32 salva localmente (máx 50 eventos = ~72h de dados a 1 evento/h)
  Backend volta → ESP32 drena tudo ao reconectar

Risco residual: se o ESP32 ficar sem energia E LittleFS for corrompido
Mitigação: RTC DS3231 recalcula o estado correto ao reiniciar (sem depender da fila)
```

#### Cenário C: RTC perde bateria + sem Wi-Fi

```
Risco: ESP32 não sabe a hora → não pode executar o ciclo por horário
Mitigação:
  1. LED de alerta físico no painel
  2. Sistema entra em modo manual com ciclo fixo de 16h a partir do boot
  3. Ao reconectar Wi-Fi → sincroniza NTP → retorna ao ciclo por horário
  4. WhatsApp ao restaurar: "⚠️ RTC sem bateria. Ciclo foi executado em modo temporizado."
```

#### Cenário D: Twilio fora do ar ou saldo zerado

```
Mitigação multicamada:
  1. Backend retenta envio WhatsApp por 3x com backoff exponencial (1s, 5s, 30s)
  2. Se falhar: salva mensagem pendente no banco (tabela notificacoes_pendentes)
  3. Job a cada 5 minutos tenta reenviar pendentes
  4. Fallback: envia e-mail via nodemailer como canal secundário
```

### 5.3 Impacto da Automação vs. Acionamento Manual

| Critério | Manual | Automatizado (ESP32 + RTC) |
|----------|--------|---------------------------|
| **Precisão do ciclo** | ±30–120 min (erro humano) | ±3–5 segundos (desvio RTC) |
| **Disponibilidade noturna** | Requer operador acordado | Autônomo 24/7 |
| **Reação a falhas** | Depende de inspeção visual | Alerta em < 10 segundos |
| **Consumo de água** | Superirrigação ou subirrigação comum | Ciclo exato = desperdício zero |
| **Rastreabilidade** | Zero (sem registro) | 100% — cada evento logado |
| **Custo operacional** | Alto (tempo humano) | Baixo (hardware + API) |
| **Saúde da planta** | Irregular — estresse hídrico possível | Estável — ciclo circadiano respeitado |

#### Estimativa de Economia

Assumindo ciclo manual com erro médio de ±45 minutos por acionamento:
- 2 acionamentos/dia × 45min excesso × 365 dias = **547 horas/ano** de bomba desnecessária
- A 0,5 kW de consumo da bomba: **273 kWh/ano evitados**
- A R$ 0,80/kWh: **R$ 218/ano economizados** apenas em energia elétrica

---

## 6. Roadmap de Implementação

```
Fase 1 — MVP (semanas 1–2)
  ✓ ESP32 com RTC DS3231
  ✓ Controle do relé da bomba por horário
  ✓ POST para backend ao ligar/desligar
  ✓ Notificação WhatsApp via Evolution API (desenvolvimento)

Fase 2 — Monitoramento (semanas 3–4)
  ✓ Leitura de sensores pH, EC, Temp
  ✓ Alertas de sensor fora da faixa
  ✓ Fila offline com LittleFS
  ✓ Dashboard web mostrando histórico de ciclos

Fase 3 — Produção (semanas 5–6)
  ✓ Sensor de fluxo para detecção de falha na bomba
  ✓ Sensor de corrente INA219
  ✓ Migração para Twilio (produção)
  ✓ E-mail como canal de fallback
  ✓ OTA (Over-The-Air updates) para firmware
```

---

## 7. Variáveis de Ambiente Necessárias

```env
# .env (backend)
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPERADOR_NUMERO=+5511999999999
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=xxxxxxxx

# firmware (secrets.h — NÃO commitar no git)
#define WIFI_SSID     "nome_da_rede"
#define WIFI_PASSWORD "senha"
#define BACKEND_URL   "http://192.168.1.100:3000"
#define API_KEY       "chave_secreta_esp32"
```

---

*Documentação gerada para integração com [arquitetura.md](arquitetura.md) — Astro Verde INOVATECH*
