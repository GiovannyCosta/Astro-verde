# Documento 3: Integração, Resultados e Discussões

## Objetivo

Apresentar o elo entre hardware e software e sintetizar os principais critérios de validação do sistema, incluindo iluminação e temperatura.

## Fluxo Integrado do Dado

1. Os sensores medem propriedades da água, luminosidade e temperatura.
2. O Arduino lê e filtra os sinais.
3. O ESP32 organiza a telemetria e executa comandos locais.
4. O servidor recebe e valida os dados.
5. O banco armazena leituras e estados dos atuadores.
6. O sistema compara com limites operacionais.
7. O sistema decide ligar, desligar, reduzir ou sinalizar falha.
8. O dashboard exibe o estado atual.
9. O usuário interpreta os dados e age.

## KPIs Essenciais

### Medição

- erro absoluto médio do pH;
- desvio padrão das leituras;
- erro relativo de EC/TDS;
- tempo de estabilização da leitura;
- taxa de leituras inválidas;
- drift do sensor ao longo do tempo;
- acurácia da detecção de lâmpada queimada;
- erro médio da temperatura ambiente.

### Comunicação

- latência entre coleta e visualização;
- taxa de perda de pacotes;
- taxa de retransmissão;
- disponibilidade do ESP32;
- tempo de geração de alerta.

### Operação

- frequência de calibração;
- tempo médio para recuperação de falha;
- taxa de falso positivo;
- taxa de falso negativo;
- tempo de resposta do controle térmico;
- taxa de acerto do estado da iluminação.

## Cenários de Validação

### 1. Calibração do sensor de pH

- comparar leituras com soluções padrão;
- medir erro antes e depois da calibração;
- verificar redução da dispersão.

### 2. Sensor de minerais com falha

- simular valor zero contínuo;
- verificar se o sistema identifica falha de sensor;
- impedir interpretação incorreta como valor normal.

### 3. Queda de internet

- interromper a conexão do ESP32;
- observar se a coleta continua;
- verificar se existe buffer local e retransmissão.

### 4. Falha de iluminação

- simular lâmpada ligada sem emissão luminosa;
- verificar se o sistema marca `queimada`;
- validar alerta e registro do evento.

### 5. Temperatura acima ou abaixo da faixa

- forçar temperatura acima do ideal;
- verificar se o sistema reduz carga térmica ou desliga iluminação;
- forçar temperatura abaixo do ideal;
- verificar se o sistema liga aquecimento ou modo de elevação térmica.

### 6. Ruído elétrico

- comparar leituras com bombas e LEDs ligados e desligados;
- medir aumento de dispersão em ambiente estável.

### 7. Escalabilidade

- simular múltiplos pontos de coleta;
- medir latência, perda e capacidade de persistência.

## Discussão Técnica

O monitoramento automatizado é superior à medição manual porque:

- registra dados continuamente;
- reduz atraso na identificação de falhas;
- gera histórico confiável;
- permite alertas em tempo útil;
- automatiza decisões de iluminação e temperatura.

Mesmo assim, a automação não elimina manutenção. O principal risco do sistema é parecer operacional mesmo com sensor degradado ou mal calibrado.

Em escala maior, como dezenas ou centenas de pontos de coleta, os gargalos passam a ser:

- gestão dos dispositivos;
- manutenção das sondas;
- manutenção de lâmpadas e atuadores térmicos;
- sincronização temporal;
- volume de dados;
- organização visual do dashboard.

## Conclusão Técnica

O valor do projeto está na integração entre medição física, transmissão confiável, validação lógica, automação ambiental e visualização clara. A eficácia do sistema deve ser demonstrada com métricas quantitativas, testes de falha e rotina de manutenção preventiva.
