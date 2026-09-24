# Arquitetura

## Visão geral

A aplicação é um frontend estático em HTML, CSS e JavaScript ES Modules. O código C é tratado como texto: o navegador analisa sua estrutura, gera descritores de funções e monta uma experiência de exploração em Canvas com informações complementares no DOM.

A separação desejada é:

```text
verdade do código -> grafo -> layout -> experiência
```

`grafoC.js` concentra a estrutura das relações entre funções. `layoutMasmorra.js` concentra a geometria das salas e do mundo lógico. `masmorra.js` consome o grafo e o layout para montar as entidades, enquanto `corredores.js` transforma as arestas em segmentos geométricos compartilhados por jogo e cenário. `camera.js` transforma a região visível do mundo em viewport.

## Módulos atuais

### `index.html`

Define as telas de entrada e exploração, editor, Canvas, inspector, status dos controles e legenda. É a estrutura estática da aplicação.

### `css/estilo.css`

Define o visual das telas, editor, mapa, inspector, criaturas, status e indicador ativo dos controles. Não contém lógica de análise.

### `js/lexicoC.js`

Percorre o texto para distinguir código, comentários, strings e literais de caracteres. Produz representações mascaradas preservando índices e quebras de linha e lança erros de análise para entradas incompletas.

### `js/analisadorC.js`

Extrai funções por uma expressão de assinatura simplificada, conta linhas e estruturas de controle, calcula complexidade e encontra chamadas entre funções conhecidas. Exclui o corpo estrutural temporário dos descritores ao finalizar.

### `js/masmorra.js`

Consome o grafo e o layout calculado para montar as salas, copiar metadados estruturais e definir a cor visual de cada sala. Não calcula mais colunas, posições ou dimensões.

### `js/layoutMasmorra.js`

Calcula, sem DOM, Canvas ou estado global, a organização por profundidade, as colunas, a distribuição vertical, as posições, as dimensões das salas e o tamanho do mundo lógico. A API retorna `{ salas, larguraMundo, alturaMundo }`. O viewport continua sendo 560x480, mas o mundo cresce quando as dimensões reais das salas e os gaps mínimos exigem mais espaço. Funções não alcançáveis ficam na coluna final.

### `js/camera.js`

Calcula, sem DOM, Canvas, eventos ou estado global, a posição da câmera a partir do tamanho do viewport, do tamanho do mundo e do alvo. Mantém a câmera dentro dos limites do mundo e acompanha o personagem sem suavização ou zoom.

### `js/grafoC.js`

Representa explicitamente a estrutura do programa: função de entrada, nós por nome, arestas direcionadas, chamadas recebidas (`chamadaPor`), profundidade mínima e alcançabilidade. Considera apenas chamadas para funções conhecidas, elimina arestas duplicadas e trata ciclos e recursão sem loop infinito. Não depende de Canvas, DOM ou geometria.

### `js/cenario.js`

Cria e desenha o cenário de fundo e suas decorações, evitando áreas ocupadas pelas salas e pelos segmentos de corredores reais recebidos do jogo. Não reconstrói o grafo nem cria corredores próprios.

### `js/corredores.js`

Converte `salas + arestas` em segmentos com origem, destino, início e fim. Ignora salas ausentes, autoarestas e duplicatas. É uma função pura, sem Canvas ou DOM, usada para manter a geometria dos corredores igual no jogo e no cenário.

### `js/personagem.js`

Mantém a física e o desenho do personagem, incluindo movimento, limites, direção e passos.

### `js/criaturas.js`

Define criaturas associadas à complexidade e desenha seus retratos e representações nas salas.

### `js/efeitos.js`

Cria, atualiza e desenha partículas de entrada, com limites de quantidade e duração.

### `js/pixelArt.js`

Fornece paleta e dados/recursos de pixel art usados pela renderização.

### `js/jogo.js`

Coordena o ciclo de animação, renderiza Canvas, atualiza física, detecta a sala sob o jogador e gerencia teclado, foco, `Esc`, listeners e preferência de movimento reduzido. Recebe as arestas reais, usa `corredores.js` para obter segmentos e desenha somente os corredores válidos. Não deve manipular DOM diretamente; comunica mudanças por callbacks.

### `js/interface.js`

Manipula DOM, troca telas, atualiza o inspector, anima descrições, desenha retratos e atualiza o estado visual dos controles. Conteúdo vindo do usuário deve ser inserido como texto, não HTML.

### `js/principal.js`

Inicializa a aplicação, recebe o código, chama análise, construção da masmorra e jogo, atualiza mensagens de erro e conecta callbacks entre jogo e interface.

## Fluxo atual

1. O usuário edita ou cola código C.
2. `principal.js` chama `analisarFuncoes`.
3. `lexicoC.js` protege strings, caracteres e comentários durante a análise.
4. `analisadorC.js` devolve funções, métricas e nomes de chamadas conhecidas.
5. `grafoC.js` cria nós, arestas, chamadas recebidas, profundidade e alcance.
6. `layoutMasmorra.js` calcula as posições, dimensões e tamanho do mundo a partir do grafo e das funções.
7. `masmorra.js` monta as salas usando o grafo e o layout.
8. `corredores.js` transforma as arestas e salas em segmentos geométricos compartilhados.
9. `principal.js` inicia `jogo.js` passando a masmorra e as arestas reais.
10. `jogo.js` atualiza a câmera, usa dimensões do mundo na física e desenha a região visível.
11. `cenario.js` reserva os mesmos segmentos para suas decorações.
12. `interface.js` atualiza o inspector e o status dos controles.

## Arquitetura futura desejada

Os módulos seguintes são direções de arquitetura e não devem ser criados agora sem necessidade real demonstrada por testes, uso ou complexidade concreta.

O módulo `grafoC.js` já existe com a base estrutural descrita acima. Caminhos e detecção mais sofisticada de ciclos continuam sendo evolução futura, não fazem parte da implementação atual.

### `layoutMasmorra.js`

O módulo já existe e concentra a geometria básica. Continua futuro o aprimoramento para mapas grandes, com menos sobreposição, câmera ou zoom. Não deve decidir o significado das chamadas nem desenhar.

### `camera.js`

O acompanhamento básico e a transformação do mundo para o viewport já existem. Ainda são futuros zoom, minimapa, pan manual, drag, easing e otimizações de culling.

### `busca.js`

Deverá indexar e localizar funções, permitindo selecionar uma sala e navegar até ela sem misturar busca com análise ou renderização.

### `arquivos.js`

Deverá encapsular importação local de arquivos `.c`, validação do tipo de entrada e fluxo explícito de leitura, sem executar o conteúdo.

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
