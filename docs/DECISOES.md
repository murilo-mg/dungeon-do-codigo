# Decisões técnicas

Este documento registra decisões que orientam o desenvolvimento atual do **Dungeon do Código**.

Ele não é um plano de funcionalidades futuras.

Uma decisão deve aparecer aqui quando:

- já estiver adotada no projeto; ou
- funcionar como regra explícita para preservar a arquitetura.

Funcionalidades planejadas pertencem principalmente a `PLANO_TECNICO.md`.

---

# Princípio central

## A dungeon deve explicar o programa, não inventá-lo

O Dungeon pode usar uma linguagem visual inspirada em jogos.

Isso não significa que pode criar significado sem evidência no código.

A regra principal é:

> **Se um significado visual não puder ser justificado pelos dados reais do programa analisado, ele não deve ser apresentado como fato.**

Isso vale para:

- relações;
- nomes;
- regiões;
- métricas;
- importância;
- destaques;
- descrições;
- agrupamentos.

Quando não existe evidência suficiente, uma representação neutra é preferível.

---

# Determinismo

## Não usar aleatoriedade como estrutura principal

A estrutura principal da dungeon deve ser reproduzível.

O mesmo código precisa produzir a mesma organização estrutural.

Isso facilita:

- testes;
- comparação;
- reprodução de bugs;
- leitura do mapa;
- futuras comparações entre versões.

Elementos puramente decorativos podem variar quando isso não altera significado, geometria importante ou comportamento.

---

## Resolver empates de forma estável

Layout, roteamento e composição regional devem usar critérios determinísticos.

Quando duas opções são equivalentes, a escolha deve seguir uma ordem estável.

Não deve depender de aleatoriedade oculta.

---

# Análise de C

## Separar léxico da análise estrutural

Comentários, strings e caracteres não devem ser analisados como código estrutural.

Exemplo:

```c
printf("if while }");
```

não deve ser interpretado como:

- um `if`;
- um `while`;
- o fechamento real de uma função.

Por isso existe uma etapa léxica anterior à análise estrutural.

---

## Manter uma análise própria simples enquanto ela atender ao objetivo

O projeto não pretende implementar toda a gramática de C neste momento.

A análise atual foi construída para a experiência do Dungeon.

Um parser completo só deve ser considerado quando limitações reais justificarem esse custo.

---

## Não esconder limitações do analisador

O projeto deve deixar claro quando uma construção pode não ser compreendida corretamente.

Entre os casos mais delicados estão:

- macros complexas;
- pré-processamento condicional;
- ponteiros de função;
- declarações avançadas;
- formas pouco comuns da gramática.

É preferível comunicar uma limitação real do que mostrar um mapa incorreto com aparência de certeza.

---

## Chamadas externas não viram salas internas automaticamente

O grafo interno representa principalmente funções conhecidas no próprio código analisado.

Chamadas como:

```text
printf
malloc
strlen
fopen
```

não devem virar salas internas apenas por aparecerem no código.

Elas podem futuramente ser apresentadas como informação complementar.

---

## Não mudar a métrica de complexidade sem estudar o impacto

A complexidade atual influencia:

- tamanhos;
- cores;
- criaturas;
- leitura visual;
- comparações.

Uma troca de fórmula não deve acontecer apenas porque existe uma métrica mais conhecida.

Antes de mudar, é necessário:

- documentar a fórmula atual;
- entender sua função no produto;
- avaliar impacto visual;
- comparar alternativas;
- criar testes apropriados.

---

# Grafo

## O grafo é separado da geometria

`grafoC.js` responde perguntas como:

```text
quem chama quem?
```

Layout, corredores e circulação respondem perguntas espaciais.

Nenhum módulo geométrico deve determinar relações do programa.

---

## Representar apenas relações conhecidas como internas

Uma chamada entra no grafo interno quando existe uma função correspondente entre as funções analisadas.

Isso evita criar funções fictícias.

---

## Direção lógica e movimento físico são coisas diferentes

Uma chamada:

```text
a → b
```

é direcionada.

O personagem pode percorrer fisicamente o corredor correspondente nos dois sentidos.

Logo:

```text
movimento físico bidirecional
```

não significa:

```text
chamada bidirecional
```

---

## Cruzamento visual não significa conexão

Dois caminhos podem cruzar geometricamente sem compartilhar topologia.

A identidade dos percursos deve continuar explícita.

