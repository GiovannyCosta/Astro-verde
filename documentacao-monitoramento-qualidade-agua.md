# Documentação Técnica Integrada do Sistema de Monitoramento de Qualidade da Água

## Contexto e Premissas de Projeto

Esta documentação consolida a camada física e a camada lógica de um sistema de monitoramento de qualidade da água aplicado ao contexto do projeto Astro Verde, associado ao cultivo hidropônico em ambiente controlado. O foco é descrever o sistema de forma técnica e analítica, com ênfase em critérios que sustentem a seção de resultados e discussões. Além dos parâmetros da solução nutritiva, o sistema passa a incorporar controle de luminosidade e temperatura do ambiente de cultivo.

Como os materiais de origem descrevem com clareza os requisitos de automação, monitoramento de pH, alertas, operação offline e visualização em dashboard, mas não especificam integralmente a topologia final do hardware, o local exato da medição e a tecnologia de banco de dados, foram adotadas as seguintes premissas de engenharia para manter a coerência da arquitetura:

- O ponto de medição é o reservatório ou linha de recirculação da solução nutritiva do sistema hidropônico NFT.
- O termo "sensores de minerais" representa sensores de condutividade elétrica, TDS ou sondas correlatas de concentração iônica, por serem as abordagens mais compatíveis com monitoramento contínuo de nutrientes em solução.
- O Arduino atua como unidade de aquisição de sinais e condicionamento básico, enquanto o ESP32 atua como nó de borda com conectividade e capacidade de processamento.
- O sistema possui sensor de luminosidade, sensores ou feedback elétrico da iluminação e sensor de temperatura ambiente para controle automático do microclima.
- A persistência histórica é tratada como séries temporais em banco relacional com suporte a consultas cronológicas, sendo PostgreSQL com extensão temporal uma escolha de referência arquitetural.
- O protocolo preferencial de telemetria é MQTT, por menor overhead, suporte a publicação assíncrona e boa aderência a cenários IoT com conectividade intermitente.

## 1. Documentação do Projeto Físico (Hardware & IoT)

### 1.1 Arquitetura de Hardware

O subsistema físico é composto por sensores imersos na solução nutritiva, uma camada de aquisição local e uma camada de conectividade. A arquitetura mais robusta para este cenário separa aquisição analógica sensível de comunicação de rede, reduzindo ruído, simplificando manutenção e favorecendo expansão modular.

O Arduino desempenha o papel de aquisição bruta dos sinais oriundos dos sensores. Seu uso é especialmente vantajoso quando o sistema lida com entradas analógicas sujeitas a ruído, necessidade de amostragem periódica e rotinas simples de pré-processamento. Nesse contexto, o Arduino:

- lê sinais analógicos do sensor de pH após o circuito condicionador;
- lê sinais de sensores de minerais, tipicamente por tensão proporcional a EC/TDS ou via módulos dedicados;
- executa filtragem local simples, como média móvel ou descarte inicial de amostras instáveis;
- padroniza o pacote de leitura com carimbo de tempo relativo, identificador do sensor e indicador de integridade da amostra.

O ESP32 opera como gateway inteligente da borda. Seu papel é receber os dados do Arduino, complementar o processamento e realizar a comunicação com a camada lógica. No projeto, o ESP32 é o elemento mais adequado para:

- consolidar múltiplas leituras em um payload estruturado;
- aplicar validações adicionais antes do envio;
- estabelecer comunicação Wi-Fi com a API ou broker MQTT;
- implementar lógica de contingência, como buffer local e retransmissão;
- acionar alertas locais ou saídas críticas quando a rede estiver indisponível.

Em conjunto, Arduino e ESP32 formam uma arquitetura em duas camadas. O Arduino fica mais próximo da física da medição, reduzindo a exposição do processo de aquisição às variações da pilha de rede. O ESP32 concentra a conectividade, a segurança da transmissão e a interoperabilidade com o software de supervisão.

### 1.2 Sensores e natureza dos sinais

O sensor de pH, em geral, produz um sinal analógico de baixa amplitude e alta sensibilidade a interferências eletroquímicas. Por isso, ele exige módulo de condicionamento, aterramento adequado e referência de tensão estável. A leitura final depende de curva de calibração, temperatura e envelhecimento da sonda.

