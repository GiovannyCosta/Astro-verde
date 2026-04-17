# Prompt Para Cloud Code: Refatoração, Organização e Implementação do Astro Verde

## Objetivo do Prompt

Você vai atuar como **Arquiteto Full Stack, Engenheiro de Software, Especialista em IoT e Mentor Técnico** para reorganizar e evoluir um projeto já iniciado chamado **Astro Verde**, voltado ao monitoramento da qualidade da água e do ambiente de uma fazenda vertical hidropônica.

O projeto **já possui um `index.html` funcional e visualmente avançado**, mas ele está **monolítico**, com HTML, CSS e JavaScript juntos. Também já existem documentos técnicos do projeto que definem requisitos de:

- monitoramento de pH;
- monitoramento de minerais (`EC/TDS`);
- fluxo NFT;
- alertas;
- histórico e dashboard;
- controle de luminosidade;
- identificação de iluminação `acesa`, `apagada` ou `queimada`;
- controle automático de temperatura;
- preparação para integração futura com hardware real.

Seu trabalho é **organizar, refatorar, comentar, ensinar e deixar pronto para execução e estudos**, mesmo sem o hardware físico ainda existir.

---

## Contexto do Projeto

O sistema será usado em uma fazenda vertical indoor com cultivo hidropônico NFT. O objetivo é monitorar e controlar:

- pH da solução nutritiva;
- minerais da solução (`EC/TDS`);
- temperatura do ambiente;
- luminosidade do ambiente;
- status da iluminação;
- falhas críticas, como interrupção do fluxo NFT;
- alertas e histórico operacional.

### Regras funcionais já definidas

- se o pH sair da faixa ideal, o sistema deve alertar e permitir correção;
- se o sensor de minerais falhar, o sistema deve detectar anomalia;
- se o fluxo NFT falhar, o sistema deve gerar alerta crítico;
- se a iluminação estiver comandada como ligada, mas sem luminosidade compatível, o sistema deve marcar `queimada`;
- se a temperatura estiver acima da faixa ideal, o sistema deve reduzir potência luminosa, acionar resfriamento ou desligar em proteção;
- se a temperatura estiver abaixo da faixa ideal, o sistema deve acionar aquecimento ou restaurar a condição térmica ideal;
- o sistema precisa funcionar inicialmente com **simulação/mock**, sem depender do hardware real.

---

## Arquivos Existentes no Projeto

Considere que o projeto atual possui:

- `index.html` com interface pronta, mas tudo em um único arquivo;
- documentos `.md` e `.pdf` com a arquitetura física, software, integração e resultados;
- identidade visual do projeto em `ASTRO.png`.

Use o `index.html` atual como base visual e funcional. **Não descarte o que já existe. Refatore aproveitando a estrutura atual.**

---

## Stack Obrigatória e Preferencial

Escolha stacks que sejam **fáceis de entender, estudar e executar**, com foco principal em **JavaScript**.

### Prioridade de stack

1. **Frontend:** HTML + CSS + JavaScript modular
2. **Backend:** Node.js + Express
3. **Banco local para desenvolvimento:** SQLite
4. **Banco futuro para produção:** PostgreSQL
5. **Simulação IoT:** JavaScript/Node.js
6. **Java:** usar apenas se realmente agregar valor arquitetural, por exemplo deixando uma pasta `docs/java-future-architecture/` com proposta futura em Spring Boot, mas **não usar Java como backend principal desta entrega**

### Restrições

- evitar Python;
- só usar Python se for absolutamente indispensável para algum utilitário, e justificar no código;
- o foco principal deve ser JavaScript;
- o projeto deve ser simples o suficiente para estudo acadêmico.

---

## Objetivo Técnico da Implementação

Transforme o projeto atual em uma aplicação organizada em camadas, pronta para:

- rodar localmente;
- simular sensores e atuadores;
- exibir dados no dashboard;
- registrar logs e alertas;
- exportar dados;
- receber futuramente integração com ESP32/Arduino via API REST ou MQTT.

---

## O Que Deve Ser Entregue

