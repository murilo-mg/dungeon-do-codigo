# Decisões técnicas

Este documento registra decisões que orientam o desenvolvimento atual do Dungeon do Código.

Ele não é uma lista de todas as ideias possíveis.

Uma decisão só deve ser apresentada aqui como atual quando ela já estiver adotada no projeto ou quando funcionar como regra explícita para sua evolução.

Funcionalidades futuras pertencem principalmente a `PLANO_TECNICO.md`.

---

# Princípio central

## A dungeon deve explicar o programa, não inventá-lo

O Dungeon pode usar linguagem visual de jogos.

Isso não significa que pode criar significado sem evidência.

A regra principal é:

> **Se um significado visual não puder ser justificado por dados reais do código, ele não deve ser apresentado como fato.**

Isso vale para:

- nomes;
- agrupamentos;
- regiões;
- importância;
- relações;
- métricas;
- destaques;
- descrições.

Uma representação neutra é preferível a uma interpretação inventada.

---

# Estrutura da dungeon

## Não usar aleatoriedade como estrutura principal

Uma dungeon procedural aleatória pode ser visualmente interessante, mas prejudicaria:

- comparação;
- aprendizado;
- testes;
- depuração;
- previsibilidade.

O mesmo código deve produzir uma estrutura estável.

Elementos puramente decorativos podem variar quando isso não altera significado.

---

## Priorizar determinismo

A mesma entrada deve produzir o mesmo resultado estrutural.

Determinismo ajuda em:

- testes;
- comparação;
- reprodução de bugs;
- leitura do mapa;
- futuras comparações antes/depois.

O layout possui critérios determinísticos e usa ordem estrutural para resolver empates quando necessário.

---

## Profundidade deve influenciar a organização

A profundidade calculada a partir da entrada é uma informação real do grafo.

Por isso ela é usada como uma das principais referências da organização espacial.

Funções em profundidades diferentes tendem a ocupar colunas diferentes.

---

## Usar callers para melhorar a disposição

Dentro de uma profundidade, a posição dos callers da coluna anterior pode ajudar a ordenar as funções.

Essa estratégia foi escolhida porque melhora a legibilidade de vários casos sem alterar:

- o grafo;
- a profundidade;
- o tamanho das salas.

Novas alterações de layout devem partir de problemas medidos.

---

## Não instalar Dagre ou ELK sem necessidade demonstrada

O projeto possui um layout próprio separado e testável.

Nos cenários atuais, ele resolve os problemas de sobreposição que motivaram sua criação.

Adicionar uma biblioteca de layout aumentaria:

- dependências;
- complexidade;
- superfície de manutenção.

Dagre, ELK ou soluções semelhantes podem ser avaliadas no futuro se casos reais mostrarem que a implementação atual não consegue evoluir de forma adequada.

---

# Grafo

## O grafo é separado do layout

O grafo representa relações.

O layout representa espaço.

Por isso:

```text
grafoC.js
```

não deve decidir posições de Canvas, e:

```text
layoutMasmorra.js
```

não deve determinar quem chama quem.

Essa separação deve continuar sendo preservada.

---

## Representar apenas relações conhecidas como internas

Uma chamada só entra no grafo interno atual quando existe uma função correspondente no código analisado.

Isso evita criar salas fictícias para funções que não fazem parte do arquivo.

Chamadas externas podem futuramente aparecer como informação complementar, mas não devem ser confundidas com funções internas.

---

## Separar direção lógica de navegação física

Uma chamada possui direção:

```text
a → b
```

A navegação física do personagem pode percorrer o corredor nos dois sentidos.

Essa escolha facilita exploração sem modificar o significado do grafo.

Portanto:

```text
movimento físico bidirecional
```

não significa:

```text
chamada de função bidirecional
```

---

# Regiões semânticas

## Regiões são dados antes de serem desenho

A classificação das regiões foi implementada separadamente do Canvas.

Isso permite:

- testar as regras;
- mudar a aparência depois;
- evitar que geometria determine significado.

`regioesMasmorra.js` não decide posições.

---

## A entrada não é uma ala normal

A função de entrada possui um papel estrutural diferente.

Quando existe `main`, ela assume esse papel.

Caso contrário, a primeira função encontrada é usada.

A entrada é representada separadamente das alas.

---