O sensor de minerais, quando implementado como EC/TDS, também tende a produzir leitura analógica ou semidigital convertida por módulo específico. Em sistemas hidropônicos, essa medição é relevante porque indica indiretamente a concentração da solução nutritiva. Em ambientes de produção, a correlação entre pH e concentração iônica é decisiva para avaliar estabilidade química e eficiência da recirculação.

Para o ambiente de cultivo, o sistema também deve possuir monitoramento de luminosidade e temperatura. O sensor de luminosidade verifica se a lâmpada está efetivamente emitindo luz no nível esperado e permite distinguir estados como ligada, desligada ou queimada quando combinado com o estado de comando e, idealmente, com leitura de corrente do circuito de iluminação. Já o sensor de temperatura ambiente permite comparar a condição real do módulo de cultivo com a faixa ideal configurada para a cultura, habilitando ações automáticas de proteção e correção térmica.

Sensores auxiliares recomendados para aumentar a confiabilidade do sistema incluem:

- sensor de temperatura da água, pois pH e EC variam com temperatura;
- sensor de nível do reservatório, para correlação entre reposição hídrica e variações químicas;
- sensor de fluxo da linha NFT, para validar circulação efetiva da solução;
- sensor de luminosidade no ponto de cultivo para confirmar emissão real da lâmpada;
- leitura de corrente ou estado do driver de LED para detectar lâmpada queimada;
- monitoramento de tensão de alimentação, para rastrear leituras falsas causadas por instabilidade elétrica.

### 1.3 Coleta e Transmissão

O ciclo de coleta inicia na interface físico-química entre sonda e água. Após estabilização mínima da leitura, o Arduino realiza amostragem periódica, por exemplo a cada 5 a 30 segundos, dependendo da criticidade operacional. Para reduzir ruído, a leitura não deve ser baseada em amostra única, mas em uma janela curta de amostras sucessivas.

Uma sequência técnica recomendada é:

1. aquisição de `n` amostras por sensor;
2. descarte de outliers imediatos por limiar físico;
3. cálculo de média ou mediana;
4. aplicação da curva de calibração;
5. comparação de luminosidade e temperatura com limites operacionais;
6. geração de pacote estruturado;
7. envio do pacote ao ESP32 via serial UART ou I2C.

O ESP32 recebe esse pacote e publica os dados na nuvem. Entre HTTP/REST e MQTT, o protocolo MQTT é o mais aderente ao cenário porque:

- mantém payloads pequenos;
- opera com baixa latência e baixo custo de rede;
- suporta modelo publish/subscribe, adequado para dashboards e alertas;
- permite QoS para controle da entrega;
- facilita desacoplamento entre dispositivo, processamento e interface.

Uma estrutura típica de mensagem pode conter:

```json
{
  "device_id": "astroverde-node-01",
  "timestamp": "2026-04-17T10:30:00Z",
  "location": "reservatorio_nft_a1",
  "ph": 6.18,
  "ec": 1.74,
  "tds": 870,
  "water_temp_c": 24.3,
  "reservoir_level_pct": 82,
  "signal_quality": "ok",
  "firmware_version": "1.2.0"
}
```

No servidor, o broker MQTT encaminha a telemetria para consumidores especializados, como serviço de ingestão, motor de alertas e persistência temporal. Caso o projeto adote HTTP/REST, o padrão continua válido, porém com maior overhead e menor elasticidade para cenários de múltiplos nós.

No caso de automação ambiental, o ESP32 também pode executar comandos locais de baixa latência. Se a luminosidade esperada não for confirmada, o sistema registra falha de iluminação. Se a temperatura estiver acima da faixa ideal, o dispositivo pode reduzir a potência luminosa, acionar ventilação ou desligar a iluminação em regime de proteção. Se a temperatura estiver abaixo da faixa ideal, pode acionar aquecimento ou restaurar a condição térmica configurada.

### 1.4 Limitações e Interferências

Os sensores eletroquímicos impõem restrições que afetam diretamente a interpretação dos resultados experimentais. A principal limitação do sensor de pH é sua deriva temporal. A sonda perde confiabilidade com o uso, requer recalibração periódica em soluções tampão e sofre com incrustação, contaminação cruzada e armazenamento inadequado do eletrodo.

