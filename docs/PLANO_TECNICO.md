# Plano técnico

Este documento organiza o trabalho que **ainda falta** no Dungeon do Código.

O estado funcional atual está em `ESTADO_ATUAL.md`.

A organização dos módulos está em `ARQUITETURA.md`.

As decisões que devem ser preservadas estão em `DECISOES.md`.

Este arquivo não deve repetir funcionalidades já concluídas como se ainda fossem trabalho futuro.

---

# Objetivo atual

O projeto já possui uma base funcional ampla:

- análise de código C;
- grafo de chamadas;
- regiões semânticas;
- layout regional;
- corredores semânticos;
- galerias físicas;
- área caminhável;
- colisão;
- câmera;
- zoom;
- busca;
- inspector;
- foco contextual;
- navegação manual e automática;
- visual completo de dungeon.

A baseline `v0.1.0` já está incorporada à `main`. O objetivo deste ciclo é
consolidar os refinamentos da página inicial e da exploração com documentação
alinhada, testes e revisão visual, preservando esse ponto estável.

---

# Etapa 0 — Consolidar os refinamentos posteriores à baseline

## 0.1 Estado já concluído

- baseline `v0.1.0` criada no commit `ae885db`;
- incorporação à `main` pelo commit `fc6da7a`;
- página inicial com materiais e sprites compartilhados;
- revisão da composição regional, dos caminhos, das portas e da decoração;
- barra de câmera e modo visual com legenda expansível;
- documentação atualizada para o código desta revisão;
- suíte local com 354 testes passando e nenhuma falha.

Não recriar a tag `v0.1.0` nem tratar essas funcionalidades como trabalho futuro.

## 0.2 Validação visual pendente nesta revisão

Conferir as duas telas no navegador com código pequeno e com muitas funções:

- editor, arquivo `.c`, mensagens de erro e retorno ao editor;
- busca, inspector, callers/callees e foco contextual;
- clique, duplo clique e navegação automática;
- WASD, setas, liberação do foco e colisão em portas e cruzamentos;
- zoom, Encaixar, câmera livre e troca de modo visual;
- legenda expansível e redimensionamento do viewport;
- função isolada, programa sem `main`, recursão e ciclos;
- geração de outra dungeon depois da anterior.

Os testes de integração não substituem a avaliação visual de legibilidade e
acabamento. Não registrar como concluída uma inspeção que não foi realizada.

## 0.3 Registrar esta consolidação

Depois da revisão visual e da aplicação das correções:

1. executar `npm test` e `git diff --check`;
2. conferir os arquivos alterados e novos;
3. adicionar apenas os arquivos usados pelo projeto;
4. revisar o conteúdo preparado e executar `git diff --cached --check`;
5. commitar a consolidação das duas telas e da circulação física.

A imagem de referência solta na raiz não é usada pelo HTML, CSS ou JavaScript
atual e não faz parte desta consolidação. Não é necessário apagá-la.

A tag `v0.1.0` permanece como referência histórica. Outra tag exige uma escolha
de versão para um ciclo posterior. Fazer push somente com autorização explícita.

---

# Etapa 1 — Confiança na análise

Depois desta consolidação, o próximo foco técnico deve ser aumentar a confiança no que o Dungeon afirma sobre o código.

---

## 1.1 Explicar a métrica de complexidade

Hoje a interface mostra uma pontuação.

O usuário deve conseguir entender de onde ela veio.

Exemplo conceitual:

```text
Complexidade: 12

if: 3
for: 1
while: 0
switch: 1
case: 2
...
```

Antes de mudar a fórmula atual:

- documentá-la;
- explicar seus componentes;
- criar testes específicos;
- avaliar impacto na representação visual.

---

## 1.2 Detectar situações potencialmente não suportadas

O analisador trabalha com um subconjunto de C.

Quando possível, detectar construções que podem tornar a análise incompleta.

Casos de interesse:

- macros complexas;
- pré-processamento condicional;
- ponteiros de função;
- declarações incomuns;
- formas avançadas da gramática.

A interface pode apresentar um aviso como:

```text
Esta análise pode estar incompleta.
```

O aviso deve ser usado quando houver evidência, não como mensagem genérica em todos os casos.

---

## 1.3 Chamadas externas

