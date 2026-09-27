# Plano técnico

## Objetivo

O Dungeon do Código recebe código C simples, analisa suas funções e transforma a estrutura do programa em uma dungeon explorável. Cada função vira uma sala; métricas de linhas e estruturas de controle influenciam o tamanho, a cor e o perigo. A exploração permite relacionar o mapa ao código exibido no inspetor.

## Fluxo de dados

```text
Código C
  -> análise léxica e extração de funções
  -> funções, métricas e chamadas conhecidas
  -> grafo do programa
  -> layout determinístico
  -> salas e corredores da dungeon
  -> exploração no Canvas e inspector no DOM
```

No estado atual, `analisadorC.js` extrai chamadas conhecidas, `grafoC.js` concentra as relações estruturais, `layoutMasmorra.js` calcula a geometria e o mundo lógico dinâmico, e `masmorra.js` monta as salas. Os corredores já consomem as arestas reais, e a câmera permite seguir o personagem, focar uma sala e encaixar o mundo inteiro no viewport.

## Funcionalidades existentes

- Editor de código C no navegador.
- Importação local de um `.c` por vez pelo seletor ou drop no editor, com limite de 512 KiB e mensagens de erro sem apagar o código anterior; a geração continua explícita.
- Análise local sem executar o código fornecido.
- Detecção de funções, corpo original, linhas, total e contagem por tipo de estruturas de controle (`if`, `for`, `while`, `switch`, `case`).
- Ignorância de comentários e literais ao analisar estrutura, preservando o texto exibido.
- Validação de corpos, strings, caracteres e comentários incompletos.
- Detecção de chamadas entre funções conhecidas.
- Detecção de recursão direta e participação em ciclos de chamadas conhecidas, com indicadores nos nós, salas e inspector.
- Escolha de `main` como sala inicial, ou da primeira função quando não há `main`.
- Cálculo de chamadas recebidas e profundidade alcançável a partir da função inicial.
- Layout por colunas de profundidade, ordenação vertical por callers da coluna anterior e coluna separada para funções isoladas.
- Salas coloridas e criaturas conforme complexidade.
- Marcadores em pixels inteiros nas laterais das salas: I/F/W/S para presença de estruturas e R/C para recursão direta ou ciclo indireto, com legenda HTML. Quantidades detalhadas, inclusive `case`, ficam no inspector.
- Modos visuais Complexidade e Estrutura: o primeiro preserva cores e criaturas ligadas à complexidade; o segundo usa base neutra e marcadores de maior contraste, ocultando criaturas. Uma nova dungeon inicia em Complexidade.
- Exploração por WASD/setas, foco no mapa, liberação por clique fora e `Esc`.
- Preferência de movimento reduzido.
- Inspector com descrição, perigo, métricas e trecho de código.
- Grafo explícito em `grafoC.js` e corredores baseados em chamadas reais.
- Layout separado em `layoutMasmorra.js`, com mundo lógico dinâmico.
- Testes de estresse com 5, 15, 30 e 60 funções, sem sobreposição de salas nos cenários atuais.
- Linha de base de legibilidade dos corredores: cruzamentos transversais, corredores que atravessam o interior de outra sala e comprimento total dos segmentos retos atuais.
- Primeiro experimento de ordenação vertical determinística: reduziu as três métricas no diagnóstico denso de 24 funções, sem sobreposição de salas.
- Câmera básica que acompanha o personagem e respeita os limites do mundo; viewport de 560x480 e movimento limitado pelas dimensões do mundo.
- Validação manual da câmera concluída pelo mantenedor, com salas e corredores alinhados, controles funcionando e nenhum bug visual encontrado.
- Barra de câmera com zoom manual em passos de 25%, retorno a 100% e visão geral que encaixa a dungeon inteira no viewport. A validação visual desse novo recurso ainda está pendente.
- Inspector estrutural com callers, callees, caminho mínimo desde a entrada, total e perfil de estruturas de controle e indicadores de ciclo.
- Navegação por botões de callers e callees, com foco manual da câmera na sala selecionada sem teleportar o personagem.
- Busca por nome de função na dungeon atual, com foco pelo mesmo mecanismo das relações.
- Foco topológico da função selecionada, preservando todas as cadeias relevantes desde a entrada e atenuando salas e corredores fora do contexto sem ocultá-los.
- 207 testes automatizados Node.js registrados como passando.