Não se deve inferir uma ligação apenas porque duas linhas se encontram na tela.

Faixas paralelas com chão sobreposto e encontros em T são classificados como
junções físicas locais na geometria. A colisão e a navegação automática usam essa
mesma classificação; cruzamentos transversais interiores continuam separados.
Isso evita divisões invisíveis dentro de uma passagem desenhada como contínua,
sem alterar callers, callees ou alcançabilidade no grafo.

---

# Regiões semânticas

## Regiões são dados antes de serem desenho

A classificação semântica acontece antes da renderização.

`regioesMasmorra.js` não deve:

- mover salas;
- calcular coordenadas;
- desenhar no Canvas.

Isso permite mudar a aparência sem mudar a classificação.

---

## A entrada não é uma ala normal

A função de entrada possui papel estrutural próprio.

Quando existe `main`, ela assume esse papel.

Caso contrário, a primeira função encontrada é usada.

---

## Funções inalcançáveis pertencem às Criptas Isoladas

Alcançabilidade tem prioridade sobre outras classificações.

Uma função desconectada da entrada não deve virar Salão Central apenas porque recebe muitas chamadas de outras funções também desconectadas.

---

## Hubs dependem do grafo, não do nome

Uma função chamada:

```text
hub
central
core
```

não ganha importância estrutural apenas pelo nome.

A classificação atual depende de relações reais, incluindo callers alcançáveis.

---

## Usar nomes de alas de forma conservadora

Prefixos técnicos comuns podem ajudar a nomear regiões.

Exemplo:

```text
vm_push
vm_pop
vm_execute
```

pode produzir:

```text
Ala VM
```

Mas a inferência deve ser conservadora.

---

## Prefixos operacionais não representam automaticamente domínios

Termos como:

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

normalmente indicam operações.

Eles não devem produzir automaticamente regiões como:

```text
Ala Get
Ala Create
```

---

## Preferir um nome neutro a inventar significado

Quando não existe evidência suficiente para um nome semântico, usar:

```text
Ala 1
Ala 2
Ala 3
```

é melhor do que comunicar uma interpretação falsa.

---

# Layout

## Profundidade pode influenciar a organização

A profundidade no grafo é um dado real.

Por isso ela pode ser usada como referência espacial.

---

## Callers podem ajudar a ordenar salas

A posição de callers pode ser usada para melhorar legibilidade do layout.

Essa estratégia não deve modificar:

- grafo;
- profundidade;
- tamanho das salas;
- relações.

---

## O layout regional consome semântica pronta

`layoutRegioes.js` pode usar:

- regiões;
- grafo;
- dimensões das salas.

Mas não deve recalcular:

- hubs;
- alcançabilidade;
- nomes;
- chamadas.

---

## Não instalar Dagre ou ELK sem necessidade demonstrada

O projeto possui um layout próprio, separado e testável.

Bibliotecas externas de layout só devem ser consideradas quando casos reais mostrarem que a solução atual não atende adequadamente.

Adicionar dependências sem problema concreto aumenta:

- complexidade;
- superfície de manutenção;
- custo de explicação;
- risco de regressão.

---

# Corredores

## Corredores semânticos representam chamadas reais

Os corredores de chamadas devem nascer das arestas reais do grafo.

Eles não devem ser criados apenas para preencher espaço ou melhorar aparência.

---

## A geometria pode evoluir sem alterar a chamada

Uma chamada pode ser representada por:

- um segmento;
- vários segmentos ortogonais;
- um percurso com desvios.

Enquanto a identidade da chamada for preservada, a geometria pode evoluir.

O roteamento considera primeiro as relações mais curtas e usa seus eixos como
alternativas para as próximas. Compartilhar um trecho físico reduz o emaranhado
de faixas paralelas; cada relação mantém seus extremos, identidade e sequência
de pontos. A ordem retornada continua sendo a ordem das arestas do grafo.

A preferência por piso existente é um custo geométrico, não uma nova relação
entre funções. Obstáculos e a folga das portas continuam obrigatórios. Pisos
coincidentes recebem uma textura única; chamadas em foco são desenhadas por
último para que a atenuação das demais não apague seu destaque.

---

## Portas devem surgir de conexões reais

Uma abertura em uma sala deve corresponder a um percurso físico real.

Portas não devem aparecer como decoração aleatória.

