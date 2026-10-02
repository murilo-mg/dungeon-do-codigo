# Caminho de evolução

Este documento registra os principais marcos já concluídos do **Dungeon do Código**.

Ele funciona como histórico de evolução.

O estado atual está em `docs/ESTADO_ATUAL.md`.

O trabalho ainda planejado está em `docs/PLANO_TECNICO.md`.

A ideia central do projeto permanece:

> transformar a estrutura real de um código em uma dungeon que ajude o usuário a compreender o programa.

A linguagem visual pode usar referências de jogos, mas o mapa não deve inventar significado.

---

# 1. Base visual inicial

O projeto começou como uma experiência simples em Canvas.

As primeiras versões estabeleceram:

- personagem;
- salas;
- cenário;
- criaturas;
- efeitos;
- movimentação com teclado;
- painel lateral;
- controle de foco da exploração.

Nesse estágio, a prioridade era provar que código poderia ser apresentado como um espaço explorável.

---

# 2. Análise estrutural mais segura

A análise de C ganhou uma etapa léxica separada.

Passou a distinguir:

- código;
- comentários;
- strings;
- caracteres.

Isso corrigiu problemas como interpretar:

```c
printf("if while }");
```

como estruturas reais da linguagem.

Também foram tratados casos como:

- strings incompletas;
- comentários incompletos;
- chaves inconsistentes;
- palavras reservadas dentro de literais;
- marcadores de comentário dentro de strings.

Essa revisão está documentada em `CORRECOES.md`.

A partir daí, cada bug importante do analisador passou a ser candidato a caso de regressão automatizado.

---

# 3. Grafo real de chamadas

As relações entre funções conhecidas passaram a ser representadas explicitamente.

O grafo passou a manter:

- nós;
- arestas;
- função de entrada;
- callers;
- callees;
- alcançabilidade;
- profundidade mínima;
- caminho estrutural;
- recursão direta;
- participação em ciclos.

Quando existe `main`, ela é usada como entrada.

Caso contrário, a primeira função encontrada assume esse papel.

Esse marco transformou a dungeon de uma visualização apenas decorativa em uma representação estrutural do programa.

---

# 4. Layout guiado pelo grafo

O mapa deixou de depender de uma disposição circular fixa.

As salas passaram a ser organizadas considerando principalmente:

- profundidade no grafo;
- callers;
- ordem estrutural;
- tamanho das funções;
- separação das funções inalcançáveis.

O mundo lógico passou a crescer de acordo com a necessidade.

Isso permitiu representar programas maiores sem obrigar todas as salas a caberem em uma única tela.

O layout também passou a ser tratado como uma camada separada do grafo.

---

# 5. Câmera e mundo expansível

Com o crescimento do mapa, foi adicionada uma câmera.

A posição das salas continuou no sistema de coordenadas do mundo.

A câmera passou a controlar apenas a visualização.

Foram adicionados:

- zoom;
- visão geral;
- Encaixar;
- foco em sala;
- acompanhamento do personagem.

Mais tarde, a câmera também ganhou modo livre por rolagem.

A roda move verticalmente a câmera e `Shift + roda` move horizontalmente.

Mover a câmera não altera a posição do personagem.

---

# 6. Busca e leitura estrutural

O projeto passou a oferecer busca de funções.

O inspector foi ampliado para apresentar:

- nome;
- métricas;
- código;
- callers;
- callees;
- caminho desde a entrada;
- estruturas de controle;
- recursão;
- ciclos.

Busca, clique e relações do inspector passaram a convergir para uma seleção unificada.

---

# 7. Foco contextual

Selecionar uma função passou a destacar as cadeias estruturais relevantes até ela.

Funções fora do contexto continuam visíveis com menor destaque.

Esse recurso permite estudar uma parte do programa sem apagar o restante da dungeon.

Funções inalcançáveis não recebem caminhos artificiais a partir da entrada.

---

# 8. Interação direta com as salas

As salas passaram a aceitar interação direta no Canvas.

Clique simples:

```text
seleciona
↓
atualiza inspector
↓
ativa foco contextual
```

