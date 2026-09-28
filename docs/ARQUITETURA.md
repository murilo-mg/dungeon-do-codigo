# Arquitetura

## Visão geral

O Dungeon do Código é uma aplicação frontend estática feita com HTML, CSS e JavaScript ES Modules.

O código C fornecido pelo usuário é tratado como texto. Ele é analisado no navegador, convertido em uma representação estrutural e usado para construir uma dungeon explorável em Canvas.

A aplicação não compila nem executa o código C.

Também não existe backend no estado atual.

A separação principal do projeto é:

```text
código
  ↓
análise
  ↓
grafo
  ├──────────────┐
  ↓              ↓
layout       regiões semânticas
  └──────┬───────┘
         ↓
     masmorra
         ↓
    corredores
         ↓
 jogo / renderização
         ↕
      interface
```

O objetivo dessa separação é impedir que regras de análise, geometria e interface fiquem misturadas.

---

# Princípios arquiteturais

## A estrutura do código é a fonte de verdade

Informações como:

- callers;
- callees;
- profundidade;
- alcance;
- ciclos;
- recursão;
- regiões;

devem vir da análise e do grafo.

A renderização não deve inventar essas informações.

---

## Grafo e geometria são responsabilidades diferentes

O grafo responde perguntas como:

```text
quem chama quem?
```

O layout responde perguntas como:

```text
onde essa sala deve ficar?
```

Uma camada não deve assumir a responsabilidade da outra.

---

## Regiões semânticas não controlam o layout

`regioesMasmorra.js` classifica funções semanticamente.

Ele não:

- move salas;
- calcula coordenadas;
- cria corredores;
- desenha no Canvas.

Isso permite evoluir a aparência das regiões sem mudar as regras que determinam quem pertence a cada uma.

---

## Coordenadas do mundo são separadas da câmera

Salas, personagem, corredores, passos e efeitos possuem posições no mundo lógico.

A câmera apenas decide qual parte desse mundo será projetada no Canvas.

Zoom não altera a geometria real da dungeon.

---

## Canvas e DOM possuem papéis diferentes

O Canvas é usado para:

- dungeon;
- salas;
- corredores;
- personagem;
- cenário;
- efeitos;
- elementos visuais da exploração.

O DOM é usado para:

- editor;
- botões;
- busca;
- inspector;
- mensagens;
- controles;
- texto;
- elementos que precisam de foco e acessibilidade.

---

# Camadas do projeto

A arquitetura pode ser dividida em sete grupos principais.

```text
1. Entrada e análise
2. Grafo estrutural
3. Semântica da dungeon
4. Geometria
5. Exploração e renderização
6. Interface
7. Orquestração
```

---

# 1. Entrada e análise

## `index.html`

Define a estrutura estática da aplicação.

Contém, entre outros elementos:

- editor de código;
- abertura de arquivo `.c`;
- área de exploração;
- Canvas;
- busca;
- inspector;
- controles de câmera;
- controles de modo visual;
- legendas;
- informações de estado da exploração.

Não deve conter regras de análise do código.

---

## `css/estilo.css`

Define a apresentação visual da aplicação.

Cuida da aparência de:

- editor;
- telas;
- controles;
- inspector;
- busca;
- estados da interface.

As regras estruturais da dungeon não devem depender do CSS.

---

## `js/entradaCodigo.js`

Centraliza regras básicas relacionadas à importação de arquivos C.

Atualmente valida:

- extensão `.c`;
- limite de 512 KiB.

A leitura efetiva do arquivo e a interação com o DOM ficam em outras camadas.

Esse módulo não:

- executa o arquivo;
- envia o arquivo para rede;
- analisa C.

---

## `js/lexicoC.js`

Faz a separação léxica básica necessária para proteger a análise estrutural.

Distingue:

- código;
- comentários;
- strings;
- caracteres.

Produz representações mascaradas que preservam:

- índices;
- comprimento;
- quebras de linha.

Isso permite que outras etapas analisem a estrutura sem interpretar conteúdo textual como código.

Exemplo:

```c
printf("if while }");
```

não deve ser interpretado como:

- um `if`;
- um `while`;
- o fechamento real de uma função.