### 1. Reorganização do Frontend

Separe o `index.html` atual em arquivos organizados:

- `index.html`
- `assets/css/variables.css`
- `assets/css/base.css`
- `assets/css/layout.css`
- `assets/css/components.css`
- `assets/css/dashboard.css`
- `assets/js/main.js`
- `assets/js/router.js`
- `assets/js/state.js`
- `assets/js/charts.js`
- `assets/js/mock-data.js`
- `assets/js/services/api.js`
- `assets/js/modules/dashboard.js`
- `assets/js/modules/alerts.js`
- `assets/js/modules/logs.js`
- `assets/js/modules/inventory.js`
- `assets/js/modules/harvest.js`

### 2. Backend Node.js

Crie um backend simples e didático com:

- `server/`
- `server/src/app.js`
- `server/src/server.js`
- `server/src/routes/sensors.routes.js`
- `server/src/routes/alerts.routes.js`
- `server/src/routes/logs.routes.js`
- `server/src/routes/actuators.routes.js`
- `server/src/controllers/`
- `server/src/services/`
- `server/src/repositories/`
- `server/src/database/`
- `server/src/database/schema.sql`
- `server/src/database/seed.js`
- `server/src/mocks/sensorSimulator.js`
- `server/src/config/`

### 3. Simulação sem Hardware

Implemente modo mock para:

- pH;
- EC/TDS;
- temperatura;
- luminosidade;
- status da iluminação;
- falha do fluxo NFT;
- estados dos atuadores.

### 4. Preparação para Hardware Futuro

Deixe preparado um ponto de integração futura com:

- `POST /api/telemetry`
- `POST /api/actuators/lighting`
- `POST /api/actuators/temperature`

E documente no código que:

- no futuro o ESP32 pode enviar dados por REST;
- no futuro o sistema pode migrar para MQTT;
- a camada mock deve poder ser desligada sem quebrar o frontend.

### 5. Código Comentado e Didático

Todo o código deve ser:

- comentado de forma pedagógica;
- fácil de estudar;
- organizado por responsabilidade;
- com nomes claros;
- com explicação breve nos trechos importantes.

### 6. Documentação no Próprio Projeto

Crie:

- `README.md` completo;
- `docs/arquitetura.md`;
- `docs/fluxo-dados.md`;
- `docs/regras-negocio.md`;
- `docs/integracao-hardware-futura.md`;
- `docs/estrutura-do-projeto.md`.

Esses documentos devem explicar:

- o que cada pasta faz;
- como executar o projeto;
- como o mock funciona;
- como integrar depois com hardware real;
- como o frontend conversa com o backend;
- como funcionam os alertas e atuadores.

---

## Regras de Negócio Que Devem Ser Implementadas

### Água

- monitorar pH continuamente;
- classificar pH como ideal, atenção ou crítico;
- permitir correção simulada do pH;
- monitorar minerais como `EC/TDS`;
- detectar `EC/TDS = 0` persistente como possível falha.

### NFT

- monitorar fluxo NFT;
- simular falha;
- gerar alerta crítico e log do evento.

### Luminosidade

Implementar três estados:

- `acesa`
- `apagada`
- `queimada`

Regras:

- se houver comando para ligar e a luminosidade estiver adequada, estado = `acesa`;
- se houver comando para desligar, estado = `apagada`;
- se houver comando para ligar e a luminosidade estiver incompatível com o esperado, estado = `queimada`.

### Temperatura

Implementar faixa ideal configurável.

Regras:

- se temperatura > limite ideal, reduzir potência luminosa ou acionar resfriamento;
- se temperatura > limite crítico, desligar iluminação em proteção;
- se temperatura < limite ideal, acionar aquecimento;
- registrar toda alteração de estado.

### Alertas

Classificação:

- `info`
- `warning`
- `critical`

Os alertas devem existir para:

- pH fora da faixa;
- sensor de minerais com falha;
- fluxo NFT interrompido;
- iluminação queimada;
- temperatura alta;
- temperatura baixa;
- perda de conexão futura com dispositivo.

---