## Funcionalidades futuras

- Leitura estrutural avançada: navegação pelo caminho completo e filtros estruturais.
- Minimapa e controles futuros como pan manual, drag e zoom contínuo.
- Colisão/topologia.
- Novas melhorias do layout e dos corredores para reduzir cruzamentos, travessias de salas e comprimento quando os casos medidos justificarem.
- PWA.
- Exportação de resultados.
- Comparação antes/depois de duas versões do código.
- Destaque das estruturas que contribuíram para uma métrica.
- Missões de leitura e exercícios guiados.
- Controles de toque e layout adaptável.

## Roadmap

### Fase 1: fundação e confiança

- Manter parser para o subconjunto simples de C suportado.
- Preservar testes de strings, comentários, caracteres, índices e entradas incompletas.
- Manter processamento local, sem compilação ou execução.

### Fase 2: grafo estrutural

- Concluído: modelo explícito em `grafoC.js`, com nós por funções e arestas por chamadas reais.
- Concluído: chamadas recebidas, profundidade mínima e alcançabilidade, com tratamento de ciclos e recursão sem loop infinito.
- Concluído: um caminho mínimo e determinístico desde a entrada para cada função alcançável.
- Concluído: recursão direta e participação em ciclos de chamadas conhecidas.
- Pendente: enumeração de múltiplos caminhos e análises mais avançadas de ciclos.

### Fase 3: geometria e exploração

- Concluído: geometria em `layoutMasmorra.js` e mundo lógico dinâmico.
- Concluído: testes de estresse com 5, 15, 30 e 60 funções, com zero sobreposições de salas nos cenários atuais.
- Concluído: cenário e corredores consomem as arestas reais.
- Concluído: câmera básica com viewport de 560x480 e validação manual pelo mantenedor.
- Concluído: zoom manual, retorno a 100% e Encaixar para visão geral da dungeon; validação visual desse recurso pendente.
- Concluído: linha de base determinística da legibilidade dos corredores, sem mudança de geometria ou desenho.
- Concluído: primeiro experimento de ordem vertical por callers, mantendo colunas e dimensões; cenário denso passou de 59/15/6439,16 para 17/8/5307,77 em cruzamentos/travessias/comprimento.
- Pendentes: minimapa e colisão/topologia.

### Fase 4: leitura estrutural do programa

- Concluído: inspector estrutural com callers, callees, um caminho mínimo desde a entrada, total e perfil de estruturas de controle e indicadores de ciclo.
- Concluído: navegação por botões de callers e callees, com seleção independente da sala física e foco manual da câmera.
- Concluído: busca por função na dungeon atual, com foco pelo mesmo fluxo da navegação estrutural.
- Concluído: foco contextual no Canvas baseado em todas as relações reais até a função selecionada, sem alterar grafo, layout ou roteamento.
- Concluído: marcadores de presença nas salas para I/F/W/S e R/C, preservando a cor de complexidade, a geometria e os contornos de interação.
- Concluído: modos visuais Complexidade e Estrutura, com alternância imediata sem mudar grafo, geometria, câmera, busca ou inspector.
- Destaque de métricas e outras formas de explorar relações.
- Inspector acessível, foco previsível e controles de toque.
- Validar a experiência com usuários e programas curtos.

### Fase 5: arquivos e exportação

- Concluído: importar um `.c` local por escolha explícita ou drop, sem upload, execução ou persistência.
- Exportar uma imagem ou relatório do grafo/layout.
- Evitar persistência automática até existir uma necessidade clara.

