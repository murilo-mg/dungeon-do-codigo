# Plano técnico

Este documento organiza os próximos passos técnicos do Dungeon do Código.

Ele separa claramente:

```text
o que já existe
o que vem agora
o que vem depois
o que é necessário antes da publicação
o que fica para depois da primeira versão pública
```

O estado funcional atual está documentado em `ESTADO_ATUAL.md`.

As decisões arquiteturais estão em `DECISOES.md`.

---

# Objetivo

O Dungeon do Código transforma a estrutura de um código C em uma dungeon explorável.

Cada função vira uma sala.

As relações entre funções ajudam a formar:

- grafo;
- corredores;
- contexto;
- organização;
- regiões.

A experiência deve combinar:

```text
leitura de código
+
visualização estrutural
+
exploração
```

sem inventar informações sobre o programa.

---

# Princípio do plano

Toda nova funcionalidade deve responder pelo menos uma destas perguntas:

```text
Ajuda a entender o código?
Melhora a confiabilidade da análise?
Melhora a legibilidade da dungeon?
Melhora a navegação?
Melhora a acessibilidade?
Melhora a segurança?
Resolve um problema medido?
```

Se não responder a nenhuma delas, provavelmente não é prioridade.

---

# Base atual concluída

## Análise de C

Já existe:

- entrada de código;
- separação léxica básica;
- extração de funções;
- contagem de linhas;
- estruturas de controle;
- métrica de complexidade atual;
- chamadas entre funções conhecidas;
- tratamento de entradas incompletas suportadas.

---

## Grafo

Já existe:

- função de entrada;
- nós;
- arestas direcionadas;
- callers;
- callees;
- profundidade;
- alcance;
- caminho mínimo;
- recursão direta;
- ciclos;
- contexto topológico.

---

## Layout

Já existe:

- layout separado do grafo;
- colunas por profundidade;
- distribuição vertical;
- ordenação por callers;
- mundo lógico dinâmico;
- separação das funções inalcançáveis;
- comportamento determinístico;
- testes contra sobreposição.

---

## Masmorra

Já existe:

- construção das salas;
- tamanhos por complexidade;
- cores;
- perfil estrutural;
- indicadores de recursão e ciclo;
- dimensões do mundo;
- regiões semânticas.

---

## Regiões semânticas

Já existe como dados:

```text
Entrada da Dungeon
Salão Central
Alas
Criptas Isoladas
```

Também estão definidas as regras para:

- hubs;
- funções inalcançáveis;
- prefixos confiáveis;
- prefixos operacionais;
- fallback `Ala N`.

---

## Corredores

Já existe:

- transformação de arestas reais em segmentos;
- remoção de duplicatas;
- exclusão de autoarestas no desenho;
- uso compartilhado pelo jogo e cenário;
- métricas de legibilidade.

---

## Exploração

Já existe:

- WASD;
- setas;
- ativação dos controles pelo Canvas;
- `Esc` para liberar;
- personagem;
- câmera;
- mundo maior que o viewport;
- clique;
- hover;
- duplo clique;
- navegação automática.

---

## Leitura estrutural

Já existe:

- inspector;
- callers;
- callees;
- caminho mínimo;
- perfil de estruturas;
- recursão;
- ciclos;
- busca;
- seleção unificada;
- foco contextual.

---

## Visualização

Já existe:

- modo Complexidade;
- modo Estrutura;
- marcadores I/F/W/S;
- marcadores R/C;
- câmera;
- zoom;
- Encaixar;
- zoom semântico.

---

## Arquivos

Já existe:

- seletor de `.c`;
- drop;
- limite de 512 KiB;
- leitura local;
- tratamento de erros;
- geração explícita após a leitura.

---

## Testes

Já existe uma suíte automatizada executada com:

```bash
npm test
```

Também existe GitHub Actions para executar a suíte em pushes e pull requests.

---

# Próximo ciclo: regiões visuais

A classificação semântica já está pronta.

O próximo passo é representar as regiões no Canvas.

---

## Objetivo

Permitir que o usuário perceba visualmente:

```text
onde começa a dungeon
quais salas pertencem a uma ala
onde fica o Salão Central
quais funções estão isoladas
```

---

## Regra principal

A camada visual deve consumir:

```text
masmorra.regioes
```

Ela não deve recalcular:

- prefixos;
- hubs;
- alcançabilidade;
- agrupamentos.

