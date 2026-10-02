# Dungeon do Código

O **Dungeon do Código** transforma código C em uma dungeon explorável no navegador.

Cada função encontrada vira uma sala. Chamadas entre funções conhecidas formam corredores semânticos, a estrutura do programa influencia a organização da dungeon e informações do código aparecem durante a exploração.

A proposta combina:

- leitura de código;
- visualização de software;
- exploração espacial;
- uma interface inspirada em jogos.

A regra principal do projeto é simples:

> **A dungeon pode interpretar a estrutura do programa, mas não deve inventar informações sobre ele.**

O projeto é uma ferramenta de visualização e exploração. Ele **não compila nem executa** o código C.

---

## Visão geral

Um programa C passa aproximadamente por este fluxo:

```text
Código C
   ↓
Análise léxica
   ↓
Extração de funções e métricas
   ↓
Grafo de chamadas
   ├───────────────┐
   ↓               ↓
Regiões        Layout regional
   └───────┬───────┘
           ↓
        Dungeon
           ↓
 ┌─────────┴──────────┐
 ↓                    ↓
Corredores        Galerias
semânticos        de exploração
 └─────────┬──────────┘
           ↓
     Área caminhável
           ↓
 Exploração no Canvas
```

Os dois tipos de caminho possuem papéis diferentes:

- **corredores semânticos** representam chamadas reais entre funções;
- **galerias de exploração** existem apenas para melhorar a circulação física pela dungeon.

Uma galeria não cria uma chamada, não altera callers ou callees e não muda o grafo do programa.

---

## O que já funciona

### Entrada de código

É possível:

- digitar ou colar código C;
- abrir um arquivo `.c`;
- arrastar um arquivo válido para a área de entrada;
- editar o conteúdo antes da geração;
- gerar a dungeon somente quando o usuário desejar.

A importação aceita atualmente:

```text
1 arquivo por vez
extensão .c
até 512 KiB
```

O limite de 512 KiB também vale para texto colado, medido em bytes UTF-8.
Esta versão aceita até 64 funções e 256 relações de chamada. A preparação
acontece em um Worker local, pode ser cancelada e é interrompida depois de
8 segundos. Mapas grandes demais são recusados com uma mensagem.

O aplicativo não envia, salva em armazenamento persistente, compila ou executa
seu código C. As fontes também são locais. A hospedagem ainda recebe requisições
pelos arquivos do site e pode manter registros de acesso.

As proteções e as verificações de publicação estão em [SECURITY.md](SECURITY.md).

### Análise estrutural

O projeto possui uma etapa léxica que diferencia:

- código;
- comentários;
- strings;
- caracteres.

Isso evita interpretar conteúdo textual como estrutura real.

Por exemplo:

```c
printf("if while }");
```

não deve produzir um `if`, um `while` ou encerrar uma função.

O analisador extrai informações como:

- funções;
- trechos originais;
- quantidade de linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- métrica de complexidade atual;
- chamadas para outras funções conhecidas.

---

## Grafo de chamadas

As relações entre funções conhecidas formam um grafo direcionado.

Por exemplo:

```c
void carregar(void) {
}

void executar(void) {
    carregar();
}

int main(void) {
    executar();
    return 0;
}
```

produz estruturalmente:

```text
main
  ↓
executar
  ↓
carregar
```

O grafo mantém informações como:

- função de entrada;
- callers;
- callees;
- profundidade mínima;
- alcançabilidade;
- caminho desde a entrada;
- recursão direta;
- participação em ciclos.

Quando existe `main`, ela é usada como entrada.

Caso contrário, a primeira função encontrada assume esse papel.

Chamadas para funções externas que não possuem implementação no código analisado não viram salas atualmente.

---

## Salas

Cada função encontrada vira uma sala.

O tamanho e a aparência podem representar informações extraídas do código.

