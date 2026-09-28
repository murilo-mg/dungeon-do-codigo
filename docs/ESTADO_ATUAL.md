# Estado atual

Este documento representa o estado funcional e técnico atual do Dungeon do Código.

Para decisões arquiteturais, consulte `DECISOES.md`.

Para detalhes de organização dos módulos, consulte `ARQUITETURA.md`.

Para funcionalidades planejadas, consulte `PLANO_TECNICO.md`.

---

# Repositório

Branch de desenvolvimento atual:

```text
melhoria/v1-publica
```

O projeto é um frontend estático feito com:

- HTML;
- CSS;
- JavaScript ES Modules;
- Canvas 2D.

A suíte automatizada é executada com:

```bash
npm test
```

O repositório também possui GitHub Actions executando os testes em pushes e pull requests.

---

# Estado geral

O Dungeon do Código já possui uma experiência completa de entrada, geração e exploração.

O usuário pode:

```text
digitar código C
       ou
abrir um arquivo .c
       ↓
gerar a dungeon
       ↓
explorar o mapa
       ↓
selecionar funções
       ↓
consultar relações e métricas
```

O código C é analisado como texto.

Ele não é compilado nem executado.

---

# Entrada de código

A tela inicial possui um editor onde o usuário pode:

- digitar código;
- colar código;
- abrir um arquivo `.c`;
- arrastar um arquivo válido para a área de entrada.

A importação atual aceita:

```text
1 arquivo por vez
extensão .c
até 512 KiB
```

O arquivo só substitui o conteúdo do editor depois de uma leitura válida.

Importar o arquivo não gera automaticamente a dungeon.

O usuário continua decidindo quando iniciar a análise.

---

# Análise local

A análise ocorre no navegador.

No estado atual:

- não existe backend da aplicação;
- o código não é enviado para um servidor próprio;
- o código não é compilado;
- o código não é executado.

A arquitetura de publicação ainda passará por uma revisão específica de segurança antes da primeira versão pública.

---

# Análise léxica

`lexicoC.js` separa conteúdo estrutural de conteúdo textual.

O módulo distingue:

- código;
- comentários;
- strings;
- caracteres.

Isso evita erros como interpretar:

```c
printf("if while }");
```

como estruturas reais da linguagem.

A representação mascarada preserva:

- posições;
- comprimento;
- quebras de linha.

Também existem tratamentos para entradas incompletas suportadas pela análise atual.

---

# Analisador de C

`analisadorC.js` extrai funções e informações estruturais.

Atualmente são considerados dados como:

- nome da função;
- corpo;
- trecho original;
- quantidade de linhas;
- `if`;
- `for`;
- `while`;
- `switch`;
- `case`;
- complexidade segundo a fórmula atual;
- chamadas para funções conhecidas.

O analisador trabalha com um subconjunto de C.

Ele não pretende substituir um compilador ou parser completo.

---

# Grafo de chamadas

`grafoC.js` representa as relações entre as funções conhecidas.

O grafo contém:

- função de entrada;
- nós;
- arestas direcionadas;
- callers;
- callees;
- profundidade mínima;
- alcançabilidade;
- recursão direta;
- participação em ciclos.

Quando existe:

```c
main
```

ela é usada como entrada.

Quando não existe, a primeira função encontrada assume esse papel.

---

# Callers e callees

Para cada função, o grafo permite identificar:

```text
callers
```

funções que chamam a função selecionada;

e:

```text
callees
```

funções chamadas pela função selecionada.

Essas relações são reutilizadas pelo:

- inspector;
- foco contextual;
- layout;
- navegação da interface.

---

# Caminho desde a entrada

O grafo calcula um caminho mínimo desde a função de entrada até uma função alcançável.

Esse caminho aparece no inspector.

Quando a função não é alcançável, nenhum caminho artificial é criado.

---

# Recursão

Uma função que chama diretamente a si mesma é marcada como recursiva.

Exemplo:

```text
fatorial → fatorial
```

Essa informação chega ao inspector e à representação visual.

---

# Ciclos

Também são detectados ciclos entre funções.

Exemplo:

```text
a → b → c → a
```

Recursão direta e participação em ciclo são tratadas como informações diferentes.

---

# Layout