Também identifica entradas estruturalmente incompletas suportadas pela análise atual.

---

## `js/analisadorC.js`

Transforma o código C em descritores de funções.

Entre os dados extraídos atualmente estão:

- nome da função;
- trecho original;
- corpo estrutural;
- quantidade de linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- complexidade segundo a fórmula atual;
- chamadas para funções conhecidas.

A extração de funções utiliza uma estratégia simplificada e não representa toda a gramática de C.

O analisador usa o resultado do léxico para evitar falsos positivos em comentários e literais.

Ele não:

- executa código;
- compila C;
- cria salas;
- calcula posições;
- desenha no Canvas.

---

# 2. Grafo estrutural

## `js/grafoC.js`

É a principal representação das relações entre funções conhecidas.

O grafo mantém:

- função de entrada;
- nós;
- arestas direcionadas;
- callers;
- callees;
- profundidade mínima;
- alcançabilidade;
- recursão direta;
- participação em ciclos.

Quando existe `main`, ela é usada como entrada.

Quando não existe, a primeira função encontrada é usada.

O módulo também fornece dados para diferentes formas de navegação e leitura estrutural.

Entre elas:

- caminho mínimo desde a entrada;
- relações de callers e callees;
- contexto topológico da função selecionada.

O grafo não depende de:

- Canvas;
- DOM;
- câmera;
- posição das salas.

---

## Chamadas conhecidas

O grafo atual representa chamadas entre funções encontradas no próprio código analisado.

Por exemplo:

```c
void b() {}

void a() {
    b();
}

int main() {
    a();
}
```

gera:

```text
main → a → b
```

Chamadas externas que não possuem uma função correspondente no arquivo não viram salas no grafo atual.

---

## Ciclos e recursão

Uma chamada da função para ela mesma pode ser marcada como recursão direta.

Exemplo:

```text
a → a
```

Ciclos entre funções também são detectados.

Exemplo:

```text
a → b → c → a
```

Essas informações pertencem ao grafo, não à renderização.

---

# 3. Semântica da dungeon

## `js/regioesMasmorra.js`

Classifica funções em regiões usando somente informações estruturais.

Atualmente existem quatro categorias principais.

### Entrada

A função inicial é separada das alas normais.

---

### Salão Central

Somente funções alcançáveis podem ser consideradas hubs.

A regra atual exige pelo menos:

```text
3 callers alcançáveis distintos
```

O nome da função não participa dessa decisão.

---

### Alas

Funções alcançáveis podem formar alas.

Quando duas ou mais funções compartilham um prefixo técnico considerado confiável, esse prefixo pode dar nome à região.

Exemplo:

```text
parse_primary
parse_expression
parse_unary
```

pode gerar:

```text
Ala Parser
```

Prefixos operacionais genéricos não são usados como domínio.

Entre eles:

```text
get
set
create
delete
remove
add
find
init
free
read
write
load
save
update
process
handle
make
new
```

Sem um prefixo confiável, o agrupamento estrutural recebe um nome neutro:

```text
Ala 1
Ala 2
...
```

---

### Criptas Isoladas

Toda função não alcançável a partir da entrada pertence às Criptas Isoladas.

Essa regra tem prioridade sobre a identificação de hubs.

Um componente desconectado continua isolado mesmo quando várias funções dele chamam uma mesma função.

---

## Dados produzidos

Cada região possui informações como:

```js
{
  id,
  tipo,
  titulo,
  funcoes
}
```

Esses dados são independentes do Canvas.

No estado atual, as regiões ainda não são representadas visualmente no mapa.

---

# 4. Geometria

## `js/layoutMasmorra.js`

É responsável por calcular a geometria das salas.

Entre suas responsabilidades estão:

- colunas;
- distribuição vertical;
- posições;
- dimensões;
- tamanho do mundo lógico.

O layout usa informações do grafo, mas não modifica o grafo.

As funções alcançáveis são organizadas principalmente por profundidade.

Dentro de uma coluna, relações de callers ajudam a determinar a ordenação vertical.

Funções inalcançáveis ficam separadas na parte destinada às isoladas.

O mundo possui tamanho mínimo compatível com o viewport, mas pode crescer horizontal ou verticalmente conforme o programa exige.

