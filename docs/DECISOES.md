# Decisões técnicas

## Estrutura da dungeon

### Não usar dungeon procedural aleatória como estrutura principal

A dungeon deve explicar o programa. Aleatoriedade pode dificultar a comparação entre execuções e esconder relações importantes. O mapa deve refletir a semântica do código.

### O layout deve refletir a semântica do programa

Salas representam funções e posições devem comunicar profundidade, alcance e relações. O layout atual usa profundidade para colunas, e os corredores já representam chamadas reais a partir das arestas de `grafoC.js`.

### Priorizar determinismo

O mesmo código deve produzir uma dungeon estável. Determinismo facilita aprendizagem, testes, comparação e depuração.

## Tecnologia

### Não usar React agora

A aplicação é pequena, estática e já funciona com HTML, CSS e ES Modules. React adicionaria build e abstrações sem resolver uma necessidade comprovada da v1.

### Não usar Three.js/WebGL agora

O mapa atual é 2D e Canvas 2D atende à renderização, física e pixel art. Three.js/WebGL só deve ser considerado se houver uma necessidade real de 3D ou volume que Canvas 2D não consiga atender.

### Não instalar Dagre/ELK agora

O grafo explícito, o layout separado e os testes de estresse com 5, 15, 30 e 60 funções estão concluídos. O mundo lógico dinâmico apresenta zero sobreposições de salas nos cenários atuais, e a câmera básica foi validada manualmente. Dagre/ELK só deve ser avaliado se novas medições mostrarem problemas reais que uma implementação pequena não resolva.

### Não usar backend na v1

Análise, exploração e exportação inicial podem ser locais. Backend criaria custos de hospedagem, privacidade e manutenção sem requisito atual.

### Não executar código C

O projeto analisa texto. Compilar ou executar código fornecido pelo usuário aumentaria drasticamente a superfície de risco e foge do objetivo pedagógico atual.

### Processamento local no navegador

Preserva privacidade, funciona como aplicação estática e simplifica publicação. O código do usuário não deve ser enviado automaticamente.

### Evitar persistência automática

Não salvar automaticamente o código do usuário. Importação, salvamento de sessão e exportação devem ser ações explícitas e futuras.

## Interface

### Priorizar leitura estrutural do programa

O inspector mostra callers, callees, um caminho mínimo desde a entrada, o total e o perfil de estruturas de controle e indicadores de recursão direta e ciclo. Callers, callees e resultados da busca usam a mesma seleção: ela foca a sala na câmera e atualiza o inspector sem mover o personagem. Ao clicar no Canvas, a câmera volta a seguir o personagem. Navegação pelo caminho completo continua futura.

### Separar dados semânticos da representação visual

O analisador expõe contagens por tipo mantendo o total e a fórmula de complexidade. O grafo determina recursão direta e participação em ciclo a partir de chamadas conhecidas; salas e inspector consomem esses dados. As salas recebem glifos pequenos para presença de I/F/W/S e R/C, enquanto `case` e quantidades permanecem no inspector. Complexidade conserva a cor base e as criaturas anteriores; Estrutura usa base de pedra neutra, oculta as criaturas e aumenta o contraste dos mesmos glifos. A alternância afeta apenas o desenho, sem mudar dimensões, layout ou seleção. Filtros continuam futuros.

### Canvas para mapa; DOM para inspector e controles

Canvas é adequado para mapa, criaturas, cenário e animações. DOM é melhor para texto, foco, leitores de tela, inspector e controles acessíveis.

### Zoom altera somente a projeção do mundo

`camera.js` calcula área visível, limites e encaixe. `jogo.js` mantém os modos de seguimento, foco em sala e visão geral; apenas a transformação do Canvas recebe o zoom. Física, detecção de sala, personagem e geometria continuam em coordenadas do mundo. Selecionar uma função ou clicar no Canvas após Encaixar restaura 100% para tornar o foco visível. A barra de câmera fica no DOM e é conectada pelo orquestrador.

### Preservar HTML/CSS/JavaScript ES Modules + Canvas

Essa combinação é suficiente para a v1 e mantém o projeto fácil de explicar em entrevista. Novas tecnologias precisam de justificativa técnica e aprovação antes de entrar.

## Operação do repositório

O usuário Murilo continua responsável por commits e push. Mudanças devem ser verificadas com a suíte e as checagens documentadas em `AGENTS.md`; operações como commit, push, merge, reset, clean ou stash exigem autorização explícita.