`layoutMasmorra.js` calcula a geometria das salas.

O layout é separado do grafo.

As funções alcançáveis são organizadas principalmente por profundidade.

Exemplo:

```text
profundidade 0 → entrada
profundidade 1 → funções chamadas pela entrada
profundidade 2 → funções chamadas posteriormente
...
```

Funções de uma mesma profundidade são distribuídas verticalmente.

A posição média dos callers da coluna anterior ajuda na ordenação.

---

# Mundo lógico

A dungeon não precisa caber inteira dentro do Canvas.

O mundo lógico pode crescer:

- horizontalmente;
- verticalmente.

O viewport continua sendo uma janela sobre esse mundo.

Isso permite representar programas maiores sem sobrepor as salas apenas para fazê-las caber na tela.

---

# Sobreposição das salas

Os cenários automatizados atuais verificam layouts com diferentes quantidades e formatos de grafo.

Os casos de referência testados mantêm as salas sem sobreposição.

A mesma entrada também deve continuar produzindo o mesmo layout.

---

# Funções inalcançáveis

Funções que não possuem caminho a partir da entrada continuam representadas.

Na geometria atual elas ficam separadas das funções alcançáveis.

Na classificação semântica pertencem às:

```text
Criptas Isoladas
```

---

# Regiões semânticas

A masmorra já possui regiões semânticas como dados.

Essa classificação é feita por:

```text
js/regioesMasmorra.js
```

Cada região contém:

```text
id
tipo
titulo
funcoes
```

As regiões ainda não são desenhadas no Canvas.

---

## Entrada da Dungeon

A função de entrada possui sua própria região.

Ela não é tratada como uma ala normal.

---

## Salão Central

Uma função pode ser classificada como hub quando:

```text
é alcançável
+
possui pelo menos 3 callers alcançáveis distintos
```

A classificação não depende do nome da função.

---

## Alas

Grupos alcançáveis podem receber nomes derivados de prefixos técnicos confiáveis.

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

Outro exemplo:

```text
vm_push
vm_pop
vm_execute
```

pode gerar:

```text
Ala VM
```

---

## Prefixos operacionais

Prefixos genéricos de operação não são usados como domínio da ala.

Entre eles estão:

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

Assim:

```text
get_usuario
get_config
get_tempo
```

não gera:

```text
Ala Get
```

---

## Fallback neutro

Quando não existe um nome confiável, o agrupamento recebe um título neutro.

Exemplo:

```text
Ala 1
Ala 2
Ala 3
```

A preferência é comunicar menos em vez de inventar uma interpretação.

---

## Criptas Isoladas

Toda função inalcançável pertence às Criptas Isoladas.

Essa regra possui prioridade sobre a detecção de hub.

Mesmo que várias funções desconectadas chamem uma função comum, esse conjunto continua isolado da dungeon principal.

---

# Construção da masmorra

`masmorra.js` reúne:

- dados das funções;
- dados do grafo;
- geometria do layout;
- regiões semânticas.

A estrutura final inclui:

```text
salas
regioes
larguraMundo
alturaMundo
```

O módulo não recalcula relações que pertencem ao grafo nem posições que pertencem ao layout.

---

# Corredores

`corredores.js` transforma:

```text
salas + arestas
```

em segmentos geométricos.

Os corredores atuais representam relações reais entre funções conhecidas.

São ignoradas para o desenho:

- autoarestas;
- duplicatas;
- referências a salas inexistentes.

---

# Limitação dos corredores atuais

A geometria atual ainda usa segmentos diretos entre salas.

Isso significa que, em alguns cenários densos, um corredor pode atravessar visualmente outra sala.

Esse problema já possui métricas automatizadas para:

- cruzamentos;
- travessia de terceira sala;
- comprimento total.

O roteamento de corredores será tratado em uma etapa posterior.

---

# Cenário

`cenario.js` desenha o fundo e as decorações.

Ele recebe as mesmas salas e corredores usados pela exploração.

Isso evita que o cenário ocupe regiões importantes da dungeon.

O cenário não cria relações próprias.

---

# Personagem

O personagem pode ser movimentado por:

```text
W A S D
```

ou:

```text
↑ ← ↓ →
```

O teclado só controla a dungeon depois que o mapa recebe foco.

---

