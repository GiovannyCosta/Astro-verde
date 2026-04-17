# Regras de Negócio — Astro Verde

## 1. pH da Solução Nutritiva (RF08)

| Condição | Estado | Ação |
|----------|--------|------|
| 5.5 ≤ pH ≤ 6.5 | Ideal | Nenhuma |
| pH < 5.2 ou pH > 6.8 | Crítico | Alerta critical + borda vermelha no card |
| 5.2 ≤ pH < 5.5 ou 6.5 < pH ≤ 6.8 | Atenção | Alerta warning |
| Botão "Injetar" pressionado | — | pH restaurado para 6.0, log registrado |

## 2. EC/TDS — Minerais (RF08)

| Condição | Estado | Ação |
|----------|--------|------|
| 1.2 ≤ EC ≤ 2.5 | Ideal | Nenhuma |
| EC < 0.1 com fluxo NFT ativo | Falha | Alerta critical "falha de sensor de minerais" |

TDS é calculado automaticamente: `TDS = EC × 500`

## 3. Fluxo NFT (RF07)

| Condição | Ação |
|----------|------|
| Fluxo ativo | Exibe "Circulando" |
| Fluxo interrompido | Alerta critical, log, congela simulação |
| Restauração automática (10s no mock) | Log de recuperação |

## 4. Iluminação (RF02)

Três estados derivados do **comando** + **leitura do sensor de luminosidade**:

| Comando | Lux medido | Estado |
|---------|-----------|--------|
| on | ≥ 200 lux | **Acesa** |
| off | qualquer | **Apagada** |
| on | < 200 lux | **Queimada** (alerta critical) |

## 5. Temperatura Ambiente (RF03)

| Faixa | Estado | Ação automática |
|-------|--------|----------------|
| 18 – 26°C | Ideal | Nenhuma |
| 26 – 30°C | Elevada | Reduz potência luminosa para 60%; ativa resfriamento |
| > 30°C | Crítica | Desliga iluminação (proteção); ativa resfriamento; alerta critical |
| < 18°C | Baixa | Ativa aquecimento; alerta warning |

## 6. Classificação de Alertas

| Tipo | Cor | Exemplos |
|------|-----|---------|
| info | Azul | Sistema iniciado, exportação realizada |
| warning | Amarelo | pH próximo do limite, temperatura alta, EC baixo |
| critical | Vermelho | Fluxo NFT interrompido, lâmpada queimada, temperatura crítica |