## Toda função inalcançável pertence às Criptas Isoladas

Alcançabilidade tem prioridade sobre a classificação de hub.

Se não existe caminho da entrada até uma função, ela pertence às Criptas Isoladas.

Mesmo que outras funções desconectadas chamem essa função diversas vezes, ela não deve ser apresentada como um centro da dungeon principal.

---

## Hubs dependem do grafo, não do nome

O Salão Central representa uma característica estrutural.

A regra atual considera candidata uma função:

```text
alcançável
+
pelo menos 3 callers alcançáveis distintos
```

Uma função chamada:

```text
hub
central
core
```

não ganha esse papel apenas pelo nome.

---

## Usar nomes de alas de forma conservadora

Prefixos técnicos comuns podem ajudar a nomear grupos.

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

Mas essa inferência precisa ser conservadora.

---

## Prefixos operacionais não são domínios

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

normalmente representam operações, não componentes arquiteturais.

Por isso não devem produzir automaticamente nomes como:

```text
Ala Get
Ala Create
```

---

## Preferir `Ala N` a inventar significado

Quando não existe evidência suficiente para um nome semântico, o projeto usa:

```text
Ala 1
Ala 2
...
```

Esse nome informa menos, mas não comunica uma interpretação falsa.

---

# Análise de C

## Usar análise própria simples enquanto ela atender ao objetivo

O projeto possui uma análise construída especificamente para a experiência atual.

Ela não pretende implementar toda a gramática de C.

Enquanto esse subconjunto for suficiente para o objetivo do produto, não existe necessidade de introduzir imediatamente um parser completo.

---

## Separar léxico da análise estrutural

Comentários, strings e caracteres não devem ser analisados como código.

Por isso existe uma etapa léxica anterior às contagens estruturais.

Essa decisão evita falsos positivos como:

```c
printf("if while }");
```

---

## Não esconder as limitações do analisador

O projeto deve deixar claro que construções mais avançadas podem não ser compreendidas corretamente.

Entre elas:

- macros complexas;
- pré-processamento;
- ponteiros de função;
- declarações avançadas.

É melhor apresentar uma limitação verdadeira do que comunicar uma análise incorreta com aparência de certeza.

---

## Não mudar a métrica de complexidade sem estudar o impacto

A complexidade atual influencia diferentes elementos visuais.

Uma troca de fórmula afetaria:

- classificação;
- cores;
- tamanhos;
- criaturas;
- comparações.

Antes de substituir a métrica, o projeto deve primeiro tornar sua fórmula atual mais explicável e avaliar alternativas de forma consciente.

---

# Tecnologia

## Continuar com HTML, CSS e JavaScript ES Modules

A arquitetura atual é suficiente para a versão em desenvolvimento.

Ela possui vantagens importantes:

- pouca configuração;
- fácil execução;
- poucas dependências;
- funcionamento como site estático;
- código fácil de explicar.

Novas tecnologias devem resolver problemas concretos.

---

## Não usar React agora

React não resolve atualmente um problema necessário da aplicação.

Sua adoção traria:

- build adicional;
- dependências;
- abstrações;
- migração da interface existente.

Pode ser reconsiderado se a complexidade da interface justificar essa mudança no futuro.

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

Three.js ou WebGL só devem ser considerados se houver uma necessidade concreta que Canvas 2D não consiga atender de forma adequada.

---

## Não usar motor de jogos agora

O projeto ainda não possui necessidades como:

- combate complexo;
- vários mapas;
- grande sistema de entidades;
- física avançada;
- gerenciamento pesado de recursos.

Adicionar um motor de jogos hoje aumentaria o projeto sem resolver um requisito atual.

---

# Backend e privacidade

## Não usar backend na versão atual

As funcionalidades atuais podem funcionar no navegador.

Um backend traria custos e responsabilidades adicionais:

- hospedagem;
- privacidade;
- armazenamento;
- segurança;
- manutenção.

Ele só deve ser introduzido se existir um requisito concreto que não possa ser resolvido localmente.

---

## Não executar código C

O Dungeon analisa texto.

Ele não deve compilar ou executar código C no estado atual.

Executar código fornecido por usuários criaria uma arquitetura de segurança completamente diferente.

Isso não é necessário para o objetivo atual do projeto.

---

## Processar localmente

A análise deve continuar local no navegador enquanto a arquitetura permitir.