A classificação já possui uma fonte de verdade.

---

## Primeira versão

Representar:

### Entrada da Dungeon

A região da função inicial.

---

### Salão Central

A área destinada aos hubs estruturais.

---

### Alas

Grupos normais com títulos como:

```text
Ala Parser
Ala VM
Ala RBT
Ala 1
Ala 2
```

---

### Criptas Isoladas

Representação separada das funções inalcançáveis.

---

## Aparência possível

A primeira versão pode experimentar:

- contorno de região;
- chão diferenciado;
- textura;
- placa;
- título;
- fundo discreto;
- separação visual.

A escolha precisa continuar legível nos diferentes níveis de zoom.

---

## Zoom semântico das regiões

Na visão distante, os nomes das regiões podem se tornar mais importantes que os nomes de cada função.

Exemplo conceitual:

```text
zoom distante
→ Entrada
→ Ala Parser
→ Salão Central
→ Criptas Isoladas
```

Ao aproximar:

```text
região
→ salas
→ função
→ detalhes
```

Isso deve ser testado visualmente antes de virar comportamento definitivo.

---

## Critério de conclusão

A etapa estará concluída quando:

- todas as regiões corretas puderem ser identificadas visualmente;
- funções não aparecerem na região errada;
- o layout continuar determinístico;
- zoom continuar funcionando;
- clique e hover continuarem funcionando;
- foco contextual continuar funcionando;
- personagem continuar funcionando;
- nenhuma regra de classificação for duplicada na renderização;
- a suíte permanecer verde.

---

# Depois: Corredores 2.0

Os corredores atuais já representam relações reais, mas sua geometria ainda é simples.

Esse será o próximo grande ciclo estrutural depois das regiões.

---

## Problema principal

Nos casos densos, um segmento pode atravessar outra sala.

Isso reduz a legibilidade e enfraquece a aparência de dungeon.

---

## Objetivo

Criar rotas de corredor que:

1. conectem as salas corretas;
2. evitem atravessar outras salas;
3. sejam fáceis de seguir visualmente;
4. preservem o grafo;
5. não criem passagens físicas falsas.

---

## Estratégia inicial

Uma abordagem possível:

```text
origem
  ↓
tenta rota direta
  ↓
detecta colisões
  ↓
se necessário procura desvio
  ↓
gera segmentos finais
```

O algoritmo deve continuar separado do grafo.

---

## Corredores ortogonais

Pode ser testada uma representação baseada em trechos horizontais e verticais.

Exemplo:

```text
sala ───┐
        │
        └──── sala
```

Isso tende a se aproximar mais da linguagem visual de dungeon.

---

## Portas

Quando o sistema de corredores estiver estável, entradas e saídas das salas podem receber representação de porta.

A porta deve ser consequência da conexão real.

Não deve ser apenas uma decoração aleatória.

---

## Interseções

Uma regra importante:

```text
duas rotas cruzarem geometricamente
```

não significa automaticamente:

```text
elas estão conectadas
```

O sistema de navegação deve continuar baseado na topologia explícita.

---

## Métricas

Continuar medindo:

- travessias de salas;
- cruzamentos;
- comprimento total.

Novas métricas só devem ser adicionadas quando ajudarem a avaliar problemas concretos.

---

# Ciclo de confiança na análise

Depois da organização visual e dos corredores, o foco passa a ser tornar as informações mais explicáveis.

---

## Explicar a complexidade

O usuário deve conseguir entender de onde vem a métrica apresentada.

Hoje a interface mostra o resultado.

Uma evolução importante é mostrar sua composição.

Exemplo conceitual:

```text
Complexidade: 12

if: 3
for: 1
while: 0
switch: 1
...
```

A fórmula atual deve ser documentada e explicada antes de ser substituída.

---

## Avaliar métricas conhecidas

Uma possível evolução é estudar complexidade ciclomática ou outras métricas conhecidas.

Isso ainda não é uma decisão.

Antes de mudar a fórmula, avaliar impacto sobre:

- tamanho das salas;
- cores;
- criaturas;
- documentação;
- comparações futuras.

---

## Chamadas externas

Atualmente apenas funções conhecidas entram no grafo interno.

Uma melhoria futura é preservar também chamadas como:

```text
printf
malloc
free
strlen
fopen
```

Elas podem aparecer como informação no inspector sem virar salas.

---

## Limitações detectáveis