## Arquitetura Esperada

### Frontend

Use **HTML + CSS + JavaScript modular**, sem framework pesado, para facilitar estudo.

O frontend deve:

- manter o visual atual do projeto Astro Verde;
- melhorar organização do CSS;
- manter responsividade;
- exibir dashboard com cards, gráficos, logs e alertas;
- mostrar claramente os estados ambientais e dos atuadores.

### Backend

Use **Node.js + Express** com arquitetura simples:

- `routes` para rotas;
- `controllers` para entrada HTTP;
- `services` para regras de negócio;
- `repositories` para persistência;
- `mocks` para simulação.

### Banco

Use **SQLite** para deixar simples de rodar.

Crie tabelas para:

- sensores;
- leituras;
- atuadores;
- alertas;
- logs;
- configurações da faixa ideal.

### Simulação

O simulador deve gerar:

- leitura variável de pH;
- leitura variável de EC/TDS;
- temperatura variável;
- luminosidade variável;
- possibilidade de falha manual.

---

## O Que Fazer com o HTML e CSS Já Prontos

O `index.html` atual já possui base visual forte. Você deve:

- preservar identidade visual;
- extrair o CSS inline para arquivos separados;
- extrair scripts inline para módulos JS;
- remover duplicações;
- melhorar sem destruir a interface existente;
- comentar o HTML e o CSS;
- explicar nos comentários por que cada bloco existe.

### Atenção importante

Se houver lógica duplicada, como funções repetidas, unifique.

Se houver trechos grandes sem separação semântica, reorganize em:

- header;
- sidebar;
- dashboard;
- estoque;
- safras;
- logs;
- modal;
- gráficos;
- componentes reutilizáveis.

---

## Nível de Comentários Esperado

Quero um projeto com perfil de estudo. Portanto:

- comente o HTML explicando seções importantes;
- comente o CSS explicando layout, tokens e componentes;
- comente o JS explicando fluxo, estado, atualização de tela e integração com API;
- comente o backend explicando rota, controller, service e mock;
- escreva comentários curtos, úteis e didáticos;
- evite comentários óbvios como “define uma variável”.

---

## Requisitos de Qualidade

O projeto final deve:

- rodar localmente sem hardware;
- ter mock funcional;
- ser fácil de entender;
- ter código limpo;
- ter arquivos separados por responsabilidade;
- ter comentários didáticos;
- ter README ensinando execução;
- estar pronto para futura integração com ESP32/Arduino;
- ter interface coerente com os documentos do projeto.

---

## Entrega Esperada do Cloud Code

Quero que você:

1. analise a estrutura atual do projeto;
2. refatore sem perder a identidade visual;
3. separe frontend em arquivos;
4. implemente backend Node.js com mocks;
5. conecte frontend e backend;
6. comente todo o código importante;
7. crie documentação interna didática;
8. deixe tudo pronto para rodar;
9. explique passo a passo como executar;
10. explique como trocar mock por hardware real no futuro.

---

## Critérios de Aceitação

Só considere a tarefa concluída se:

- o frontend estiver separado em HTML, CSS e JS;
- o backend estiver funcional;
- houver simulação de sensores e atuadores;
- o dashboard mostrar pH, EC/TDS, temperatura, luminosidade e estado da iluminação;
- houver alertas para temperatura e iluminação;
- o projeto estiver bem comentado;
- o projeto estiver documentado;
- o projeto rodar localmente;
- a base estiver preparada para integração futura com hardware.

---

## Instrução Final

Implemente o projeto com postura de **professor + engenheiro**, ou seja:

- além de construir, explique;
- além de comentar, organize;
- além de organizar, deixe pronto para continuar evoluindo;
- use JavaScript como principal linguagem;
- use Java apenas como referência arquitetural futura, se realmente necessário;
- não use Python como solução principal;
- mantenha o projeto simples, técnico, pedagógico e executável.

Ao final, entregue:

- estrutura final de pastas;
- código completo;
- comentários didáticos;
- instruções de execução;
- resumo das decisões técnicas;
- próximos passos para integração real com hardware.
