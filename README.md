# Dungeon do Código

O **Dungeon do Código** transforma um código em C em uma dungeon explorável no navegador.

Cada função vira uma sala. As chamadas entre funções formam caminhos, a estrutura do programa influencia a organização do mapa e as métricas do código aparecem de forma visual durante a exploração.

A ideia do projeto é juntar **leitura de código, visualização de software e uma interface inspirada em jogos**, sem deixar o mapa inventar informações que não estejam no programa analisado.

## Ideia do projeto

Ler um código maior pode ficar confuso quando é preciso entender rapidamente:

- onde o programa começa;
- quais funções chamam quais;
- quais funções são mais complexas;
- quais partes estão conectadas;
- quais funções estão isoladas;
- onde existem ciclos ou recursão.

O Dungeon do Código tenta representar essas relações de uma forma espacial.

Em vez de enxergar apenas um arquivo de texto, o usuário pode caminhar por uma representação do programa e inspecionar suas funções como salas de uma dungeon.

> O projeto é uma ferramenta de visualização e exploração. Ele não compila nem executa o código C.

---

## O que já funciona

Atualmente o projeto permite:

- digitar ou colar código C diretamente no editor;
- abrir um arquivo `.c` local;
- gerar uma dungeon a partir das funções encontradas;
- transformar cada função em uma sala;
- identificar chamadas entre funções conhecidas;
- criar um grafo de chamadas;
- usar `main` como entrada quando ela existe;
- usar a primeira função encontrada quando não existe `main`;
- calcular profundidade a partir da entrada;
- distinguir funções alcançáveis e inalcançáveis;
- detectar recursão direta;
- detectar participação em ciclos de chamadas;
- organizar as salas em um mundo que cresce conforme o programa;
- explorar a dungeon com teclado;
- selecionar salas com o mouse;
- navegar automaticamente até uma sala conectada;
- pesquisar funções pelo nome;
- navegar por callers e callees;
- destacar o contexto de chamadas de uma função;
- inspecionar métricas e o trecho de código de cada função;
- usar câmera, zoom e visão geral;
- adaptar o nível de detalhes das salas de acordo com o zoom;
- alternar entre os modos **Complexidade** e **Estrutura**;
- visualizar marcadores estruturais nas salas;
- classificar semanticamente partes da dungeon em regiões.

O projeto continua em desenvolvimento.

---

## Como o código vira uma dungeon

O fluxo atual pode ser resumido assim:

```text
Código C
   ↓
Análise léxica e estrutural
   ↓
Funções e métricas
   ↓
Grafo de chamadas
   ↓
Layout das salas
   ↓
Classificação das regiões
   ↓
Masmorra
   ↓
Corredores
   ↓
Exploração no Canvas
```

### Funções

Cada função encontrada no arquivo C vira uma sala.

O analisador identifica informações como:

- quantidade de linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- chamadas para outras funções conhecidas;
- recursão;
- participação em ciclos.

Comentários, strings e caracteres são tratados separadamente durante a análise estrutural para evitar que palavras como `if` dentro de uma string sejam interpretadas como código real.

### Grafo de chamadas

As chamadas entre funções conhecidas formam um grafo direcionado.

Por exemplo:

```c
int carregar() {
    return 1;
}

void executar() {
    carregar();
}

int main() {
    executar();
    return 0;
}
```

A relação estrutural é:

```text
main
  ↓
executar
  ↓
carregar
```

Essas relações são usadas pelo layout, pelo inspector, pelo foco contextual e pela navegação da dungeon.

---

## Organização do mapa

A dungeon não usa mais um mapa circular fixo.

As funções alcançáveis são distribuídas principalmente de acordo com sua profundidade no grafo de chamadas.

Funções mais profundas avançam pelo mapa, enquanto funções no mesmo nível são distribuídas verticalmente.

O mundo lógico pode ficar maior que o Canvas. Nesse caso, a câmera permite navegar pela dungeon sem comprimir todas as salas dentro de uma única tela.

Funções que não podem ser alcançadas a partir da entrada continuam representadas, mas ficam separadas da parte principal da exploração.

---

## Regiões semânticas

A dungeon já possui uma camada de classificação semântica das funções.

Atualmente existem quatro tipos principais:

### Entrada da Dungeon

Representa a função inicial do programa.

Quando existe `main`, ela é usada como entrada. Caso contrário, o projeto usa a primeira função encontrada.

### Salão Central

Representa funções alcançáveis que funcionam como pontos compartilhados do grafo.

Atualmente uma função pode entrar no Salão Central quando possui pelo menos três callers alcançáveis distintos.

A classificação depende das relações reais do grafo, e não do nome da função.

### Alas

Grupos de funções podem receber nomes derivados do próprio código quando existe um prefixo técnico comum confiável.

Exemplos:

```text
parse_expression
parse_primary
parse_unary
```

podem formar:

```text
Ala Parser
```

Outro exemplo:

```text
vm_push
vm_pop
vm_execute
```

pode formar:

```text
Ala VM
```

Prefixos operacionais genéricos como `get`, `set`, `create`, `delete`, `read` e `write` não são usados como significado arquitetural.