Quando a análise encontrar construções potencialmente não suportadas, pode mostrar um aviso.

Exemplo:

```text
Esta análise pode estar incompleta.
```

Casos possíveis:

- ponteiro de função;
- macro complexa;
- pré-processamento condicional;
- declaração incomum.

O objetivo é evitar comunicar certeza quando o analisador não possui evidência suficiente.

---

## Descrições de função

Não gerar descrição sem fonte.

Uma possível origem legítima é um comentário diretamente associado à função.

Exemplo:

```c
// Calcula o menor caminho entre dois pontos.
int caminho(...) {
```

pode alimentar uma descrição.

Sem comentário ou outra fonte explícita, não inventar texto sobre o objetivo da função.

---

# Pequenas melhorias de UX

Depois da confiança básica da análise, algumas melhorias possuem alto retorno.

---

## Exemplos prontos

Adicionar programas C de demonstração.

Possíveis exemplos:

- cadeia;
- ramificação;
- recursão;
- ciclo;
- função isolada;
- programa maior.

Isso ajuda:

- novos usuários;
- apresentações;
- testes manuais;
- portfólio.

---

## Justificativa da região

Permitir que o usuário descubra por que uma classificação foi usada.

Exemplo:

```text
Ala Parser
prefixo comum: parse_
```

```text
Salão Central
4 callers alcançáveis
```

```text
Criptas Isoladas
sem caminho desde a entrada
```

---

## Destaque da origem das métricas

No inspector, permitir relacionar métricas a trechos concretos do código.

Exemplo:

```text
clicar em "3 if"
→ destacar os 3 if no trecho
```

Isso pode melhorar bastante o valor didático.

---

# Acessibilidade

A acessibilidade deve continuar evoluindo junto da experiência.

---

## Manter o DOM como fonte textual

Informações críticas não devem existir apenas como pixels no Canvas.

O inspector continuará sendo importante para:

- texto;
- foco;
- navegação por teclado;
- leitores de tela.

---

## Modo lista futuro

Uma possível visualização alternativa pode listar a estrutura como:

```text
main
├── parser
│   ├── parse_expression
│   └── parse_primary
└── util
```

Isso ainda não está implementado.

---

## Contraste

Revisar:

- nomes das salas;
- placas;
- marcadores;
- textos pequenos;
- foco.

A informação não deve depender apenas de cor.

---

## Toque e telas menores

Controles de toque e layout responsivo completo ainda ficam para um ciclo posterior.

---

# Segurança antes da publicação

Antes de tornar o projeto público na web, haverá uma etapa específica de hardening.

Essa etapa não deve ser misturada com melhorias puramente visuais.

---

## Objetivo

Garantir que um código C hostil ou estranho:

```text
não execute código
não vire HTML
não cause comportamento inesperado
não trave facilmente a aplicação
não seja enviado para terceiros sem intenção
```

---

# Testes de entradas hostis

Adicionar casos específicos para:

```text
__proto__
constructor
toString
hasOwnProperty
```

e também:

- comentários com HTML;
- strings com `<script>`;
- nomes estranhos;
- Unicode;
- caracteres invisíveis;
- NUL;
- linhas gigantes;
- aninhamento profundo;
- muitas funções;
- grafos densos;
- ciclos grandes.

---

# Prototype pollution

Estruturas indexadas por nomes de função devem continuar usando mecanismos seguros como:

```text
Map
Set
```

quando aplicável.

Nomes fornecidos pelo usuário não podem alterar comportamento interno apenas por coincidirem com propriedades especiais de JavaScript.

---

# DOM

Continuar tratando o conteúdo do código como texto.

Auditar usos de:

```text
innerHTML
outerHTML
insertAdjacentHTML
document.write
eval
new Function
```

Conteúdo do usuário não deve chegar a sinks perigosos.

---

# Limites de processamento

O limite de 512 KiB não resolve todos os casos de consumo excessivo.

Avaliar também limites para:

- linhas;
- tamanho de uma linha;
- funções;
- arestas;
- profundidade;
- quantidade de trabalho.

Os limites devem ser baseados em testes e medições.

---

# Web Worker

Considerar mover a análise para um Worker caso os testes mostrem risco real de congelamento da interface.

Benefício esperado:

```text
análise pesada
→ Worker

interface
→ continua responsiva
```

Também permitiria encerrar uma análise excessiva.

Ainda não é requisito implementado.

---

# Fuzzing simples

