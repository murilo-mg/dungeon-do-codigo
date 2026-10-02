# Arquitetura

Este documento descreve a arquitetura atual do **Dungeon do Código** na baseline em preparação.

O objetivo é registrar:

- como os dados percorrem a aplicação;
- quais módulos são responsáveis por cada etapa;
- quais separações arquiteturais precisam ser preservadas;
- onde termina a semântica do código e começa a representação física da dungeon.

Para o comportamento funcional atual, consulte `ESTADO_ATUAL.md`.

Para decisões e justificativas, consulte `DECISOES.md`.

---

# Visão geral

O Dungeon do Código é uma aplicação frontend estática feita com:

- HTML;
- CSS;
- JavaScript ES Modules;
- Canvas 2D.

O código C fornecido pelo usuário é tratado como texto.

Ele é analisado no navegador e convertido em uma representação estrutural usada para construir uma dungeon explorável.

A aplicação:

- não compila o código;
- não executa o código;
- não possui backend no estado atual.

O fluxo principal pode ser resumido assim:

```text
código C
   ↓
léxico
   ↓
análise estrutural
   ↓
funções e métricas
   ↓
grafo de chamadas
   ├───────────────────┐
   ↓                   ↓
regiões semânticas   layout base
   │                   │
   └─────────┬─────────┘
             ↓
       layout regional
             ↓
          masmorra
       ┌─────┴─────┐
       ↓           ↓
 corredores     galerias
 semânticos     físicas
       └─────┬─────┘
             ↓
      rede navegável
             ↓
      área caminhável
             ↓
    jogo / renderização
             ↕
          interface
```

A separação mais importante é:

```text
significado do programa
        ≠
arquitetura física da dungeon
```

---

# Princípios arquiteturais

## O código é a fonte de verdade

Informações como:

- funções;
- chamadas;
- callers;
- callees;
- profundidade;
- alcançabilidade;
- ciclos;
- recursão;
- métricas;
- classificação semântica;

devem vir da análise do código e do grafo.

A renderização não deve inventar essas informações.

---

## Grafo e geometria são responsabilidades diferentes

O grafo responde:

```text
quem chama quem?
```

A geometria responde:

```text
onde isso fica e por onde o personagem pode passar?
```

Uma conexão física não pode virar automaticamente uma relação do programa.

Uma relação do programa também não deve ser inferida apenas porque dois elementos se tocam visualmente.

---

## Visitabilidade não significa alcançabilidade

Uma função pode ser:

```text
inalcançável no grafo
```

e ainda assim ser:

```text
visitável fisicamente
```

Isso acontece, por exemplo, com funções das Criptas Isoladas quando existe uma galeria física até sua região.

Essa galeria não altera a semântica do programa.

---

## Identidade física deve ser explícita

Dois percursos podem ocupar os mesmos pixels sem serem o mesmo caminho.

Por isso, corredores e galerias preservam uma identidade de percurso.

Um cruzamento visual:

```text
──────┼──────
      │
      │
```

não significa automaticamente:

```text
entroncamento
```

---

## Coordenadas do mundo são separadas da câmera

Salas, personagem, corredores, galerias e efeitos existem no mundo lógico.

A câmera apenas decide qual parte desse mundo será mostrada.

Zoom, Encaixar e deslocamento livre não modificam a geometria da dungeon.

---

## Canvas e DOM possuem papéis diferentes

O Canvas cuida principalmente de:

- mundo;
- salas;
- regiões;
- corredores;
- galerias;
- personagem;
- cenário;
- efeitos;
- interação espacial.

O DOM cuida principalmente de:

- editor;
- botões;
- busca;
- inspector;
- mensagens;
- legendas;
- estados acessíveis;
- controles.

---

# Camadas do projeto

A arquitetura pode ser dividida em sete grupos:

```text
1. Entrada e análise
2. Grafo estrutural
3. Semântica da dungeon
4. Geometria e construção
5. Exploração e renderização
6. Interface
7. Orquestração
```

---

# 1. Entrada e análise

## `index.html`

Define a estrutura estática da aplicação.

Contém elementos como:

- editor;
- entrada de arquivo `.c`;
- área da dungeon;
- Canvas;
- busca;
- inspector;
- controles de câmera;
- modos visuais;
- legenda;
- estados da exploração.

Não deve conter regras de análise do código C.

---

## `css/estilo.css`

Define a apresentação da interface HTML.

Cuida de elementos como:

- tela inicial;
- área de exploração;
- botões;
- editor;
- busca;
- inspector;
- controles;
- estados visuais.

As regras semânticas e físicas da dungeon não devem depender do CSS.

---

## `js/entradaCodigo.js`

Centraliza regras básicas da importação de arquivos C.

Atualmente valida principalmente:

- extensão `.c`;
- limite de 512 KiB.

O módulo não:

- executa arquivos;
- envia arquivos para rede;
- analisa C;
- cria dungeon.

---

## `js/lexicoC.js`

Faz a separação léxica usada pela análise estrutural.

Distingue:

- código;
- comentários;
- strings;
- caracteres.

Produz representações mascaradas que preservam:

- índices;
- comprimento;
- quebras de linha.

Isso impede que conteúdo textual seja interpretado como código estrutural.

Exemplo:

```c
printf("if while }");
```

não deve gerar estruturas falsas nem encerrar uma função.

---

## `js/analisadorC.js`

Transforma o código em descritores de funções.

Entre os dados extraídos estão:

- nome;
- trecho original;
- corpo estrutural;
- linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- complexidade atual;
- chamadas conhecidas.

O módulo utiliza a etapa léxica.

Ele não:

- compila C;
- executa C;
- cria o grafo final;
- posiciona salas;
- desenha no Canvas.

A análise representa um subconjunto da linguagem C.

---

# 2. Grafo estrutural

## `js/grafoC.js`

É a principal representação das relações entre funções conhecidas.

Mantém:

- função de entrada;
- nós;
- arestas;
- callers;
- callees;
- profundidade;
- alcançabilidade;
- caminho estrutural;
- recursão direta;
- participação em ciclos;
- contexto topológico.

Quando existe `main`, ela é usada como entrada.

Caso contrário, a primeira função encontrada é usada.

O grafo não depende de:

- Canvas;
- câmera;
- posição de salas;
- galerias de exploração.

---

## Chamadas internas

Uma chamada só entra no grafo interno quando existe uma função correspondente entre as funções analisadas.

Exemplo:

```c
void b(void) {
}

void a(void) {
    b();
}

int main(void) {
    a();
    return 0;
}
```

gera:

```text
main → a → b
```

Chamadas externas não viram salas atualmente.

---

## Direção lógica e navegação física

Uma chamada:

```text
a → b
```

é direcionada no grafo.

O corredor físico correspondente pode ser percorrido nos dois sentidos pelo personagem.

Portanto:

```text
movimento físico bidirecional
```

não significa:

```text
chamada bidirecional
```

---

# 3. Semântica da dungeon

## `js/regioesMasmorra.js`

Classifica funções em regiões usando informações estruturais.

Não calcula posições e não desenha no Canvas.

As categorias atuais incluem:

- Entrada da Dungeon;
- Salão Central;
- Alas;
- Criptas Isoladas.

A classificação é independente da geometria.

---

## Entrada da Dungeon

Representa a função de entrada.

Ela não é tratada como uma ala comum.

---

## Salão Central

Pode receber funções:

```text
alcançáveis
+
com pelo menos 3 callers alcançáveis distintos
```

O nome da função não define esse papel.

---

## Alas

Funções alcançáveis podem ser agrupadas.

Prefixos técnicos confiáveis podem ajudar a nomear uma ala.

Exemplo:

```text
parse_primary
parse_expression
parse_unary
```

pode produzir:

```text
Ala Parser
```

Na ausência de evidência suficiente, utiliza-se um nome neutro:

```text
Ala 1
Ala 2
...
```

---

## Criptas Isoladas

Funções sem caminho a partir da entrada pertencem às Criptas Isoladas.

Alcançabilidade semântica tem prioridade sobre importância visual ou número de chamadas recebidas.

---

## `js/semanticaVisual.js`

Converte dados estruturais já existentes em decisões de apresentação.

Entre suas responsabilidades estão:

- nível de detalhe por zoom;
- aparência visual das salas;
- marcadores estruturais;
- cores das regiões;
- classificação visual de corredores;
- limites visuais auxiliares quando necessário.

O módulo não deve recalcular o grafo.

---

# 4. Geometria e construção

## `js/layoutMasmorra.js`

Mantém o layout geométrico base.

Define informações como:

- dimensões das salas;
- posições no layout tradicional;
- dimensões do mundo base.

A profundidade do grafo influencia esse layout.

O módulo não decide chamadas.

---

## `js/layoutRegioes.js`