As salas também podem exibir marcadores estruturais:

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → participação em ciclo
```

A visualização possui dois modos principais.

### Complexidade

Prioriza:

- cores;
- criaturas;
- diferença visual de perigo.

### Estrutura

Prioriza:

- marcadores;
- relações;
- leitura estrutural.

A troca de modo não altera o grafo ou a geometria da dungeon.

---

## Regiões da dungeon

As funções também podem ser organizadas em regiões semânticas.

Atualmente existem quatro categorias principais.

### Entrada da Dungeon

Representa a função inicial do programa.

### Salão Central

Pode representar uma função alcançável que recebe chamadas de pelo menos três callers alcançáveis distintos.

A classificação depende do grafo, não do nome da função.

### Alas

Funções podem formar alas.

Quando existe um prefixo técnico comum considerado confiável, ele pode ajudar a nomear a região.

Por exemplo:

```text
parse_primary
parse_expression
parse_unary
```

pode produzir:

```text
Ala Parser
```

Quando não existe evidência suficiente para um nome semântico, são usados nomes neutros:

```text
Ala 1
Ala 2
Ala 3
```

### Criptas Isoladas

Funções sem caminho a partir da entrada pertencem às **Criptas Isoladas**.

Elas continuam semanticamente inalcançáveis mesmo quando uma passagem física permite visitá-las durante a exploração.

---

## Layout regional

A dungeon possui uma camada de layout regional separada do grafo.

Ela organiza:

- regiões;
- salas dentro das regiões;
- dimensões dos territórios;
- espaço para placas;
- distribuição da dungeon no mundo lógico.

A composição procura manter o resultado determinístico.

O mesmo código deve produzir a mesma estrutura.

O mundo lógico pode ser maior que o Canvas, permitindo representar programas grandes sem obrigar todas as salas a caberem em uma única tela.

---

## Corredores semânticos

Uma chamada real entre funções pode produzir um corredor físico.

Os corredores:

- ligam as salas corretas;
- usam trechos ortogonais quando possível;
- procuram evitar outras salas;
- possuem portas nas extremidades;
- preservam a identidade da relação mesmo quando possuem vários segmentos.

Um cruzamento visual entre dois percursos **não significa que eles estão conectados**.

A topologia continua explícita.

Faixas paralelas que compartilham chão e encontros em T possuem junções físicas
locais, usadas tanto pelo movimento manual quanto pelo automático. Cruzamentos
transversais independentes aparecem como pontes e não permitem trocar de caminho.
Essas junções não adicionam chamadas ao grafo.

---

## Galerias de exploração

Além dos corredores de chamadas, a dungeon possui **galerias de exploração**.

Elas foram adicionadas para evitar que o personagem precise sempre retornar à função de entrada para trocar de ramo.

Exemplo conceitual:

```text
Ala A
  │
  ├── corredor semântico
  │
  └──── galeria física ──── Ala B
