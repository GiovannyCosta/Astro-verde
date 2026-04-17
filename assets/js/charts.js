/*
 * charts.js — Gráficos Chart.js
 *
 * Inicializa e atualiza os gráficos do dashboard.
 *
 * Por que Chart.js?
 * É uma biblioteca JavaScript gratuita, leve e fácil de usar.
 * Não precisa de servidor — roda direto no browser.
 * Adequada para dashboards de estudo e protótipos.
 *
 * Gráficos implementados:
 * 1. envChart — Histórico de temperatura e umidade (24h simulado)
 *
 * Como adicionar pontos em tempo real:
 * Charts.addDataPoint(temperatura, umidade)
 */

const Charts = {

  /* Referências às instâncias do Chart.js */
  envChartInstance: null,

  /* Máximo de pontos visíveis no gráfico de histórico */
  MAX_POINTS: 20,

  /* ============================================================
     INICIALIZAÇÃO
     Chamada uma vez quando o DOM estiver pronto.
     ============================================================ */
  init() {
    this._initEnvChart();
  },

  /* ============================================================
     GRÁFICO AMBIENTAL — temperatura e umidade ao longo do tempo
     ============================================================ */
  _initEnvChart() {
    const canvas = document.getElementById('envChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Dados iniciais: últimas 7 horas simuladas
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Agora'];
    const tempData = [22, 21.5, 22.5, 24, 23.5, 22.5, AppState.sensors.temperature];
    const humData  = [65,  68,   62,  58,   60,   64,  AppState.sensors.humidity];

    this.envChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: tempData,
            borderColor: '#98ce00',                   // verde Astro Verde
            backgroundColor: 'rgba(152, 206, 0, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: isMobile ? 2 : 3,
          },
          {
            label: 'Umidade (%)',
            data: humData,
            borderColor: '#343a40',                   // cinza escuro
            borderDash: [5, 5],                       // linha tracejada
            tension: 0.4,
            fill: false,
            pointRadius: isMobile ? 2 : 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: {
            position: isMobile ? 'bottom' : 'top',
            labels: {
              boxWidth: isMobile ? 10 : 16,
              font: { family: "'Inter', sans-serif", size: isMobile ? 10 : 12 },
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              minRotation: 0,
              maxTicksLimit: isMobile ? 4 : 7,
            },
          },
        },
      },
    });
  },

  /* ============================================================
     ADICIONAR PONTO EM TEMPO REAL
     Chamado pelo Dashboard.refresh() a cada tick do simulador.
     Remove o ponto mais antigo quando atingir MAX_POINTS.
     ============================================================ */
  addDataPoint(temperature, humidity) {
    if (!this.envChartInstance) return;

    const chart  = this.envChartInstance;
    const now    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Adiciona label e valores
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(parseFloat(temperature.toFixed(1)));
    chart.data.datasets[1].data.push(parseFloat(humidity.toFixed(1)));

    // Remove ponto mais antigo se ultrapassar o limite
    if (chart.data.labels.length > this.MAX_POINTS) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
    }

    // Re-renderiza o gráfico com animação suave
    chart.update('none'); // 'none' desativa animação no update para suavidade
  },
};