Duplo clique:

```text
seleciona
↓
calcula rota
↓
inicia navegação automática
```

A seleção foi mantida separada da posição física do personagem.

Selecionar uma função não significa mover o personagem até ela.

---

# 9. Modos de visualização

Foram criados dois modos principais.

## Complexidade

Mantém:

- cores;
- criaturas;
- identidade visual baseada na complexidade.

## Estrutura

Prioriza:

- marcadores;
- relações;
- leitura estrutural.

Trocar de modo não altera:

- grafo;
- geometria;
- câmera;
- personagem;
- seleção.

---

# 10. Marcadores estruturais

As salas passaram a poder mostrar:

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → participação em ciclo
```

Esses marcadores complementam o inspector.

Eles não substituem as métricas completas.

---

# 11. Importação de arquivos C

O projeto passou a aceitar arquivos `.c` locais.

A importação atual:

- acontece no navegador;
- aceita um arquivo por vez;
- possui limite de tamanho;
- não executa o conteúdo;
- só substitui o editor depois de uma leitura válida;
- não gera a dungeon automaticamente.

Esse fluxo manteve o usuário no controle do momento da análise.

---

# 12. Zoom semântico

O nível de detalhe da dungeon passou a depender da aproximação.

Em visão distante, a prioridade é a estrutura geral.

Em níveis intermediários, nomes e identificação ganham importância.

Em visão próxima, aparecem mais detalhes como:

- marcadores;
- criaturas;
- texturas;
- alvenaria;
- acabamentos.

Hover e seleção permitem consultar nomes completos quando o conteúdo interno está simplificado.

---

# 13. Regiões semânticas

Foi adicionada uma camada de classificação semântica separada da geometria.

As categorias principais passaram a ser:

```text
Entrada da Dungeon
Salão Central
Alas
Criptas Isoladas
```

A classificação passou a seguir dados reais do grafo.

---

## Entrada da Dungeon

A função inicial ganhou uma região própria.

Ela deixou de ser tratada como uma ala comum.

---

## Salão Central

Funções alcançáveis podem ser classificadas como hubs quando possuem quantidade suficiente de callers alcançáveis distintos.

O nome da função não define esse papel.

---

## Alas

Funções alcançáveis podem ser agrupadas.

Quando existe prefixo técnico comum confiável, ele pode ser usado no título.

Exemplo:

```text
parse_expression
parse_primary
parse_unary
```

pode gerar:

```text
Ala Parser
```

Quando não existe evidência suficiente, são usados nomes neutros:

```text
Ala 1
Ala 2
Ala 3
```

---

## Criptas Isoladas

Toda função sem caminho a partir da entrada pertence às Criptas Isoladas.

Uma função desconectada não vira Salão Central apenas por receber chamadas de outras funções também desconectadas.

Alcançabilidade passou a ter prioridade sobre classificação de hub.

---

# 14. Representação visual das regiões

As regiões deixaram de existir apenas como dados.

A dungeon passou a mostrar:

- territórios;
- placas;
- cores regionais;
- contornos;
- alvenaria;
- diferenciação visual entre setores.

A representação visual passou a consumir a classificação já existente.

Ela não recalcula regiões no Canvas.

Esse marco eliminou a antiga diferença entre:

```text
região semântica existente nos dados
```

e:

```text
região visível no mapa
```

---

# 15. Layout regional

Foi introduzida uma composição regional própria.

`layoutRegioes.js` passou a organizar:

- regiões;
- salas dentro das regiões;
- espaço para placas;
- dimensões dos territórios;
- posição relativa dos setores.

A composição considera:

- ocupação;
- proporção;
- distância entre regiões ligadas por chamadas reais;
- determinismo.

A Entrada, o Salão Central e as Criptas mantêm papéis espaciais próprios.

Esse layout não altera o agrupamento semântico.

---

# 16. Corredores 2.0

Os corredores deixaram de ser apenas segmentos diretos entre centros de salas.

O roteamento passou a:

- usar vários segmentos;
- priorizar caminhos ortogonais;
- evitar terceiras salas;
- considerar folga;
- recortar caminhos nas paredes;
- preservar a identidade da chamada;
- criar portas coerentes com a geometria.

Esse ciclo aproximou a rede de chamadas da linguagem visual de uma dungeon.

---

# 17. Cruzamentos e pontes visuais

O sistema passou a distinguir:

```text
cruzamento geométrico
```

de:

```text
conexão física
```

Percursos independentes podem cruzar sem permitir troca de rota.

Alguns cruzamentos recebem uma ponte gráfica para ajudar a leitura.

Essa ponte é apenas visual.

Ela não cria altura física, novo nó ou entroncamento.

---

# 18. Arquitetura visual da dungeon

O mapa recebeu uma camada visual mais rica.

Foram adicionados e refinados elementos como:

- piso regional;
- paredes;
- alvenaria;
- portais;
- tochas;
- pedras;
- musgo;
- placas;
- acabamentos dos corredores;
- diferenciação de regiões.

A decoração passou a respeitar melhor as áreas ocupadas pela estrutura principal.

Essa camada continuou separada da colisão e da semântica.

---

# 19. Área caminhável

A exploração deixou de usar apenas os limites retangulares do mundo.

`areaCaminhavel.js` passou a definir onde o personagem pode andar.

A área física passou a ser formada por:

- salas;
- portas;
- corredores.

O sistema preserva a identidade do percurso.

Isso evita que cruzamentos criem atalhos falsos.

---

# 20. Colisão corporal

A colisão passou a considerar a base do personagem.

Antes, apenas a posição central era relevante.

Agora existe uma margem física.

Com isso:

- paredes bloqueiam corretamente;
- quinas não podem ser cortadas diagonalmente;
- portas precisam ter espaço suficiente;
- navegação manual e automática usam a mesma física.

A parte superior do sprite ainda pode se projetar visualmente sobre paredes, porque a colisão representa principalmente o contato da base com o piso.

---

# 21. Correção de portas e aproximações

O roteamento passou a validar melhor a posição das portas.

Entradas próximas demais das quinas podem ser reposicionadas.

A navegação interna das salas também passou a alinhar a aproximação com a abertura.

Isso corrigiu situações em que o personagem chegava diagonalmente e ficava preso próximo à porta.

---

# 22. Controle de teclado por foco

O Canvas passou a ativar a exploração quando recebe foco.

Não é mais obrigatório um clique adicional apenas para liberar o teclado.

Perder o foco interrompe os controles.

`Esc` continua liberando a exploração.

---

# 23. Galerias de exploração

Foi adicionada uma camada física separada das chamadas C.

`circulacaoDungeon.js` passou a criar galerias para evitar que toda troca de ramo exija voltar pela função de entrada.

As galerias:

- ficam em `passagensExploracao`;
- possuem identidade própria;
- podem ser usadas manualmente;
- podem ser usadas pela navegação automática;
- não entram no grafo;
- não alteram callers;
- não alteram callees;
- não alteram alcançabilidade;
- não alteram foco topológico;
- não mudam a classificação das regiões.

Funções isoladas podem ser visitadas fisicamente sem deixar de ser isoladas no programa.

Esse marco consolidou uma separação importante:

```text
estrutura do código
        ≠
