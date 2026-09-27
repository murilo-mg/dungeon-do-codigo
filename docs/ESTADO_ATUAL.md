# Estado atual

## Repositório

- Branch de desenvolvimento: `melhoria/v1-publica`.
- O projeto é um frontend estático servido localmente; o script de testes é `npm test`.
- A suíte registrada no estado deste documento tem 186 testes passando.
- O workspace de exploração já existe.

## Produto existente

- A tela de entrada e a tela de exploração estão separadas.
- A entrada aceita código digitado/colado ou um arquivo `.c` local por seletor ou drop no editor. Aceita um arquivo por vez, até 512 KiB; só substitui o texto após leitura válida, sem executar ou enviar o arquivo.
- O parser detecta funções, ignora comentários/literais na análise estrutural e detecta chamadas entre funções conhecidas.
- A profundidade a partir de `main` já é calculada; se não houver `main`, a primeira função é usada como inicial.
- O layout atual organiza salas em colunas conforme a profundidade e separa funções inalcançáveis em uma coluna de isoladas.
- O Canvas renderiza cenário, salas, personagem, passos, efeitos e marcadores estruturais. No modo Complexidade, preserva cores por complexidade e criaturas; no modo Estrutura, usa base de pedra neutra, oculta criaturas e realça os marcadores.
- O inspector no DOM mostra função, métricas, perigo, trecho do código, callers, callees, caminho mínimo desde a entrada, total e perfil de estruturas de controle e indicadores de recursão direta ou ciclo. Callers e callees são botões que permitem focar a sala relacionada.
- A busca na exploração filtra nomes de `grafo.nos` por trecho, sem diferenciar maiúsculas de minúsculas, e foca a sala escolhida pelo mesmo fluxo dos botões de relações.
- Os controles de exploração só capturam teclado após clique no mapa; clique fora e `Esc` liberam o mapa.
- A preferência `prefers-reduced-motion` é respeitada em animações relevantes.

## Último marco

O último marco é a importação local de um arquivo `.c` pelo botão Abrir .c ou por drop na área de código. O arquivo é validado pelo nome e pelo limite de 512 KiB antes de ser lido; extensão inválida, tamanho excessivo, seleção múltipla, leitura falha ou conteúdo vazio preservam o texto anterior. A importação não gera a dungeon automaticamente. A validação manual desse fluxo no navegador, dos marcadores, dos modos visuais, do zoom e da visão geral ainda está pendente.

## Base estrutural atual

`grafoC.js` representa explicitamente a função de entrada, os nós por nome, as arestas direcionadas, as chamadas recebidas, a profundidade mínima e o alcance a partir da entrada. Agora também marca autoarestas como recursão direta e detecta participação em ciclo apenas quando um caminho de chamadas conhecidas retorna ao próprio nó. `masmorra.js` consome esses dados sem duplicar o cálculo das relações.

`layoutMasmorra.js` agora concentra a organização por profundidade, as colunas, a distribuição vertical, as posições, as dimensões e o tamanho do mundo lógico. Sua API retorna `{ salas, larguraMundo, alturaMundo }`. O viewport continua em 560x480; `masmorra.js` consome somente `layout.salas` para montar as salas.

`camera.js` calcula a posição a partir de um alvo sem suavização, considerando a área visível definida pelo zoom para limitar o deslocamento. Também calcula o menor zoom que encaixa o mundo e limita o zoom manual a 200%. `jogo.js` usa o personagem como alvo durante a exploração, o centro da sala selecionada no foco manual e mantém a visão geral fixa enquanto ela está ativa. As coordenadas armazenadas de salas, corredores, personagem, partículas e passos continuam sendo coordenadas do mundo.

## Corredores reais

`principal.js` cria o grafo uma única vez, passa o grafo para `masmorra.js` e passa `grafo.arestas` para `jogo.js`. `corredores.js` converte as arestas e as salas em segmentos geométricos válidos. `jogo.js` desenha esses segmentos, enquanto `cenario.js` usa os mesmos segmentos para evitar decorações. Arestas com origem ou destino ausente, duplicatas e autoarestas são ignoradas para a renderização.

## Câmera e viewport

O mundo lógico cresce horizontalmente para cadeias profundas e verticalmente para níveis com muitas salas, mantendo gaps mínimos e sem sobreposição nos cenários testados. O Canvas continua sendo um viewport de 560x480. A câmera segue o jogador, foca manualmente a sala selecionada ou mostra o mundo inteiro em visão geral. O zoom manual avança em passos de 25%, entre o encaixe do mundo e 200%; Encaixar escolhe o zoom necessário para mostrar toda a dungeon, sem ampliar mundos pequenos acima de 100%. Escala e deslocamento são aplicados somente durante o desenho. Selecionar uma função após Encaixar restaura 100% e foca a sala; um clique no Canvas restaura 100% e o seguimento do jogador. O jogador usa `larguraMundo` e `alturaMundo` como limites físicos.

Minimapa, pan manual, drag, easing, culling e colisão com salas/corredores ainda não existem. A detecção da sala continua comparando coordenadas do mundo sem aplicar a câmera.

## Resultados de estresse do layout