# Controle de foco

O Canvas não captura permanentemente o teclado.

O comportamento atual é:

```text
clique no mapa
→ controles ativos
```

e:

```text
Esc
ou clique fora
→ controles liberados
```

Campos de texto continuam podendo usar teclado normalmente.

---

# Movimento manual

O personagem possui:

- posição;
- direção;
- velocidade;
- limites do mundo;
- passos.

O movimento é calculado independentemente da taxa de atualização da tela.

A preferência:

```text
prefers-reduced-motion
```

é respeitada nas animações relevantes.

---

# Colisão atual

O personagem respeita os limites do mundo lógico.

Ainda não existe uma colisão completa com:

- paredes;
- salas;
- corredores.

O movimento manual ainda pode atravessar áreas que visualmente não seriam transitáveis em uma dungeon física completa.

---

# Seleção de salas

Uma sala pode ser selecionada diretamente no Canvas.

Clique simples:

```text
seleciona a função
atualiza o inspector
ativa o foco contextual
```

Selecionar não move o personagem.

---

# Sala física e sala selecionada

O projeto mantém estados separados para:

```text
sala onde o personagem está
```

e:

```text
sala que está sendo inspecionada
```

Isso permite estudar uma função distante sem teleportar o personagem.

---

# Hover

Passar o mouse sobre uma sala pode mostrar o nome completo da função.

O hover reutiliza a mesma transformação de coordenadas usada pela seleção.

Ele não modifica:

- seleção;
- personagem;
- câmera.

---

# Navegação automática

Um duplo clique em uma sala pode iniciar movimento automático até ela.

A navegação usa:

```text
navegacaoMasmorra.js
```

e percorre a geometria atual dos corredores.

Se não existe rota válida, nenhuma passagem fictícia é criada.

---

# Cancelamento da navegação

A navegação automática pode ser cancelada por:

- movimento manual;
- mudança de seleção;
- perda de foco;
- reinício da dungeon.

O personagem continua usando sua velocidade normal.

---

# Direção lógica e física

Chamadas do programa continuam direcionadas.

Exemplo:

```text
a → b
```

A navegação física pode atravessar um corredor nos dois sentidos.

Isso não transforma o grafo lógico em um grafo bidirecional.

---

# Busca

A exploração possui busca por nome de função.

A consulta:

- ignora diferença entre maiúsculas e minúsculas;
- preserva a ordem das funções;
- não cria um sistema de seleção separado.

Selecionar pela busca usa o mesmo fluxo de:

- clique;
- caller;
- callee.

---

# Inspector

O inspector fica no DOM.

Atualmente apresenta informações como:

- nome da função;
- perigo;
- métricas;
- trecho do código;
- callers;
- callees;
- caminho desde a entrada;
- quantidade de estruturas;
- perfil estrutural;
- recursão;
- ciclo.

---

# Navegação pelo inspector

Callers e callees são interativos.

Selecionar uma função por essas relações:

- atualiza o inspector;
- foca visualmente a sala;
- não teleporta o personagem.

---

# Foco contextual

Selecionar uma função pode destacar todas as cadeias relevantes desde a entrada até ela.

As salas e corredores do contexto permanecem com destaque normal.

Os demais continuam visíveis com opacidade menor.

O objetivo é:

```text
destacar
```

sem:

```text
apagar o contexto global
```

---

# Função inalcançável no foco

Quando uma função selecionada não é alcançável:

- apenas ela é destacada estruturalmente;
- nenhum caminho falso até a entrada é criado.

---

# Câmera

A câmera trabalha sobre o mundo lógico.

Ela pode:

- seguir o personagem;
- focar uma sala selecionada;
- mostrar uma visão geral.

A posição física dos objetos não é modificada pela câmera.

---

# Zoom

Os controles atuais permitem níveis discretos de zoom.

Entre eles:

```text
50%
75%
100%
125%
150%
175%
200%
```

O valor calculado por Encaixar pode entrar como nível mínimo quando necessário.

---

# Encaixar

O comando:

```text
Encaixar
```

calcula um zoom suficiente para mostrar a dungeon inteira.

Ele não reposiciona as salas.

Mundos menores também não são ampliados desnecessariamente acima de 100%.

---

# Zoom semântico