circulação da dungeon
```

---

# 24. Galerias como linguagem visual própria

As galerias receberam aparência própria.

Entre os elementos usados estão:

- piso distinto;
- marcas quadradas;
- juntas;
- pedras laterais;
- simplificação de detalhes conforme o zoom.

A intenção é comunicar que:

```text
passagem física
```

não significa necessariamente:

```text
chamada de função
```

---

# 25. Navegação física unificada

A navegação automática passou a considerar a mesma rede física usada pelo movimento manual.

Corredores e galerias podem participar da rota.

O estado físico atual do personagem também é considerado.

Se o personagem está dentro de uma galeria, a navegação sabe em qual percurso ele está.

Isso evita trocar de caminho por uma simples sobreposição geométrica.

---

# 26. Estabilização atual

O estado atual consolidou:

- análise;
- grafo;
- layout;
- regiões;
- visual regional;
- corredores;
- galerias;
- colisão;
- câmera;
- navegação;
- inspector;
- busca;
- foco contextual.

Na auditoria que antecede a baseline candidata, a suíte chegou a:

```text
328 testes
328 passando
0 falhando
```

Também foi verificado:

```bash
git diff --check
```

sem problemas reportados.

Esse foi o estado usado para preparar a baseline oficial `v0.1.0`, posteriormente
incorporada à `main`. Naquele momento, o foco era:

```text
organizar
↓
documentar
↓
validar
↓
versionar
↓
congelar uma referência estável
```

---

# 27. Baseline incorporada à main

A tag `v0.1.0` registra o commit `ae885db`. O PR #1 incorporou essa baseline à
`main` em `fc6da7a`, preservando a referência histórica.

---

# 28. Consolidação das duas telas e da circulação

O PR #2 foi integrado em `9c9c0b7`, com 354 testes aprovados. A página inicial
e a exploração passaram a compartilhar materiais, sprites e adereços. A
revisão alinhou pisos, portas, junções, colisão e navegação, compactou o layout
regional e reorganizou os controles abaixo do Canvas.

---

# 29. Preparação em Worker e revisão de segurança

O PR #3 foi integrado em `e5253c2`, com 367 testes e CI aprovados. A revisão
adicionou limites UTF-8 e de grafo/mapa, preparação cancelável em Worker com
prazo de 8 segundos, fontes locais, CSP, configuração HTTP e permissões menores
no CI. Os controles e a privacidade estão registrados em `SECURITY.md`.

---

# 30. Demonstração pública no Cloudflare Pages

O site foi publicado em 1º de outubro de 2026, horário de Manaus, em
[dungeon-do-codigo.pages.dev](https://dungeon-do-codigo.pages.dev/).

HTTPS e cabeçalhos de segurança foram conferidos na resposta real. Os fluxos
verificados em Chromium 154 passaram sem erros de página ou violações de CSP.
As capturas mostram as duas telas publicadas; configuração, escopo dos testes
e conferências complementares estão em `docs/PUBLICACAO.md`.

---

# Linha resumida de evolução

```text
Canvas simples
    ↓