Calcula a composição regional usada pela versão atual quando `layoutRegional` está ativo.

Recebe:

- regiões já classificadas;
- grafo;
- dimensões das salas fornecidas pelo layout base.

Não decide:

- quem é hub;
- quais funções são isoladas;
- nomes semânticos;
- chamadas.

A composição regional:

- distribui salas dentro de cada região;
- preserva as dimensões das salas;
- reserva espaço para placas;
- calcula dimensões dos territórios;
- busca uma composição compacta;
- considera relações reais entre regiões;
- mantém comportamento determinístico;
- posiciona Entrada, Salão Central e Criptas de acordo com seus papéis.

O módulo também calcula formas decorativas dos territórios.

Essas formas acompanham as fileiras existentes sem alterar posições ou colisões.

---

## `js/masmorra.js`

Compõe a estrutura final da dungeon.

Recebe:

- funções;
- grafo;
- opções de construção.

Usa:

- `layoutMasmorra.js`;
- `regioesMasmorra.js`;
- `layoutRegioes.js`, quando o layout regional está ativo;
- `circulacaoDungeon.js`, no layout regional.

Devolve dados como:

- salas;
- regiões;
- territórios regionais;
- galerias de exploração;
- largura do mundo;
- altura do mundo.

`masmorra.js` coordena a construção.

Ele não deve concentrar algoritmos de análise ou renderização.

---

## `js/corredores.js`

Transforma relações reais do grafo em percursos geométricos.

Responsabilidades atuais:

- largura física dos corredores;
- identidade das chamadas;
- identidade genérica dos percursos;
- roteamento entre salas;
- desvio de obstáculos;
- recorte do percurso nas paredes;
- validação de portas;
- detecção de cruzamentos visuais.

Uma chamada pode gerar vários segmentos físicos.

Todos continuam pertencendo à mesma relação.

---

## Roteamento dos corredores

O roteador procura caminhos ortogonais.

Ele considera folga em relação às salas.

Quando uma aproximação levaria a uma porta muito próxima de uma quina, podem ser testadas portas centrais alternativas.

Essas alternativas com folga são testadas antes de qualquer compatibilidade com
intervalos estreitos do layout legado. A folga considera a largura do piso inteiro.

`extrairPortasDosCorredores` produz os acessos a partir do primeiro e do último
ponto de cada percurso, verificando a borda completa da sala. Física e desenho
consomem essa mesma definição, evitando portais em curvas intermediárias.

`calcularJuncoesCorredores` explicita áreas locais de chão compartilhado entre
faixas paralelas sobrepostas e encontros em T. Um X transversal interior continua
independente. As junções são geometria física e nunca voltam ao grafo C.

Para compatibilidade com geometrias antigas específicas, corredores semânticos ainda podem usar um fallback identificável quando não existe outra rota.

Esse fallback pertence à representação física da relação existente.

Ele não cria uma nova relação.

---

## Identidade de percurso

`chaveDoCorredor(origem, destino)` identifica a chamada semântica.

`chaveDoPercurso(segmento)` identifica o percurso físico.

Para um corredor semântico comum:

```text
identidade do percurso
=
identidade da chamada
```

Para uma galeria:

```text
identidade do percurso
=
id próprio da galeria
```

Isso permite que uma chamada e uma galeria entre extremos semelhantes continuem distintas.

---

## `js/circulacaoDungeon.js`

Constrói galerias físicas de exploração.

Recebe:

- salas;
- regiões;
- conexões semânticas já conhecidas.

Ele não adiciona arestas ao grafo.

O objetivo é reduzir situações em que o personagem precisa voltar obrigatoriamente pela entrada para trocar de ramo.

A estratégia atual:

- considera a conectividade física já fornecida pelos corredores;
- ignora a entrada como desvio obrigatório ao analisar componentes;
- procura pares próximos de salas em componentes distintos;
- tenta criar ligações determinísticas;
- usa o roteador ortogonal com folga;
- não força uma passagem se não existir caminho seguro;
- pode criar acesso físico à entrada quando necessário.

As galerias são devolvidas em:

```text
passagensExploracao
```

Uma galeria nunca deve ser interpretada como caller/callee.

---

## `js/areaCaminhavel.js`

Define a física a partir da geometria pronta.

Recebe:

- salas;
- segmentos navegáveis;
- raio físico do personagem.

Não conhece:

- grafo;
- regiões semânticas;
- Canvas;
- câmera.

O módulo organiza:

- salas;
- percursos;
- portas;
- identidade física atual.

