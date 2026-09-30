# Correções da revisão de bugs

> Este documento registra uma revisão anterior do projeto.
>
> Os comportamentos, números de testes e limitações descritos aqui correspondem ao estado do Dungeon do Código naquele momento.
>
> Para saber como o projeto funciona atualmente, consulte:
>
> - `docs/ESTADO_ATUAL.md`
> - `docs/ARQUITETURA.md`
> - `docs/PLANO_TECNICO.md`

---

## Contexto da revisão

Esta revisão aconteceu quando o projeto ainda estava consolidando a análise básica de código C e a primeira versão da dungeon.

Foram reproduzidos cinco comportamentos problemáticos encontrados na versão anterior.

O objetivo daquela etapa foi corrigir a análise sem alterar as regras visuais de perigo nem as principais etapas já existentes da interface.

---

## Problemas corrigidos

| Achado | Comportamento corrigido | Cobertura adicionada naquela revisão |
| --- | --- | --- |
| Chaves em strings truncavam funções | Strings e caracteres passaram a ser mascarados durante a contagem de chaves, enquanto o trecho original continuou preservado | Strings com `{` e `}`, aspas escapadas e caracteres como `'}'` |
| Palavras de controle em strings inflavam a complexidade | Apenas palavras presentes no código estrutural passaram a entrar na contagem | Strings contendo palavras reservadas, comentários e estruturas reais misturados |
| `//` e `/* */` dentro de strings eram interpretados como comentários | O reconhecimento de comentários passou a ocorrer apenas fora de literais | Mensagens, URLs e marcadores de comentário dentro de strings |
| Corpos incompletos eram aceitos | A análise passou a interromper com `ErroAnaliseC`, informando a linha e mantendo o usuário no editor | Chaves, strings e comentários incompletos, além da correção e nova geração |
| `construirMasmorra([])` criava uma sala inválida | A construção de uma dungeon vazia passou a retornar uma estrutura sem salas fictícias | Lista vazia e preservação da entrada normal com `main` ou primeira função |

---

## Implementação daquela revisão

A principal mudança foi a introdução de uma etapa léxica dedicada.

`lexicoC.js` passou a percorrer o código distinguindo:

- código;
- comentários;
- strings;
- caracteres.

O módulo produz versões mascaradas com o mesmo comprimento e as mesmas quebras de linha do texto original.

Isso permite analisar a estrutura sem confundir conteúdo textual com código real.

Por exemplo:

```c
printf("if for while");
```

não deve ser interpretado como três estruturas de controle.

Da mesma forma:

```c
printf("}");
```

não deve encerrar antecipadamente o corpo da função.

O texto original continua preservado para exibição no inspector.

---

## Exemplos que motivaram as correções

### Chave dentro de string

```c
int main() {
    printf("}");
    return 0;
}
```

Antes daquela revisão, a chave dentro da string podia ser interpretada como o final da função.

Depois da correção, a função passou a ser extraída completamente.

### Palavras reservadas dentro de string

```c
int main() {
    printf("if for while");
    return 0;
}
```

Antes, essas palavras podiam aumentar a métrica estrutural mesmo não representando código.

Depois da correção, elas deixaram de ser contabilizadas como estruturas.

---

## Tratamento de erro

A geração passou a tratar explicitamente erros conhecidos de análise.

Quando o código está estruturalmente incompleto:

- a dungeon não é iniciada;
- o usuário continua no editor;
- o erro é apresentado;
- quando possível, a linha relacionada é informada.

Outros erros internos de programação não são escondidos por esse tratamento.

A intenção é diferenciar:

```text
entrada C inválida
```

de:

```text
defeito interno do programa
```

---

## Validação histórica

Naquela revisão, a suíte chegou a:

```text
32 testes passando
```

Esse número é mantido aqui apenas como registro histórico.

A suíte atual cresceu bastante desde então e deve ser verificada diretamente com:

```bash
npm test
```

na pasta que contém o `package.json`.

---

## Erro de execução registrado na época

Durante aquela revisão apareceram mensagens como:

```text
npm ERR! enoent
```

e:

```text
ERR_MODULE_NOT_FOUND
```

O problema não estava no código do projeto.

Os comandos haviam sido executados em uma pasta acima da raiz correta do repositório.

A regra continua válida:

> Execute os comandos na pasta que contém o `package.json`.

Por exemplo:

```bash
npm test
```

---

## Limitações existentes naquela revisão

Naquele momento, o analisador ainda trabalhava com um subconjunto simples de C.

Ele não:

- compilava código;
- executava código;
- expandia macros;
- validava toda a gramática da linguagem;
- compreendia todas as formas de declarações avançadas.

A extração de assinaturas ainda era simplificada, e construções mais avançadas permaneciam candidatas a um parser dedicado no futuro.

Também estavam pendentes, naquela época:

- um grafo de chamadas mais completo;
- layout sem sobreposição;
- câmera para mundos maiores;
- corredores baseados nas relações reais;
- navegação entre funções.

Essas limitações pertencem ao contexto daquela revisão e várias delas já foram tratadas em ciclos posteriores.

Para o estado atual, consulte `docs/ESTADO_ATUAL.md`.

---

## Importância desta revisão

Essa etapa definiu uma regra que continuou importante no projeto:

> O Dungeon não deve interpretar texto como código apenas porque ele parece código.

Strings, comentários e caracteres precisam continuar separados da análise estrutural.

A partir dessa base, o projeto pôde evoluir com mais segurança para:

- grafo de chamadas;
- ciclos e recursão;
- layout determinístico;
- navegação;
- busca;
- foco contextual;
- zoom;
- regiões semânticas;
- outras formas de leitura estrutural.

---

## Regra para futuras correções

Correções relacionadas ao analisador devem sempre incluir um exemplo pequeno em C que reproduza o problema.

O objetivo é transformar cada bug corrigido em um caso de regressão da suíte.

Exemplo de fluxo:

```text
bug encontrado
   ↓
programa C mínimo que reproduz
   ↓
teste falhando
   ↓
correção
   ↓
teste passando
```

Assim, problemas antigos não devem reaparecer silenciosamente em mudanças futuras.