As principais limitações físicas do sistema são:

- necessidade de calibração frequente do sensor de pH, idealmente antes de campanhas de teste e após longos períodos de operação;
- influência da temperatura nas leituras de pH e EC;
- oxidação de conectores e terminais devido à umidade do ambiente hidropônico;
- ruído elétrico provocado por bombas, fontes chaveadas e fitas ou painéis LED;
- queda de tensão que altera leituras analógicas e reinicia microcontroladores;
- instabilidade do Wi-Fi do ESP32 em estruturas metálicas, ambientes fechados ou locais com interferência eletromagnética;
- incrustação de sais nos sensores de minerais, reduzindo repetibilidade ao longo do tempo;
- falha de relés, drivers ou módulos de potência da iluminação;
- leitura inadequada de luminosidade por mau posicionamento do sensor;
- inércia térmica do ambiente, que pode atrasar a resposta do controle.

Do ponto de vista experimental, essas limitações significam que leituras divergentes nem sempre representam variação real da água. Parte da dispersão pode decorrer de fenômenos instrumentais. Por isso, a camada lógica deve registrar contexto operacional e a equipe de resultados deve separar claramente erro do processo físico e erro do instrumento.

## 2. Documentação do Software (Full Stack)

### 2.1 Recepção e Processamento

Na camada lógica, o back-end atua como fronteira entre a telemetria dos dispositivos e a informação útil para o operador. A primeira etapa é a ingestão segura da mensagem enviada pelo ESP32. Em arquitetura orientada a eventos, um serviço consumidor lê os tópicos MQTT e transforma a telemetria em registros validados.

O pipeline recomendado de processamento é:

1. autenticação do dispositivo por chave, token ou certificado;
2. validação de esquema do payload;
3. verificação de campos obrigatórios e unidade de medida;
4. normalização de timestamp e timezone;
5. aplicação de regras de sanidade;
6. tratamento de ruído e detecção de anomalias;
7. persistência em banco de dados;
8. atualização de dashboards e subsistemas de alerta.

O tratamento de ruídos deve combinar regras determinísticas com métodos estatísticos simples. Para pH e minerais, abordagens práticas incluem:

- descarte de leituras fora do domínio físico plausível, como pH negativo, pH acima de 14 ou EC nula persistente em sistema em operação;
- rejeição de saltos abruptos incompatíveis com a dinâmica química do reservatório;
- comparação com janela histórica recente;
- marcação de amostras suspeitas em vez de exclusão silenciosa;
- uso de estados de qualidade como `ok`, `warning`, `invalid`, `stale`.

Exemplo de regras de validação:

- se `ph < 0` ou `ph > 14`, a leitura é inválida;
- se o valor de EC ou TDS permanecer zerado por período prolongado com fluxo ativo, há suspeita de falha de sensor ou rompimento de cabo;
- se a iluminação estiver comandada como ligada, mas a luminosidade medida estiver abaixo do mínimo e não houver corrente compatível no circuito, há suspeita de lâmpada queimada;
- se a temperatura estiver acima da faixa ideal, o sistema deve registrar sobretemperatura e acionar a estratégia de redução térmica;
- se a temperatura estiver abaixo da faixa ideal, o sistema deve registrar subtensão térmica e acionar aquecimento ou correção equivalente;
- se houver variação instantânea de pH superior ao limiar aceitável entre duas amostras consecutivas, a medição deve ser marcada como espúria e reenfileirada para confirmação.

Esse modelo preserva rastreabilidade. Em contexto acadêmico, isso é importante porque a equipe pode demonstrar quantas leituras foram aceitas, rejeitadas ou sinalizadas, transformando a robustez do software em métrica experimental.

### 2.2 Persistência de Dados

Os dados gerados formam séries temporais. Cada registro deve armazenar valor, contexto, integridade e metadados do dispositivo. Uma modelagem relacional com tabelas temporais ou extensão orientada a séries é adequada por permitir:

- histórico cronológico detalhado;
- agregações por intervalo;
- comparação entre sensores, reservatórios e módulos empilhados;
- construção de gráficos, alarmes e análises estatísticas;
- retenção de eventos de falha, calibração e manutenção.

Uma estrutura mínima de persistência deve conter:

- tabela de dispositivos;
- tabela de sensores;
- tabela de leituras;
- tabela de atuadores;
- tabela de eventos e alertas;
- tabela de calibrações e manutenção;
- tabela de usuários e perfis de acesso.

Campos recomendados para a tabela de leituras:

- identificador da leitura;
- identificador do dispositivo;
- identificador do sensor;
- timestamp da coleta;
- valor bruto;
- valor calibrado;
- unidade;
- status de qualidade;
- intensidade do sinal ou nível de confiança;
- estado da iluminação;
- estado do controle térmico;
- versão do firmware;
- indicador de origem online ou retransmitida.

Esse desenho permite diferenciar dado ao vivo de dado reenviado após contingência, ponto essencial para análises de latência, disponibilidade e perda de dados.

### 2.3 Interface e Alertas

O front-end deve consolidar visualização operacional e interpretação analítica. Para o usuário de produção, a interface precisa exibir tendência, faixa ideal e criticidade. Para a equipe de pesquisa, precisa mostrar dispersão, eventos de anomalia, timestamps e histórico comparável.

Os dashboards devem contemplar:

- gráfico temporal de pH por reservatório;
- gráfico temporal de EC/TDS e correlação com pH;
- gráfico temporal de luminosidade e temperatura do ambiente;
- indicadores instantâneos com faixas aceitáveis;
- estado da iluminação com classificação `acesa`, `apagada` ou `queimada`;
- status do sistema térmico, como resfriamento, proteção ou aquecimento;
- histórico de calibração e manutenção;
- mapa de status dos dispositivos;
- contadores de alertas por severidade;
- exportação para CSV ou planilha.

Os alertas devem ser classificados por criticidade:

- informativo: leve desvio ou oscilação transitória;
- aviso: tendência de saída da faixa operacional;
- crítico: valor fora do padrão por período sustentado, falha de sensor, lâmpada queimada, sobretemperatura, perda de fluxo ou perda prolongada de conectividade.

Uma regra de alerta de pH fora do padrão pode considerar:

- limite inferior e superior configuráveis por cultura;
- histerese para evitar alarmes oscilantes;
- confirmação em múltiplas amostras consecutivas;
- registro do momento de abertura, reconhecimento e encerramento do evento.

Essa estratégia evita falsos positivos e fornece base auditável para discussão de eficiência do sistema em comparação com inspeções manuais.

## 3. Arquitetura de Integração (O Elo Físico-Lógico)

O ciclo de vida do dado no sistema pode ser descrito de forma sequencial:

1. O sensor de pH e o sensor de minerais são imersos na solução nutritiva do reservatório ou da linha de recirculação.
2. Sensores adicionais de luminosidade e temperatura monitoram o ambiente de cultivo.
3. Cada sensor converte uma propriedade físico-química ou ambiental em sinal elétrico analógico ou digital.
4. O Arduino lê esses sinais em intervalos configurados, aplicando filtragem inicial e organização da telemetria.
5. O Arduino envia os dados consolidados ao ESP32 por interface local, como UART.
6. O ESP32 agrega metadados de dispositivo, horário, integridade e estado da conectividade.
7. O ESP32 valida superficialmente o pacote, decide se deve ligar, desligar ou reduzir atuadores de iluminação e temperatura e transmite a telemetria via Wi-Fi para um broker MQTT ou endpoint de API.
8. O serviço de ingestão no servidor recebe a mensagem e executa autenticação, validação estrutural e checagem de sanidade.
9. O motor de processamento identifica ruídos, valores espúrios, leituras ausentes ou padrões de falha.
10. Os dados validados são persistidos no banco em estrutura de séries temporais, incluindo estados dos atuadores.
11. O módulo de regras compara os valores com limites operacionais e gera alertas quando necessário.
12. O front-end consulta ou recebe atualização em tempo quase real e apresenta dashboards, histórico e notificações.
13. O usuário interpreta o estado do sistema, toma decisões operacionais e, se necessário, executa manutenção, recalibração ou correção da solução e do ambiente.

Esse fluxo demonstra que o valor do sistema não está apenas na leitura dos sensores, mas na rastreabilidade completa entre evento físico, transmissão, decisão algorítmica e ação humana.

## 4. Resultados e Discussões

### 4.1 Métricas de Confiabilidade (KPIs)

