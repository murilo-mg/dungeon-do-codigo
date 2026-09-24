# Estado atual

## Repositório

- Branch de desenvolvimento: `melhoria/v1-publica`.
- O projeto é um frontend estático servido localmente; o script de testes é `npm test`.
- A suíte registrada no estado deste documento tem 50 testes passando.
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

## Problema estrutural importante

Os corredores ainda saem da sala inicial para todas as salas e não representam as chamadas reais entre funções. O grafo já possui as arestas necessárias, mas `jogo.js` ainda não as consome para desenhar os corredores.

Também existe risco de sobreposição quando muitas funções ocupam os mesmos níveis/posições. A geometria atual é fixa para um Canvas de 560x480 e não oferece câmera ou zoom.

## Próximo trabalho estrutural

1. Fazer o layout consumir o grafo sem misturar semântica e geometria.
2. Desenhar corredores reais a partir das arestas.
3. Atualizar o cenário para reservar e utilizar essas arestas.
4. Acrescentar caminhos e análises mais avançadas somente quando houver necessidade real.

## Divergências entre plano e código

- O plano define o grafo como fonte de verdade; `grafoC.js` já concentra nós, arestas, chamadas recebidas, alcance e profundidade.
- O plano define corredores como chamadas reais, mas `jogo.js` ainda desenha uma ligação da sala inicial para cada sala secundária.
- O plano prevê layout separado, mas a geometria ainda está em `masmorra.js`.
- O plano prevê módulos futuros como `camera.js`, `busca.js`, `arquivos.js` e `exportacao.js`; eles ainda não existem e não devem ser criados sem necessidade real.
- O plano prevê estresse com 5, 15, 30 e 60 funções; esses cenários ainda não são uma suíte dedicada.
- O plano prevê comparação A/B apenas após a v1; ela não está implementada.

## Critérios para o próximo ciclo

O próximo trabalho deve preservar a análise local sem execução de C, a estabilidade do layout para os casos suportados, a separação Canvas/DOM, a acessibilidade dos controles e a suíte existente. Qualquer adoção de biblioteca de layout deve ser precedida por medições dos casos de estresse.
