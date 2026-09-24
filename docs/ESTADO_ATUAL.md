# Estado atual

## Repositório

- Branch de desenvolvimento: `melhoria/v1-publica`.
- O projeto é um frontend estático servido localmente; o script de testes é `npm test`.
- A suíte registrada no estado deste documento tem 83 testes passando.
- O workspace de exploração já existe.

## Produto existente

- A tela de entrada e a tela de exploração estão separadas.
- O parser detecta funções, ignora comentários/literais na análise estrutural e detecta chamadas entre funções conhecidas.
- A profundidade a partir de `main` já é calculada; se não houver `main`, a primeira função é usada como inicial.
- O layout atual organiza salas em colunas conforme a profundidade e separa funções inalcançáveis em uma coluna de isoladas.
- O Canvas renderiza cenário, salas, criaturas, personagem, passos e efeitos.
- O inspector no DOM mostra função, métricas, perigo e trecho do código.
- Os controles de exploração só capturam teclado após clique no mapa; clique fora e `Esc` liberam o mapa.
- A preferência `prefers-reduced-motion` é respeitada em animações relevantes.

## Último marco

O último marco é o estado visual dos controles e a tecla `Esc` para liberar o mapa. O indicador e o texto do rodapé informam o estado; há cobertura automatizada para ativação, notificações, `Esc`, liberação das setas e reativação.

## Base estrutural atual

`grafoC.js` agora representa explicitamente a função de entrada, os nós por nome, as arestas direcionadas, as chamadas recebidas, a profundidade mínima e o alcance a partir da entrada. `masmorra.js` consome esse grafo para manter o layout atual, sem duplicar o cálculo das relações.

`layoutMasmorra.js` agora concentra a organização por profundidade, as colunas, a distribuição vertical, as posições, as dimensões e o tamanho do mundo lógico. Sua API retorna `{ salas, larguraMundo, alturaMundo }`. O viewport continua em 560x480; `masmorra.js` consome somente `layout.salas` para montar as salas.

`camera.js` agora acompanha o personagem sem suavização, limitando a posição ao intervalo válido entre o mundo lógico e o viewport. As coordenadas armazenadas de salas, corredores, personagem, partículas e passos continuam sendo coordenadas do mundo.

## Corredores reais

`principal.js` cria o grafo uma única vez, passa o grafo para `masmorra.js` e passa `grafo.arestas` para `jogo.js`. `corredores.js` converte as arestas e as salas em segmentos geométricos válidos. `jogo.js` desenha esses segmentos, enquanto `cenario.js` usa os mesmos segmentos para evitar decorações. Arestas com origem ou destino ausente, duplicatas e autoarestas são ignoradas para a renderização.

## Câmera e viewport

O mundo lógico cresce horizontalmente para cadeias profundas e verticalmente para níveis com muitas salas, mantendo gaps mínimos e sem sobreposição nos cenários testados. O Canvas continua sendo um viewport de 560x480. A câmera acompanha o jogador, é limitada às bordas do mundo e aplica uma única transformação de contexto durante o desenho. O jogador usa `larguraMundo` e `alturaMundo` como limites físicos.

Zoom, minimapa, pan manual, drag, easing, culling e colisão com salas/corredores ainda não existem. A detecção da sala continua comparando coordenadas do mundo sem aplicar a câmera.

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

O layout próprio agora garante espaçamento nos cenários medidos. O próximo passo é adicionar câmera/viewport para explorar o mundo maior; só depois de validar essa etapa e medir novos casos deve-se considerar Dagre ou ELK.

## Próximo trabalho estrutural

1. Avaliar manualmente a navegação em mundos maiores que o viewport.
2. Considerar zoom e minimapa somente depois de validar a câmera básica.
3. Acrescentar caminhos e análises mais avançadas somente quando houver necessidade real.

## Divergências entre plano e código

- O plano define o grafo como fonte de verdade; `grafoC.js` já concentra nós, arestas, chamadas recebidas, alcance e profundidade.
- O plano define corredores como chamadas reais; isso já está implementado por `corredores.js`, `jogo.js` e `cenario.js`.
- O layout separado já existe em `layoutMasmorra.js`; a câmera básica já acompanha o personagem, mas ainda não há zoom nem minimapa.
- O plano prevê módulos futuros como `camera.js`, `busca.js`, `arquivos.js` e `exportacao.js`; eles ainda não existem e não devem ser criados sem necessidade real.
- O plano prevê estresse com 5, 15, 30 e 60 funções; esses cenários ainda não são uma suíte dedicada.
- O plano prevê comparação A/B apenas após a v1; ela não está implementada.

## Critérios para o próximo ciclo

O próximo trabalho deve preservar a análise local sem execução de C, a estabilidade do layout para os casos suportados, a separação Canvas/DOM, a acessibilidade dos controles e a suíte existente. Qualquer adoção de biblioteca de layout deve ser precedida por medições dos casos de estresse.
