# Caminho de evolução

A direção recomendada é transformar o Dungeon do Código em uma ferramenta para aprender a ler e melhorar programas. Cada nova mecânica deve ajudar o usuário a responder uma pergunta sobre o código: onde começar, quais funções exigem atenção, quem chama quem e o que mudou depois de uma refatoração.

## Entrega atual

As quatro frentes foram implementadas na ordem combinada e em commits separados: personagem, salas, cenário e painel. Um commit adicional registra os testes de integração e a documentação. Não foi necessário adotar um framework ou motor de jogos. A revisão seguinte corrigiu os cinco achados do parser e da entrada vazia, com dois commits de correção e um de documentação; veja `CORRECOES.md`.

O ponto de extensão visual é `criaturas.js`: uma definição abastece tanto a sala quanto o retrato. A física do personagem fica em `personagem.js`; o jogo compõe os desenhos e emite mudanças de sala, sem atualizar o painel diretamente. Os efeitos transitórios têm duração e quantidade limitadas.

## Próximo ciclo: confiança no mapa

Antes de aumentar a quantidade de mecânicas, recomendo uma entrega pequena para cada item abaixo.

| Ordem | Entrega proposta | Motivo | Critério para concluir |
| --- | --- | --- | --- |
| Concluído | Scanner que distingue código, comentários, strings e caracteres | Evita estruturas fictícias e corpos truncados nos casos revisados | Testes de aspas escapadas, comentários, literais e entradas incompletas; trecho original preservado e aviso com a linha |
| 2 | Centralizar as faixas e explicar as métricas | Cor, tamanho, criatura e barra precisam continuar coerentes | Uma definição das faixas serve a todos os módulos; exemplos verificáveis acompanham o índice |
| 3 | Extrair chamadas diretas entre funções conhecidas | Os corredores podem explicar a estrutura real do programa | `main → a → b` produz essas duas ligações; função isolada e recursão têm representação clara |
| 4 | Distribuição sem sobreposição e câmera com zoom | O mapa circular fixo perde legibilidade com mais funções | Exemplos com 1, 5, 12 e 30 funções ficam acessíveis; nomes completos podem ser consultados |

O scanner pequeno desta revisão atende ao primeiro passo do escopo atual. Suporte amplo a macros, ponteiros de função e construções avançadas deve ser tratado como outro ciclo, com avaliação de um parser completo. Não prometer análise geral de C antes de definir e testar o subconjunto suportado.

### Casos corrigidos na revisão

```c
int main() { printf("}"); return 0; }
```

Antes, a extração terminava na chave dentro da string. Agora, retorna a função completa.

```c
int main() { printf("if for while"); return 0; }
```

Antes, eram contadas três estruturas e o índice chegava a 6. Agora, são contadas zero estruturas e o índice é 0 para esse exemplo.

### Problemas ainda pendentes

Ao gerar 12 funções com complexidade 8, a distribuição atual apresentou 11 pares de salas sobrepostas. Além disso, `ehChamadaPelaPrincipal` usa uma busca textual simples, e o desenho atual dos corredores não utiliza essa informação.

A sobreposição e a representação das chamadas continuam documentadas para um ciclo dedicado à geometria e ao grafo de chamadas.

## Depois: experiência de aprendizagem

| Entrega | Como ajuda | Primeira versão pequena |
| --- | --- | --- |
| Código completo com destaque das estruturas | Explica por que a sala tem aquele perigo | Selecionar uma métrica destaca as linhas que contribuíram para ela |
| Missões de leitura | Dá propósito à exploração | Localizar a função com mais decisões e justificar a escolha; conferir a resposta pelas métricas |
| Comparação antes/depois | Mostra o efeito de uma refatoração | Colar duas versões e comparar funções pelo nome, explicitando ambiguidades de renomeação |
| Importar um arquivo `.c` e salvar sessão | Facilita repetir exercícios | Leitura local do arquivo e exportação de um estado pequeno, versionado |
| Controles de toque e layout adaptável | Permite explorar em telas menores | Botões direcionais, painel recolhível e mapa que cabe na tela |

A refatoração pode virar a principal mecânica: o usuário melhora o código, gera o mapa novamente e vê quais salas e criaturas mudaram. Isso conecta a parte lúdica ao aprendizado. Para evitar incentivar apenas a redução do número de linhas, as missões devem considerar clareza e preservação do comportamento.

## Validar antes de ampliar

Testar uma versão com três a cinco colegas usando um programa curto. Pedir que encontrem a função mais complexa, expliquem os motivos e identifiquem uma chamada. Observar onde se perdem e se o mapa realmente ajuda a justificar as respostas. Esse teste serve para orientar melhorias; não demonstra eficácia pedagógica por si só.

Manter HTML, CSS e módulos JavaScript enquanto o projeto continuar cabendo nessa arquitetura. Considerar um motor de jogos se combate, colisões complexas, vários mapas e gerenciamento de muitos recursos passarem a fazer parte do objetivo. Contas, ranking e servidor ficam para quando houver um uso concreto que justifique esses custos.

## Disciplina de entrega

Cada mudança deve oferecer uma experiência utilizável sozinha, com a documentação correspondente. Correções da análise precisam de exemplos C que reproduzam o problema. Mudanças na exploração precisam preservar velocidade, liberação de teclas, cancelamento dos efeitos e a preferência de reduzir movimento. Conferir visualmente no navegador antes de integrar mudanças de layout.