Quando não existe um nome confiável, o projeto usa nomes neutros:

```text
Ala 1
Ala 2
Ala 3
```

### Criptas Isoladas

Toda função que não pode ser alcançada a partir da entrada pertence às **Criptas Isoladas**.

Mesmo que várias funções de um componente desconectado chamem outra função desse mesmo componente, elas continuam isoladas da dungeon principal.

### Estado visual das regiões

A classificação das regiões já existe nos dados da masmorra, mas **a representação visual dessas regiões no Canvas ainda está em desenvolvimento**.

Esse é um dos próximos passos do projeto.

---

## Exploração

Depois de gerar a dungeon, o Canvas pode ser ativado com um clique.

### Movimento

Use:

```text
W A S D
```

ou:

```text
↑ ← ↓ →
```

para mover o personagem.

O teclado só controla o personagem quando o mapa está ativo.

Pressionar `Esc` libera os controles da exploração.

### Seleção de salas

Um clique em uma sala:

- seleciona a função;
- atualiza o inspector;
- destaca seu contexto no grafo;
- permite visualizar suas relações.

Um duplo clique pode iniciar a navegação automática até a sala quando existe uma rota pelos corredores atuais.

Qualquer movimento manual cancela essa navegação.

---

## Busca e inspector

Durante a exploração é possível pesquisar funções pelo nome.

O inspector mostra informações da função selecionada, incluindo:

- nome;
- métricas;
- nível de perigo;
- trecho do código;
- callers;
- callees;
- caminho mínimo desde a entrada;
- estruturas de controle;
- recursão direta;
- participação em ciclos.

Callers e callees também podem ser usados para navegar entre funções relacionadas.

---

## Foco contextual

Ao selecionar uma função, o Dungeon pode destacar as cadeias de chamadas relevantes entre a entrada e aquela função.

As salas que fazem parte do contexto continuam em destaque.

As demais permanecem visíveis com menor opacidade.

Isso permite estudar uma parte do programa sem apagar o restante da dungeon.

Funções inalcançáveis não recebem um caminho artificial a partir da entrada.

---

## Zoom

O mapa possui controles de zoom e uma opção para encaixar a dungeon inteira na tela.

O zoom não altera a posição física das salas ou do personagem. Ele muda apenas a forma como o mundo é visualizado.

O nível de detalhes também muda conforme a aproximação.

### Visão distante

Prioriza a estrutura geral do mapa.

Detalhes pequenos das salas são ocultados.

### Visão intermediária

Mostra principalmente a identificação das funções.

### Visão próxima

Exibe os detalhes completos das salas, incluindo elementos visuais e marcadores.

O hover pode mostrar o nome completo de uma função sem selecioná-la.

---

## Modos visuais

Existem dois modos principais de visualização.

### Complexidade

Mantém a representação visual baseada na complexidade da função, incluindo cores e criaturas.

### Estrutura

Usa uma aparência mais neutra e dá mais destaque às características estruturais do código.

Trocar de modo não altera:

- o grafo;
- a geometria;
- a posição do personagem;
- a câmera;
- a função selecionada.

---

## Marcadores estruturais

