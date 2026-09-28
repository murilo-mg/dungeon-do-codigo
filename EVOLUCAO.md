# Caminho de evolução

O Dungeon do Código está evoluindo de uma experiência visual simples para uma ferramenta de exploração e leitura de programas.

A ideia central continua sendo:

> transformar a estrutura real de um código em uma dungeon que ajude o usuário a compreender o programa.

A parte visual pode usar referências de jogos, mas o mapa não deve inventar significado.

Sempre que uma sala, região, marcador ou relação comunicar algo sobre o programa, essa informação precisa estar ligada a dados reais extraídos do código.

---

# Objetivo do projeto

O objetivo não é criar apenas um jogo baseado em código.

O Dungeon deve ajudar o usuário a responder perguntas como:

- onde o programa começa?
- quais funções estão conectadas?
- quem chama determinada função?
- quais funções ela chama?
- quais partes são mais profundas no fluxo?
- onde há recursão?
- onde existem ciclos?
- quais funções não são alcançadas pela entrada?
- quais partes parecem estruturalmente importantes?
- onde vale concentrar a leitura?

A dungeon funciona como outra forma de observar essas relações.

---

# Evolução já concluída

## Base visual

O projeto começou com uma representação simples em Canvas.

Ao longo do desenvolvimento foram adicionados:

- personagem;
- salas;
- cenário;
- criaturas;
- efeitos;
- painel lateral;
- movimentação com teclado;
- controle de foco da exploração.

Esses elementos formaram a base da experiência.

---

## Análise estrutural mais segura

O analisador passou a separar:

- código;
- comentários;
- strings;
- caracteres.

Isso evita interpretar conteúdo textual como estrutura C.

Também foram adicionados tratamentos para:

- entradas incompletas;
- comentários não terminados;
- strings não terminadas;
- chaves inconsistentes.

As correções dessa etapa estão registradas em `CORRECOES.md`.

---

## Grafo real de chamadas

As chamadas entre funções conhecidas passaram a ser representadas explicitamente.

O grafo atual registra:

- nós;
- arestas;
- função de entrada;
- callers;
- callees;
- alcance;
- profundidade mínima;
- recursão direta;
- participação em ciclos.

Quando existe `main`, ela é usada como entrada.

Caso contrário, a primeira função encontrada assume esse papel.

---

## Layout baseado no grafo

O mapa deixou de depender de uma disposição circular fixa.

As salas passaram a ser organizadas considerando principalmente:

- profundidade no grafo;
- callers;
- ordem estrutural;
- tamanho da função;
- funções inalcançáveis.

O mundo lógico cresce de acordo com a necessidade.

Isso permitiu representar programas maiores sem obrigar todas as salas a caber dentro de um único viewport.

---

## Câmera e mundo expansível

Foi adicionada uma câmera para permitir que o jogador explore mundos maiores que o Canvas.

A posição física das salas continua no sistema de coordenadas do mundo.

A câmera altera apenas o que é mostrado ao usuário.

Também foram adicionados:

- zoom;
- visão geral;
- encaixe da dungeon;
- foco manual em uma sala.

---

## Busca e leitura estrutural

A exploração passou a oferecer busca de funções.

O inspector permite navegar pelas relações estruturais da função selecionada.

Atualmente é possível consultar:

- callers;
- callees;
- caminho mínimo desde a entrada;
- estruturas de controle;
- recursão;
- ciclos;
- métricas;
- trecho do código.

Busca, clique e botões de relações usam a mesma seleção.

---

## Foco contextual

Selecionar uma função pode destacar as cadeias de chamadas relevantes até ela.

As funções fora do contexto permanecem no mapa, mas recebem menos destaque.

Isso permite estudar uma região do programa sem esconder a estrutura completa.

---

## Interação direta com as salas

As salas podem ser selecionadas diretamente no Canvas.

Um clique seleciona a função.

Um duplo clique pode iniciar uma navegação automática até ela quando existe uma rota pelos corredores atuais.