Hoje apenas funções internas conhecidas entram no grafo.

Uma evolução útil é registrar chamadas externas como informação complementar.

Exemplos:

```text
printf
malloc
free
strlen
fopen
```

Essas chamadas:

- não viram salas;
- não viram nós internos;
- podem aparecer no inspector.

Objetivo:

```text
mais informação
sem inventar arquitetura interna
```

---

## 1.4 Descrições de função com fonte real

Não gerar descrições arbitrárias a partir apenas do nome da função.

Uma fonte aceitável pode ser:

- comentário associado à função;
- documentação explicitamente presente no código.

Exemplo:

```c
// Calcula o menor caminho entre dois pontos.
int calcular_caminho(...) {
```

Sem fonte explícita, não inventar a finalidade da função.

---

# Etapa 2 — Exemplos prontos

Adicionar programas C de demonstração.

Objetivos:

- permitir testar o projeto imediatamente;
- facilitar apresentações;
- mostrar diferentes estruturas;
- fornecer casos estáveis para validação manual.

Conjunto inicial sugerido:

```text
1. cadeia simples
2. ramificações
3. recursão
4. ciclo
5. funções isoladas
6. programa maior
```

Cada exemplo deve ser curto o suficiente para ser compreendido.

---

# Etapa 3 — UX e acessibilidade

Depois da confiança básica da análise, melhorar pequenos pontos de alto retorno.

---

## 3.1 Primeira tela

A primeira tela pode receber refinamento visual para ficar mais coerente com a dungeon.

Regras:

- preservar a estrutura atual;
- editor continua sendo o foco;
- não transformar a página em dashboard;
- não adicionar informação desnecessária;
- usar decoração leve;
- manter boa responsividade.

Possíveis melhorias:

- moldura arquitetônica discreta;
- detalhes de pedra;
- brilho leve;
- tochas ou partículas sutis;
- melhor integração visual com a tela de exploração.

---

## 3.2 Mensagens de erro

Tornar erros mais úteis.

Separar claramente:

```text
entrada C inválida
```

de:

```text
defeito interno da aplicação
```

Quando possível mostrar:

- linha;
- tipo do problema;
- sugestão objetiva.

---

## 3.3 Acessibilidade

Revisar:

- foco por teclado;
- ordem de tabulação;
- nomes acessíveis;
- contraste;
- mensagens de estado;
- redução de movimento;
- uso sem mouse sempre que possível.

---

## 3.4 Viewport pequeno

Continuar validando:

- notebooks menores;
- janelas estreitas;
- zoom do navegador;
- inspector e controles sem sobreposição.

Detalhes decorativos podem ser reduzidos quando o espaço for pequeno.

---

# Etapa 4 — Exportação

Depois da baseline e da confiança da análise, adicionar formas de exportar resultados.

---

## 4.1 Exportar imagem

Possibilidade inicial:

```text
PNG da dungeon
```

Cuidados:

- incluir apenas a área desejada;
- respeitar escala;
- evitar depender do viewport atual quando houver modo de exportação completa.

---

## 4.2 Exportar dados estruturais

Possível formato:

```text
JSON
```

Dados úteis:

- funções;
- métricas;
- arestas;
- callers;
- callees;
- regiões;
- posição das salas.

Galerias físicas devem ser identificadas como circulação, não chamadas.

---

# Etapa 5 — Segurança e publicação

Antes de disponibilizar a primeira versão pública, fazer uma revisão específica.

---

## 5.1 Entrada do usuário

Revisar:

- tratamento de texto;
- tamanho máximo;
- importação de arquivo;
- nomes de funções;
- conteúdo exibido no inspector;
- mensagens de erro.

Conteúdo do usuário não deve ser interpretado como HTML.

---

## 5.2 Dependências e recursos externos

Confirmar:

- quais recursos externos existem;
- se são realmente necessários;
- se há risco de carregamento remoto inesperado;
- se a aplicação continua funcional como frontend estático.

---

## 5.3 Política de privacidade técnica

A documentação pública deve deixar claro:

- análise local;
- ausência de backend próprio;
- ausência de execução de C;
- ausência de compilação;
- comportamento da importação de arquivos.

---

## 5.4 Deploy

Depois da revisão de segurança:

- escolher hospedagem estática;
- validar caminhos relativos;
- validar cache;
- validar carregamento de módulos;
- testar em navegadores comuns;
- testar versão publicada.

---

# Etapa 6 — Refinamentos estruturais posteriores

Esses itens não são necessários para concluir a consolidação atual.

---

## 6.1 Melhorar encontros de percursos

Concluído neste refinamento: junções locais compartilhadas pela física e navegação,
prioridade para portas com folga e desenho dos caminhos em camadas para remover
paredes internas decorativas. As relações do grafo permanecem separadas dessas junções.

Ainda podem existir situações visualmente densas próximas de:

- portas;
- curvas;
- sobreposições;
- regiões compactas.

Futuras melhorias devem preservar:

- identidade do percurso;
- ausência de conexões falsas;
- área caminhável;
- determinismo.

---

## 6.2 Entradas arquitetônicas de região

Hoje galerias podem conectar salas escolhidas geometricamente.

Uma evolução futura pode estudar acessos mais arquitetônicos entre regiões.

Exemplo conceitual:

```text
Ala A
  ↓
acesso da região
  ↓
galeria
  ↓
acesso da região
  ↓
Ala B
```

Isso só deve ser implementado se melhorar significativamente a leitura da dungeon.

Não é requisito da primeira baseline.

---

## 6.3 Refinar densidade visual

Avaliar:

- quantidade de tochas;
- pedras;
- musgo;
- placas;
- detalhes de alvenaria;
- criaturas em mapas densos.

O objetivo é manter o mapa legível sem perder identidade visual.

---

# Etapa 7 — Recursos para versões posteriores

Itens para depois da primeira versão pública estável.

---

## Comparação antes/depois

Permitir comparar duas versões do mesmo código.

Possíveis perguntas:

- quais funções surgiram?
- quais desapareceram?
- quais relações mudaram?
- quais métricas mudaram?
- como a estrutura espacial mudou?

---

## Visão textual alternativa

Criar uma alternativa ao Canvas para:

- acessibilidade;
- leitura rápida;
- compartilhamento;
- testes.

Pode apresentar uma árvore ou lista estrutural.

---

## Atividades de leitura de código

Possível camada educacional:

- encontre a função mais chamada;
- encontre uma função isolada;
- encontre um ciclo;
- siga o caminho até uma função;
- identifique recursão.

Essa camada deve ser adicionada sem transformar o mapa em uma narrativa que invente significado.

---

## Outros analisadores ou linguagens

O projeto pode futuramente separar ainda mais:

```text
analisador
    ↓
modelo estrutural comum
    ↓
dungeon
```

Isso permitiria estudar suporte a outras linguagens.

Não é prioridade atual.

---

# O que não é prioridade agora

Não é objetivo imediato:

- migrar para React;
- usar Three.js;
- usar WebGL;
- adicionar motor de jogos;
- implementar multiplayer;
- executar código C;
- compilar código C;
- criar backend sem necessidade;
- substituir o analisador por um parser completo sem problema concreto;
- adicionar funcionalidades apenas para parecer mais sofisticado.

---

# Ordem recomendada

A ordem de trabalho depois desta reorganização é:

```text
1. fechar baseline
2. confiar e explicar melhor a análise
3. adicionar exemplos prontos
4. melhorar UX e acessibilidade
5. adicionar exportação
6. revisar segurança
7. publicar
8. iniciar recursos de versões posteriores
```

---

# Critério de prioridade

Toda nova funcionalidade deve responder pelo menos uma destas perguntas:

```text
Ajuda a entender o código?

Melhora a confiabilidade da análise?

Melhora a legibilidade da dungeon?

Melhora a navegação?

Melhora a acessibilidade?

Melhora a segurança?

Resolve um problema observado?
```

Se não responder a nenhuma delas, provavelmente não é prioridade.

---

# Regra do plano

Este documento deve conter apenas trabalho ainda relevante.

Quando uma etapa for concluída:

- remover sua descrição de “próximo passo”;
- registrar o marco em `EVOLUCAO.md`;
- atualizar `ESTADO_ATUAL.md` se o comportamento do produto mudar;
- atualizar `ARQUITETURA.md` ou `DECISOES.md` quando houver mudança estrutural.

Assim, o plano continua sendo um roteiro real, e não um histórico acumulado.
