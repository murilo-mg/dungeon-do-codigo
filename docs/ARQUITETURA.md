# Arquitetura

## Visão geral

A aplicação é um frontend estático em HTML, CSS e JavaScript ES Modules. O código C é tratado como texto: o navegador analisa sua estrutura, gera descritores de funções e monta uma experiência de exploração em Canvas com informações complementares no DOM.

A separação atual é:

```text
verdade do código -> grafo -> layout -> experiência
```

`grafoC.js` concentra a estrutura das relações entre funções. `layoutMasmorra.js` concentra a geometria das salas e do mundo lógico. `masmorra.js` consome o grafo e o layout para montar as entidades, enquanto `corredores.js` transforma as arestas em segmentos geométricos compartilhados por jogo e cenário. `camera.js` transforma a região visível do mundo em viewport.

## Módulos atuais

### `index.html`

Define as telas de entrada e exploração, editor, botão para abrir `.c`, área de drop no editor, Canvas, barra de câmera, botões de modo visual, legenda estrutural, campo de busca, inspector, status dos controles e legenda de complexidade. É a estrutura estática da aplicação.

### `css/estilo.css`

Define o visual das telas, editor, mapa, inspector, criaturas, status e indicador ativo dos controles. Não contém lógica de análise.

### `js/lexicoC.js`

Percorre o texto para distinguir código, comentários, strings e literais de caracteres. Produz representações mascaradas preservando índices e quebras de linha e lança erros de análise para entradas incompletas.

### `js/entradaCodigo.js`

Valida o nome `.c` e o limite de 512 KiB antes da leitura local. Não lê o conteúdo nem acessa DOM ou rede.

### `js/analisadorC.js`

Extrai funções por uma expressão de assinatura simplificada, conta linhas e estruturas de controle por tipo (`if`, `for`, `while`, `switch`, `case`), calcula a complexidade pela fórmula existente e encontra chamadas entre funções conhecidas. Usa o corpo sanitizado pelo léxico para as contagens e exclui o corpo estrutural temporário dos descritores ao finalizar.

### `js/masmorra.js`

Consome o grafo e o layout calculado para montar as salas, incluindo o perfil de estruturas e os indicadores de recursão direta e ciclo vindos do grafo. As cores e dimensões continuam baseadas na complexidade existente. Não calcula colunas, posições ou dimensões.

### `js/layoutMasmorra.js`

Calcula, sem DOM, Canvas ou estado global, a organização por profundidade, as colunas, a distribuição vertical, as posições, as dimensões das salas e o tamanho do mundo lógico. A API retorna `{ salas, larguraMundo, alturaMundo }`. O viewport continua sendo 560x480, mas o mundo cresce quando as dimensões reais das salas e os gaps mínimos exigem mais espaço. Dentro de cada profundidade alcançável, ordena as funções pela média vertical dos callers na coluna anterior, com empate pela ordem estrutural original. Funções não alcançáveis ficam na coluna final, em sua ordem original.

### `js/camera.js`

Calcula, sem DOM, Canvas, eventos ou estado global, a posição e o zoom da câmera. Usa o zoom para calcular a área visível do mundo e os limites de deslocamento. Também calcula o zoom mínimo que encaixa o mundo inteiro no viewport; `jogo.js` escolhe como alvo o personagem ou o centro de uma sala em foco manual.

### `js/zoomDiscreto.js`

Escolhe o próximo degrau dos botões + e − entre 50%, 75%, 100%, 125%, 150%, 175% e 200%, incluindo o valor calculado por Encaixar como mínimo próprio da dungeon. Não altera o cálculo nem a posição da câmera.

### `js/grafoC.js`

Representa explicitamente a estrutura do programa: função de entrada, nós por nome, arestas direcionadas, chamadas recebidas (`chamadaPor`), profundidade mínima e alcançabilidade. Detecta recursão direta por autoaresta e participação em ciclo quando há caminho de retorno ao próprio nó. Também fornece callers, callees, esses indicadores, um caminho mínimo para o inspector e o contexto topológico de todas as cadeias relevantes até a função selecionada. Considera apenas chamadas para funções conhecidas, elimina arestas duplicadas e não depende de Canvas, DOM ou geometria.