```

A galeria:

- melhora a circulação;
- não cria arestas no grafo;
- não aparece como caller ou callee;
- não altera alcançabilidade;
- não altera foco topológico;
- possui identidade física própria.

Funções isoladas podem ser visitadas fisicamente sem deixar de ser isoladas no código.

Quando não existe um caminho geométrico seguro, uma galeria não é forçada através de obstáculos.

---

## Área caminhável e colisão

O personagem não pode caminhar livremente pelo vazio.

A área caminhável é formada por:

- interior das salas;
- portas;
- corredores semânticos;
- galerias de exploração.

A colisão considera também uma margem para a base do personagem.

Corredores e galerias possuem piso de 32 pixels nas coordenadas do mundo.
A mesma largura define o desenho, as portas e a área caminhável.

Isso permite:

- bloquear paredes;
- impedir cortes diagonais por quinas;
- atravessar portas corretamente;
- preservar a identidade de percursos em cruzamentos;
- usar a mesma física no movimento manual e automático.

---

## Exploração

O personagem pode ser controlado com:

```text
W A S D
```

ou:

```text
↑ ← ↓ →
```

O Canvas precisa estar com a exploração ativa.

O foco do Canvas também pode ativar os controles.

`Esc` libera o teclado.

Perder o foco interrompe o movimento.

---

## Câmera e zoom

A câmera é separada das coordenadas físicas do mundo.

O projeto possui:

- zoom discreto;
- visão geral;
- botão **Encaixar**;
- foco em sala selecionada;
- câmera livre pela roda do mouse.

A roda desloca verticalmente a câmera.

```text
Shift + roda
```

desloca horizontalmente.

Mover a câmera não move o personagem.

O zoom também altera o nível de detalhe apresentado no Canvas, mas não altera a geometria real da dungeon.

Zoom e modo visual ficam na mesma barra abaixo do Canvas. **Legenda do mapa**
expande as explicações dos marcadores e das passagens, inclusive pelo teclado.

---

## Seleção e navegação

### Clique simples

Seleciona uma sala e:

- atualiza o inspector;
- ativa o foco contextual;
- mantém o personagem onde está.

### Duplo clique

Pode iniciar navegação automática até a sala selecionada quando existe uma rota física válida.

A navegação utiliza corredores e galerias existentes.

Movimento manual cancela a rota automática.

---

## Busca e inspector

Durante a exploração é possível pesquisar funções pelo nome.

O inspector pode mostrar:

- nome;
- métricas;
- trecho original do código;
- callers;
- callees;
- caminho estrutural desde a entrada;
- estruturas de controle;
- recursão;
- ciclos.

Callers e callees também podem ser usados para navegar entre funções relacionadas.

---

## Foco contextual

Selecionar uma função pode destacar as cadeias de chamadas estruturalmente relevantes até ela.

Funções e relações fora desse contexto continuam visíveis com menor destaque.

Galerias de exploração não participam desse cálculo.

Uma função isolada também não recebe um caminho estrutural artificial apenas porque pode ser visitada fisicamente.

---

## Visual da dungeon

A versão atual possui elementos como:

- territórios por região;
- paredes e alvenaria;
- pisos;
- placas;
- portais;
- corredores de pedra;
- galerias visualmente distintas;
- tochas;
- rochas;
- musgo;
- pilares;
- criaturas;
- efeitos;
- detalhes que simplificam conforme o zoom.

Salas e passagens usam lajes; a fundação entre elas usa rocha escura para distinguir
as áreas bloqueadas. Portas são desenhadas a partir dos mesmos acessos usados pela
física, e o acabamento dos caminhos é composto em camadas para evitar paredes
decorativas dentro do chão compartilhado.

Paredes com relevo, lajes gastas, placas de madeira com ferragens e tochas com
luz quente reforçam o ambiente. Rochas musgosas, samambaias, colunas quebradas
e pequenas teias compõem os detalhes; a sala de entrada possui um tapete bordado.
Estandartes, caixas, baús, barris e crânios decorativos ficam fora das passagens,
com a silhueta inteira verificada para não cobrir salas, portas ou outros objetos.
Esses acabamentos são determinísticos e simplificados ao afastar a câmera.

A página inicial compartilha essa linguagem visual: paredes de pedra, luz
quente, bandeiras e adereços em pixel art cercam o editor. A prévia de salas
reutiliza os materiais e sprites da dungeon.

O entorno usa terreno pedregoso, folhagens e rochas com silhuetas variadas.
A luz suave das tochas contrasta com a pedra fria, e as muralhas recebem a cor
da região. Nomes mantêm tamanho de leitura estável enquanto houver espaço na sala.

O aventureiro usa capuz, roupa sombreada, botas e detalhes de metal, com vistas
direcionais e passos animados. Gosma, sentinela e guardião possuem rostos e
silhuetas próprios; o inspector utiliza os mesmos sprites das salas.

Esses elementos pertencem à apresentação.

Eles não devem alterar a análise do programa.

---

## Privacidade

Atualmente:

- não existe backend da aplicação;
- o código é analisado no navegador;
- arquivos não são enviados para um servidor próprio;
- o código não é compilado;
- o código não é executado;
- não existe conta ou login.

---

## Tecnologias

O projeto usa:

- HTML;
- CSS;
- JavaScript;
- ES Modules;
- Canvas 2D;
- Node.js para testes;
- `node:test`;
- GitHub Actions.

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
│   ├── regioesMasmorra.js
│   ├── layoutMasmorra.js
│   ├── layoutRegioes.js
│   ├── masmorra.js
│   ├── corredores.js
│   ├── circulacaoDungeon.js
│   ├── areaCaminhavel.js
│   ├── navegacaoMasmorra.js
│   ├── camera.js
│   ├── semanticaVisual.js
│   ├── desenhoMasmorra.js
│   ├── cenario.js
│   ├── aderecosDungeon.js
│   ├── entradaDungeon.js
│   ├── personagem.js
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
│
├── EVOLUCAO.md
├── CORRECOES.md
├── package.json
└── README.md
```

Alguns módulos centrais:

| Arquivo | Responsabilidade |
| --- | --- |
| `lexicoC.js` | Separa código, comentários e literais |
| `analisadorC.js` | Extrai funções e métricas |
| `grafoC.js` | Representa chamadas e relações estruturais |
| `regioesMasmorra.js` | Classifica as regiões semânticas |
| `layoutMasmorra.js` | Mantém o layout geométrico base |
| `layoutRegioes.js` | Organiza regiões e salas na composição regional |
| `masmorra.js` | Monta a dungeon a partir dos dados estruturais |
| `corredores.js` | Calcula os caminhos físicos das chamadas reais |
| `circulacaoDungeon.js` | Cria galerias físicas sem modificar o grafo |
| `areaCaminhavel.js` | Resolve colisão e identidade física dos percursos |
| `navegacaoMasmorra.js` | Calcula rotas pela rede física existente |
| `camera.js` | Controla viewport, zoom e deslocamento |
| `desenhoMasmorra.js` | Desenha arquitetura e acabamentos da dungeon |
| `aderecosDungeon.js` | Define sprites e limites dos objetos decorativos |
| `entradaDungeon.js` | Desenha o fundo e a prévia estática da página inicial |
| `personagem.js` | Estado e animação do personagem |
| `jogo.js` | Coordena renderização, interação e física |
| `interface.js` | Controla a interface fora do Canvas |
| `principal.js` | Orquestra análise, dungeon, interface e jogo |