Para sustentar tecnicamente a eficácia do sistema, os indicadores devem cobrir quatro dimensões: qualidade da medição, desempenho de comunicação, disponibilidade operacional e utilidade analítica.

#### KPIs da medição

| KPI | Objetivo | Interpretação |
| --- | --- | --- |
| Erro absoluto médio de pH | Comparar leitura do sistema com solução padrão ou instrumento de referência | Mede acurácia do sensor após calibração |
| Desvio padrão das leituras de pH | Quantificar dispersão em condição estável | Mede precisão e repetibilidade |
| Erro relativo de EC/TDS | Comparar sensor de minerais com solução de referência | Mede fidelidade da concentração iônica |
| Tempo de estabilização da leitura | Medir quanto tempo o sensor demora para convergir após imersão | Impacta responsividade do sistema |
| Taxa de leituras inválidas | Percentual de amostras rejeitadas por regra de sanidade | Mede robustez instrumental e do pipeline |
| Drift por período | Variação gradual do erro ao longo de dias ou semanas | Indica necessidade de recalibração |
| Taxa de acerto da detecção de lâmpada queimada | Comparar falha real da iluminação com identificação automática | Mede qualidade da supervisão luminosa |
| Erro médio da temperatura ambiente | Comparar a medição com termômetro de referência | Mede confiabilidade do controle térmico |

#### KPIs de comunicação e processamento

| KPI | Objetivo | Interpretação |
| --- | --- | --- |
| Latência ponta a ponta | Tempo entre coleta física e exibição no dashboard | Mede responsividade real do sistema |
| Taxa de perda de pacotes | Percentual de mensagens não recebidas no servidor | Mede confiabilidade da rede IoT |
| Taxa de retransmissão | Percentual de mensagens reenviadas após falha | Mede resiliência da camada de borda |
| Disponibilidade do nó ESP32 | Tempo em operação sem reinicialização crítica | Mede estabilidade do hardware |
| Throughput de ingestão | Quantidade de leituras processadas por minuto | Mede capacidade de escalabilidade |
| Tempo de geração de alerta | Tempo entre anomalia física e notificação ao usuário | Mede efetividade operacional |
| Tempo de atuação térmica | Tempo entre sobretemperatura e ação automática | Mede eficiência da automação ambiental |

#### KPIs de operação e manutenção

| KPI | Objetivo | Interpretação |
| --- | --- | --- |
| MTBF do sensor | Tempo médio entre falhas | Mede robustez física do conjunto |
| MTTR de recuperação | Tempo médio para restaurar sensor ou conectividade | Mede prontidão operacional |
| Frequência de calibração | Intervalo necessário para manter erro dentro da meta | Mede custo de manutenção |
| Taxa de falso positivo de alerta | Alertas sem evento real correspondente | Mede qualidade das regras |
| Taxa de falso negativo | Eventos reais não detectados | Mede risco operacional |
| Taxa de acerto do estado da iluminação | Precisão na classificação entre ligada, desligada e queimada | Mede assertividade do diagnóstico do atuador |

Em termos experimentais, um sistema convincente não é apenas aquele que "mede", mas aquele que mede com baixa dispersão, comunica com baixa perda, persiste com rastreabilidade e alerta em tempo útil.

### 4.2 Cenários de Validação e Testes

Os testes devem simular tanto operação nominal quanto falhas controladas. A seguir estão os cenários mais relevantes para validação técnico-científica.

#### Cenário 1: calibração e acurácia do sensor de pH

Procedimento:

- submeter a sonda a soluções tampão conhecidas, por exemplo pH 4, pH 7 e pH 10;
- registrar leituras cruas e calibradas;
- calcular erro antes e depois da calibração.

Resultado esperado:

- redução mensurável do erro absoluto médio;
- menor dispersão após estabilização;
- documentação de curva de correção aplicada no firmware ou no back-end.

Discussão:

Esse teste comprova se a confiabilidade do sistema depende majoritariamente da instrumentação ou da modelagem lógica. Se o erro residual permanecer alto mesmo após calibração, o problema tende a estar em ruído elétrico, acondicionamento da sonda ou envelhecimento do eletrodo.

#### Cenário 2: sensor de minerais queimado ou enviando zeros

Procedimento:

- forçar a entrada do sensor de minerais para valor zero constante;
- manter os demais sensores operando normalmente.

Comportamento esperado do software:

- detectar incompatibilidade entre zero persistente e contexto operacional;
- marcar as leituras como inválidas ou suspeitas;
- abrir alerta de falha de sensor, não apenas alerta químico;
- preservar o histórico sem sobrescrever com valores falsamente normais;
- exibir no dashboard estado de instrumentação degradada.

Discussão:

Esse cenário é crítico porque valor zero pode ser interpretado erroneamente como baixa mineralização real. O sistema precisa diferenciar anomalia do processo e falha de medição. Essa distinção é um dos principais ganhos da integração físico-lógica.

#### Cenário 3: queda de internet do ESP32

Procedimento:

- interromper o acesso Wi-Fi durante a operação;
- manter a coleta local ativa por período definido;
- restaurar a conectividade e observar o comportamento.

Comportamento esperado:

- o ESP32 continua coletando amostras;
- dados são armazenados em buffer local, preferencialmente memória persistente ou cartão SD;
- após retorno da rede, o dispositivo retransmite as mensagens pendentes com marcação de origem em contingência;
- o servidor aceita a inserção tardia preservando o timestamp original da coleta.

Se não houver armazenamento local, a discussão deve explicitar a perda de dados como limitação arquitetural. Essa limitação impacta diretamente a validade de séries temporais e reduz a confiabilidade do sistema em cenários reais.

#### Cenário 4: falha de iluminação ou lâmpada queimada

Procedimento:

- comandar a iluminação como ligada;
- interromper a emissão luminosa ou simular falha do driver;
- observar se o sistema detecta a inconsistência entre comando e luminosidade real.

Resultado esperado:

- classificação automática do estado como `queimada` ou `falha de iluminação`;
- geração de alerta crítico;
- registro do evento para manutenção corretiva.

Discussão:

Esse teste é importante porque o simples comando elétrico não garante que a cultura esteja recebendo luz. A integração entre sensor de luminosidade e estado do atuador reduz falsos cenários de operação normal.

#### Cenário 5: temperatura acima ou abaixo da faixa ideal

Procedimento:

- elevar a temperatura do ambiente acima do limite configurado;
- verificar se o sistema reduz a carga térmica, aciona ventilação ou desliga a iluminação em proteção;
- reduzir a temperatura abaixo do mínimo;
- verificar se o sistema liga aquecimento ou recupera a condição térmica configurada.

Resultado esperado:

- resposta automática coerente com a faixa ideal;
- registro de atuação e retorno ao estado normal após estabilização;
- histerese suficiente para evitar liga/desliga excessivo.

Discussão:

Esse cenário valida se o sistema não apenas monitora, mas efetivamente controla o ambiente. Também permite discutir inércia térmica, tempo de resposta e custo energético da automação.

#### Cenário 6: ruído elétrico induzido por bombas e LEDs

Procedimento:

- comparar leituras com atuadores desligados e ligados;
- analisar dispersão de pH e EC em ambiente quimicamente estável.

Resultado esperado:

- aumento de ruído durante acionamento elétrico, se o condicionamento for inadequado;
- mitigação parcial por blindagem, aterramento, filtragem e segregação de alimentação.

Discussão:

Esse teste é essencial para provar que parte da variação não vem da água, mas da eletrônica de potência do sistema. Sem esse controle, qualquer conclusão agronômica pode ser contaminada por erro instrumental.

#### Cenário 7: escalabilidade para múltiplos pontos de coleta

Procedimento:

- simular 10, 50 e 100 nós publicando simultaneamente;
- medir latência, perda de pacotes e tempo de renderização do dashboard.

Resultado esperado:

- crescimento controlado da latência;
- manutenção da integridade da ingestão com fila assíncrona;
- necessidade de particionamento e compressão de históricos em larga escala.

Discussão:

Esse cenário deixa de ser apenas tecnológico e passa a ser arquitetural. O problema central deixa de ser "medir bem" e passa a ser "medir bem em volume e sem perder rastreabilidade".

### 4.3 Discussão Crítica

O monitoramento automatizado apresenta vantagens substanciais em relação à medição manual. A principal é a continuidade temporal. Enquanto a medição manual produz amostras esparsas e dependentes de disponibilidade humana, o sistema automatizado registra a dinâmica do reservatório em alta frequência, permitindo identificar transientes, tendências de degradação e eventos breves que passariam despercebidos.

