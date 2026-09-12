# Dungeon do Código

Pega um código em C e transforma ele numa masmorra que dá pra explorar. Cada função vira uma sala — funções mais complexas geram salas maiores e mais perigosas. Dá pra andar pelo mapa com as setas ou WASD e ver o código de cada função ao entrar na sala dela.

## Como funciona

O código colado é analisado no navegador: um parser simples identifica cada função, conta linhas e estruturas de controle (`if`, `for`, `while`, `switch`), e calcula um nível de complexidade a partir disso. A função `main` vira a sala inicial, e as demais são distribuídas ao redor dela, com corredores ligando tudo.

## Estrutura

dungeon-do-codigo/
├── index.html
├── css/
│ └── estilo.css
└── js/
├── analisadorC.js — extrai funções e calcula complexidade
├── masmorra.js — gera as salas a partir das funções
├── jogo.js — renderização em canvas e física do jogador
├── interface.js — manipulação de DOM
└── principal.js — ponto de entrada, liga tudo


## Como rodar

Como os módulos JS usam `import`/`export`, não dá pra abrir o `index.html` direto do disco — precisa servir a pasta com um servidor local. Com Python instalado, por exemplo:

\`\`\`bash
python3 -m http.server
\`\`\`

E depois acessar `http://localhost:8000` no navegador.

## Limitações conhecidas

O parser é ingênuo: funciona bem com código C simples e direto, mas pode se confundir com structs aninhadas complexas, macros elaboradas ou ponteiros de função.