A API mantém dados como:

```js
{
  salas,
  larguraMundo,
  alturaMundo
}
```

O layout não:

- desenha;
- manipula DOM;
- controla personagem;
- classifica regiões.

---

## `js/masmorra.js`

É a camada que reúne os dados necessários para formar a dungeon.

Recebe:

- funções;
- grafo.

Usa:

- `layoutMasmorra.js`;
- `regioesMasmorra.js`.

E devolve a estrutura final da masmorra, incluindo:

- salas;
- regiões;
- largura do mundo;
- altura do mundo.

As salas recebem dados vindos das funções e do grafo, como:

- métricas;
- estruturas;
- recursão;
- ciclos.

`masmorra.js` não deve duplicar algoritmos que pertencem ao grafo ou ao layout.

---

## `js/corredores.js`

Transforma:

```text
salas + arestas do grafo
```

em segmentos geométricos.

Esses segmentos representam as conexões atuais da dungeon.

O módulo:

- ignora autoarestas para desenho;
- evita duplicatas;
- ignora referências a salas inexistentes;
- não modifica o grafo.

Os mesmos segmentos podem ser usados por diferentes partes da experiência.

Isso evita que o jogo e o cenário tenham duas versões diferentes dos corredores.

---

## Limitação atual dos corredores

Os corredores ainda utilizam segmentos diretos.

Em cenários densos, principalmente com muitas funções no mesmo nível, uma conexão pode atravessar visualmente uma terceira sala.

O roteamento mais elaborado pertence a uma etapa futura.

---

# 5. Exploração e renderização

## `js/camera.js`

Calcula a região visível do mundo.

Entre suas responsabilidades estão:

- posição da câmera;
- limites de deslocamento;
- cálculo de encaixe;
- área visível considerando zoom.

Não altera as coordenadas das salas ou do personagem.

---

## `js/zoomDiscreto.js`

Controla os degraus usados pelos botões de zoom.

Os níveis atuais incluem valores como:

```text
50%
75%
100%
125%
150%
175%
200%
```

O valor de Encaixar também pode participar dos degraus quando necessário.

O módulo decide níveis de zoom, mas não altera a geometria.

---

## `js/semanticaVisual.js`

Centraliza decisões de representação visual baseadas em dados que já foram calculados.

Entre elas:

- marcadores I/F/W/S;
- indicador R/C;
- aparência por modo visual;
- presença de criatura;
- nível de detalhe conforme o zoom.

O módulo não deve recalcular:

- chamadas;
- estruturas;
- ciclos;
- complexidade.

---

## Zoom semântico

O desenho das salas possui níveis de detalhe.

### Distante

Prioriza o mapa e a geometria geral.

Elementos pequenos podem ser omitidos.

### Intermediário

Prioriza a identificação das funções.

### Próximo

Mantém os detalhes completos da sala.

Essa mudança é apenas visual.

---

## `js/navegacaoMasmorra.js`

Calcula rotas sobre a geometria dos corredores existentes.

A navegação automática pode partir:

- de dentro de uma sala;
- de um corredor válido.

O módulo usa os segmentos existentes e devolve pontos de passagem.

Ele não cria chamadas novas no grafo.

Para navegação física, os corredores podem ser percorridos nos dois sentidos, mesmo que a chamada original seja direcionada.

Isso não muda o significado do grafo.

---

## `js/personagem.js`

Concentra o estado e a física básica do personagem.

Cuida de:

- posição;
- direção;
- movimento;
- limites;
- passos;
- desenho.

O movimento manual ainda não representa uma colisão completa com paredes da dungeon.

---

## `js/cenario.js`

Desenha o ambiente ao redor das salas.

Recebe informações sobre:

- salas;
- corredores.

As decorações evitam ocupar áreas destinadas à estrutura principal da dungeon.

O cenário não reconstrói o grafo.

---

## `js/criaturas.js`

Define e desenha criaturas ligadas à representação de complexidade.

Esses elementos pertencem à apresentação visual.

Eles não modificam a métrica que recebem.

---

## `js/efeitos.js`

Gerencia efeitos transitórios usados na exploração.

Mantém limites de:

- duração;
- quantidade.