análise léxica segura
    ↓
grafo real
    ↓
layout estrutural
    ↓
câmera e zoom
    ↓
busca e inspector
    ↓
foco contextual
    ↓
interação direta
    ↓
regiões semânticas
    ↓
regiões visuais
    ↓
layout regional
    ↓
corredores ortogonais
    ↓
arquitetura visual
    ↓
área caminhável
    ↓
colisão corporal
    ↓
galerias de exploração
    ↓
baseline v0.1.0
    ↓
consolidação das duas telas
    ↓
preparação em Worker e segurança
    ↓
demonstração pública
```

---

# Princípio preservado durante a evolução

O projeto cresceu visualmente e tecnicamente.

Mas a regra central continua a mesma:

> **Se um significado visual não puder ser justificado pelos dados reais do programa, ele não deve ser apresentado como fato.**

Isso vale para:

- chamadas;
- regiões;
- importância;
- navegação estrutural;
- métricas;
- descrições;
- futuras mecânicas.

A evolução do Dungeon do Código deve aumentar a capacidade de compreender o programa sem transformar a visualização em uma interpretação arbitrária.

---

# Como registrar próximos marcos

Este arquivo deve registrar apenas etapas realmente concluídas.

Quando uma nova funcionalidade importante for finalizada:

1. confirmar que ela está validada;
2. registrar o marco aqui;
3. atualizar `ESTADO_ATUAL.md` se o comportamento atual mudar;
4. atualizar `ARQUITETURA.md` se responsabilidades mudarem;
5. atualizar `DECISOES.md` se surgir uma nova regra arquitetural;
6. remover a etapa correspondente de `PLANO_TECNICO.md` quando deixar de ser trabalho futuro.

Assim:

```text
EVOLUCAO.md
```

permanece histórico,

enquanto:

```text
PLANO_TECNICO.md
```

permanece futuro.
