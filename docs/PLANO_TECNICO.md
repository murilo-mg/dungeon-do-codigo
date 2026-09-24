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

No estado atual, a extração de chamadas e parte das relações ainda vivem em `analisadorC.js` e `masmorra.js`; o grafo explícito e os corredores baseados em arestas ainda são trabalho futuro.

## Funcionalidades existentes

- Editor de código C no navegador.
- Análise local sem executar o código fornecido.
- Detecção de funções, corpo original, linhas e estruturas de controle.
- Ignorância de comentários e literais ao analisar estrutura, preservando o texto exibido.
- Validação de corpos, strings, caracteres e comentários incompletos.
- Detecção de chamadas entre funções conhecidas.
- Escolha de `main` como sala inicial, ou da primeira função quando não há `main`.
- Cálculo de chamadas recebidas e profundidade alcançável a partir da função inicial.
- Layout atual por colunas de profundidade e coluna separada para funções isoladas.
- Salas coloridas e criaturas conforme complexidade.
- Exploração por WASD/setas, foco no mapa, liberação por clique fora e `Esc`.
- Preferência de movimento reduzido.
- Inspector com descrição, perigo, métricas e trecho de código.
- Testes automatizados Node.js.

## Funcionalidades futuras

- Modelo de grafo explícito com arestas de chamadas reais.
- Corredores desenhados conforme as arestas do grafo.
- Layout sem sobreposição para mapas maiores.
- Câmera, zoom e navegação para dungeons extensas.
- Busca por função e navegação direta.
- Importação de arquivos `.c` e exportação de resultados.
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

- Extrair o modelo de grafo para um módulo próprio.
- Representar nós por funções e arestas por chamadas reais.
- Calcular chamadas recebidas, profundidade, alcançabilidade, caminhos e ciclos.
- Definir representação clara para recursão, ciclos e funções isoladas.

### Fase 3: geometria e exploração

- Mover a geometria para `layoutMasmorra.js`.
- Eliminar sobreposições em conjuntos de funções pequenos e médios.
- Fazer o cenário e os corredores consumirem as arestas reais.
- Adicionar câmera e zoom apenas quando o mapa exigir.

### Fase 4: leitura e acessibilidade

- Busca por função.
- Destaque de relações e métricas.
- Inspector acessível, foco previsível e controles de toque.
- Validar a experiência com usuários e programas curtos.

### Fase 5: arquivos e exportação

- Importar `.c` por escolha explícita do usuário.
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

Executar cenários determinísticos com 5, 15, 30 e 60 funções. Medir tempo de análise, construção do grafo, layout, primeiro desenho e interação. Verificar sobreposição, funções isoladas, múltiplos callers, recursão e ciclos. O resultado deve orientar qualquer adoção futura de uma biblioteca de layout.

## Segurança

- Tratar o texto como dados; não executar, compilar ou interpretar C.
- Usar `textContent` e elementos DOM criados programaticamente para conteúdo do usuário.
- Evitar `eval`, `new Function` e inserção com `innerHTML`.
- Manter o processamento local e não enviar código para backend sem decisão explícita.
- Limitar trechos, partículas e trabalho por quadro para evitar consumo desnecessário.

## Acessibilidade

Manter foco visível e previsível, teclado com ativação no mapa, liberação por `Esc`, mensagens com `aria-live`, rótulos de Canvas e inspector em DOM. Respeitar `prefers-reduced-motion`. Validar também contraste, leitura por teclado e comportamento em telas menores.

## Performance

Priorizar análise linear no tamanho do texto, layout determinístico e renderização limitada ao Canvas atual. Medir antes de otimizar. Para mapas maiores, considerar câmera, agrupamento e desenho incremental antes de adotar dependências pesadas.

## Publicação

A aplicação é estática e pode ser servida por um servidor de arquivos. O fluxo local documentado usa `python3 -m http.server`. Antes de publicar, executar a suíte, `git diff --check`, revisar o diff e testar o fluxo principal em navegador.

## Exportação

A exportação futura deve ser explícita e local, com formato documentado. Pode começar por imagem do mapa e relatório de funções/arestas, sem criar conta ou backend.