Os acessos são extraídos uma vez das extremidades dos percursos e validados na
borda completa da sala. Coincidir apenas com a coordenada de uma parede não basta.

---

## Preservar folga física quando possível

O roteamento deve evitar:

- atravessar terceiras salas;
- portas coladas em quinas;
- caminhos sem espaço para a base do personagem.

Quando a geometria não oferece uma rota segura, não se deve criar uma passagem falsa apenas para manter conectividade visual.

---

# Circulação física

## Separar galerias de exploração das chamadas

Galerias físicas existem para melhorar a exploração.

Elas não representam código.

Por isso ficam em uma estrutura separada:

```text
passagensExploracao
```

Elas não devem ser adicionadas a:

- `grafo.arestas`;
- callers;
- callees;
- caminho estrutural;
- foco topológico;
- classificação semântica.

---

## Visitabilidade não altera alcançabilidade

Uma função isolada pode ser visitada fisicamente.

Isso não deve fazê-la parecer alcançável pela função de entrada.

A interface precisa manter essa diferença clara.

---

## Usar poucas ligações físicas adicionais

As galerias não devem transformar a dungeon em uma malha artificial de atalhos.

A estratégia deve acrescentar apenas as conexões necessárias para melhorar circulação entre componentes físicos.

---

## Não forçar uma galeria através de obstáculos

Se o roteamento com folga não encontra um caminho seguro, a galeria não deve ser criada.

É preferível manter uma limitação física do que atravessar salas ou paredes de forma incoerente.

---

# Física e navegação

## A física trabalha com geometria pronta

`areaCaminhavel.js` não deve conhecer o significado do grafo.

Ele recebe:

- salas;
- percursos;
- raio físico.

E decide apenas onde o personagem pode estar.

---

## Preservar identidade do percurso

Durante o movimento, a física deve saber em qual percurso o personagem está.

Isso impede mudar para outro caminho em um simples cruzamento visual.

---

## Movimento manual e automático usam a mesma física

A navegação automática não deve possuir regras de colisão privilegiadas.

Se o personagem não consegue atravessar fisicamente um local manualmente, a navegação automática também não deve atravessá-lo.

---

## A colisão representa a base do personagem

O sprite inteiro não precisa funcionar como um retângulo rígido.

A base física representa o contato com o chão.

Essa escolha permite uma leitura visual mais natural em perspectiva 2D.

A cabeça do sprite pode se sobrepor visualmente a uma parede sem que a base atravesse a colisão.

---

# Câmera e zoom

## A câmera não modifica o mundo

Zoom, Encaixar e deslocamento livre são operações de visualização.

Eles não devem alterar:

- posições das salas;
- posição do personagem;
- grafo;
- regiões;
- colisões.

---

## Encaixar é uma visão, não um novo layout

O botão Encaixar deve calcular uma câmera capaz de mostrar a dungeon.

Ele não deve reposicionar salas para fazê-las caber.

---

## Zoom semântico pode esconder detalhes, não significado

Detalhes visuais podem ser simplificados quando o mapa está distante.

Isso não pode alterar:

- relações;
- seleção;
- localização física;
- significado da dungeon.

---

# Renderização

## O desenho consome dados prontos

`desenhoMasmorra.js` e `jogo.js` podem decidir aparência.

Eles não devem reconstruir:

- grafo;
- classificação de regiões;
- chamadas;
- alcançabilidade.

---

## Alvenaria e decoração não definem colisão

Paredes, musgo, tochas, pedras e outros acabamentos pertencem à apresentação.

A física deve continuar baseada na geometria explícita de salas e percursos.

Por isso a fundação regional tem aparência de rocha escura, enquanto apenas os
espaços caminháveis recebem piso pavimentado. Na rede de passagens, todas as bordas
são desenhadas antes dos pisos, para não criar paredes decorativas em junções.

---

## Galerias devem ser visualmente distinguíveis

Como galerias não representam chamadas C, sua aparência deve ajudar o usuário a perceber essa diferença.

Essa distinção não precisa ser exagerada, mas deve evitar que o usuário interprete uma passagem física como uma chamada.

---

# Interface

## Canvas para espaço, DOM para informação e controles

O Canvas é adequado para:

- dungeon;
- personagem;
- caminhos;
- efeitos;
- interação espacial.

O DOM é preferível para:

- editor;
- busca;
- inspector;
- botões;
- mensagens;
- conteúdo acessível.

---

