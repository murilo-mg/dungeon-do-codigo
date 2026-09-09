# Dungeon do Código

Ideia: pegar um código em C e transformar ele numa masmorra que dá pra explorar. Cada função vira uma sala — funções mais complexas geram salas maiores e mais perigosas. Dá pra andar pelo mapa com as setas ou WASD e ver o código de cada função ao entrar na sala dela.

## Onde estou

Ainda em obra. Por enquanto é tudo um arquivo HTML só, com parser de C, geração das salas e o jogo em canvas misturados. Fiz assim pra testar a ideia rápido, agora quero organizar isso direito.

## O que pretendo mudar

Separar HTML, CSS e JS em módulos de verdade, tirar o parser de C de dentro da lógica do jogo, e resolver um bug feio: toda vez que gero uma masmorra nova, o loop de animação anterior continua rodando junto. Também quero traduzir tudo pra português — variáveis, funções, comentários.

## Estrutura que estou construindo

\`\`\`
dungeon-do-codigo/
├── index.html
├── css/
│   └── estilo.css
└── js/
    ├── analisadorC.js
    ├── masmorra.js
    ├── jogo.js
    ├── interface.js
    └── principal.js
\`\`\`

## Como rodar

Só abrir o \`index.html\` no navegador. Quando eu terminar de separar os módulos JS, vai ser preciso rodar por um servidor local, porque \`import\`/\`export\` não funcionam abrindo o arquivo direto do disco.