O código do usuário não deve ser enviado automaticamente para um servidor.

Qualquer mudança futura que exija envio do código precisa ser explícita e tratada como mudança de arquitetura e de privacidade.

---

## Não prometer privacidade absoluta

O projeto pode descrever seu comportamento técnico real.

Por exemplo:

```text
o código é analisado localmente no navegador
```

Mas não deve usar afirmações como:

```text
100% privado
100% seguro
```

Segurança precisa ser verificável, não apenas declarada.

---

# Importação de arquivos

## Importar um arquivo por vez

A importação atual trabalha com um único `.c`.

Essa limitação mantém o fluxo simples e compatível com o analisador atual.

Projetos com vários arquivos são uma possível evolução futura, mas exigiriam novas regras de:

- nomes;
- chamadas;
- arquivos;
- escopo;
- interface.

---

## Manter limite de tamanho

O limite atual é de 512 KiB.

Ele existe principalmente para evitar entradas acidentais muito grandes.

Esse limite não deve ser considerado proteção completa contra consumo excessivo de CPU.

Antes da publicação, também devem ser avaliados limites relacionados à complexidade da entrada.

---

## Importação não deve executar nem gerar automaticamente

Abrir um arquivo deve carregar seu conteúdo no editor.

O usuário continua decidindo quando gerar a dungeon.

Essa separação evita ações inesperadas.

---

# Interface

## Canvas para espaço; DOM para informação textual

Canvas permanece responsável pela experiência espacial.

DOM permanece responsável principalmente por:

- inspector;
- busca;
- botões;
- editor;
- mensagens;
- estados.

Isso também facilita acessibilidade e interação com texto.

---

## Seleção não deve teleportar o jogador

Selecionar uma função e estar fisicamente em uma função são estados diferentes.

Busca, callers, callees e clique simples podem focar outra sala sem alterar a posição do personagem.

Movimento físico acontece apenas quando existe uma ação específica de navegação.

---

## Busca, relações e clique compartilham a mesma seleção

Não devem existir três sistemas independentes de função selecionada.

Busca, callers, callees e clique na sala utilizam o mesmo fluxo.

Isso reduz estados inconsistentes.

---

## Duplo clique pode iniciar navegação

O duplo clique possui um significado diferente do clique simples.

Clique:

```text
inspecionar
```

Duplo clique:

```text
inspecionar + tentar navegar
```

Quando não existe rota, a seleção ainda pode ocorrer sem criar uma passagem artificial.

---

## Destacar contexto sem esconder o restante

O foco contextual reduz a importância visual de elementos fora das cadeias relevantes.

Eles continuam presentes no mapa.

Essa decisão mantém o contexto global disponível enquanto o usuário estuda uma função.

---

# Modos visuais

## Complexidade e Estrutura são representações da mesma dungeon

Trocar o modo visual não deve mudar:

- grafo;
- posições;
- tamanhos;
- câmera;
- personagem;
- seleção.

O modo altera apenas como os mesmos dados são apresentados.

---

## Marcadores indicam presença, não quantidade

Os glifos:

```text
I
F
W
S
R
C
```

comunicam presença estrutural.

Detalhes e quantidades ficam no inspector.

Essa escolha evita sobrecarregar visualmente salas pequenas.

---

# Câmera e zoom

## Zoom altera projeção, não geometria

Zoom não modifica:

- posição física;
- dimensões do mundo;
- grafo;
- corredores;
- detecção estrutural.

Apenas a transformação visual muda.

---

## Níveis de zoom podem mudar a quantidade de detalhe

O zoom semântico existe para manter o mapa legível.

Visão distante não precisa mostrar os mesmos detalhes da visão próxima.

Contudo, ocultar detalhes não pode alterar o significado da dungeon.

---

## Encaixar é uma visão, não uma reconstrução

A função Encaixar calcula uma câmera capaz de mostrar o mundo inteiro.

Ela não reposiciona as salas para caber no viewport.

---

# Corredores

## Corredores atuais representam arestas reais

O desenho dos corredores parte das arestas do grafo.

Eles não devem ser criados apenas para preencher o cenário.

---

## Cruzamento visual não significa conexão física

Quando o roteamento evoluir, dois corredores podem se cruzar sem que exista uma passagem entre eles.

