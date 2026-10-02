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

A baseline `v0.1.0`, a consolidação das duas telas (`9c9c0b7`) e a revisão de
segurança (`e5253c2`) já estão integradas à `main`. A demonstração está publicada
no Cloudflare Pages, com HTTPS, cabeçalhos e fluxos conferidos em Firefox e
Chromium. A versão pública consolidada está marcada como `v0.2.0` no commit
`5fded90`.
O histórico está em `../EVOLUCAO.md`; o escopo da publicação está em `PUBLICACAO.md`.

---

O licenciamento do projeto usa MIT, registrada em `../LICENSE` e `package.json`.
As fontes mantêm suas licenças em `assets/fontes/`. O About do GitHub já contém
a descrição e o link da demonstração. Esses registros de fechamento estão
concluídos; o plano passa a priorizar os próximos ciclos educativos.

---

# Etapa 1 — Confiança na análise

Depois da revisão de segurança e da publicação validada, o próximo foco educativo será aumentar a confiança no que o Dungeon afirma sobre o código.

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

## 3.1 Preservar as duas telas consolidadas

O refinamento visual da entrada e da exploração já foi concluído. Mudanças
futuras devem responder a problemas observados, preservar o editor como foco
na entrada e manter os controles, o mapa e o inspector legíveis.

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

# Etapa 5 — Manutenção de segurança e hospedagem

Os controles atuais estão implementados e a demonstração está publicada.
Esta etapa é contínua: não repetir a revisão e o deploy como trabalho futuro.

A cada mudança relevante:

- revisar os pontos que recebem e exibem entrada do usuário;
- preservar validações, limites, cancelamento e testes de regressão;
- revisar novos recursos externos e seus efeitos na privacidade e na CSP;
- conferir os cabeçalhos reais depois de alterações na hospedagem;
- verificar módulos, Worker e fluxos afetados na versão ao vivo;
- atualizar `../SECURITY.md` e `PUBLICACAO.md` quando houver mudança.

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

1. Explicar melhor a análise e seus limites.
2. Adicionar exemplos prontos.
3. Melhorar UX e acessibilidade a partir de problemas observados.
4. Adicionar exportação.
5. Iniciar os recursos de versões posteriores.

Segurança e validação da hospedagem acompanham cada ciclo.

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