### Pós-v1: comparação A/B

Permitir colar duas versões e comparar funções, chamadas, complexidade e mudanças de layout. Renomeações e ambiguidades devem ser explicitadas, sem sugerir que menos linhas sempre significa código melhor.

## Exemplos de código C para testar

### Cadeia linear

```c
void c(void) {}
void b(void) { c(); }
int main(void) { b(); return 0; }
```

### Ramificação

```c
void esquerda(void) {}
void direita(void) {}
int main(void) {
  if (1) esquerda();
  else direita();
  return 0;
}
```

### Múltiplos callers

```c
void comum(void) {}
void primeiro(void) { comum(); }
void segundo(void) { comum(); }
int main(void) { primeiro(); segundo(); return 0; }
```

### Função isolada

```c
void isolada(void) {}
int main(void) { return 0; }
```

### Recursão

```c
int fatorial(int n) {
  if (n <= 1) return 1;
  return n * fatorial(n - 1);
}
int main(void) { return fatorial(3); }
```

### Ciclo entre funções

```c
void b(void);
void a(void) { b(); }
void b(void) { a(); }
int main(void) { a(); return 0; }
```

### Chamadas falsas em string e comentário

```c
void real(void) {}
int main(void) {
  printf("real() nao e uma chamada aqui");
  /* real(); também não é chamada */
  return 0;
}
```

### Programa com muitas funções

Gerar uma sequência de funções `f01` a `f30`, com `main` chamando algumas funções e cada função chamando a seguinte. Repetir com 60 funções para observar legibilidade, limites do Canvas e tempo de análise.

## Testes de estresse

Os cenários determinísticos com 5, 15, 30 e 60 funções estão concluídos em `testes/layoutMasmorra-estresse.test.js`. Cadeias, funções no mesmo nível e combinações com funções isoladas apresentam zero sobreposições de salas nos cenários atuais; os resultados estão em `ESTADO_ATUAL.md`. Esses cenários mantiveram suas métricas de corredores após a ordenação vertical. Um diagnóstico denso de 24 funções agora compara cruzamentos, travessias do interior de salas e comprimento dos corredores retos antes/depois. A navegação com câmera também foi validada manualmente pelo mantenedor. Novas medições de análise, grafo, layout, primeiro desenho e interação, além de casos adicionais, devem orientar qualquer adoção futura de uma biblioteca de layout.

## Segurança

A auditoria final de segurança permanece pendente. As regras abaixo continuam sendo requisitos do projeto.

- Tratar o texto como dados; não executar, compilar ou interpretar C.
- Usar `textContent` e elementos DOM criados programaticamente para conteúdo do usuário.
- Evitar `eval`, `new Function` e inserção com `innerHTML`.
- Manter o processamento local e não enviar código para backend sem decisão explícita.
- Limitar trechos, partículas e trabalho por quadro para evitar consumo desnecessário.

## Acessibilidade

Manter foco visível e previsível, teclado com ativação no mapa, liberação por `Esc`, mensagens com `aria-live`, rótulos de Canvas e inspector em DOM. Respeitar `prefers-reduced-motion`. Validar também contraste, leitura por teclado e comportamento em telas menores.

## Performance

Priorizar análise linear no tamanho do texto, layout determinístico e renderização limitada ao Canvas atual. Medir antes de otimizar. A câmera básica já está implementada. Para novas necessidades em mapas maiores, medir antes de considerar agrupamento, desenho incremental ou dependências pesadas.

## Publicação

A aplicação é estática e pode ser servida por um servidor de arquivos. O fluxo local documentado usa `python3 -m http.server`. Antes de publicar, executar a suíte, `git diff --check`, revisar o diff e testar o fluxo principal em navegador.

## Exportação

A exportação futura deve ser explícita e local, com formato documentado. Pode começar por imagem do mapa e relatório de funções/arestas, sem criar conta ou backend.
