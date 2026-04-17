# Documento 2: Software Full Stack

## Objetivo

Descrever a camada lógica responsável por receber, validar, armazenar e apresentar os dados de qualidade da água e do ambiente de cultivo.

## Recepção dos Dados

O back-end recebe a telemetria enviada pelo ESP32 por meio de broker `MQTT` ou API `HTTP/REST`.

O fluxo recomendado é:

1. autenticar o dispositivo;
2. validar o formato da mensagem;
3. verificar campos obrigatórios;
4. normalizar horário e unidade;
5. aplicar regras de sanidade;
6. salvar no banco;
7. atualizar dashboards e alertas.

## Tratamento de Leituras

O sistema deve tratar dados espúrios antes da persistência.

Exemplos de validação:

- `pH < 0` ou `pH > 14`: leitura inválida;
- `EC/TDS = 0` por longo período: possível falha de sensor;
- luminosidade muito baixa com comando de lâmpada ligada: possível lâmpada queimada;
- temperatura acima do limite ideal: acionar redução térmica;
- temperatura abaixo do limite ideal: acionar aquecimento ou modo de elevação térmica;
- salto brusco entre amostras consecutivas: leitura suspeita;
- pacote incompleto: rejeição ou marcação de erro.

O ideal é marcar leituras suspeitas, em vez de apagar o registro. Isso melhora rastreabilidade e análise posterior.

## Persistência

Os dados devem ser armazenados como séries temporais.

Estrutura mínima:

- tabela de dispositivos;
- tabela de sensores;
- tabela de leituras;
- tabela de atuadores;
- tabela de alertas;
- tabela de calibrações e manutenção.

Campos importantes em cada leitura:

- identificador do dispositivo;
- identificador do sensor;
- timestamp;
- valor bruto;
- valor calibrado;
- unidade;
- status de qualidade;
- estado do atuador associado;
- origem online ou retransmitida.

## Interface

O front-end deve apresentar:

- gráfico histórico de pH;
- gráfico histórico de minerais;
- gráfico de temperatura e luminosidade;
- indicadores instantâneos;
- estado da iluminação: `acesa`, `apagada` ou `queimada`;
- estado do controle térmico;
- status do dispositivo;
- histórico de alertas;
- opção de exportar dados.

## Alertas

O sistema deve gerar alertas por severidade:

- `informativo`: oscilação leve;
- `aviso`: tendência de saída da faixa ideal;
- `crítico`: valor fora do padrão, falha de sensor, lâmpada queimada, sobretemperatura ou perda de conectividade.

Para evitar falsos alarmes, o alerta deve considerar:

- múltiplas amostras consecutivas;
- faixa ideal configurável;
- histerese;
- registro de abertura e encerramento do evento.

## Lógica de Automação

O software deve aplicar regras simples e auditáveis:

- se a lâmpada estiver comandada como ligada e a luminosidade medida for incompatível, registrar `falha de iluminação`;
- se a temperatura estiver acima da faixa ideal, reduzir potência luminosa ou desligar a iluminação e acionar resfriamento;
- se a temperatura atingir nível crítico, manter desligamento de proteção;
- se a temperatura estiver abaixo da faixa ideal, ligar aquecimento ou elevar a condição térmica configurada;
- registrar toda troca de estado para posterior análise.

## Conclusão Técnica

O software agrega valor quando transforma leitura bruta em informação confiável. Seu papel principal é separar dado válido de falha instrumental, executar regras de automação e disponibilizar histórico útil para análise e tomada de decisão.
