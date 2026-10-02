# Publicação

Demonstração pública: **[dungeon-do-codigo.pages.dev](https://dungeon-do-codigo.pages.dev/)**.

O site é hospedado no Cloudflare Pages, com integração ao repositório
`murilo-mg/dungeon-do-codigo` e produção a partir da branch `main`.

## Configuração usada

| Campo | Valor |
| --- | --- |
| Nome do projeto | `dungeon-do-codigo` |
| Branch de produção | `main` |
| Framework | `None` |
| Diretório raiz | Raiz do repositório |
| Diretório de saída | `dist` |
| Variáveis adicionais | Nenhuma |

Comando de build configurado no painel:

```bash
mkdir -p dist && cp index.html _headers dist/ && cp -R css js assets dist/
```

A saída contém HTML, CSS, módulos, fontes e suas licenças. Documentação, testes,
metadados do Git e `package.json` ficam fora da saída. A pasta `dist/` é gerada
na hospedagem e está ignorada pelo Git. `_headers` fica na raiz da saída e é
interpretado pelo Cloudflare Pages para configurar as respostas dos recursos.

Não habilitar Web Analytics sem revisar a política de privacidade e a CSP:
a versão atual não integra analytics e bloqueia conexões de dados.

## Verificação da primeira publicação

Verificação em 1º de outubro de 2026, horário de Manaus
(2 de outubro em UTC), sobre o código integrado em `e5253c2`.

| Verificação | Resultado observado |
| --- | --- |
| Página inicial | HTTP 200 por HTTPS |
| CSP da resposta | Recursos locais; `connect-src 'none'`; `frame-ancestors 'none'` |
| Cabeçalhos adicionais | `nosniff`, `DENY`, `no-referrer` e bloqueio de câmera, microfone e geolocalização |
| Worker | HTTP 200, MIME JavaScript e os mesmos cabeçalhos de segurança |
| HTML e módulo do Worker | Conteúdo correspondente aos arquivos revisados |
| Fluxos no Chromium 154 | Geração, Encaixar, Estrutura, busca, retorno e importação `.c` aprovados |
| Entradas rejeitadas | Texto acima de 512 KiB UTF-8 e mais de 64 funções |
| Conteúdo com aparência de HTML | Exibido como texto, sem criar elemento ou executar evento |
| Recursos carregados nos fluxos normais | 37 URLs distintas, todas na origem do site |
| Erros nos fluxos normais | Nenhum erro de página, console ou violação de CSP observado |
| Interface estreita | Captura e fluxo de retorno verificados em largura de 390 px; sem controles de movimento por toque |
| Suíte da `main` | 367 testes aprovados; CI do GitHub aprovado |
| Fluxos no Firefox | Geração, importação, controles, duplo clique, cancelamento e retorno aprovados manualmente em 2 de outubro de 2026 |

A conexão HTTPS também foi conferida por um cliente HTTP com validação de
certificado. O navegador automatizado usa o proxy do ambiente de revisão;
a confiança no certificado desse proxy é uma condição do ambiente de teste.

A revisão local anterior também verificou cancelamento, edição durante a
preparação, prazo de 8 segundos, nova tentativa e bloqueios deliberados da CSP,
inclusive com o aplicativo servido em subdiretório.

Esses resultados registram verificações específicas, não uma auditoria exaustiva
ou garantia de segurança absoluta. A conferência manual da versão hospedada em
Firefox foi concluída em 2 de outubro de 2026, cobrindo geração, importação,
controles, duplo clique, cancelamento e retorno.

## Capturas

As capturas foram feitas no site publicado, com viewport de 1440 × 1000 e o
exemplo inicial de estoque. A preferência de redução de movimento foi ativada
para registrar o painel com o texto completo.

- [Tela de entrada](imagens/entrada.png).
- [Exploração e inspeção](imagens/exploracao.png).

São recursos da documentação; não integram o pacote servido ao visitante.

## Manutenção

Depois de integrar mudanças por PR, acompanhe o check `testes` e o deploy de
produção no Cloudflare. Verifique os fluxos afetados na URL pública. Se o visual
mudar, atualize as capturas; se os controles ou limites mudarem, atualize README,
`ESTADO_ATUAL.md` e `SECURITY.md`.

Para conferir as respostas HTTP:

```bash
curl -I https://dungeon-do-codigo.pages.dev/
curl -I https://dungeon-do-codigo.pages.dev/js/dungeonWorker.js
```

A tag `v0.1.0` permanece como baseline histórica. A versão pública consolidada
está marcada como `v0.2.0`, com tag e release apontando para o commit `5fded90`.
A atualização documental do fechamento é posterior à tag; ela não altera essa
referência nem exige recriar a release.