Uma evolução útil da suíte pode gerar entradas aleatórias determinísticas.

Objetivo:

```text
muitas entradas
+
mesma semente
+
resultado reproduzível
```

O teste pode verificar principalmente:

- ausência de travamento;
- ausência de exceção não tratada;
- tempo razoável.

---

# Privacidade da versão pública

A versão publicada deve preservar a proposta de processamento local.

O comportamento desejado é:

```text
código do usuário
→ navegador
→ análise local
```

e não:

```text
código do usuário
→ servidor externo
```

Qualquer mudança dessa arquitetura precisa ser explícita.

---

## Recursos externos

Evitar sem necessidade:

- analytics;
- gravação de sessão;
- error tracking;
- scripts externos;
- fontes externas;
- CDN de bibliotecas.

Cada recurso externo deve ser analisado em relação à privacidade e à CSP.

---

# CSP e headers

Antes do deploy público, estudar e testar uma Content Security Policy compatível com o projeto.

Também avaliar:

```text
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Cross-Origin-Opener-Policy
HSTS
```

Não copiar configurações sem verificar impacto na aplicação.

---

# Rede

No deploy de teste, verificar a aba:

```text
Network
```

durante:

- abertura da página;
- importação de `.c`;
- geração da dungeon;
- exploração.

O conteúdo do código não deve aparecer em requisições inesperadas.

---

# Console

Também verificar:

```text
Console
```

para:

- violações de CSP;
- erros;
- warnings relevantes;
- comportamentos inesperados.

---

# CI

GitHub Actions já executa:

```bash
npm test
```

em push e pull request.

Antes de automatizar deploy, a publicação deve depender de uma suíte verde.

---

# Hospedagem

A plataforma final ainda não foi escolhida.

Opções serão avaliadas perto da publicação considerando:

- site estático;
- HTTPS;
- headers;
- CSP;
- integração Git;
- plano gratuito;
- domínio;
- privacidade;
- possibilidade de migração.

Não existe decisão definitiva por Cloudflare Pages, GitHub Pages, Netlify ou Vercel neste momento.

---

# Deploy de teste

Antes da publicação principal:

```text
build/arquivos finais
      ↓
deploy de teste
      ↓
Network
      ↓
Console
      ↓
fluxo completo
      ↓
testes em navegadores
```

Validar pelo menos:

- abrir `.c`;
- gerar;
- mover;
- buscar;
- clicar;
- navegar;
- zoom;
- Encaixar;
- modos visuais;
- regiões quando estiverem implementadas.

---

# Primeira versão pública

A primeira versão não precisa ter todas as ideias futuras.

Ela precisa ser:

- funcional;
- compreensível;
- estável;
- honesta sobre limitações;
- segura para seu escopo;
- utilizável fora do localhost.

---

# Depois da publicação

A partir daí, funcionalidades maiores podem ser guiadas por uso real.

---

## Comparação antes e depois

Permitir comparar duas versões do código.

Mostrar diferenças concretas em vez de produzir uma nota única.

Exemplos:

- função adicionada;
- função removida;
- complexidade alterada;
- chamadas alteradas;
- profundidade alterada;
- região alterada.

---

## Exportação

Possíveis formatos:

```text
PNG
JSON
Mermaid
```

A exportação pode ajudar em:

- trabalhos;
- documentação;
- compartilhamento;
- apresentação.

Deve continuar explícita e preferencialmente local.

---

## Missões de leitura

Desafios derivados do próprio grafo.

Exemplos:

```text
Qual função está mais profunda?
```

```text
Encontre uma função em ciclo.
```

```text
Qual função não é alcançada pela entrada?
```

A resposta precisa continuar vindo dos dados reais.

---

## Modo lista

Criar uma representação textual alternativa ao mapa.

Pode melhorar:

- acessibilidade;
- navegação por teclado;
- leitura rápida;
- uso sem Canvas.

---

## Outras linguagens

A arquitetura poderá receber outros analisadores no futuro.

Exemplo conceitual:

```text
Analisador C ───────┐
Analisador Java ────┼→ modelo estrutural → dungeon
Analisador Go ──────┘
```

Isso não é prioridade da primeira versão.

---

## Parser C mais completo

Avaliar soluções como Tree-sitter somente se o analisador atual se tornar uma limitação real.

Uma mudança desse tipo deve considerar:

- dependências;
- tamanho;
- segurança;
- CSP;
- manutenção;
- benefício real.

