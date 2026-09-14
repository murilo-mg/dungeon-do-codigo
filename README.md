# Dungeon do Código

Transforma funções de um código-fonte em C em salas de uma masmorra explorável. Use setas ou WASD para andar e inspecione a função da sala atual no painel lateral.

## O que já funciona

- Aventureiro em pixel art com quatro direções, quadros de caminhada, pegadas temporárias e respiração após três segundos parado.
- Movimento por tempo decorrido, velocidade diagonal normalizada e liberação das teclas ao perder foco ou trocar de aba.
- Três criaturas por faixa de complexidade, borda pulsante na sala atual e partículas ao entrar.
- Nuvens lentas ao fundo, pedras e tochas posicionadas fora das salas e dos corredores.
- Retrato da mesma criatura no painel, descrição baseada nas métricas com efeito de digitação e barra de perigo animada.
- Respeito à preferência de reduzir movimento do sistema. Nesse modo, a navegação continua, os efeitos decorativos ficam estáticos e a descrição aparece inteira.

A exploração continua livre pelo canvas, como na versão inicial. As criaturas são decorativas; não há combate, portas físicas ou colisão com paredes.

## Como rodar

Na pasta do projeto, inicie um servidor estático:

```bash
python3 -m http.server 8000
```

Acesse [a aplicação local](http://localhost:8000). Os módulos JavaScript precisam de HTTP; abrir `index.html` diretamente pelo disco pode bloquear os imports. Não há instalação de pacotes nem etapa de compilação para executar o jogo. As fontes externas possuem alternativas locais.

Para executar os testes, use Node.js 22 ou superior:

```bash
npm test
```

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura da página e controles |
| `css/estilo.css` | Layout, paleta e transição da barra |
| `js/analisadorC.js` | Extração simplificada de funções e métricas |
| `js/masmorra.js` | Geometria, tamanho e cor das salas |
| `js/jogo.js` | Eventos, ciclo de animação, composição do canvas e transições de sala |
| `js/personagem.js` | Movimento, direção, quadros, repouso e pegadas |
| `js/pixelArt.js` | Cores usadas pelo canvas e desenho de matrizes de pixels |
| `js/criaturas.js` | Definições compartilhadas entre sala e retrato |
| `js/efeitos.js` | Criação, duração e desenho das partículas de entrada |
| `js/cenario.js` | Nuvens e posicionamento das decorações |
| `js/interface.js` | Telas e ciclo de vida das animações do painel |
| `js/principal.js` | Conexão entre análise, geração, jogo e interface |
| `testes/` | Testes sem dependências, com relógio e eventos controlados |

Os desenhos são matrizes de pixels, renderizadas em escala inteira pelo canvas. Ao mudar a paleta, mantenha as cores de `pixelArt.js` e as variáveis do CSS correspondentes. Cada subsistema de efeitos recebe o tempo do jogo; não cria ciclos próprios. O painel possui um ciclo curto, cancelado na troca de sala ou saída para o editor.

## Como interpretar o perigo

O índice atual é `estruturas de controle × 2 + floor(linhas de corpo / 4)`.

| Índice | Perigo | Criatura | Preenchimento visual da barra |
| --- | --- | --- | --- |
| 0–2 | Baixo | Gosma de musgo | 25% |
| 3–6 | Médio | Sentinela de brasa | 60% |
| 7 ou mais | Alto | Guardião das profundezas | 100% |

A barra representa três categorias; o preenchimento não é uma probabilidade. O índice é uma heurística de tamanho e estruturas de controle, não uma medição formal de complexidade ciclomática ou uma avaliação de segurança. A sala inicial conserva o tamanho fixo e a cor dourada do projeto original; sua criatura segue a complexidade.

O painel descreve as métricas disponíveis, sem inferir o objetivo semântico da função. O trecho exibido conserva o limite existente de 500 caracteres. O código C não é executado.

## Limitações e próximos passos

O parser ainda usa expressões regulares e não interpreta C completo. Textos entre aspas podem afetar a extração e a contagem. Muitas funções podem gerar salas sobrepostas; os corredores atuais ligam todas as salas à inicial e ainda não representam chamadas reais.

Veja [EVOLUCAO.md](EVOLUCAO.md) para os casos reproduzidos, a sequência recomendada e os critérios de entrega.

## Verificação desta evolução

Os 15 testes cobrem velocidade em 30/60/144 Hz, diagonal, parada, pegadas, limites, faixas de criaturas, escala dos retratos, expiração de partículas, posicionamento do cenário, cancelamento do painel, redução de movimento, transições de sala e reinício do jogo sem duplicar eventos ou ciclos.

A cena e a folha de sprites foram renderizadas com uma implementação de Canvas 2D e conferidas visualmente. O navegador remoto de revisão bloqueou a URL local; a composição HTML/CSS e a percepção das animações ainda precisam de conferência em um navegador comum.

Roteiro para essa conferência: gerar a masmorra de exemplo; andar nas quatro direções; soltar as teclas e esperar o repouso; entrar e sair rapidamente de salas; voltar e gerar outra masmorra; trocar de aba durante o movimento; repetir com a preferência de reduzir movimento ligada.