---

## `js/pixelArt.js`

Centraliza recursos reutilizáveis de pixel art.

Inclui elementos como:

- paleta;
- glifos;
- representações usadas pelos marcadores.

---

## `js/jogo.js`

É o principal coordenador da experiência dentro do Canvas.

Entre suas responsabilidades estão:

- ciclo de animação;
- renderização;
- movimentação;
- câmera;
- zoom;
- detecção de sala;
- clique;
- duplo clique;
- hover;
- foco;
- seleção;
- navegação automática;
- modos visuais;
- efeitos;
- corredores.

O jogo recebe dados estruturais já calculados.

Ele não deve analisar código C.

Também não deve manipular diretamente o conteúdo textual do DOM.

A comunicação com a interface ocorre por callbacks.

---

## Sala física e sala selecionada

O projeto diferencia:

```text
sala onde o personagem está
```

de:

```text
sala que o usuário está inspecionando
```

Selecionar uma função não teleporta o personagem.

A câmera pode focar a sala selecionada sem alterar a posição física.

---

## Clique e duplo clique

Um clique em uma sala solicita a seleção daquela função.

Um duplo clique também pode iniciar navegação automática quando existe uma rota válida.

Movimento manual cancela a rota automática.

---

## Foco contextual

Ao selecionar uma função, o contexto topológico calculado pelo grafo pode ser exibido.

As funções relevantes permanecem destacadas.

As demais continuam no mapa com menor opacidade.

O jogo apenas apresenta esse resultado.

A definição de quais funções pertencem ao contexto continua no grafo.

---

# 6. Interface

## `js/interface.js`

Centraliza a manipulação do DOM.

Entre suas responsabilidades estão:

- troca entre telas;
- editor;
- importação de arquivo;
- mensagens;
- busca;
- resultados;
- inspector;
- callers;
- callees;
- controles de câmera;
- modos visuais;
- status;
- percentual de zoom.

O conteúdo originado do código do usuário deve ser tratado como texto.

A interface não deve interpretar novamente a estrutura C.

---

## Inspector

O inspector recebe dados das camadas estruturais.

Atualmente pode apresentar:

- função selecionada;
- trecho de código;
- métricas;
- perfil das estruturas;
- callers;
- callees;
- caminho mínimo;
- recursão;
- ciclos.

A interface não deve recalcular essas informações.

---

# 7. Orquestração

## `js/principal.js`

É o ponto central de integração da aplicação.

Coordena o fluxo entre:

- interface;
- analisador;
- grafo;
- masmorra;
- jogo.

Entre suas responsabilidades estão:

- receber o código;
- iniciar análise;
- criar o grafo;
- construir a dungeon;
- iniciar o jogo;
- conectar busca;
- conectar seleção;
- conectar inspector;
- conectar câmera;
- conectar modos.

`principal.js` deve orquestrar módulos.

Ele não deve acumular algoritmos que pertencem ao parser, grafo, layout ou renderização.

---

# Fluxo completo atual

## Entrada

O usuário:

```text
digita
cola
ou abre um arquivo .c
```

O arquivo é carregado localmente no editor.

A importação não gera automaticamente uma dungeon.

---

## Análise

Quando o usuário solicita a geração:

```text
principal.js
    ↓
analisadorC.js
    ↕
lexicoC.js
```

São produzidos descritores das funções.

---

## Estrutura

Depois:

```text
funções
   ↓
grafoC.js
```

São calculados:

- nós;
- arestas;
- entrada;
- alcance;
- profundidade;
- callers;
- callees;
- ciclos;
- recursão.

---

## Dungeon

O grafo alimenta duas responsabilidades independentes:

```text
              grafo
             /     \
            ↓       ↓
        layout    regiões
            \       /
             ↓     ↓
             masmorra
```

`layoutMasmorra.js` define geometria.

`regioesMasmorra.js` define classificação semântica.

`masmorra.js` reúne os resultados.

---

## Corredores

Depois:

```text
salas + arestas
      ↓
corredores.js
```

são transformados em segmentos geométricos.

---

## Exploração

Finalmente:

```text
masmorra
arestas
   ↓
jogo.js
```

A experiência é renderizada no Canvas.