A topologia precisa continuar explícita.

Não se deve inferir conexão apenas porque duas linhas se encontram visualmente.

---

## Medir antes de mudar

Melhorias de corredores devem ser avaliadas usando métricas e cenários de teste.

Entre os problemas relevantes estão:

- travessia de terceira sala;
- cruzamentos;
- comprimento excessivo;
- perda de legibilidade.

A futura versão dos corredores deve resolver problemas reais sem alterar as relações do grafo.

---

# Acessibilidade

## Não depender exclusivamente de cor

Estrutura ou importância não devem ser comunicadas somente por mudança de cor.

Marcadores, contornos, texto e outras formas podem complementar a representação.

---

## Manter informação textual no DOM

Informações importantes sobre o código devem continuar disponíveis fora do Canvas sempre que possível.

O inspector é a principal representação textual atual.

Uma visão estrutural alternativa ao mapa pode ser adicionada no futuro se necessário.

---

# Testes

## Mudanças estruturais precisam de regressão automatizada

Correções de análise devem incluir exemplos C que reproduzam o problema.

Mudanças de grafo devem possuir casos determinísticos.

Mudanças de layout devem verificar invariantes geométricos.

---

## Não registrar contagens de testes como estado permanente

A quantidade de testes muda com frequência.

Documentos vivos devem preferir:

```bash
npm test
```

em vez de frases como:

```text
existem X testes
```

Números podem continuar em documentos históricos quando fizerem parte do registro daquela revisão.

---

# Integração contínua

## Executar testes em push e pull request

O repositório possui GitHub Actions executando a suíte automaticamente.

Esse comportamento deve continuar servindo como proteção contra regressões.

---

## Deploy futuro deve depender de testes verdes

Quando a publicação automática for implementada, a intenção é que uma versão considerada estável não seja publicada depois de uma suíte quebrada.

O mecanismo exato de deploy ainda não foi decidido.

---

# Segurança para publicação

## Segurança é uma etapa própria

A publicação não deve acontecer apenas porque a interface está funcionando.

Antes da primeira versão pública devem ser avaliados:

- entradas hostis;
- consumo de CPU;
- limites;
- DOM;
- CSP;
- headers;
- recursos externos;
- hospedagem;
- política de rede.

Essas medidas ainda não são tratadas como concluídas.

---

## Evitar dependências externas sem necessidade

Scripts, fontes ou bibliotecas externas aumentam:

- dependência de terceiros;
- superfície de ataque;
- requisições de rede.

Devem ser adicionados apenas quando houver um benefício concreto.

---

## Não armazenar automaticamente o código

O conteúdo do usuário não deve ser salvo automaticamente.

Se algum tipo de sessão ou persistência for criado no futuro, precisa ser explícito e cuidadosamente limitado.

---

# Documentação

## Documentos vivos devem representar o estado atual

Os arquivos de arquitetura, decisões, estado atual e plano técnico precisam acompanhar mudanças relevantes do comportamento.

Não devem continuar descrevendo como futuro algo que já foi implementado.

---

## Documentos históricos devem permanecer históricos

Arquivos como `CORRECOES.md` podem manter:

- números antigos;
- limitações antigas;
- contexto da época.

Eles devem apenas deixar claro que representam uma revisão passada.

Não se deve reescrever o passado como se o projeto atual já existisse naquele momento.

---

# Entrada de novas tecnologias

Uma nova biblioteca, framework ou serviço deve responder:

```text
Qual problema concreto isso resolve?
```

Não é motivo suficiente:

```text
é moderno
é popular
fica mais profissional
```

A tecnologia deve melhorar o projeto mais do que aumenta sua complexidade.

---

# Ordem das prioridades

As decisões atuais favorecem esta sequência:

```text
correção
↓
confiabilidade
↓
clareza
↓
experiência
↓
segurança
↓
expansão
```

Funcionalidades maiores não devem impedir a consolidação das bases existentes.

---

# Regra final

O projeto deve continuar sendo compreensível pelo próprio mantenedor.

Uma mudança técnica é melhor quando:

- resolve um problema real;
- pode ser explicada;
- pode ser testada;
- mantém responsabilidades separadas;
- não cria complexidade desnecessária.

O Dungeon do Código deve crescer sem perder a capacidade de explicar tanto o código analisado quanto o próprio código que o constrói.