### `js/cenario.js`

Cria e desenha o cenário de fundo e suas decorações, evitando áreas ocupadas pelas salas e pelos segmentos de corredores reais recebidos do jogo. Não reconstrói o grafo nem cria corredores próprios.

### `js/corredores.js`

Converte `salas + arestas` em segmentos com origem, destino, início e fim. Ignora salas ausentes, autoarestas e duplicatas. É uma função pura, sem Canvas ou DOM, usada para manter a geometria dos corredores igual no jogo e no cenário.

### `js/navegacaoMasmorra.js`

Calcula uma rota geométrica entre a posição atual e uma sala usando apenas os centros das salas e os segmentos de corredores existentes. Aceita partida dentro de uma sala ou na faixa desenhada de um corredor; trata corredores como transitáveis nos dois sentidos, sem alterar o grafo de chamadas. Devolve pontos de passagem ou ausência de rota, sem DOM, Canvas ou estado global.

### `js/personagem.js`

Mantém a física e o desenho do personagem, incluindo movimento, limites, direção e passos.

### `js/semanticaVisual.js`

Seleciona, sem DOM ou Canvas, os marcadores de presença I/F/W/S e o indicador R ou C a partir dos metadados já calculados da sala. Também decide a cor base e a presença de criatura e destaque de marcadores conforme o modo visual. Classifica o zoom em distante, intermediário e próximo por limiares centralizados, sem alterar a câmera. Não conta estruturas nem analisa chamadas.

### `js/criaturas.js`

Define criaturas associadas à complexidade e desenha seus retratos e representações nas salas.

### `js/efeitos.js`

Cria, atualiza e desenha partículas de entrada, com limites de quantidade e duração.

### `js/pixelArt.js`

Fornece paleta, glifos de 5x5 pixels para os marcadores e dados/recursos de pixel art usados pela renderização.

### `js/jogo.js`

Coordena o ciclo de animação, renderiza Canvas, atualiza física, detecta a sala sob o jogador e gerencia teclado, foco, `Esc`, listeners e preferência de movimento reduzido. Mantém a sala física separada da seleção manual e alterna a câmera entre seguir o jogador, focar a sala selecionada e mostrar a visão geral. Converte cliques do Canvas para coordenadas do mundo; um clique em sala solicita a seleção ao orquestrador, e um duplo clique percorre a rota calculada por `navegacaoMasmorra.js` usando a velocidade do personagem. O hover reutiliza essa conversão apenas para mostrar o nome completo, sem selecionar. Teclado de movimento interrompe a rota. Aplica escala e deslocamento apenas ao desenho, sem alterar as coordenadas do mundo, e desenha um contorno adicional na sala selecionada. Durante a seleção, conserva visíveis as salas e os corredores fora do contexto topológico com opacidade menor, sem alterar suas coordenadas. O nível semântico oculta nomes e detalhes internos na visão distante, mantém nomes na intermediária e preserva o desenho completo na próxima; etiquetas não escaladas identificam o hover e a seleção distante. Guarda um único modo visual, reiniciado em Complexidade a cada dungeon: Complexidade conserva cores por complexidade, criaturas e glifos discretos; Estrutura usa base neutra, oculta criaturas e destaca os mesmos glifos. Recebe as arestas reais, usa `corredores.js` para obter segmentos e desenha somente os corredores válidos. Não deve manipular DOM diretamente; comunica mudanças por callbacks.

### `js/interface.js`

Manipula DOM, troca telas, aceita escolha ou drop de arquivo no editor, apresenta mensagens de erro e nome do arquivo, filtra e desenha os resultados da busca, atualiza o inspector estrutural, anima descrições, desenha retratos e atualiza o estado visual dos controles, do modo visual e do percentual de zoom. Busca, importação, callers, callees, barra de câmera e botões de modo comunicam ações por callbacks. O inspector mostra as relações e indicadores de ciclo recebidos do grafo e o total e detalhamento de estruturas fornecidos pelo analisador; não recalcula esses dados. Conteúdo vindo do usuário deve ser inserido como texto, não HTML.

### `js/principal.js`