O nível de detalhes das salas muda conforme o zoom.

---

## Visão distante

Abaixo do limiar principal, o mapa prioriza:

- forma das salas;
- posição;
- cor;
- seleção;
- contexto.

Detalhes internos são reduzidos.

---

## Visão intermediária

Os nomes das funções passam a ser priorizados.

Elementos internos ainda permanecem simplificados.

---

## Visão próxima

A sala mantém sua representação completa.

Podem aparecer:

- textura;
- criatura;
- marcadores;
- detalhes.

---

# Modos visuais

Existem atualmente dois modos.

---

## Complexidade

Preserva a identidade visual ligada à complexidade.

Inclui:

- cores;
- criaturas;
- marcadores discretos.

---

## Estrutura

Prioriza informações estruturais.

Utiliza:

- base visual mais neutra;
- maior destaque dos marcadores;
- ausência das criaturas.

---

## Troca de modo

Trocar o modo visual não altera:

- grafo;
- posições;
- dimensões;
- personagem;
- câmera;
- seleção.

Apenas a apresentação muda.

---

# Marcadores estruturais

As salas podem apresentar:

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → ciclo
```

Esses marcadores indicam presença.

Quantidades detalhadas continuam no inspector.

---

# Segurança de conteúdo no DOM

Conteúdo originado do código deve ser tratado como texto.

A interface possui testes garantindo que nomes e trechos com aparência de HTML não sejam interpretados como marcação.

A revisão de segurança completa para publicação ainda não foi realizada.

---

# Testes

A suíte automatizada é executada com:

```bash
npm test
```

Ela cobre módulos individuais e fluxos integrados.

Entre as áreas cobertas estão:

- entrada de arquivo;
- léxico;
- analisador;
- grafo;
- caminhos;
- ciclos;
- layout;
- métricas de corredores;
- masmorra;
- regiões;
- câmera;
- zoom;
- semântica visual;
- personagem;
- navegação;
- interface;
- busca;
- inspector;
- integração.

O número exato de testes não é registrado neste documento porque muda durante o desenvolvimento.

---

# GitHub Actions

Existe um workflow em:

```text
.github/workflows/testes.yml
```

Ele executa:

```bash
npm test
```

em pushes e pull requests.

Ainda não existe pipeline de deploy público.

---

# Último marco concluído

O marco mais recente é:

```text
classificação semântica das regiões
```

A classificação já existe como dado.

Ela não alterou:

- layout;
- posições;
- dimensões;
- Canvas;
- corredores;
- física.

---

# Próximo marco

O próximo passo planejado é:

```text
representar visualmente as regiões no Canvas
```

incluindo:

- Entrada da Dungeon;
- Salão Central;
- Alas;
- Criptas Isoladas.

A representação deve consumir os dados existentes, sem duplicar a lógica de classificação.

---

# Limitações atuais

Entre as principais limitações atuais estão:

- suporte apenas a um subconjunto de C;
- macros complexas podem não ser compreendidas;
- pré-processamento condicional não é completamente interpretado;
- ponteiros de função não possuem suporte completo;
- declarações avançadas podem confundir o analisador;
- chamadas externas não viram salas;
- regiões ainda não são desenhadas;
- corredores ainda são segmentos diretos;
- alguns corredores podem atravessar outras salas;
- não existe minimapa;
- não existe pan manual;
- não existe drag do mapa;
- não existe colisão completa com paredes;
- não existe execução de C;
- não existe backend;
- não existe suporte a projetos C com vários arquivos.

---

# Privacidade

A característica atual de processamento local é importante para o projeto.

No estado atual, a aplicação não precisa receber o código em servidor próprio para gerar a dungeon.

Essa arquitetura deve continuar sendo preservada enquanto fizer sentido.

Antes da publicação, será feita uma auditoria específica para garantir que a versão hospedada não introduza comportamentos incompatíveis com essa proposta.

---

# Princípio de confiança

O estado atual do projeto segue esta regra:

> Se um significado visual não puder ser justificado por dados reais do código, ele não deve ser apresentado como fato.

Isso já influencia:

- Salão Central;
- Alas;
- Criptas Isoladas;
- foco;
- marcadores;
- caminhos;
- relações.

Esse princípio deve continuar guiando as próximas etapas.