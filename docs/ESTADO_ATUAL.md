# Estado atual

Este documento registra o estado funcional e técnico atual do **Dungeon do Código** nos refinamentos posteriores à baseline `v0.1.0`.

Para entender a organização dos módulos, consulte `ARQUITETURA.md`.

Para decisões arquiteturais, consulte `DECISOES.md`.

Para funcionalidades planejadas, consulte `PLANO_TECNICO.md`.

---

## Repositório

Branch da revisão atual:

```text
main
```

A baseline `v0.1.0` está na tag do commit `ae885db` e foi incorporada à
`main` pelo commit `fc6da7a` (`release: incorpora baseline v0.1.0 na main (#1)`).
Os refinamentos deste documento são posteriores a essa baseline.
A consolidação das duas telas está integrada em `9c9c0b7`; a revisão de
segurança está integrada em `e5253c2`. A documentação da publicação foi
integrada em `5a6edee`, e o favicon próprio entrou pelo PR #5.

A versão pública consolidada está marcada como `v0.2.0` no commit `5fded90`,
que registra a versão publicada. O fechamento documental é posterior à tag.

Demonstração: [dungeon-do-codigo.pages.dev](https://dungeon-do-codigo.pages.dev/).
Configuração e verificações da hospedagem: [PUBLICACAO.md](PUBLICACAO.md).

O projeto é um frontend estático feito com:

- HTML;
- CSS;
- JavaScript ES Modules;
- Canvas 2D.

A aplicação não possui backend no estado atual.

Os testes são executados com:

```bash
npm test
```

Também existe um workflow do GitHub Actions para executar a suíte automaticamente.

---

# Estado geral

O Dungeon do Código já possui um fluxo completo de:

```text
entrada de código C
        ↓
análise
        ↓
grafo de chamadas
        ↓
classificação semântica
        ↓
layout
        ↓
construção da dungeon
        ↓
exploração
        ↓
inspeção das funções
```

O usuário pode:

- digitar ou colar código C;
- abrir um arquivo `.c`;
- gerar a dungeon;
- explorar o mapa;
- selecionar funções;
- pesquisar funções;
- consultar métricas;
- navegar por callers e callees;
- usar câmera, zoom e visão geral;
- caminhar manualmente ou usar navegação automática.

O código é analisado como texto.

Ele não é compilado nem executado.

---

# Entrada de código

A tela inicial permite:

- digitar código;
- colar código;
- abrir um arquivo `.c`;
- arrastar um arquivo válido para a área de entrada.

A página inicial usa uma parede em pixel art, tochas estáticas, estandartes e
objetos de madeira e osso. O editor e seus controles continuam sendo elementos
DOM. A ilustração de duas salas utiliza os mesmos materiais e sprites do mapa;
ela não interpreta o conteúdo do editor. O fundo usa `ResizeObserver` quando
disponível e o evento `resize` como alternativa; a decoração não deve impedir
a inicialização do editor e dos botões.

A importação aceita atualmente:

```text
1 arquivo por vez
extensão .c
até 512 KiB
```

O arquivo só substitui o conteúdo do editor depois de uma leitura válida.

A importação não gera automaticamente a dungeon.

O usuário continua decidindo quando iniciar a análise.

---

# Análise local

A análise acontece no navegador.

No estado atual:

- não existe backend da aplicação;
- o código não é enviado para um servidor próprio;
- o código não é compilado;
- o código não é executado.

---

# Análise léxica

`lexicoC.js` separa conteúdo estrutural de conteúdo textual.

O módulo distingue:

- código;
- comentários;
- strings;
- caracteres.

Isso evita interpretar trechos como:

```c
printf("if while }");
```

como estruturas reais da linguagem.

A representação mascarada preserva posições, comprimento e quebras de linha para que a análise estrutural continue alinhada ao texto original.

---

# Analisador de C

`analisadorC.js` extrai funções e informações estruturais.

Atualmente são considerados dados como:

- nome da função;
- trecho original;
- corpo estrutural;
- quantidade de linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- complexidade segundo a fórmula atual;
- chamadas para funções conhecidas.

O analisador trabalha com um subconjunto de C.

Ele não pretende substituir um compilador ou parser completo.

---

# Grafo de chamadas

`grafoC.js` representa as relações entre as funções conhecidas.

O grafo contém:

- função de entrada;
- nós;
- arestas direcionadas;
- callers;
- callees;
- profundidade mínima;
- alcançabilidade;
- caminho estrutural;
- recursão direta;
- participação em ciclos.

Quando existe `main`, ela é usada como entrada.

Quando não existe, a primeira função encontrada assume esse papel.

Chamadas externas que não possuem implementação no código analisado não viram salas da dungeon.

---

# Regiões semânticas

`regioesMasmorra.js` classifica as funções semanticamente.

Atualmente existem quatro categorias principais:

## Entrada da Dungeon

Representa a função de entrada.

## Salão Central

Pode representar funções alcançáveis que recebem chamadas de pelo menos três callers alcançáveis distintos.

Essa classificação depende da estrutura do grafo, não do nome da função.

## Alas

Funções alcançáveis podem ser agrupadas.

Quando existe um prefixo técnico confiável, ele pode ser usado no título da região.

Exemplo:

```text
parse_primary
parse_expression
parse_unary
```

pode formar:

```text
Ala Parser
```

Quando não existe um nome confiável, são usados títulos neutros como:

```text
Ala 1
Ala 2
Ala 3
```

## Criptas Isoladas

Toda função sem caminho a partir da entrada pertence às Criptas Isoladas.

Uma função pode ser fisicamente visitável sem deixar de ser semanticamente inalcançável no programa.

---

# Layout

O projeto mantém duas camadas de layout relacionadas, mas separadas.

`layoutMasmorra.js` fornece a geometria base das salas.

`layoutRegioes.js` organiza a composição regional usada pela versão atual da dungeon.

O layout regional considera:

- regiões;
- salas pertencentes a cada região;
- espaço interno;
- posição relativa de regiões relacionadas;
- dimensões do mundo;
- determinismo.

A mesma entrada deve produzir a mesma estrutura.

Cada quantidade candidata de colunas é avaliada depois de aproximar as regiões
relacionadas. A proporção da planta também entra no custo para evitar conjuntos
muito estreitos e altos quando uma distribuição compacta é possível.

O mundo lógico pode ser maior que o Canvas.

---

# Territórios visuais

As regiões possuem representação visual no Canvas.

A apresentação inclui:

- contornos arquitetônicos;
- alvenaria;
- placas;
- pisos;
- detalhes de região;
- cores secundárias;
- simplificação de detalhes de acordo com o zoom.

A forma visual de uma região acompanha melhor a distribuição das salas e não precisa ser apenas um retângulo simples.

Esses elementos são decorativos e não alteram o significado estrutural da região.

---

# Corredores semânticos

`corredores.js` transforma arestas reais do grafo em percursos físicos.

Uma chamada como:

```text
a → b
```

pode gerar um corredor entre as salas de `a` e `b`.

Os corredores atuais:

- preservam a identidade da chamada;
- podem possuir vários trechos;
- priorizam caminhos ortogonais;
- procuram evitar outras salas;
- utilizam portas nas extremidades;
- mantêm uma largura física compartilhada com a colisão.

As chamadas mais curtas são roteadas primeiro. As demais podem aproveitar os
mesmos eixos, mantendo um percurso completo por chamada. O custo favorece piso
alinhado e desestimula faixas paralelas quase coladas, curvas e cruzamentos.
O acabamento desenha uma única textura nos intervalos de piso coincidentes.
O foco contextual conserva o destaque da chamada sobre o piso compartilhado.

Portas e junções físicas são dados explícitos compartilhados pelo desenho e pela
navegação. Portas centrais com folga são tentadas antes do fallback estreito legado.

Quando a geometria não permite um caminho seguro dentro das regras atuais, existe um fallback identificável para casos compatíveis com o layout legado.

Um cruzamento visual não cria uma relação nova.

---

# Galerias de exploração

`circulacaoDungeon.js` cria passagens físicas adicionais para melhorar a circulação pela dungeon.

Essas passagens ficam em:

```text
passagensExploracao
```

Elas são separadas das chamadas do programa.

Uma galeria:

- não cria aresta no grafo C;
- não aparece como caller ou callee;
- não altera alcançabilidade;
- não altera regiões semânticas;
- não participa do foco topológico;
- possui identidade física própria;
- pode ser usada por movimento manual e navegação automática.

As galerias ajudam a conectar componentes físicos que, de outra forma, exigiriam retornar pela entrada.

Quando não existe um desvio geométrico seguro, a passagem não é forçada através de obstáculos.

Funções isoladas continuam isoladas semanticamente mesmo quando seu espaço físico pode ser visitado.

---

# Área caminhável

`areaCaminhavel.js` define a física da exploração a partir da geometria já calculada.

A área caminhável é composta por:

- salas;
- portas;
- corredores semânticos;
- galerias de exploração.

A física não lê o grafo para decidir significado.

Ela trabalha apenas com os percursos físicos recebidos.

O estado de movimento preserva a identidade do percurso.

Isso impede que dois caminhos que apenas se cruzam visualmente passem a funcionar como um entroncamento.

Faixas paralelas sobrepostas e encontros em T possuem junções locais. Nelas o
personagem pode atravessar o chão compartilhado sem uma divisão invisível entre
percursos. A mesma junção pode ser usada pela navegação automática.

---

# Colisão do personagem

A colisão não considera apenas o ponto central do personagem.

A base do personagem possui uma margem corporal.

As amostras dessa base precisam caber na área física válida.

Com isso:

- paredes bloqueiam o movimento;
- portas continuam atravessáveis;
- quinas não podem ser cortadas diagonalmente;
- a mesma lógica é usada no movimento manual e automático.

A parte superior do sprite ainda pode se projetar visualmente sobre uma parede em alguns ângulos, porque a colisão representa principalmente a base física do personagem.

---

# Personagem

`personagem.js` mantém estado, direção, animação e velocidade.

O sprite usa uma malha de 14 por 16 pixels, com roupa, rosto, botas e metal
sombreados. As vistas de frente, costas e lados acompanham a direção; a vista
esquerda espelha a direita. O acabamento conserva a base física e a velocidade.

O módulo não conhece diretamente salas, grafo ou regiões.

O jogo pode fornecer um resolvedor de movimento.

A posição efetivamente permitida alimenta:

- animação;
- pegadas;
- estado de caminhada.

Empurrar continuamente contra uma parede não deve manter uma animação de deslocamento inexistente.

---

# Navegação automática

`navegacaoMasmorra.js` calcula rotas sobre percursos físicos já existentes.

A navegação pode usar:

- corredores semânticos;
- galerias de exploração.

Ela preserva a identidade do percurso atual.

Se o personagem estiver dentro de um corredor ou galeria, a rota parte apenas dos caminhos fisicamente compatíveis com sua localização atual.

Um cruzamento independente não permite trocar de percurso.

---

# Movimento manual

O personagem pode ser controlado por:

```text
W A S D
```

ou:

```text
↑ ← ↓ →
```

O Canvas precisa estar ativo para controlar a exploração.

O foco do Canvas também ativa os controles sem exigir um clique anterior.

`Esc` libera o teclado.

Perder o foco interrompe os controles.

---

# Câmera

A câmera é separada das coordenadas físicas do mundo.

O projeto possui:

- acompanhamento do personagem;
- foco em sala selecionada;
- visão geral;
- modo livre;
- zoom;
- Encaixar.

A roda do mouse desloca a câmera verticalmente.

Com `Shift`, a roda desloca horizontalmente.

Mover a câmera não move o personagem.

O duplo clique em uma sala com rota válida retoma o acompanhamento do personagem.

---

# Viewport

O Canvas acompanha o espaço disponível na interface.

Mudanças de tamanho atualizam o bitmap e a câmera sem reconstruir o mundo lógico.

Quando disponível, `ResizeObserver` acompanha alterações do tamanho do Canvas.

---

# Seleção

Clique simples em uma sala:

```text
seleciona a função
        ↓
atualiza o inspector
        ↓
ativa o foco contextual
```

Selecionar uma função não move o personagem.

O projeto mantém separados:

```text
sala física
```

e:

```text
sala selecionada
```

---

# Duplo clique

Duplo clique pode iniciar navegação automática até uma sala quando existe uma rota física válida.

A implementação preserva o alvo mesmo quando o primeiro clique altera a câmera.

Movimento manual cancela a navegação automática.

---

# Busca

A exploração possui busca de funções.

A busca:

- ignora diferença entre maiúsculas e minúsculas;
- permite consulta parcial;
- mantém ordem previsível;
- pode selecionar uma função encontrada;
- é limpa ao trocar de dungeon ou voltar ao editor.

---

# Inspector

O inspector pode exibir:

- nome;
- código;
- métricas;
- callers;
- callees;
- caminho estrutural desde a entrada;
- estruturas de controle;
- recursão direta;
- participação em ciclos.

Callers e callees também podem ser usados para selecionar outras funções.

Conteúdo originado do código do usuário é inserido como texto, não interpretado como HTML.

---

# Foco contextual

Ao selecionar uma função, o projeto pode destacar as cadeias estruturais relevantes até ela.

Salas e chamadas fora do contexto recebem menor destaque.

O foco utiliza apenas o grafo C.

Galerias de exploração não criam relações no foco.

Funções inalcançáveis continuam sem caminho artificial a partir da entrada.

---

# Modos visuais

Existem dois modos principais.

## Complexidade

Mantém uma leitura visual baseada na complexidade, incluindo cores e criaturas.

## Estrutura

Prioriza a leitura estrutural e os marcadores.

Trocar de modo não altera:

- grafo;
- geometria;
- personagem;
- câmera;
- seleção.

---

# Marcadores estruturais

As salas podem apresentar:

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → participação em ciclo
```

Os marcadores complementam o inspector.

Eles não substituem as métricas completas.

---

# Zoom semântico

O nível de detalhe depende da aproximação.

Em visão distante, o mapa prioriza:

- forma geral;
- regiões;
- conexões principais.

Em níveis intermediários, nomes de funções ganham mais destaque.

Salas com área suficiente na tela também mantêm o nome em visão distante.
A fonte compensa o zoom até o limite definido para a placa; nomes extensos
continuam abreviados, com o texto completo disponível no hover e no inspector.

Em visão próxima, aparecem:

- detalhes internos;
- alvenaria;
- criaturas;
- marcadores;
- acabamentos.

Hover pode mostrar o nome completo de uma função sem selecioná-la.

---

# Cenário e decoração

A versão atual possui elementos visuais como:

- paredes de pedra;
- pisos;
- portais;
- tochas;
- rochas;
- musgo;
- pilares;
- bandeiras;
- caixas, baús e barris;
- crânios;
- detalhes de alvenaria;
- criaturas;
- efeitos;
- acabamento dos corredores;
- acabamento das galerias.

O cenário evita ocupar as áreas reservadas para os percursos físicos.

Elementos decorativos não alteram o grafo nem a área caminhável.

Os adereços têm limites explícitos. Sua distribuição determinística verifica
o objeto inteiro contra salas, corredores e outros objetos, preservando portas
e evitando sobreposição. Eles não representam loot ou novas métricas do código.

A fundação entre salas usa rocha escura e esparsa; o chão caminhável usa lajes com
variação determinística. As portas possuem soleiras abertas e ombreiras laterais.
Chamadas e galerias são desenhadas em camadas comuns de bordas, pisos e detalhes,
evitando paredes decorativas dentro de passagens compartilhadas.

O acabamento inclui pedras chanfradas, juntas e rachaduras nas lajes, reforços
nas muralhas, placas de madeira com ferragens e tapete bordado na sala de entrada.
Rochas com silhuetas variadas, musgo, samambaias, colunas quebradas e pequenas
teias dão textura ao cenário sem ocupar os pisos caminháveis.

Tochas usam halos translúcidos, chama e pequenas brasas. Com
`prefers-reduced-motion`, a iluminação permanece estática. Os detalhes menores
de pedra e vegetação simplificam conforme o zoom, nos dois modos visuais.

O terreno possui manchas e fragmentos fixos com distribuição irregular.
As bordas alternam rochas e folhagens, e a luz das tochas usa um halo radial
translúcido. As muralhas recebem pigmento da cor regional existente.

As criaturas também usam sprites de 14 por 16 pixels e paletas próprias, tanto
nas salas quanto no retrato. Os limiares de complexidade e os nomes das três
criaturas permanecem os mesmos.

O piso dos corredores e galerias mede 32 pixels no mundo. Portas, folgas do
roteamento, junções, colisão e desenho acompanham essa largura compartilhada.

Os controles de zoom e modo visual compartilham a barra abaixo do Canvas.
A legenda fica em um painel expansível acessível pelo teclado, liberando espaço
para o mapa quando recolhida.

---

# Cruzamentos

Percursos podem cruzar geometricamente.

Isso não significa que exista uma conexão entre eles.

A identidade de cada caminho é preservada pela física e pela navegação.

Os cruzamentos transversais independentes recebem acabamento de ponte, inclusive
quando próximos de uma curva. Eles continuam sem permitir a troca de percurso.

Encontros muito próximos de portas, curvas ou trechos sobrepostos ainda podem ser visualmente ambíguos em casos específicos.

---

# Testes

A suíte automatizada é executada com:

```bash
npm test
```

Na revisão dos refinamentos posteriores à baseline `v0.1.0`:

```text
367 testes
367 passando
0 falhando
```

A suíte cobre, entre outros pontos:

- análise léxica;
- extração de funções;
- entradas incompletas;
- grafo;
- profundidade;
- callers e callees;
- ciclos;
- recursão;
- layout;
- regiões;
- corredores;
- galerias;
- área caminhável;
- colisão;
- cruzamentos;
- navegação;
- câmera;
- zoom;
- Encaixar;
- viewport;
- busca;
- inspector;
- foco contextual;
- clique;
- duplo clique;
- modos visuais;
- importação de arquivos;
- limites e posicionamento dos adereços;
- coerência entre piso, portas, junções, colisão e navegação;
- roteamento de chamadas convergentes;
- inicialização e redimensionamento da decoração da entrada.

O estado atual também foi validado com:

```bash
git diff --check
```

sem erros de whitespace reportados.

---

# Limitações atuais

## Analisador

O analisador trabalha com um subconjunto de C.

Construções avançadas podem ser reconhecidas parcialmente ou não serem compreendidas corretamente, principalmente:

- macros complexas;
- pré-processamento condicional;
- ponteiros de função;
- declarações avançadas;
- formas pouco comuns da gramática.

Chamadas externas ainda não viram nós internos do grafo.

## Circulação

Uma galeria não é criada quando não existe desvio geométrico seguro dentro das regras atuais.

Alguns encontros de percursos podem continuar visualmente densos.

## Personagem

A base física respeita paredes e portas.

A cabeça do sprite ainda pode se projetar visualmente sobre a parede em alguns casos.

## Visual

A linguagem visual da dungeon já está funcional, mas ainda pode receber refinamentos de:

- acabamento;
- legibilidade;
- densidade de detalhes;
- diferenciação arquitetônica;
- leitura de grandes mapas.

Esses refinamentos não devem alterar a semântica existente.

---

# Princípios preservados

O estado atual mantém as seguintes regras:

1. o código analisado é a fonte de verdade;
2. grafo e geometria são responsabilidades diferentes;
3. regiões semânticas não devem ser inventadas pela renderização;
4. corredores semânticos representam relações reais;
5. galerias físicas não representam chamadas;
6. cruzamento visual não implica conexão;
7. zoom e câmera não alteram a geometria real;
8. a mesma entrada deve produzir uma estrutura determinística;
9. limitações do analisador devem ser comunicadas;
10. bugs corrigidos devem ganhar casos de regressão.

---

# Situação da baseline e dos refinamentos

A baseline `v0.1.0` já existe e está incorporada à `main`.
A revisão atual consolida as mudanças da página inicial e da exploração:

- materiais e sprites compartilhados entre a prévia e o jogo;
- adereços decorativos com limites completos;
- corredores com piso compartilhado e pontes em cruzamentos independentes;
- portas e junções usadas pelo desenho, pela colisão e pela navegação;
- composição regional mais compacta e nomes legíveis conforme o espaço;
- barra de câmera e modo visual com legenda expansível.

A consolidação foi integrada à `main` em `9c9c0b7`, com 354 testes aprovados.
A revisão visual das duas telas foi informada pelo mantenedor.

A revisão de segurança seguinte acrescenta limite UTF-8 para texto colado,
validação após leitura de arquivo, limites de funções e chamadas, preparação
cancelável em Worker com prazo de 8 segundos, limites de tamanho do mapa,
fontes locais, CSP e configuração HTTP. Ela inclui 367 testes automatizados.

A revisão de segurança foi integrada por PR no commit `e5253c2`, com o check
`testes` aprovado. As regras de privacidade estão em `../SECURITY.md`.

O site está publicado no Cloudflare Pages. HTTPS, cabeçalhos HTTP e os fluxos
de geração, Encaixar, Estrutura, busca, retorno e importação foram conferidos
na URL pública em Chromium 154, sem erros de página ou violações de CSP nos
fluxos normais. Em 2 de outubro de 2026, a versão hospedada também foi
conferida manualmente em Firefox, incluindo geração, importação, controles,
duplo clique, cancelamento e retorno. O escopo da verificação está em
`PUBLICACAO.md`.

A tag e release `v0.2.0` fecham esta versão pública no commit `5fded90`.

A validação local desta revisão foi executada em Chromium headless com CSP e
os cabeçalhos aplicados, incluindo hospedagem em subdiretório. Passaram os
fluxos de geração, importação, busca, modos, zoom e retorno ao editor; conteúdos
com aparência de HTML permaneceram texto. Cancelamento, edição durante a
preparação, encerramento de Worker bloqueado ao atingir o prazo e nova tentativa
foram verificados. As tentativas deliberadas de conexão e script inline foram
bloqueadas pela CSP. Nos fluxos normais não houve erro de página ou violação da
política, e os recursos carregados vieram somente da hospedagem local.