As salas podem mostrar pequenos marcadores para indicar estruturas encontradas na função.

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → ciclo de chamadas
```

Esses marcadores representam presença estrutural e não substituem as métricas completas mostradas no inspector.

---

## Abrindo um arquivo `.c`

Além de colar código no editor, é possível carregar um arquivo C local.

No estado atual:

- apenas um arquivo é carregado por vez;
- a extensão deve ser `.c`;
- o limite atual é de 512 KiB;
- o conteúdo é tratado como texto;
- o código não é executado.

O arquivo só substitui o conteúdo do editor depois de uma leitura válida.

---

## Privacidade

A análise do código acontece localmente no navegador.

O projeto atualmente:

- não possui backend;
- não envia o arquivo C para um servidor próprio;
- não compila o código;
- não executa o código;
- não precisa de conta ou login para funcionar localmente.

A arquitetura de publicação ainda será revisada antes da primeira versão pública, principalmente em relação a segurança, headers HTTP e proteção contra entradas maliciosas.

---

## Tecnologias

O projeto foi feito principalmente com:

- HTML;
- CSS;
- JavaScript;
- ES Modules;
- Canvas 2D;
- Node.js para a suíte de testes;
- `node:test`;
- GitHub Actions para executar os testes automaticamente.

Até o momento não foi necessário usar framework frontend ou motor de jogos.

---

## Estrutura principal

```text
dungeon-do-codigo/
├── index.html
├── css/
│   └── estilo.css
│
├── js/
│   ├── analisadorC.js
│   ├── lexicoC.js
│   ├── grafoC.js
│   ├── layoutMasmorra.js
│   ├── regioesMasmorra.js
│   ├── masmorra.js
│   ├── corredores.js
│   ├── navegacaoMasmorra.js
│   ├── camera.js
│   ├── semanticaVisual.js
│   ├── zoomDiscreto.js
│   ├── personagem.js
│   ├── cenario.js
│   ├── criaturas.js
│   ├── efeitos.js
│   ├── interface.js
│   ├── jogo.js
│   └── principal.js
│
├── testes/
├── docs/
├── .github/
│   └── workflows/
│       └── testes.yml
│
├── EVOLUCAO.md
├── CORRECOES.md
├── package.json
└── README.md
```

Alguns módulos importantes:

| Arquivo | Responsabilidade |
| --- | --- |
| `lexicoC.js` | Diferencia código, comentários e literais durante a análise |
| `analisadorC.js` | Extrai funções e métricas do código C |
| `grafoC.js` | Cria o grafo de chamadas e calcula relações estruturais |
| `layoutMasmorra.js` | Calcula posições, dimensões e tamanho do mundo |
| `regioesMasmorra.js` | Classifica entrada, hubs, alas e funções isoladas |
| `masmorra.js` | Monta os dados finais das salas e regiões |
| `corredores.js` | Converte relações do grafo em corredores geométricos |
| `navegacaoMasmorra.js` | Calcula rotas sobre os corredores existentes |
| `camera.js` | Controla a visualização do mundo |
| `semanticaVisual.js` | Define o nível de detalhes conforme o zoom |
| `personagem.js` | Controla o movimento do personagem |
| `jogo.js` | Coordena renderização, exploração e interação no Canvas |
| `interface.js` | Controla os elementos da interface fora do Canvas |
| `principal.js` | Integra análise, grafo, dungeon, interface e jogo |

---

## Como executar

Como o projeto usa ES Modules, o ideal é servir a pasta por HTTP em vez de abrir o `index.html` diretamente.

Na raiz do projeto:

```bash
python3 -m http.server
```

Depois abra:

```text
http://localhost:8000
```

Não é necessário instalar dependências para abrir a aplicação.

---

## Testes

Os testes usam o próprio test runner do Node.js.

Na pasta que contém o `package.json`, execute:

```bash
npm test
```

A suíte cobre diferentes partes do projeto, incluindo:

- análise de C;
- léxico;
- grafo;
- ciclos e recursão;
- layout;
- regiões semânticas;
- corredores;
- câmera e zoom;
- navegação;
- física;
- busca;
- inspector;
- importação de arquivos;
- segurança de texto no DOM;
- integração entre os módulos.

Também existe um workflow do GitHub Actions que executa `npm test` em pushes e pull requests.

---

## Limitações atuais

O analisador foi construído para um subconjunto simples de C.

Ele ainda não pretende substituir um compilador ou parser completo da linguagem.

Alguns casos avançados podem não ser interpretados corretamente, principalmente:

- macros complexas;
- pré-processamento condicional;
- declarações avançadas;
- ponteiros de função;
- construções pouco comuns da gramática de C.

O grafo atual representa principalmente chamadas entre funções conhecidas no código analisado. Funções externas, como as de bibliotecas, não viram salas da dungeon.

Os corredores atuais ainda são segmentos diretos entre salas. Em alguns cenários densos, principalmente com muitas funções no mesmo nível, um corredor pode atravessar visualmente outra sala.

A classificação das regiões já existe, mas elas ainda não são desenhadas no mapa.

O movimento manual também ainda não representa colisão completa com paredes de uma dungeon.

Esses pontos fazem parte da evolução do projeto.

---

## Próximos passos

Os próximos ciclos estão sendo organizados nesta ordem:

1. representar visualmente as regiões semânticas no Canvas;
2. melhorar o roteamento e a aparência dos corredores;
3. aumentar a explicação e a confiabilidade das métricas mostradas ao usuário;
4. melhorar pequenos pontos de UX e acessibilidade;
5. fazer o hardening de segurança para publicação;
6. publicar uma primeira versão acessível fora do ambiente local.

Depois da primeira versão pública, algumas ideias previstas são:

- comparação antes/depois de uma refatoração;
- exportação do mapa e do grafo;
- visão textual alternativa ao Canvas;
- missões de leitura de código;
- suporte futuro a outros analisadores ou linguagens.

---

## Documentação

A documentação técnica está separada por objetivo:

- [`docs/ESTADO_ATUAL.md`](docs/ESTADO_ATUAL.md) — retrato técnico do projeto no estado atual;
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — organização dos módulos e fluxo de dados;
- [`docs/DECISOES.md`](docs/DECISOES.md) — decisões tomadas durante o desenvolvimento;
- [`docs/PLANO_TECNICO.md`](docs/PLANO_TECNICO.md) — próximos ciclos e melhorias planejadas;
- [`EVOLUCAO.md`](EVOLUCAO.md) — histórico e direção de evolução do projeto;
- [`CORRECOES.md`](CORRECOES.md) — registro de uma revisão anterior de bugs e correções.

---

## Princípio do projeto

O Dungeon do Código pode usar uma linguagem visual de jogo, mas as informações apresentadas precisam continuar ligadas ao código real.

A regra que guia essa evolução é:

> **Se um significado visual não puder ser justificado por dados reais do código, ele não deve ser apresentado como fato.**

A dungeon deve ajudar a entender o programa — não inventar uma história sobre ele.