A navegação automática usa a geometria existente da dungeon.

O movimento manual continua separado dessa seleção.

---

## Modos de visualização

Foram criados dois modos principais:

### Complexidade

Mantém:

- cores;
- criaturas;
- identidade visual ligada ao nível de complexidade.

### Estrutura

Prioriza:

- marcadores;
- relações;
- leitura estrutural.

A troca de modo não modifica o grafo ou a geometria.

---

## Marcadores estruturais

As salas podem indicar visualmente a presença de:

```text
I → if
F → for
W → while
S → switch
R → recursão direta
C → ciclo
```

Esses marcadores complementam o inspector.

---

## Importação de arquivos C

O projeto passou a permitir carregar um arquivo `.c` local.

O arquivo:

- é lido no navegador;
- não é executado;
- não precisa ser enviado a um backend;
- respeita limite de tamanho;
- só substitui o editor depois de uma leitura válida.

---

## Zoom semântico

O nível de detalhe das salas agora depende da aproximação.

A representação possui níveis diferentes para:

- visão geral do mapa;
- identificação das funções;
- detalhes completos.

Assim, mapas grandes continuam legíveis quando vistos de longe.

Hover e seleção permitem consultar nomes completos mesmo quando o desenho interno está simplificado.

---

# Último marco concluído: regiões semânticas

A dungeon agora possui uma camada de classificação semântica separada da geometria.

Essa classificação existe como dados.

Ela ainda não altera o posicionamento das salas e ainda não é desenhada visualmente no Canvas.

Existem quatro categorias principais.

---

## Entrada da Dungeon

A função de entrada é tratada separadamente.

Ela não vira uma ala normal.

---

## Salão Central

Funções alcançáveis podem ser classificadas como hubs.

Atualmente uma função precisa receber chamadas de pelo menos três callers alcançáveis distintos para poder entrar no Salão Central.

O nome da função não decide isso.

A decisão vem da estrutura do grafo.

---

## Alas

Funções podem ser agrupadas em alas.

Quando existe um prefixo técnico comum confiável, ele pode ser usado no nome.

Exemplos:

```text
parse_expression
parse_primary
parse_unary
```

podem gerar:

```text
Ala Parser
```

e:

```text
vm_push
vm_pop
vm_execute
```

podem gerar:

```text
Ala VM
```

Prefixos operacionais genéricos não são interpretados como domínio.

Exemplos:

```text
get_
set_
create_
delete_
read_
write_
```

não devem gerar significados como:

```text
Ala Get
Ala Create
```

Quando não existe um nome confiável, o fallback é neutro:

```text
Ala 1
Ala 2
Ala 3
```

---

## Criptas Isoladas

Toda função inalcançável a partir da entrada pertence às Criptas Isoladas.

Uma função desconectada não vira Salão Central apenas porque recebe chamadas de outras funções também desconectadas.

Alcançabilidade tem prioridade sobre a classificação de hub.

---

# Princípio de confiança no mapa

A evolução do projeto deve seguir uma regra:

> **Se um significado visual não puder ser justificado por dados reais do código, ele não deve ser apresentado como fato.**

Isso vale para:

- nomes de regiões;
- descrições;
- dificuldade;
- importância;
- agrupamentos;
- destaques;
- futuras mecânicas.

O Dungeon pode interpretar a estrutura.

Ele não deve inventar arquitetura.

---

# Próximo ciclo: representação visual das regiões

A classificação já existe.

Agora o próximo passo é mostrar essas regiões no mapa.

A primeira versão visual deve representar:

```text
Entrada da Dungeon
Salão Central
Alas
Criptas Isoladas
```

sem destruir a geometria existente.

O objetivo inicial não é redesenhar toda a dungeon.

Primeiro queremos criar uma camada visual que permita perceber os agrupamentos.

Possíveis elementos:

- limites visuais discretos;
- chão ou textura diferente;
- placas;
- títulos;
- separação espacial leve;
- cores secundárias;
- identificação no zoom distante.

As regiões precisam continuar sendo derivadas dos dados já existentes.

---

# Depois: Corredores 2.0

Os corredores atuais representam relações reais, mas ainda são segmentos geométricos simples.

Nos casos mais densos, principalmente quando muitas funções ocupam o mesmo nível, alguns corredores podem atravessar outras salas.

O próximo ciclo estrutural depois das regiões deve tratar isso.

---

## Objetivos

Criar corredores mais parecidos com caminhos de dungeon.

O roteamento deve tentar:

1. ligar as salas corretas;
2. evitar atravessar outras salas;
3. manter trajetos legíveis;
4. preservar as relações reais do grafo;
5. não criar conexões físicas falsas.

---

## Possível estratégia

O roteamento pode seguir uma sequência como:

```text
rota direta
    ↓
testa colisão com outras salas
    ↓
se necessário, cria desvio
    ↓
transforma o caminho em segmentos
```

Os corredores podem evoluir para formatos:

```text
┌───────┐
│       │
└───┐   │
    │   │
    └───┘
```

em vez de apenas uma linha entre centros.

---

## Regra física importante

Dois corredores podem se cruzar visualmente sem necessariamente possuir conexão entre eles.

Portanto:

```text
cruzamento geométrico
```

não pode automaticamente significar:

```text
interseção navegável
```

A topologia precisa continuar explícita.

---

# Confiança na análise

Depois das regiões e dos corredores, a prioridade passa a ser explicar melhor o que o Dungeon está mostrando.

Não basta exibir uma métrica.

O usuário precisa conseguir entender de onde ela veio.

---

## Explicar a complexidade

Se uma função recebe uma determinada pontuação, o inspector deve conseguir justificar esse valor.

Exemplo conceitual:

```text
Complexidade: 12

2 if
1 switch
3 níveis de aninhamento
...
```

A fórmula atual deve ser documentada antes de qualquer mudança de métrica.

Uma possível evolução futura é avaliar métricas conhecidas, como complexidade ciclomática.

Essa troca não deve acontecer sem estudo, porque ela afetaria:

- cores;
- tamanhos;
- criaturas;
- comparação com versões anteriores.

---

## Chamadas externas

Atualmente o grafo se concentra em funções conhecidas do próprio código analisado.

Uma evolução útil seria mostrar chamadas para funções externas como informação complementar.

Exemplos:

```text
printf
malloc
strlen
fopen
```

Essas funções não precisam virar salas.

Podem aparecer no inspector como:

```text
Chamadas externas
```

Isso melhora a leitura sem inventar nós internos.

---

## Avisos de análise incompleta

O analisador não cobre toda a gramática de C.

Algumas construções podem ser reconhecidas parcialmente.

Exemplos:

- macros complexas;
- ponteiros de função;
- pré-processamento condicional;
- declarações avançadas.

Quando for possível detectar uma situação suspeita, o projeto pode mostrar algo como:

```text
Esta análise pode estar incompleta.
```

É preferível assumir uma limitação do que apresentar um mapa incorreto com aparência de certeza.

---

## Descrições de funções

O Dungeon não deve gerar descrições arbitrárias apenas pelo nome de uma função.

Uma fonte possível de descrição é o próprio comentário associado à função.

Por exemplo:

```c
// Calcula o caminho mínimo do grafo.
int calcular_caminho(...) {
```

poderia alimentar uma descrição no inspector.

Sem fonte no código, não deve ser inventada uma explicação.

---

# Melhorias pequenas de alto retorno

Antes da primeira publicação, algumas melhorias podem trazer muito valor sem mudar a arquitetura.

---

## Exemplos prontos

Um botão de exemplos permitiria experimentar o projeto sem precisar procurar um arquivo C.

Podem existir programas pequenos demonstrando:

- cadeia simples;
- recursão;
- ciclo;
- função isolada;
- programa com mais funções.

Esses exemplos também ajudam em apresentações do portfólio.

---

## Justificativa das regiões

A interface pode explicar por que uma região existe.

Exemplos:

```text
Ala Parser
Prefixo comum: parse_
```

```text
Salão Central
Função chamada por 4 funções alcançáveis
```

```text
Criptas Isoladas
Funções sem caminho desde a entrada
```

Isso fortalece o princípio de confiança no mapa.

---

## Acessibilidade

O Canvas não deve ser a única forma possível de compreender a dungeon no futuro.

Uma visão textual pode representar:

- funções;
- profundidade;
- callers;
- callees;
- regiões;
- métricas.

Essa versão também pode ajudar usuários que preferem navegação por teclado.

---

# Segurança antes da publicação

O Dungeon atualmente funciona como frontend estático.

Isso reduz bastante a arquitetura necessária, mas não elimina riscos.

Antes da primeira versão pública, haverá um ciclo dedicado a segurança.

---

## Objetivos

Revisar:

- conteúdo vindo do usuário;
- DOM;
- limites de processamento;
- arquivos grandes;
- códigos construídos para consumir CPU;
- comportamento do parser;
- dependências;
- política de rede;
- deploy.

---

## Privacidade

A intenção é manter:

```text
análise local no navegador
```

sem enviar o código do usuário para servidores.

Essa característica precisa continuar verificável.

Não devem ser introduzidos silenciosamente:

- analytics que capturem conteúdo;
- gravação de sessão;
- error tracking contendo trechos de código;
- scripts externos desnecessários;
- fontes externas desnecessárias.

---

## Entradas hostis

A suíte deve crescer para cobrir entradas como:

```text
__proto__
constructor
toString
```

além de:

- HTML dentro de comentários;
- strings maliciosas;
- nomes gigantes;
- Unicode incomum;
- NUL;
- aninhamento extremo;
- muitas funções;
- grafos densos;
- ciclos grandes.

O objetivo não é apenas evitar XSS.

Também é evitar travamento e consumo excessivo de recursos.

---

## Limites

O limite de arquivo em bytes é apenas uma primeira proteção.

Outros limites podem ser necessários, como:

- número de linhas;
- tamanho máximo de linha;
- número de funções;
- quantidade de arestas;
- profundidade;
- custo da análise.

---

## Web Worker

Mover a análise para um Web Worker pode ser considerado se medições mostrarem risco de congelamento da interface.

Isso permitiria interromper uma análise muito pesada sem travar toda a página.

Não é obrigatório enquanto o problema não estiver demonstrado.

---

## CSP e headers

Antes do deploy público, será estudada uma Content Security Policy adequada.

Também serão avaliados headers como:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Eles só devem ser adicionados depois de verificar que não quebram funcionalidades legítimas.

---

# Publicação

O projeto ainda não depende de backend para cumprir seu objetivo atual.

A primeira versão pública deve continuar simples.

O plano é:

```text
testes verdes
    ↓
hardening
    ↓
deploy de teste
    ↓
verificação manual
    ↓
publicação
```

No deploy de teste devem ser conferidos:

- Console do navegador;
- aba Network;
- comportamento da importação;
- geração da dungeon;
- zoom;
- busca;
- interação;
- ausência de envio do código.

A plataforma de hospedagem ainda não está definida definitivamente.

Ela será escolhida quando chegarmos nessa etapa.

---

# CI

O projeto já possui GitHub Actions executando:

```bash
npm test
```

em pushes e pull requests.

A publicação futura deve respeitar essa disciplina:

> código com testes falhando não deve ser publicado como versão estável.

---

# Depois da primeira versão pública

Algumas funcionalidades maiores ficam melhores depois de termos usuários reais experimentando o projeto.

---

## Comparação antes e depois

Uma das evoluções mais interessantes é permitir comparar duas versões do mesmo código.

Exemplo:

```text
ANTES
funcaoA → complexidade 12

DEPOIS
funcaoA → complexidade 7
```

O objetivo não deve ser produzir uma pontuação única de "código melhor".

A interface deve mostrar diferenças concretas:

- complexidade;
- profundidade;
- chamadas;
- estruturas;
- funções adicionadas;
- funções removidas.

---

## Exportação

Possibilidades futuras:

- imagem PNG da dungeon;
- JSON do grafo;
- JSON da análise;
- Mermaid do grafo de chamadas.

Isso pode ajudar em:

- trabalhos acadêmicos;
- documentação;
- apresentações.

---

## Missões de leitura

A própria estrutura do grafo pode gerar desafios.

Exemplos:

```text
Encontre a função mais profunda.
```

```text
Qual função participa de um ciclo?
```

```text
Qual função não é alcançada por main?
```

As respostas devem vir dos dados reais.

---

## Outras linguagens

A longo prazo, o mapa pode deixar de depender exclusivamente de C.

A ideia seria manter a parte visual separada do analisador.

Assim:

```text
Analisador C
      ↓
estrutura comum
      ↓
Dungeon
```

poderia futuramente coexistir com:

```text
Analisador JavaScript
Analisador Go
Analisador Java
```

Essa expansão não é prioridade agora.

---

## Parser C mais completo

Um parser mais completo só deve ser adotado se as limitações atuais passarem a impedir o objetivo do projeto.

Possibilidades como Tree-sitter podem ser estudadas em um ciclo próprio.

Isso traria benefícios, mas também:

- dependências;
- maior complexidade;
- custo de manutenção;
- impacto na segurança;
- impacto no tamanho do projeto.

Não deve ser adotado apenas porque existe.

---

# Validação com usuários

Quando existir uma versão pública estável, o projeto deve ser testado com outras pessoas.

Algumas tarefas simples podem ser usadas:

1. encontrar a função mais complexa;
2. identificar quem chama determinada função;
3. encontrar uma função isolada;
4. explicar um caminho desde `main`.

Podemos observar:

- tempo;
- erros;
- dúvidas;
- partes do mapa que confundem;
- partes que realmente ajudam.

Isso não serve para provar eficácia pedagógica com poucas pessoas.

Serve para orientar as próximas decisões.

---

# Direção arquitetural

Enquanto o projeto continuar cabendo bem em:

```text
HTML
CSS
JavaScript
Canvas
```

não há necessidade de adicionar framework frontend ou motor de jogos.

Novas tecnologias devem entrar para resolver problemas concretos.

A mesma regra vale para:

- backend;
- banco de dados;
- autenticação;
- motor de jogos;
- bibliotecas de layout;
- parser externo.

Complexidade técnica não deve ser confundida com evolução do produto.

---

# Ordem atual

A sequência planejada é:

```text
1. Regiões semânticas como dados
   CONCLUÍDO

2. Representação visual das regiões
   PRÓXIMO

3. Corredores 2.0

4. Confiança na análise

5. Pequenas melhorias de UX e acessibilidade

6. Hardening de segurança

7. Publicação da primeira versão

8. Uso real e feedback

9. Funcionalidades maiores pós-publicação
```

Essa ordem pode mudar quando novas medições ou testes mostrarem uma necessidade mais importante.

---

# Disciplina de evolução

Cada mudança deve responder pelo menos uma destas perguntas:

```text
Isso ajuda a entender o código?
Isso melhora a confiabilidade?
Isso melhora a navegação?
Isso melhora a segurança?
Isso resolve um problema medido?
```

Se a resposta for não, a funcionalidade provavelmente não é prioridade.

Correções do analisador devem possuir exemplos C que reproduzam o problema.

Mudanças de layout devem possuir casos determinísticos.

Mudanças visuais importantes devem ser testadas manualmente no navegador.

E nenhuma informação visual deve ser tratada como verdade se não puder ser explicada pelos dados reais do programa.