---

# Casos de referência em C

Manter programas pequenos que representem comportamentos importantes.

---

## Cadeia

```c
void c(void) {}

void b(void) {
    c();
}

int main(void) {
    b();
    return 0;
}
```

Esperado:

```text
main → b → c
```

---

## Ramificação

```c
void esquerda(void) {}
void direita(void) {}

int main(void) {
    esquerda();
    direita();
    return 0;
}
```

Esperado:

```text
       ┌→ esquerda
main ──┤
       └→ direita
```

---

## Múltiplos callers

```c
void comum(void) {}

void a(void) {
    comum();
}

void b(void) {
    comum();
}

int main(void) {
    a();
    b();
    return 0;
}
```

---

## Função isolada

```c
void isolada(void) {}

int main(void) {
    return 0;
}
```

Esperado:

```text
main
```

e:

```text
isolada → inalcançável
```

---

## Recursão

```c
int fatorial(int n) {
    if (n <= 1) return 1;
    return n * fatorial(n - 1);
}

int main(void) {
    return fatorial(3);
}
```

---

## Ciclo

```c
void b(void);

void a(void) {
    b();
}

void b(void) {
    a();
}

int main(void) {
    a();
    return 0;
}
```

Esperado:

```text
main → a ↔ b
```

com:

```text
a e b em ciclo
```

---

## Hub

```c
void comum(void) {}

void a(void) {
    comum();
}

void b(void) {
    comum();
}

void c(void) {
    comum();
}

int main(void) {
    a();
    b();
    c();
    return 0;
}
```

`comum` pode ser classificada como hub porque possui três callers alcançáveis distintos.

---

## Prefixo de ala

```c
void parse_primary(void) {}
void parse_expression(void) {}
void parse_unary(void) {}

int main(void) {
    parse_primary();
    parse_expression();
    parse_unary();
    return 0;
}
```

Esperado:

```text
Ala Parser
```

---

## Prefixo operacional

```c
void get_usuario(void) {}
void get_config(void) {}
void get_tempo(void) {}

int main(void) {
    get_usuario();
    get_config();
    get_tempo();
    return 0;
}
```

Não deve gerar:

```text
Ala Get
```

---

# Validação manual

Mudanças visuais importantes devem continuar sendo testadas no navegador.

Principalmente:

- layout;
- regiões;
- corredores;
- câmera;
- zoom;
- movimento;
- foco;
- clique;
- navegação;
- modos.

Testes automatizados não substituem completamente a inspeção visual de uma interface em Canvas.

---

# Performance

A regra continua sendo:

```text
medir antes de otimizar
```

Possíveis otimizações futuras:

- culling;
- renderização apenas quando necessário;
- cache de partes estáticas;
- Worker;
- redução de detalhes em mapas grandes.

Nenhuma deve ser adicionada sem necessidade demonstrada.

---

# Ordem atual do desenvolvimento

```text
1. Base estrutural
   CONCLUÍDA

2. Regiões semânticas como dados
   CONCLUÍDA

3. Representação visual das regiões
   PRÓXIMA

4. Corredores 2.0

5. Confiança e explicação da análise

6. Melhorias pequenas de UX e acessibilidade

7. Hardening de segurança

8. Deploy de teste

9. Primeira versão pública

10. Feedback de usuários

11. Funcionalidades maiores pós-publicação
```

---

# Regra de mudança de prioridade

Esse plano não é imutável.

A ordem pode mudar quando:

- um bug sério aparecer;
- um teste revelar uma regressão;
- uma medição mostrar um gargalo;
- usuários mostrarem uma dificuldade importante;
- uma decisão de segurança exigir mudança anterior.

O plano existe para orientar o desenvolvimento, não para impedir correções necessárias.

---

# Critério para a v1 pública

A primeira versão pública estará pronta quando, no mínimo:

- o fluxo principal estiver estável;
- a dungeon puder ser usada fora do localhost;
- regiões estiverem compreensíveis;
- corredores não comprometerem a leitura;
- limitações estiverem documentadas;
- análise continuar local;
- entradas hostis principais estiverem cobertas;
- segurança de DOM estiver revisada;
- política de rede estiver revisada;
- testes estiverem verdes;
- deploy de teste tiver sido validado manualmente.

Não é necessário esperar pelas funcionalidades pós-publicação.

A v1 deve ser pequena, confiável e explicável.