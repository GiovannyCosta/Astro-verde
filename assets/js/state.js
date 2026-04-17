/*
 * state.js — Estado Global da Aplicação
 *
 * Este arquivo centraliza todos os dados que a aplicação
 * precisa lembrar enquanto está rodando (estado em memória).
 *
 * Por que centralizar o estado?
 * Porque se cada módulo tiver suas próprias variáveis soltas,
 * fica difícil saber "onde está o valor de pH agora" ou
 * "quem mudou o estado da iluminação". Centralizar facilita
 * depuração e manutenção.
 *
 * Em um projeto maior, isso poderia ser substituído por
 * Redux, Zustand ou Pinia — mas aqui um objeto simples resolve.
 */

const AppState = {

  /* ============================================================
     LEITURAS DOS SENSORES
     Atualizadas pelo simulador (mock) ou pela API real.
     ============================================================ */
  sensors: {
    ph: 6.1,           // pH da solução nutritiva (faixa ideal: 5.5 – 6.5)
    ec: 1.75,          // Condutividade elétrica em mS/cm (ideal: 1.5 – 2.5)
    tds: 875,          // Sólidos totais dissolvidos em ppm (relacionado ao EC)
    temperature: 23.0, // Temperatura do ambiente em °C (ideal: 18 – 26°C)
    humidity: 65,      // Umidade relativa do ar em %
    luminosity: 800,   // Luminosidade medida em lux
    waterLevel: 88,    // Nível do reservatório em %
    nftFlow: true,     // true = fluxo NFT circulando, false = interrompido
  },

  /* ============================================================
     ESTADO DOS ATUADORES
     Representam o comando enviado para cada dispositivo físico.
     ============================================================ */
  actuators: {
    /*
     * lightingCommand: o que o sistema MANDOU fazer
     *   'on'  → comando para ligar a iluminação
     *   'off' → comando para desligar
     */
    lightingCommand: 'on',

    /*
     * lightingState: o que o sensor detectou
     *   'acesa'   → comando=on E luminosidade compatível
     *   'apagada' → comando=off
     *   'queimada'→ comando=on MAS luminosidade incompatível
     */
    lightingState: 'acesa',

    /*
     * lightingPower: potência da iluminação em % (0–100)
     * Pode ser reduzida automaticamente quando temperatura sobe.
     */
    lightingPower: 100,

    /*
     * coolingActive: true quando o sistema de resfriamento está acionado
     * Ativado quando temperatura > limite crítico.
     */
    coolingActive: false,

    /*
     * heatingActive: true quando o sistema de aquecimento está acionado
     * Ativado quando temperatura < limite mínimo.
     */
    heatingActive: false,
  },

  /* ============================================================
     CONFIGURAÇÕES DA FAIXA IDEAL
     Configuráveis por cultura — aqui são os valores padrão
     para alface em sistema NFT.
     ============================================================ */
  config: {
    ph: { min: 5.5, max: 6.5 },
    ec: { min: 1.2, max: 2.5 },
    temperature: {
      min: 18,         // abaixo → acionar aquecimento
      max: 26,         // acima → reduzir luminosidade
      critical: 30,    // acima → desligar iluminação em proteção
    },
    luminosity: {
      minExpected: 200, // lux mínimo esperado com luz LIGADA
    },
    lightCycleHours: { on: 16, off: 8 }, // ciclo 16h ligada / 8h apagada
  },

  /* ============================================================
     ALERTAS ATIVOS
     Lista dos alertas gerados pelas regras de negócio.
     ============================================================ */
  alerts: [],

  /* ============================================================
     LOG DO SISTEMA
     Histórico de eventos operacionais.
     ============================================================ */
  logs: [],

  /* ============================================================
     MÓDULOS / DISPOSITIVOS
     Lista dos dispositivos físicos monitorados.
     ============================================================ */
  modules: [
    { id: 'torreA',         name: 'Torre A — 3 Módulos Empilhados',  active: true  },
    { id: 'torreB',         name: 'Torre B — 2 Módulos Empilhados',  active: true  },
    { id: 'bombaPh',        name: 'Bomba Dosadora de pH',             active: true  },
    { id: 'bombaNutrientes',name: 'Bomba dos Nutrientes',             active: false },
    { id: 'iluminacao',     name: 'Sistema de Iluminação LED',        active: true  },
  ],

  /* ============================================================
     MODO DE FONTE DE DADOS
     'mock'  → dados gerados localmente pelo simulador JS
     'api'   → dados vindos do backend Node.js
     ============================================================ */
  dataSource: 'mock',

  /* ============================================================
     CONTAGEM DE NOTIFICAÇÕES NÃO LIDAS
     ============================================================ */
  unreadNotifications: 1,
};
