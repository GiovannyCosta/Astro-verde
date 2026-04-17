# Documento 1: Hardware e IoT

## Objetivo

Descrever a camada física do sistema de monitoramento de qualidade da água e do ambiente aplicado ao cultivo hidropônico NFT do projeto Astro Verde.

## Arquitetura Física

O sistema utiliza dois microcontroladores com funções distintas:

- `Arduino`: aquisição dos sinais dos sensores.
- `ESP32`: processamento de borda e comunicação com a rede.

Essa separação melhora estabilidade, manutenção e expansão do sistema.

## Função dos Componentes

### Arduino

- realiza leitura dos sensores de pH;
- realiza leitura dos sensores de minerais, modelados como EC/TDS;
- realiza leitura de sensores de luminosidade e temperatura do ambiente;
- aplica filtragem simples, como média ou mediana;
- envia os dados ao ESP32.

### ESP32

- recebe os dados do Arduino;
- valida o pacote de telemetria;
- transmite os dados por Wi-Fi;
- gerencia contingência em falha de rede;
- identifica o dispositivo e registra horário da coleta;
- aciona relés ou drivers de iluminação e controle térmico.

## Sensores

### Sensor de pH

- mede acidez/alcalinidade da solução;
- fornece sinal analógico sensível a ruído;
- exige calibração frequente;
- sofre influência de temperatura e envelhecimento.

### Sensor de minerais

- representa concentração iônica da solução;
- pode ser tratado como sensor de `EC` ou `TDS`;
- ajuda a avaliar equilíbrio nutricional;
- pode apresentar deriva por incrustação e oxidação.

### Sensor de luminosidade e monitoramento das lâmpadas

- mede a intensidade luminosa no ponto de cultivo;
- confirma se a iluminação está realmente ativa;
- permite distinguir estados `acesa`, `apagada` e `queimada`;
- pode ser combinado com leitura de corrente para detectar falha elétrica da lâmpada.

### Sensor de temperatura

- monitora a temperatura do ambiente interno;
- compara o valor medido com a faixa ideal de cultivo;
- permite acionar resfriamento, redução de potência ou aquecimento.

## Fluxo de Coleta

1. Os sensores de água, luminosidade e temperatura coletam dados do sistema.
2. O Arduino realiza múltiplas amostragens por intervalo.
3. Leituras instáveis são descartadas.
4. O valor médio ou mediano é calculado.
5. O pacote é enviado ao ESP32.
6. O ESP32 decide se mantém, liga, desliga ou reduz atuadores.
7. O ESP32 transmite os dados ao servidor.

## Controle de Luminosidade e Temperatura

O sistema deve monitorar o estado da iluminação e a temperatura do ambiente em tempo real.

Estados esperados da iluminação:

- `acesa`: lâmpada energizada e luminosidade detectada;
- `apagada`: lâmpada desativada por comando operacional;
- `queimada`: comando de acionamento presente, mas sem corrente ou sem luminosidade compatível.

Resposta térmica esperada:

- se a temperatura estiver acima da faixa ideal, o sistema reduz a carga térmica, desligando parcialmente a iluminação ou acionando ventilação/resfriamento;
- se a temperatura ultrapassar o limite crítico, o sistema desliga a iluminação até normalização;
- se a temperatura estiver abaixo da faixa ideal, o sistema liga aquecimento ou aumenta a condição térmica configurada.

## Comunicação

O protocolo mais indicado é `MQTT`, porque:

- possui baixo overhead;
- suporta envio assíncrono;
- é adequado para IoT;
- facilita integração com dashboards e alertas.

## Limitações do Hardware

- necessidade de recalibração do sensor de pH;
- ruído elétrico de bombas e LEDs;
- variação de tensão na alimentação;
- oxidação de conectores;
- instabilidade do Wi-Fi;
- degradação física dos sensores em ambiente úmido;
- falha de lâmpadas, drivers ou relés;
- leitura incorreta de luminosidade por posicionamento inadequado do sensor;
- atraso na resposta térmica do ambiente.

## Conclusão Técnica

O desempenho do sistema físico depende da qualidade da instrumentação, da estabilidade elétrica e da rotina de manutenção. Sem calibração, inspeção preventiva e verificação dos atuadores de luz e temperatura, a automação continua operando, mas a confiabilidade do dado e do controle diminui.