## Conteúdo do usuário deve ser tratado como texto

Nomes e trechos de código fornecidos pelo usuário não devem ser inseridos como HTML interpretável.

A interface deve preservar o conteúdo como texto.

---

## Seleção e posição física são estados diferentes

A função selecionada pode ser diferente da sala onde o personagem está.

Selecionar uma função não deve teletransportar o personagem.

---

# Tecnologia

## Continuar com HTML, CSS e JavaScript ES Modules

A arquitetura atual atende ao projeto.

Entre as vantagens estão:

- pouca configuração;
- poucas dependências;
- fácil execução;
- publicação como site estático;
- código direto de explicar.

Novas tecnologias devem resolver problemas concretos.

---

## Não usar React agora

React não resolve atualmente um problema necessário da aplicação.

Sua adoção adicionaria:

- build;
- dependências;
- abstrações;
- migração da interface existente.

Pode ser reconsiderado se a complexidade da interface justificar no futuro.

---

## Não usar Three.js ou WebGL agora

O projeto é 2D.

Canvas 2D atende atualmente:

- mapa;
- personagem;
- pixel art;
- animações;
- zoom;
- cenário.

Three.js ou WebGL só devem ser considerados se aparecer uma necessidade que Canvas 2D não consiga atender adequadamente.

---

## Não usar motor de jogos agora

A aplicação não precisa atualmente de uma engine completa.

Adicionar um motor de jogos aumentaria a complexidade sem resolver um problema necessário da baseline.

---

# Testes

## Bugs corrigidos devem virar regressões automatizadas

Quando possível, o fluxo deve ser:

```text
bug encontrado
      ↓
caso mínimo reproduzível
      ↓
teste falhando
      ↓
correção
      ↓
teste passando
```

Isso vale especialmente para:

- análise de C;
- grafo;
- layout;
- corredores;
- circulação;
- colisão;
- câmera;
- navegação.

---

## Não enfraquecer testes apenas para aceitar uma mudança

Quando uma alteração quebra uma expectativa, primeiro é necessário decidir:

```text
o comportamento mudou legitimamente?
```

ou:

```text
a implementação introduziu uma regressão?
```

Só depois a expectativa deve ser ajustada.

---

## Preservar testes de propriedades

Além de exemplos específicos, o projeto deve continuar verificando propriedades como:

- determinismo;
- ausência de sobreposição;
- ausência de conexões falsas;
- preservação do grafo;
- rotas fisicamente percorríveis;
- funções isoladas continuarem isoladas;
- cruzamentos não criarem atalhos.

---

# Baseline

## Estabilizar antes de continuar experimentando

Quando o projeto atingir um estado funcional amplo e testado, deve existir um ponto de referência estável antes de iniciar novas experiências.

A baseline precisa ter:

- testes verdes;
- documentação alinhada;
- limitações registradas;
- arquitetura descrita;
- estado reproduzível.

---

## Novas experiências não devem destruir o ponto estável

Depois da baseline, mudanças relevantes devem ser desenvolvidas de forma que seja possível voltar ao estado estável.

A baseline funciona como referência técnica, não como fim do desenvolvimento.

---

# Regra para futuras decisões

Antes de adotar uma mudança arquitetural relevante, responder:

```text
Qual problema concreto ela resolve?

Qual dado do código ela preserva?

Ela mistura semântica e geometria?

Ela aumenta dependências sem necessidade?

Conseguimos testar seu comportamento?

Ela mantém a dungeon explicável?
```

Se a mudança não tiver uma resposta clara para essas perguntas, ela não deve entrar apenas por parecer mais sofisticada.

---

# Regra principal

O Dungeon pode ficar mais bonito, mais explorável e mais completo.

Mas sua arquitetura deve continuar preservando esta diferença:

```text
significado extraído do código
            ≠
estrutura criada apenas para visualização e exploração
```

Essa separação é a base de confiança do projeto.

---

## A decoração da entrada não deve bloquear a aplicação

A página inicial desenha materiais compartilhados, mas mantém editor e botões
no DOM. O fundo é estático e redimensionado conforme o viewport; não recebe um
ciclo contínuo de animação nem interpreta o código do usuário.

`ResizeObserver` é usado quando disponível. O evento `resize` é a alternativa
para que a ausência dessa API não impeça a inicialização do editor, a geração
da dungeon ou o retorno da exploração. Essa garantia possui testes de integração.
