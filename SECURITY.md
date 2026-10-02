# Segurança

A Dungeon do Código é um frontend estático que lê código C como texto e
representa funções e chamadas. Não é um compilador, executor ou detector de
vulnerabilidades do programa enviado. O índice de complexidade e as criaturas
não indicam segurança do código C.

## Proteções atuais

- Importação e texto colado: até 512 KiB, medidos em bytes UTF-8.
- Uma importação por vez, com tamanho verificado antes da leitura e conteúdo
  validado novamente depois dela. A extensão `.c` é uma regra de uso, não uma
  garantia de que o conteúdo seja confiável.
- Até 64 funções, 256 relações de chamada distintas por par origem/destino e
  128 caracteres por nome. Definições repetidas são rejeitadas.
- Análise, layout, corredores, colisão e cenografia preparados em um Worker
  dedicado, encerrado ao concluir, cancelar, editar a entrada ou exceder 8 s.
  O prazo inclui o carregamento dos módulos e não é uma promessa de velocidade.
- Mapas limitados a 8.192 unidades por dimensão, 6.000.000 unidades quadradas
  e 2.048 segmentos navegáveis, para limitar também o desenho e a navegação.
- Conteúdo do usuário exibido com `textContent` e `value`; sem `innerHTML`,
  `eval`, compilação ou execução de C.
- Sem dependências npm de produção. As fontes são locais, com suas licenças.
- CSP no HTML e configuração de cabeçalhos para hospedagens compatíveis.
  Não há autorização para scripts inline, objetos ou conexões de dados.
- CI com acesso de leitura ao repositório, ações fixadas por commit e prazo
  de execução. Alterações na `main` passam por PR e pelo check `testes`.

Os limites são conservadores para esta versão. Eles podem ser ajustados depois
de medições em computadores e navegadores comuns. O Worker mantém a interface
disponível durante a preparação; ele não elimina todo consumo de CPU/memória.
Sem suporte a Worker de módulo, a aplicação avisa e não faz análise síncrona.

## Privacidade

O aplicativo não envia o código, não o salva em armazenamento persistente e
não executa o programa. A seleção de arquivo lê somente o arquivo escolhido;
arrastar um arquivo usa o mesmo fluxo. Editor e mapa permanecem em memória
enquanto a página está aberta. Ao voltar, o editor conserva seu conteúdo.

HTML, CSS, módulos JavaScript e fontes são baixados da própria hospedagem.
O servidor de hospedagem pode manter registros de acesso, como IP e horário;
isso deve ser considerado na publicação. As proteções do aplicativo não
controlam extensões do navegador, recursos do próprio navegador ou o sistema
operacional. Não há analytics, telemetria, cookies próprios ou backend próprio
no código desta versão.

## Publicação ainda precisa ser verificada

`_headers` só funciona em serviços que reconhecem seu formato. Em outros,
copiar suas diretivas para a configuração do servidor. A CSP em `<meta>`
continua sendo uma camada básica, mas não aplica `frame-ancestors`, nem os
demais cabeçalhos HTTP. Cabeçalhos devem valer também para o módulo do Worker.

Antes de lançar:

1. Servir por HTTPS, com MIME correto para módulos, CSS e fontes. Usar servidor
   HTTP local para desenvolvimento; abrir `index.html` por `file://` não basta.
2. Conferir os cabeçalhos da resposta real, inclusive CSP, `nosniff`, política
   de referenciador e bloqueio de enquadramento. Se houver domínio próprio,
   avaliar HSTS depois de confirmar HTTPS para todo o domínio envolvido.
3. Testar a versão hospedada em Firefox e Chromium, incluindo geração,
   cancelamento, importação, edição durante preparação e navegação no mapa.
4. Confirmar que a aba de rede só carrega os recursos esperados da hospedagem
   e que nenhum trecho do código aparece nas requisições.
5. Conferir que arquivos de desenvolvimento, credenciais ou arquivos privados
   não foram incluídos na pasta publicada; manter somente os recursos do site.

Testes automatizados e revisão de código são evidências de controles específicos,
não uma certificação ou garantia de segurança absoluta. A configuração real da
hospedagem e a inspeção em navegadores continuam necessárias.

## Relatar um problema

Use o recurso de relato privado de vulnerabilidade do GitHub quando ele estiver
disponível neste repositório. Caso contrário, informe em uma issue que precisa
de um canal privado, sem publicar credenciais, código confidencial ou detalhes
de exploração antes de combinar o tratamento com o mantenedor.

## Referências técnicas

- [OWASP — prevenção de XSS no DOM](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [OWASP — Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [MDN — encerramento de Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate)
- [MDN — worker-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src)