Durante o movimento, a identidade do percurso é preservada.

Isso impede trocar para outro caminho apenas porque os pisos se cruzaram graficamente.

Uma junção física permite incorporar outro percurso apenas dentro da área local
compartilhada. Fora dela, a identidade volta a acompanhar os caminhos ocupados.

---

## Colisão corporal

A área caminhável pode considerar uma margem para a base do personagem.

A validação testa pontos ao redor da posição central.

Com isso:

- paredes bloqueiam;
- portas continuam transitáveis;
- cortes diagonais em quinas são bloqueados;
- cruzamentos não emprestam piso de percursos independentes.

O movimento é subdividido em passos pequenos para evitar saltos através de paredes.

Quando um eixo bloqueia, o outro ainda pode deslizar.

---

## `js/navegacaoMasmorra.js`

Calcula rotas sobre **percursos físicos já existentes**.

Pode trabalhar com:

- corredores semânticos;
- galerias de exploração.

O módulo:

- agrupa segmentos pela identidade do percurso;
- calcula os acessos internos das salas;
- cria uma rede física bidirecional;
- calcula custos geométricos;
- encontra uma rota até a sala de destino;
- considera a localização física atual do personagem.

Se o personagem estiver no interior de um percurso, somente identidades compatíveis com seu estado físico podem servir como saída.

O módulo não cria novos caminhos.

As junções da geometria também entram na rede de navegação automática. Assim,
uma passagem compartilhada disponível ao movimento manual não exige uma volta
artificial pelas salas para ser usada pelo automático.

---

# 5. Exploração e renderização

## `js/camera.js`

Controla a projeção do mundo.

Mantém informações como:

- posição da câmera;
- zoom;
- limites;
- tamanho do viewport.

Fornece operações para:

- seguir um alvo;
- definir zoom;
- Encaixar;
- calcular zoom de visão geral;
- deslocar livremente a câmera.

A câmera não altera posições das salas ou do personagem.

---

## `js/zoomDiscreto.js`

Controla os degraus canônicos de zoom usados pela interface.

A mudança entre níveis não altera a geometria.

---

## `js/personagem.js`

Mantém:

- posição;
- direção;
- animação;
- passos;
- velocidade;
- margem física da base.

O módulo recebe opcionalmente um resolvedor de movimento.

Quando o jogo fornece esse resolvedor, a posição permitida pela física é usada para atualizar o personagem.

`personagem.js` não precisa conhecer salas, corredores ou grafo.

---

## `js/cenario.js`

Gera e desenha decoração de ambiente.

Pode considerar áreas ocupadas por:

- salas;
- percursos.

A decoração evita interferir visualmente nas estruturas principais.

O cenário não cria relações nem altera colisões.

As manchas do terreno são geradas uma vez, de forma determinística, com áreas
reservadas para salas e percursos. Rocha, vegetação e tochas usam os materiais
compartilhados de `desenhoMasmorra.js`; os detalhes menores acompanham o zoom.

Caixas, baús, barris, crânios e bandeiras usam `aderecosDungeon.js`. A geração
considera a silhueta completa de cada objeto, evitando salas, percursos e outros
objetos. Esses adereços não acrescentam colisões ou significado estrutural.

---

## `js/aderecosDungeon.js`

Define sprites, paletas e limites dos adereços decorativos. É compartilhado
pelo cenário e pela página inicial; não depende do DOM, do grafo ou da navegação.

---

## `js/entradaDungeon.js`

Desenha a parede de fundo e a ilustração da página inicial com os materiais
compartilhados da dungeon. Ajusta o fundo ao viewport, sem animação contínua.
Não lê o editor, não analisa C e não altera o mundo do jogo.

O fundo acompanha o viewport por `ResizeObserver`, com o evento `resize` como
alternativa quando a API não existe. A ausência desse recurso não interrompe
a inicialização dos controles. `testes/entradaDungeon.test.js` cobre a página
com os dois canvases presentes, o redimensionamento e o fluxo de gerar/voltar.

---

## `js/desenhoMasmorra.js`

Centraliza materiais arquitetônicos da dungeon.

Desenha elementos como:

- piso regional;
- alvenaria;
- placas;
- portais;
- tochas;
- acabamento dos corredores;
- galerias;
- detalhes de pedra.

Recebe geometria e dados visuais já prontos.

Não calcula:

- grafo;
- regiões;
- rotas;
- colisão.

A alvenaria é decorativa.