`interface.js` apresenta os dados textuais e os controles no DOM.

---

# Estado e responsabilidades

A arquitetura tenta evitar múltiplas fontes de verdade.

## Estrutura do programa

Fonte:

```text
grafoC.js
```

---

## Geometria

Fonte:

```text
layoutMasmorra.js
```

---

## Regiões

Fonte:

```text
regioesMasmorra.js
```

---

## Câmera

Fonte:

```text
camera.js
jogo.js
```

---

## Conteúdo textual da interface

Responsabilidade:

```text
interface.js
```

---

# Testes

A suíte automatizada usa o test runner nativo do Node.js.

Ela é executada com:

```bash
npm test
```

Os testes cobrem diferentes camadas de forma separada e integrada.

Entre elas:

- léxico;
- análise;
- grafo;
- layout;
- regiões;
- corredores;
- navegação;
- câmera;
- zoom;
- renderização;
- interface;
- importação;
- integração.

Não é necessário manter na documentação uma contagem fixa de testes, porque esse número cresce durante o desenvolvimento.

---

# Integração contínua

O repositório possui GitHub Actions.

O workflow executa:

```bash
npm test
```

em pushes e pull requests.

Isso ajuda a detectar regressões antes da integração de novas mudanças.

O deploy público ainda não faz parte dessa arquitetura.

---

# Privacidade no estado atual

No estado atual:

- o projeto é frontend estático;
- o código é analisado no navegador;
- não existe backend da aplicação;
- o código C não é compilado;
- o código C não é executado;
- a importação lê um arquivo local.

A arquitetura de publicação ainda passará por uma revisão específica de segurança.

Não deve ser prometida segurança ou privacidade absoluta.

---

# Limitações arquiteturais atuais

O analisador suporta um subconjunto de C.

Construções avançadas podem exigir outra abordagem no futuro.

Entre os casos que ainda precisam de atenção estão:

- macros complexas;
- pré-processamento condicional;
- ponteiros de função;
- declarações avançadas.

Os corredores também ainda utilizam geometria simples.

Além disso:

- regiões ainda não são desenhadas;
- minimapa ainda não existe;
- pan manual e drag ainda não existem;
- colisão física completa com paredes ainda não existe.

Esses pontos não devem ser implementados dentro de módulos errados apenas para acelerar uma entrega.

---

# Próximas extensões arquiteturais

## Visualização das regiões

A próxima camada deverá consumir:

```text
masmorra.regioes
```

e representar visualmente:

- Entrada;
- Salão Central;
- Alas;
- Criptas Isoladas.

Essa representação deve consumir a classificação existente.

Não deve duplicar ou reinventar as regras de agrupamento.

---

## Corredores 2.0

Uma evolução futura deve separar melhor:

```text
relação lógica
```

de:

```text
rota geométrica
```

O grafo continuará dizendo quais salas estão relacionadas.

Um roteador poderá decidir por onde o corredor passa.

O roteamento deverá evitar, quando possível:

- atravessar salas;
- produzir caminhos confusos;
- criar conexões físicas falsas.

---

## Segurança

Antes da publicação pública, a arquitetura deverá ser revisada considerando:

- limites de processamento;
- entradas hostis;
- DOM;
- política de rede;
- CSP;
- headers;
- hospedagem;
- CI de publicação.

Essas medidas ainda não devem ser descritas como implementadas.

---

# Regras de dependência

As seguintes regras devem ser preservadas:

- análise C não depende do Canvas;
- grafo não depende do layout;
- regiões não dependem do layout;
- layout não decide semântica;
- layout não renderiza;
- corredores não modificam o grafo;
- câmera não modifica a geometria do mundo;
- jogo não analisa C;
- interface não recalcula o grafo;
- `principal.js` orquestra, mas não concentra algoritmos das outras camadas;
- Canvas cuida da experiência espacial;
- DOM cuida principalmente de texto e controles.

---

# Regra principal

A arquitetura deve continuar permitindo responder:

```text
De onde veio esta informação?
```

Se uma informação estrutural aparece na interface, deve ser possível apontar para a camada que a calculou.

A renderização apresenta os dados.

Ela não deve criar uma verdade nova sobre o código.