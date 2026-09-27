# Decisões técnicas

## Estrutura da dungeon

### Não usar dungeon procedural aleatória como estrutura principal

A dungeon deve explicar o programa. Aleatoriedade pode dificultar a comparação entre execuções e esconder relações importantes. O mapa deve refletir a semântica do código.

### O layout deve refletir a semântica do programa

Salas representam funções e posições devem comunicar profundidade, alcance e relações. O layout atual usa profundidade para colunas, e os corredores já representam chamadas reais a partir das arestas de `grafoC.js`.

### Priorizar determinismo

O mesmo código deve produzir uma dungeon estável. Determinismo facilita aprendizagem, testes, comparação e depuração.

### Medir legibilidade dos corredores antes de alterar o layout

Além de tamanho do mundo e sobreposição de salas, comparar cruzamentos transversais, passagens pelo interior de terceiras salas e comprimento total dos corredores. A linha de base usa os segmentos retos atuais e casos determinísticos; o roteamento fica para uma etapa posterior.

### Ordenar verticalmente por callers da coluna anterior

O primeiro experimento de legibilidade usa a média da posição vertical dos callers já posicionados na profundidade anterior e a ordem estrutural original como desempate. Mantém profundidades, dimensões e a coluna final de funções inalcançáveis. No diagnóstico denso de 24 funções, reduziu cruzamentos de 59 para 17, travessias de salas de 15 para 8 e comprimento de 6439,16 para 5307,77; os corredores continuam retos entre centros.

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

Não salvar automaticamente o código do usuário. A importação atual é explícita; salvamento de sessão e exportação continuam futuros e também devem exigir ação do usuário.

### Importar apenas um arquivo `.c` local por vez

O botão Abrir .c e o drop no editor passam pela mesma validação de extensão e limite de 512 KiB antes de usar `File.text()`. Erros mantêm o código anterior; a importação não dispara análise nem geração automática. O arquivo permanece no navegador, sem upload, execução ou persistência.

## Interface

### Priorizar leitura estrutural do programa

O inspector mostra callers, callees, um caminho mínimo desde a entrada, o total e o perfil de estruturas de controle e indicadores de recursão direta e ciclo. Callers, callees, resultados da busca e cliques em salas usam a mesma seleção: ela foca a sala na câmera e atualiza o inspector sem mover o personagem. Um clique em área vazia do Canvas devolve a câmera ao personagem; duplo clique em sala seleciona e inicia a navegação automática. Navegação pelo caminho completo continua futura.

### Navegar somente pela geometria existente

O duplo clique usa os segmentos já desenhados entre centros de salas para calcular uma rota transitável, sem modificar as chamadas direcionadas do programa. O personagem percorre esses segmentos à velocidade normal, com câmera acompanhando; movimento manual cancela a rota. Sem conexão entre a posição atual e a sala escolhida, só a seleção é aplicada. Essa navegação não substitui a futura colisão/topologia para movimento manual.

### Destacar todas as cadeias relevantes na seleção

O foco contextual usa as arestas reais do grafo e considera todas as funções que podem ser alcançadas da entrada antes do alvo e também podem chegar a ele. Assim, rotas alternativas permanecem visíveis sem escolher um único caminho; conjuntos de visitados limitam a busca em ciclos. O inspector mantém seu caminho mínimo textual. `principal.js` passa o contexto calculado em `grafoC.js` ao jogo, que apenas reduz a opacidade das salas e dos corredores fora do contexto. Uma função inalcançável destaca só a própria sala; desfazer a seleção restaura o desenho normal.

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