Ela pode abrir visualmente espaço onde percursos existentes atravessam uma parede, mas não cria novas passagens físicas.

O nível de detalhe acompanha o zoom.

Animações respeitam a preferência de redução de movimento quando aplicável.

---

## `js/criaturas.js`

Define e desenha criaturas relacionadas à representação de complexidade.

As criaturas não modificam a métrica recebida.

---

## `js/efeitos.js`

Cuida de efeitos temporários, como partículas.

Efeitos são apresentação.

Não alteram a estrutura da dungeon.

---

## `js/pixelArt.js`

Centraliza recursos reutilizáveis de pixel art.

Inclui:

- paleta;
- glifos;
- desenho de pixels;
- representações usadas por marcadores.

---

## `js/jogo.js`

É o principal coordenador da experiência dentro do Canvas.

Mantém estados como:

- salas;
- regiões visuais;
- personagem;
- sala física;
- sala selecionada;
- corredores semânticos;
- galerias de exploração;
- segmentos navegáveis;
- área caminhável;
- localização física atual;
- câmera;
- zoom;
- foco topológico;
- modo visual;
- navegação automática.

A separação importante é:

```text
segmentosDeCorredores
→ somente chamadas reais

passagensExploracao
→ somente circulação física

segmentosNavegaveis
→ união usada para movimento e navegação
```

Essa união não volta para o grafo.

---

## Ordem conceitual de renderização

A cena é construída aproximadamente assim:

```text
fundo
↓
territórios regionais (fundação rochosa)
↓
bordas de todos os percursos
↓
pisos de todos os percursos
↓
texturas e pontes
↓
decoração
↓
salas
↓
portais
↓
pegadas e efeitos
↓
personagem
↓
placas e etiquetas
```

A ordem pode evoluir visualmente, mas não deve alterar a semântica.

`desenharRedeCorredores` compõe chamadas e galerias nessas camadas, preservando
seus materiais e o foco contextual. Os pisos são aplicados depois de todas as
bordas para apagar pedras internas em passagens compartilhadas.

---

## Movimento

O movimento manual passa por:

```text
teclado
  ↓
jogo.js
  ↓
personagem.js
  ↓
resolverMovimento
  ↓
areaCaminhavel.js
  ↓
posição permitida
```

A navegação automática utiliza o mesmo resolvedor físico.

Assim, movimento manual e automático obedecem à mesma área caminhável.

---

## Sala física e sala selecionada

São estados diferentes.

```text
sala física
→ onde o personagem realmente está

sala selecionada
→ função que o usuário está inspecionando
```

Selecionar uma função não teletransporta o personagem.

Mover o personagem não precisa alterar imediatamente a seleção manual.

---

## Câmera livre

A roda do mouse pode deslocar a câmera sem movimentar o personagem.

`Shift + roda` usa deslocamento horizontal.

Quando a câmera está em modo livre, o acompanhamento automático não deve anulá-la a cada quadro.

Uma ação de navegação pode voltar ao acompanhamento do personagem.

---

## Viewport

O Canvas acompanha o espaço disponível.

O jogo pode utilizar `ResizeObserver` e evento de `resize` para manter:

- bitmap;
- viewport da câmera;
- zoom;
- Encaixar;

coerentes com o tamanho visível.

O redimensionamento não reconstrói o mundo.

---

# 6. Interface

## `js/interface.js`

Controla os elementos de interface fora do Canvas.

Entre suas responsabilidades estão:

- alternância entre tela inicial e exploração;
- inspector;
- busca;
- callers;
- callees;
- mensagens;
- controles;
- estado acessível;
- animação de texto;
- modos visuais.

Conteúdo originado do código do usuário deve ser inserido como texto.

Não deve ser interpretado como HTML.

---

## Busca e seleção

Busca, clique no Canvas e botões do inspector convergem para a mesma ideia de função selecionada.

A interface não deve manter uma segunda semântica paralela ao grafo.

---

## Acessibilidade

Elementos de interface que precisam de interação textual e foco permanecem no DOM sempre que apropriado.

Controles nativos devem ser preferidos quando possível.

Preferências de redução de movimento devem ser respeitadas pelas animações.

---

# 7. Orquestração

## `js/principal.js`

É o ponto central de integração da aplicação.

Coordena o fluxo entre:

- interface;
- analisador;
- grafo;
- masmorra;
- jogo.

Entre suas responsabilidades estão:

