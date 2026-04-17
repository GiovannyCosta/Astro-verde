/*
 * mocks/sensorSimulator.js — Simulador de Sensores IoT (Backend)
 *
 * Gera leituras simuladas no servidor e as persiste no banco JSON,
 * como se fossem dados reais do ESP32/Arduino.
 *
 * Para integrar com ESP32 real:
 * 1. Chame SensorSimulator.stop() para pausar o mock
 * 2. O ESP32 passa a enviar dados via POST /api/telemetry
 * 3. O handler persiste da mesma forma — o frontend não muda
 */

const { initDatabase } = require('../database/jsonDb');
const config = require('../config');

const state = {
  ph:          6.1,
  ec:          1.75,
  temperature: 23.0,
  humidity:    65,
  luminosity:  800,
  waterLevel:  88,
  nftFlow:     true,
  lightingCommand: 'on',
  lightingState:   'acesa',
  lightingPower:   100,
  coolingActive:   false,
  heatingActive:   false,
};

let db    = null;
let timer = null;

function start() {
  db = initDatabase();
  console.log('[Simulator] Iniciando simulação de sensores...');
  _tick();
  timer = setInterval(_tick, config.SIMULATOR_INTERVAL_MS);
}

function stop() {
  clearInterval(timer);
  console.log('[Simulator] Simulação pausada.');
}

function _tick() {
  _updateSensors();
  _applyBusinessRules();
  _persistReading();
}

function _updateSensors() {
  state.ph          = _clamp(state.ph + _rand(0.1), 5.0, 7.0);
  state.ec          = _clamp(state.ec + _rand(0.05), 0.3, 3.0);
  const heatBias    = state.lightingState === 'acesa' ? 0.05 : -0.05;
  state.temperature = _clamp(state.temperature + _rand(0.3) + heatBias, 10, 40);
  state.humidity    = _clamp(state.humidity + _rand(1.5), 30, 99);

  state.luminosity  = state.lightingCommand === 'on'
    ? _clamp(800 + _rand(100), 200, 1200)
    : Math.round(Math.random() * 30);

  if (Math.random() > 0.85 && state.waterLevel > 70) {
    state.waterLevel = parseFloat((state.waterLevel - 0.1).toFixed(1));
  }

  const cfg = config.SENSOR_LIMITS;
  if (state.lightingCommand === 'off') {
    state.lightingState = 'apagada';
  } else if (state.luminosity >= cfg.luminosity.minExpected) {
    state.lightingState = 'acesa';
  } else {
    state.lightingState = 'queimada';
  }
}

function _applyBusinessRules() {
  const cfg  = config.SENSOR_LIMITS;
  const temp = state.temperature;

  if (temp > cfg.temperature.critical) {
    state.lightingCommand = 'off';
    state.lightingPower   = 0;
    state.coolingActive   = true;
    state.heatingActive   = false;
  } else if (temp > cfg.temperature.max) {
    state.lightingPower = 60;
    state.coolingActive = true;
    state.heatingActive = false;
  } else if (temp < cfg.temperature.min) {
    state.heatingActive = true;
    state.coolingActive = false;
  } else {
    if (state.coolingActive || state.heatingActive) {
      state.coolingActive = false;
      state.heatingActive = false;
      if (state.lightingCommand === 'on') state.lightingPower = 100;
    }
  }
}

function _persistReading() {
  if (!db) return;
  const tempControl = state.coolingActive ? 'cooling'
    : state.heatingActive ? 'heating'
    : state.lightingPower === 0 ? 'protection'
    : 'normal';

  db.insert('readings', {
    device_id:      'astroverde-sim-01',
    sensor_type:    'telemetry',
    ph:             parseFloat(state.ph.toFixed(3)),
    ec:             parseFloat(state.ec.toFixed(3)),
    temperature:    parseFloat(state.temperature.toFixed(2)),
    humidity:       parseFloat(state.humidity.toFixed(1)),
    luminosity:     Math.round(state.luminosity),
    nft_flow:       state.nftFlow,
    lighting_state: state.lightingState,
    temp_control:   tempControl,
    quality:        _quality(state.ph, config.SENSOR_LIMITS.ph),
  });
}

function _rand(amp) { return (Math.random() - 0.5) * 2 * amp; }
function _clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function _quality(val, limits) {
  if (val < limits.min || val > limits.max) return 'warning';
  return 'ok';
}

function getCurrentState() { return { ...state }; }

module.exports = { start, stop, getCurrentState };