---

## Preparação e segurança

| Arquivo | Responsabilidade |
| --- | --- |
| `js/processadorDungeon.js` | Controla o Worker, cancelamento e prazo |
| `js/dungeonWorker.js` | Recebe texto e devolve resultado ou erro controlado |
| `js/processamentoDungeon.js` | Valida e coordena a preparação pura |
| `js/preparacaoDungeon.js` | Prepara regiões visuais, corredores, colisão e cenário |
| `css/fontes.css`, `assets/fontes/` | Distribuem as fontes localmente |
| `_headers` | Configuração HTTP para hospedagens que reconhecem esse formato |
| `SECURITY.md` | Proteções, limites, privacidade e pendências de publicação |


## Como executar

Como o projeto usa ES Modules, sirva a pasta por HTTP.

Na raiz do projeto:

```bash
python3 -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

Não é necessário instalar dependências para abrir a aplicação.

---

## Testes

A suíte utiliza o test runner do Node.js.

Na pasta que contém `package.json`:

```bash
npm test
```

Na revisão dos refinamentos posteriores à baseline `v0.1.0`:

```text
367 testes
367 passando
0 falhando
```

Os testes incluem a inicialização da página decorada, o redimensionamento do fundo
e o fluxo de gerar e voltar ao editor, inclusive sem suporte a `ResizeObserver`.

Também existe um workflow do GitHub Actions que executa a suíte automaticamente em pushes e pull requests.

---

## Limitações atuais

O analisador trabalha com um subconjunto de C.

Ele não pretende substituir um compilador ou parser completo.

Construções avançadas podem ser reconhecidas parcialmente ou não serem compreendidas corretamente, principalmente:

- macros complexas;
- pré-processamento condicional;
- ponteiros de função;
- declarações avançadas;
- formas pouco comuns da gramática de C.

Chamadas externas, como funções de bibliotecas, não viram salas no grafo atual.

A circulação física também possui limites geométricos:

- uma galeria não é criada quando não existe desvio considerado seguro;
- alguns encontros de percursos podem continuar visualmente densos;
- a parte superior do sprite pode se projetar visualmente sobre uma parede mesmo quando sua base continua corretamente bloqueada.

Essas limitações não devem ser escondidas da interface ou da documentação.

---

## Próximos passos

A consolidação das duas telas foi integrada à `main` em `9c9c0b7`.
A revisão seguinte adiciona limites de entrada, preparação cancelável,
fontes locais, CSP e CI com permissões menores. Antes de lançar, aplicar essa
revisão e validar a hospedagem e os navegadores usados pelos visitantes.

Depois dessa validação, os próximos ciclos educativos passam a priorizar:

1. aumentar a confiabilidade e a explicação da análise;
2. tornar a métrica de complexidade mais transparente;
3. melhorar avisos para construções de C parcialmente suportadas;
4. apresentar chamadas externas como informação complementar;
5. adicionar exemplos prontos de programas C;
6. continuar melhorias de UX e acessibilidade;
7. validar os cabeçalhos e os fluxos na hospedagem final, conforme `SECURITY.md`;
8. preparar a próxima versão pública a partir da baseline `v0.1.0`, já incorporada à `main`.

Ideias posteriores incluem:

- exportação do mapa e do grafo;
- comparação antes/depois de uma refatoração;
- visão textual alternativa ao Canvas;
- atividades de leitura de código;
- suporte futuro a outros analisadores ou linguagens.

---

## Documentação

A documentação técnica está separada por objetivo:

- [`docs/ESTADO_ATUAL.md`](docs/ESTADO_ATUAL.md) — fotografia técnica do comportamento atual;
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — módulos, responsabilidades e fluxo dos dados;
- [`docs/DECISOES.md`](docs/DECISOES.md) — decisões arquiteturais adotadas;
- [`docs/PLANO_TECNICO.md`](docs/PLANO_TECNICO.md) — trabalho que ainda está planejado;
- [`EVOLUCAO.md`](EVOLUCAO.md) — histórico dos principais marcos;
- [`CORRECOES.md`](CORRECOES.md) — registro de uma revisão anterior de bugs.

---

## Princípio do projeto

A linguagem de dungeon é uma forma de visualizar o programa.

Ela não substitui os dados reais do código.

> **Se um significado visual não puder ser justificado pelos dados analisados, ele não deve ser apresentado como fato.**
