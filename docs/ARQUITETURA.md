# Arquitetura

## Visão geral

A aplicação é um frontend estático em HTML, CSS e JavaScript ES Modules. O código C é tratado como texto: o navegador analisa sua estrutura, gera descritores de funções e monta uma experiência de exploração em Canvas com informações complementares no DOM.

A separação desejada é:

```text
verdade do código -> grafo -> layout -> experiência
```

A implementação atual ainda combina parte de grafo e layout em `masmorra.js`; essa é uma divergência conhecida, não uma capacidade já concluída.

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

Escolhe a função inicial, calcula relações de chamadas recebidas e profundidade alcançável, agrupa funções por profundidade e cria salas posicionadas. Também define tamanho e cor por complexidade. Atualmente não expõe um grafo com arestas explícitas.

### `js/cenario.js`

Cria e desenha o cenário de fundo e suas decorações, evitando áreas ocupadas pelas salas e corredores conforme o modelo que recebe.

### `js/personagem.js`

Mantém a física e o desenho do personagem, incluindo movimento, limites, direção e passos.

### `js/criaturas.js`

Define criaturas associadas à complexidade e desenha seus retratos e representações nas salas.

### `js/efeitos.js`

Cria, atualiza e desenha partículas de entrada, com limites de quantidade e duração.

### `js/pixelArt.js`

Fornece paleta e dados/recursos de pixel art usados pela renderização.

### `js/jogo.js`

Coordena o ciclo de animação, renderiza Canvas, atualiza física, detecta a sala sob o jogador e gerencia teclado, foco, `Esc`, listeners e preferência de movimento reduzido. Não deve manipular DOM diretamente; comunica mudanças por callbacks.

### `js/interface.js`

Manipula DOM, troca telas, atualiza o inspector, anima descrições, desenha retratos e atualiza o estado visual dos controles. Conteúdo vindo do usuário deve ser inserido como texto, não HTML.

### `js/principal.js`

Inicializa a aplicação, recebe o código, chama análise, construção da masmorra e jogo, atualiza mensagens de erro e conecta callbacks entre jogo e interface.

## Fluxo atual

1. O usuário edita ou cola código C.
2. `principal.js` chama `analisarFuncoes`.
3. `lexicoC.js` protege strings, caracteres e comentários durante a análise.
4. `analisadorC.js` devolve funções, métricas e nomes de chamadas conhecidas.
5. `masmorra.js` calcula relações, profundidade e posições.
6. `principal.js` inicia `jogo.js` e `interface.js`.
7. `jogo.js` desenha o mapa e notifica a sala atual.
8. `interface.js` atualiza o inspector e o status dos controles.

## Arquitetura futura desejada

Os módulos seguintes são direções de arquitetura e não devem ser criados agora sem necessidade real demonstrada por testes, uso ou complexidade concreta.

### `grafoC.js`

Deverá concentrar a estrutura semântica do programa: nós de funções, arestas de chamadas, chamadas recebidas, profundidade, alcançabilidade, caminhos e ciclos. Deve ser independente de posições, pixels, DOM e física.

### `layoutMasmorra.js`

Deverá cuidar apenas de geometria e posições: colunas, espaçamento, tamanho, limites e prevenção de sobreposição. Não deve decidir o significado das chamadas nem desenhar.

### `camera.js`

Deverá cuidar de viewport, pan, zoom e transformação entre coordenadas do mundo e do Canvas, quando o mapa exceder a área atual.

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