Inicializa a aplicação, recebe o código, coordena a leitura local de um `.c` por vez e chama análise, construção da masmorra e jogo. Fornece à busca os nomes de `grafo.nos`; resultados da busca, relações e cliques em salas usam a mesma seleção, que foca a sala no jogo, passa o contexto topológico calculado a partir do grafo para a renderização e entrega seus dados estruturais ao inspector. Conecta os botões da barra às operações de câmera e os botões de modo ao estado visual do jogo; atualiza o percentual quando a visão geral termina por seleção ou clique no Canvas.

## Fluxo atual

1. O usuário edita, cola ou abre/arrasta um arquivo `.c`, lido localmente no editor sem geração automática.
2. `principal.js` chama `analisarFuncoes`.
3. `lexicoC.js` protege strings, caracteres e comentários durante a análise.
4. `analisadorC.js` devolve funções, métricas, estruturas por tipo e nomes de chamadas conhecidas.
5. `grafoC.js` cria nós, arestas, chamadas recebidas, profundidade, alcance e indicadores de ciclo.
6. `layoutMasmorra.js` calcula as posições, dimensões e tamanho do mundo a partir do grafo e das funções.
7. `masmorra.js` monta as salas usando o grafo e o layout.
8. `corredores.js` transforma as arestas e salas em segmentos geométricos compartilhados.
9. `principal.js` inicia `jogo.js` passando a masmorra e as arestas reais.
10. `jogo.js` atualiza a câmera, usa dimensões do mundo na física e projeta a região visível no Canvas conforme o zoom.
11. `cenario.js` reserva os mesmos segmentos para suas decorações.
12. `interface.js` atualiza o inspector e o status dos controles.

## Arquitetura futura desejada

O inspector já mostra callers, callees, um caminho mínimo desde a entrada, o total e o perfil de estruturas de controle e a presença de recursão direta ou ciclo de chamadas. As salas mostram apenas presença por marcadores: I, F, W, S, R e C; quantidades e `case` ficam no inspector. Os botões de callers, callees, resultados da busca e cliques em salas selecionam a mesma função; o duplo clique também inicia o deslocamento por corredores existentes. Navegar pelo caminho completo e outras formas de exploração continuam futuras. As evoluções e os módulos abaixo dependem de necessidade demonstrada por testes, uso ou complexidade concreta.

O módulo `grafoC.js` já fornece um caminho mínimo desde a entrada para cada função alcançável. Listar todos os caminhos e fazer análises mais sofisticadas de ciclos continuam sendo evoluções futuras.

### `layoutMasmorra.js`

O módulo já existe e concentra a geometria e o mundo lógico dinâmico. A primeira ordenação vertical por relações do grafo reduziu cruzamentos no caso cruzado e no cenário denso de diagnóstico, preservando colunas, dimensões e ausência de sobreposições. Os testes de estresse com 5, 15, 30 e 60 funções continuam sem sobreposições de salas. Novos aprimoramentos devem partir de problemas medidos. O layout não deve decidir o significado das chamadas nem desenhar.

### `camera.js`

O acompanhamento básico e os botões de zoom por níveis canônicos entre 50% e 200%, mais o mínimo calculado por Encaixar, estão implementados. O botão Encaixar mostra o mundo inteiro sem ampliá-lo acima de 100% e mantém a visão geral até uma nova ação de navegação. O viewport permanece em 560x480, a câmera respeita os limites do mundo e o movimento usa as dimensões do mundo. A câmera básica, o zoom semântico, os controles discretos e a visão geral foram validados visualmente pelo mantenedor. Minimap, pan manual, drag, easing e otimizações de culling continuam futuros.

### `exportacao.js`

Deverá concentrar exportação de imagem, relatório ou dados estruturais, com formatos pequenos e documentados.

## Regras de dependência

- A verdade estrutural não deve depender da UI.
- O grafo não deve depender do layout.
- O layout não deve desenhar nem executar física.
- `jogo.js` deve renderizar e cuidar de física/controles.
- `interface.js` deve cuidar do DOM.
- `principal.js` deve orquestrar, não acumular regras de parser ou renderização.
- Canvas é apropriado para mapa e animação; DOM é apropriado para inspector, controles, texto e acessibilidade.