Os testes determinísticos cobrem cadeia profunda, muitas funções no mesmo nível e combinação de ramificações com funções isoladas. A contagem indica pares de salas com interseção; zero significa que não houve sobreposição. O mundo mínimo continua sendo 560x480.

| Funções | Cenário | Mundo lógico | Sobreposições | Menor distância vertical | Colunas |
| ---: | --- | ---: | ---: | ---: | ---: |
| 5 | cadeia | 560x480 | 0 | não se aplica | 5 |
| 5 | mesmo nível | 560x480 | 0 | 90 | 4 |
| 5 | combinação | 560x480 | 0 | 90 | 5 |
| 15 | cadeia | 1538x480 | 0 | não se aplica | 15 |
| 15 | mesmo nível | 560x1428 | 0 | 90 | 4 |
| 15 | combinação | 873x738 | 0 | 90 | 11 |
| 30 | cadeia | 3063x480 | 0 | não se aplica | 30 |
| 30 | mesmo nível | 560x2953 | 0 | 90 | 4 |
| 30 | combinação | 1583x1553 | 0 | 90 | 18 |
| 60 | cadeia | 6113x480 | 0 | não se aplica | 60 |
| 60 | mesmo nível | 560x6003 | 0 | 90 | 4 |
| 60 | combinação | 3108x3078 | 0 | 90 | 33 |

Antes do mundo dinâmico, as sobreposições começavam em 15 funções: 31 na cadeia, 32 no mesmo nível e 13 na combinação; em 60 funções chegavam a 606, 688 e 373, respectivamente. Depois da mudança, os 12 cenários apresentam zero sobreposições e nenhuma sala ultrapassa os limites do mundo calculado.

Nesta execução local, a criação do grafo e o cálculo do layout ficaram na ordem de milissegundos ou menos. Esses tempos são apenas observações da máquina usada, não garantias de performance; o custo computacional continua secundário diante da área visual necessária.

O layout próprio garante espaçamento nos cenários medidos, e a câmera básica já permite explorar o mundo maior, com validação manual concluída. Dagre ou ELK só devem ser considerados se novos casos medidos demonstrarem problemas que a solução atual não resolva.

## Leitura estrutural do programa

O bloco atual está implementado no inspector, com:

1. Callers: funções que chamam a função selecionada.
2. Callees: funções chamadas pela função selecionada.
3. Um caminho mínimo desde a entrada, que usa `main` quando ela existe.
4. Total de estruturas de controle e contagens separadas de `if`, `for`, `while`, `switch` e `case`.
5. Recursão direta e participação em ciclo de chamadas, com texto que distingue os dois casos.

A navegação pelos botões de callers, callees e resultados da busca seleciona a função no inspector e foca a sala correspondente sem teleportar o personagem. A sala física e a selecionada são estados separados; a sala selecionada recebe contorno adicional no mapa, inclusive na visão geral. Navegação pelo caminho completo e minimapa continuam futuros.

O perfil estrutural e os indicadores de ciclo também estão nas salas. O Canvas desenha pequenos glifos em pixels inteiros: I/F/W/S na lateral esquerda e R/C na direita. No modo Complexidade, a cor base indica complexidade; no modo Estrutura, a base neutra e o maior contraste dos glifos enfatizam a presença das estruturas. A legenda HTML fica próxima aos controles da câmera e dos modos. `case` não recebe marcador próprio nem cria S quando não há `switch`. Não existem filtro por estrutura nem contagem visual repetida.

## Implementações concluídas e pendências

- O plano define o grafo como fonte de verdade; `grafoC.js` já concentra nós, arestas, chamadas recebidas, alcance e profundidade.
- `analisadorC.js` fornece `estruturasPorTipo` com zeros explícitos, e `grafoC.js` distingue recursão direta de participação em ciclo. A complexidade e o layout continuam com as regras anteriores.
- `semanticaVisual.js` seleciona os marcadores a partir desses metadados; `jogo.js` apenas os desenha nas coordenadas do mundo, e o inspector mantém as quantidades detalhadas.
- O plano define corredores como chamadas reais; isso já está implementado por `corredores.js`, `jogo.js` e `cenario.js`.
- O layout separado já existe em `layoutMasmorra.js`; a câmera acompanha o personagem e oferece zoom manual e visão geral, mas ainda não há minimapa.
- `camera.js` já existe e o foco a partir da busca usa a seleção manual. A importação local `.c` está implementada com validação em `entradaCodigo.js`; exportação continua futura e `exportacao.js` ainda não existe.
- Os testes de estresse com 5, 15, 30 e 60 funções estão concluídos em `testes/layoutMasmorra-estresse.test.js`, com zero sobreposições de salas nos cenários atuais.
- Navegação pelo caminho completo, análise de todos os caminhos, colisão/topologia, PWA e comparação A/B não estão implementados; a comparação A/B continua prevista para depois da v1. A auditoria final de segurança permanece pendente.

## Critérios para o próximo ciclo

O próximo trabalho deve preservar a análise local sem execução de C, a estabilidade do layout para os casos suportados, a separação Canvas/DOM, a acessibilidade dos controles e a suíte existente. Qualquer adoção de biblioteca de layout deve ser precedida por medições dos casos de estresse.