Outra vantagem concreta é a integração entre medição, histórico e alerta. Na abordagem manual, o operador observa o valor atual e reage localmente. Na abordagem automatizada, o sistema constrói contexto histórico, compara com limites, detecta persistência do desvio e registra tudo com carimbo temporal. Isso amplia a qualidade da decisão e reduz o tempo entre desvio químico e ação corretiva.

Ao incorporar controle de luminosidade e temperatura, o sistema deixa de ser apenas observacional e passa a ser também supervisório e corretivo. Isso aumenta o valor operacional, porque a plataforma não só detecta desvio, mas intervém no microclima do cultivo para preservar a condição ideal.

Entretanto, a automação não elimina a necessidade de validação humana. Ela desloca o foco da operação: menos tempo gasto medindo e mais tempo gasto verificando calibração, confiabilidade do instrumento e interpretação do histórico. Em outras palavras, o ganho operacional depende de disciplina de manutenção.

Sob a ótica de escalabilidade, o maior gargalo não está apenas na rede ou no banco de dados. Em um cenário com 100 pontos de coleta, os desafios principais são:

- sincronização de tempo entre dispositivos;
- gerenciamento de identidade e firmware dos nós;
- manutenção periódica de dezenas de sensores eletroquímicos;
- manutenção de lâmpadas, drivers, relés e atuadores térmicos;
- aumento do volume de eventos espúrios;
- custo de calibração e reposição de sondas;
- saturação visual do dashboard se a interface não for hierarquizada.

Do ponto de vista da infraestrutura, um sistema com 100 nós exige:

- broker MQTT com autenticação robusta;
- processamento assíncrono desacoplado;
- armazenamento temporal indexado;
- políticas de retenção, agregação e arquivamento;
- observabilidade da própria plataforma, incluindo logs, métricas e tracing.

No plano experimental, a discussão mais importante é que a qualidade da solução depende do acoplamento entre hardware e software. Um bom back-end não corrige sonda degradada, assim como um bom sensor não compensa perda de pacotes, timestamp incorreto ou regra de alerta mal ajustada. A contribuição técnica do projeto está justamente em mostrar que a confiabilidade emerge da integração entre:

- aquisição física estável;
- transmissão resiliente;
- processamento com critérios de validação;
- persistência rastreável;
- visualização inteligível;
- manutenção preventiva sistemática.

Por isso, a manutenção preventiva do hardware não deve ser tratada como atividade acessória, mas como parte do próprio modelo de confiabilidade. Em sistemas de monitoramento de água, ignorar limpeza, recalibração e inspeção elétrica tende a produzir uma falsa sensação de automação. O dashboard continua ativo, mas a validade científica da leitura se deteriora silenciosamente.

### 4.4 Síntese analítica para a seção de resultados

Para a equipe responsável por resultados e discussões, os eixos de análise mais defensáveis em relatório técnico ou acadêmico são:

- acurácia e precisão das leituras após calibração;
- estabilidade das leituras sob operação contínua;
- impacto de ruído elétrico e conectividade na integridade do dado;
- confiabilidade da detecção de iluminação acesa, apagada ou queimada;
- eficiência da resposta automática a sobretemperatura e baixa temperatura;
- capacidade do sistema de distinguir desvio químico real de falha de sensor;
- tempo de resposta entre evento físico, processamento e alerta;
- resiliência operacional em modo offline;
- custo de manutenção versus ganho operacional sobre medição manual.

Se esses eixos forem acompanhados por métricas quantitativas e cenários de falha reproduzíveis, a discussão deixará de ser apenas descritiva e passará a demonstrar maturidade de engenharia, confiabilidade instrumental e viabilidade de uso em ambiente produtivo.

## Referências internas consideradas

Esta documentação foi estruturada a partir das premissas operacionais e requisitos observados nos materiais do projeto Astro Verde, incluindo:

- monitoramento e alerta de pH;
- operação em sistema hidropônico NFT;
- controle e supervisão por dashboard;
- exportação de dados para análise;
- operação em contingência offline;
- requisitos de confiabilidade, segurança de rede e atualização em tempo real.