- receber a solicitação de geração;
- analisar o código;
- criar o grafo;
- construir a dungeon;
- iniciar o jogo;
- conectar seleção;
- atualizar inspector;
- conectar câmera;
- conectar modos;
- voltar ao editor;
- tratar erros conhecidos da análise.

`principal.js` deve orquestrar.

Ele não deve acumular algoritmos que pertencem ao léxico, grafo, layout, física ou renderização.

---

# Fluxo completo atual

## Entrada

```text
index.html
   ↕
interface / principal
   ↓
texto C
```

---

## Análise

```text
principal.js
   ↓
analisadorC.js
   ↕
lexicoC.js
```

Resultado:

```text
descritores de funções
```

---

## Grafo

```text
descritores
   ↓
grafoC.js
```

Resultado:

```text
nós
arestas
callers
callees
profundidade
alcance
ciclos
recursão
```

---

## Regiões

```text
grafo
  ↓
regioesMasmorra.js
```

Resultado:

```text
Entrada
Salão Central
Alas
Criptas
```

---

## Layout

```text
grafo + funções
      ↓
layoutMasmorra.js
      ↓
dimensões base

regiões + grafo + dimensões
      ↓
layoutRegioes.js
      ↓
salas posicionadas + territórios
```

---

## Construção

```text
funções + grafo + layout + regiões
                 ↓
             masmorra.js
```

Resultado:

```text
salas
regiões
territórios
dimensões do mundo
galerias físicas
```

---

## Corredores semânticos

```text
salas + grafo.arestas
        ↓
    corredores.js
        ↓
segmentos de chamadas
```

---

## Rede física

```text
corredores semânticos
        +
galerias de exploração
        ↓
segmentos navegáveis
```

Essa união existe apenas na camada física.

---

## Física

```text
salas + segmentos navegáveis
             ↓
      areaCaminhavel.js
```

Resultado:

```text
rede física com identidade
```

---

## Navegação

```text
posição atual
+
rede física
+
sala destino
      ↓
navegacaoMasmorra.js
      ↓
pontos da rota
```

---

## Renderização

```text
masmorra
corredores
galerias
estado do jogo
      ↓
jogo.js
      ↓
desenhoMasmorra.js
cenario.js
criaturas.js
efeitos.js
pixelArt.js
      ↓
Canvas
```

---

# Responsabilidades que não devem se misturar

## Análise

Fonte:

```text
lexicoC.js
analisadorC.js
grafoC.js
```

Não deve depender de Canvas ou arquitetura visual.

---

## Classificação semântica

Fonte:

```text
regioesMasmorra.js
```

Não deve depender da posição final das salas.

---

## Geometria

Fonte:

```text
layoutMasmorra.js
layoutRegioes.js
corredores.js
circulacaoDungeon.js
```

Não deve inventar relações do programa.

---

## Colisão

Fonte:

```text
areaCaminhavel.js
```

Não deve recalcular grafo ou regiões.

---

## Navegação

Fonte:

```text
navegacaoMasmorra.js
```

Não deve criar caminhos inexistentes.

---

## Câmera

Fonte:

```text
camera.js
jogo.js
```

Não deve alterar a geometria lógica.

---

## Renderização

Fonte:

```text
jogo.js
desenhoMasmorra.js
cenario.js
criaturas.js
efeitos.js
pixelArt.js
```

Não deve se tornar fonte de verdade semântica.

---

## Conteúdo textual e controles

Fonte:

```text
interface.js
principal.js
```

Não deve recalcular relações estruturais.

---

# Invariantes da baseline

As seguintes regras devem continuar verdadeiras:

1. a mesma entrada produz estrutura determinística;
2. corredores semânticos correspondem a chamadas reais;
3. galerias não criam chamadas;
4. caller/callee vêm apenas do grafo;
5. função isolada pode ser visitável sem virar alcançável;
6. cruzamento visual não cria entroncamento;
7. movimento manual e automático usam a mesma física;
8. a câmera não move o mundo;
9. zoom não muda posições físicas;
10. regiões são classificadas antes do desenho;
11. decoração não cria colisão;
12. `principal.js` orquestra sem concentrar algoritmos;
13. `jogo.js` coordena o Canvas sem analisar C;
14. limitações da análise devem permanecer explícitas.

---

# Regra principal

A arquitetura deve continuar permitindo distinguir claramente:

```text
o que veio do código
```

de:

```text
o que foi criado apenas para representar e explorar esse código
```

Essa separação é o principal mecanismo de confiança do Dungeon do Código.
