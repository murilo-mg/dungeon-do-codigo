import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarAmbiente, encontrar } from './ambiente.js';
import { atualizarEstadoControles, atualizarPainelDeSala, exibirTelaDeConfiguracao, descreverSala, exibirTelaDeJogo, inicializarBuscaFuncoes, configurarBuscaFuncoes, limparBuscaFuncoes, configurarControlesCamera, atualizarZoomCamera, configurarModosVisuais, atualizarModoVisual, configurarImportacaoCodigo, mostrarArquivoImportado, mostrarErroEntrada } from '../js/interface.js';
import { criarGrafo, obterEstruturaDaFuncao } from '../js/grafoC.js';
import { analisarFuncoes } from '../js/analisadorC.js';

const sala = { nome: 'investigar', linhas: 12, estruturasControle: 4, complexidade: 11,
  textoCompleto: 'void investigar() { printf("<script> & texto"); }' };

test('entrada de arquivo tem botão acessível e drop discreto perto do textarea', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<button id="botao-abrir-c"[^>]*type="button"><span class="icone-pasta" aria-hidden="true"><\/span>Abrir \.c<\/button>/);
  assert.match(html, /<input id="arquivo-c" type="file"[^>]*accept="\.c,text\/plain,text\/x-c"[^>]*hidden>/);
  assert.doesNotMatch(html, /id="arquivo-c"[^>]*multiple/);
  assert.match(html, /id="arquivo-atual"[^>]*role="status"/);
  const css = readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8');
  assert.match(css, /#entrada-codigo\[data-arrastando="true"\]/);
});

test('seletor, drop e edição comunicam ações sem duplicar listeners', () => {
  const ambiente = criarAmbiente();
  const editor = ambiente.elementos.get('entrada-codigo');
  const campo = ambiente.elementos.get('arquivo-c');
  const escolhidos = [];
  let edicoes = 0;
  configurarImportacaoCodigo(arquivos => escolhidos.push(arquivos), () => { edicoes++; });
  ambiente.elementos.get('botao-abrir-c').emitir('click');
  assert.equal(campo.cliques, 1);
  campo.files = [{ name: 'primeiro.c' }];
  campo.emitir('change');
  assert.deepEqual(escolhidos[0].map(arquivo => arquivo.name), ['primeiro.c']);
  assert.equal(campo.value, '');
  editor.emitir('input');
  assert.equal(edicoes, 1);
  assert.equal(editor.emitir('dragover', {
    dataTransfer: { types: ['text/plain'] },
  }).prevenido, undefined);
  const transferencia = { types: ['Files'], files: [{ name: 'segundo.c' }] };
  assert.equal(editor.emitir('dragenter', { dataTransfer: transferencia }).prevenido, true);
  assert.equal(editor.atributos['data-arrastando'], 'true');
  assert.equal(editor.emitir('dragover', { dataTransfer: transferencia }).prevenido, true);
  editor.emitir('dragleave');
  assert.equal(editor.atributos['data-arrastando'], 'false');
  editor.emitir('dragover', { dataTransfer: transferencia });
  assert.equal(editor.emitir('drop', { dataTransfer: transferencia }).prevenido, true);
  assert.equal(editor.atributos['data-arrastando'], 'false');
  assert.deepEqual(escolhidos[1].map(arquivo => arquivo.name), ['segundo.c']);
  editor.emitir('dragover', { dataTransfer: transferencia });
  assert.equal(ambiente.documento.emitir('dragover', {
    target: {}, dataTransfer: transferencia,
  }).prevenido, true);
  assert.equal(editor.atributos['data-arrastando'], 'false');
  editor.emitir('dragover', { dataTransfer: transferencia });
  assert.equal(ambiente.documento.emitir('drop', {
    target: {}, dataTransfer: transferencia,
  }).prevenido, true);
  assert.equal(ambiente.documento.emitir('drop', {
    target: {}, dataTransfer: { files: [{ name: 'externo.c' }] },
  }).prevenido, true);
  assert.equal(editor.atributos['data-arrastando'], 'false');
  assert.equal(escolhidos.length, 2);
  for (const tipo of ['input', 'drop', 'dragover', 'dragleave']) {
    assert.equal(editor.ouvintes.get(tipo).size, 1);
  }
});

test('nome e conteúdo com aparência de HTML são inseridos como texto', () => {
  const ambiente = criarAmbiente();
  mostrarErroEntrada('erro anterior');
  const conteudo = '<script>alert(1)</script>\nint main() { return 0; }';
  mostrarArquivoImportado(conteudo, '<img src=x onerror=alert(1)>.c');
  assert.equal(ambiente.elementos.get('entrada-codigo').value, conteudo);
  assert.equal(ambiente.elementos.get('entrada-codigo').focado, true);
  const nome = ambiente.elementos.get('arquivo-atual');
  assert.equal(nome.textContent, 'Arquivo: <img src=x onerror=alert(1)>.c');
  assert.equal(nome.filhos.length, 0);
  assert.equal(ambiente.elementos.get('mensagem-erro').textContent, '');
});

test('barra de câmera conecta os quatro botões e atualiza percentual acessível', () => {
  const ambiente = criarAmbiente();
  const acionados = [];
  configurarControlesCamera({
    aoAfastar: () => { acionados.push('afastar'); return 0.75; },
    aoRestaurar: () => { acionados.push('restaurar'); return 1; },
    aoAproximar: () => { acionados.push('aproximar'); return 1.25; },
    aoEncaixar: () => { acionados.push('encaixar'); return 0.2; },
  });
  for (const id of ['camera-afastar', 'camera-aproximar', 'camera-encaixar', 'camera-zoom']) {
    ambiente.elementos.get(id).emitir('click');
  }
  assert.deepEqual(acionados, ['afastar', 'aproximar', 'encaixar', 'restaurar']);
  const indicador = ambiente.elementos.get('camera-zoom');
  assert.equal(indicador.textContent, '100%');
  atualizarZoomCamera(0.2333);
  assert.equal(indicador.textContent, '23%');
  assert.equal(indicador.atributos['aria-label'], 'Zoom atual: 23%. Restaurar para 100%');
  assert.equal(indicador.filhos.length, 0);
  for (const id of ['camera-afastar', 'camera-aproximar', 'camera-encaixar', 'camera-zoom']) {
    assert.equal(ambiente.elementos.get(id).ouvintes.get('click').size, 1);
  }
});

test('controles de câmera no HTML são botões nativos acessíveis', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['camera-afastar', 'camera-aproximar', 'camera-encaixar', 'camera-zoom']) {
    assert.match(html, new RegExp(`<button id="${id}" type="button"[^>]*>[^<]+</button>`));
  }
  assert.match(html, /role="group" aria-label="Controles da câmera"/);
});

test('botões nativos de modo expõem seleção e chamam o jogo sem duplicar listeners', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /role="group" aria-label="Modo de leitura do mapa"/);
  assert.match(html, /<button id="modo-complexidade" type="button" aria-pressed="true">Complexidade<\/button>/);
  assert.match(html, /<button id="modo-estrutura" type="button" aria-pressed="false">Estrutura<\/button>/);
  const ambiente = criarAmbiente();
  const escolhidos = [];
  configurarModosVisuais(modo => { escolhidos.push(modo); return modo; });
  atualizarModoVisual('complexidade');
  const complexidade = ambiente.elementos.get('modo-complexidade');
  const estrutura = ambiente.elementos.get('modo-estrutura');
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  assert.equal(estrutura.atributos['aria-pressed'], 'false');
  estrutura.emitir('click');
  assert.deepEqual(escolhidos, ['estrutura']);
  assert.equal(complexidade.atributos['aria-pressed'], 'false');
  assert.equal(estrutura.atributos['aria-pressed'], 'true');
  complexidade.emitir('click');
  assert.deepEqual(escolhidos, ['estrutura', 'complexidade']);
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  assert.equal(estrutura.atributos['aria-pressed'], 'false');
  assert.equal(estrutura.ouvintes.get('click').size, 1);
  assert.equal(complexidade.ouvintes.get('click').size, 1);
  const css = readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8');
  assert.match(css, /\.controles-modo button\[aria-pressed="true"\]/);
});

test('legenda estática explica os seis marcadores sem conteúdo do código do usuário', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const legenda = html.match(/<section class="legenda-estrutural"[^>]*>([\s\S]*?)<\/section>/)?.[0];
  assert.ok(legenda);
  assert.match(legenda, /aria-label="Legenda dos marcadores das salas"/);
  for (const [letra, significado] of [
    ['I', 'if'], ['F', 'for'], ['W', 'while'], ['S', 'switch'],
    ['R', 'recursão direta'], ['C', 'ciclo indireto'],
  ]) {
    assert.match(legenda, new RegExp(`<li><strong>${letra}</strong> ${significado}</li>`));
  }
  assert.doesNotMatch(legenda, /id="|<script|entrada-codigo|info-sala/);
  const css = readFileSync(new URL('../css/estilo.css', import.meta.url), 'utf8');
  assert.match(css, /\.legenda-estrutural ul\s*\{[^}]*flex-wrap: wrap/s);
});

test('mostra quando os controles da exploração estão ativos', () => {
  const ambiente = criarAmbiente();

  atualizarEstadoControles(false);

  assert.equal(
    ambiente.elementos.get('status-indicador').className,
    'status-indicador'
  );

  assert.equal(
    ambiente.elementos.get('status-controles-texto').textContent,
    'Clique no mapa para explorar · WASD / setas'
  );

  atualizarEstadoControles(true);

  assert.equal(
    ambiente.elementos.get('status-indicador').className,
    'status-indicador ativo'
  );

  assert.equal(
    ambiente.elementos.get('status-controles-texto').textContent,
    'Exploração ativa · WASD / setas · Esc libera'
  );
});

test('digita progressivamente e troca de sala sem manter animações antigas', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  atualizarPainelDeSala(sala);
  ambiente.avancar(5);
  const antiga = encontrar(painel, 'descricao-sala');
  assert.ok(antiga.textContent.length > 0 && antiga.textContent.length < descreverSala(sala).length);
  const trechoAntigo = antiga.textContent;
  const nova = { ...sala, nome: 'nova', complexidade: 0 };
  atualizarPainelDeSala(nova);
  assert.equal(ambiente.pendentes.size, 1);
  ambiente.avancar(240);
  assert.equal(antiga.textContent, trechoAntigo);
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(nova));
  assert.equal(encontrar(painel, 'preenchimento-perigo').style.transform, 'scaleX(0.25)');
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, sala.textoCompleto);
  assert.equal(ambiente.pendentes.size, 0);
});

test('cancela ao sair da sala ou voltar ao editor', () => {
  const ambiente = criarAmbiente();
  atualizarPainelDeSala(sala);
  atualizarPainelDeSala(null);
  assert.equal(ambiente.pendentes.size, 0);
  atualizarPainelDeSala(sala);
  exibirTelaDeConfiguracao();
  assert.equal(ambiente.pendentes.size, 0);
  assert.equal(ambiente.preferencia.ouvintes.get('change').size, 0);
  assert.equal(ambiente.elementos.get('entrada-codigo').focado, true);
});

test('alterna entre a tela de entrada e a exploração', () => {
  const ambiente = criarAmbiente();

  exibirTelaDeJogo();

  assert.equal(
    ambiente.elementos.get('tela-entrada').style.display,
    'none'
  );

  assert.equal(
    ambiente.elementos.get('area-jogo').style.display,
    'flex'
  );

  exibirTelaDeConfiguracao();

  assert.equal(
    ambiente.elementos.get('tela-entrada').style.display,
    'flex'
  );

  assert.equal(
    ambiente.elementos.get('area-jogo').style.display,
    'none'
  );
});

test('redução de movimento exibe tudo imediatamente e funciona durante a digitação', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  ambiente.preferencia.matches = true;
  atualizarPainelDeSala(sala);
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(sala));
  assert.equal(encontrar(painel, 'preenchimento-perigo').style.transform, 'scaleX(1)');
  assert.equal(ambiente.pendentes.size, 0);
  ambiente.preferencia.matches = false;
  atualizarPainelDeSala(sala);
  ambiente.avancar(5);
  ambiente.preferencia.emitir('change', { matches: true });
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(sala));
  assert.equal(ambiente.pendentes.size, 0);
});

function conteudoDaSecao(painel, classe) {
  const secao = painel.filhos.find(filho => filho.className === `secao-inspector ${classe}`);
  assert.ok(secao, `seção ${classe} ausente`);
  return secao.filhos[1];
}

function botoesDaLista(lista) {
  return lista.filhos.map(item => item.filhos[0]);
}

test('inspector apresenta entrada, callees, profundidade, estruturas e código', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['validar', 'salvar', 'printf'] },
    { nome: 'validar', chamadas: [] }, { nome: 'salvar', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'main', estruturasControle: 4 },
    obterEstruturaDaFuncao(grafo, 'main'));

  assert.equal(conteudoDaSecao(painel, 'callers-funcao').textContent, 'Entrada do programa');
  const chamadas = conteudoDaSecao(painel, 'callees-funcao');
  assert.equal(chamadas.tipo, 'ul');
  assert.deepEqual(botoesDaLista(chamadas).map(botao => botao.textContent),
    ['validar()', 'salvar()']);
  assert.ok(botoesDaLista(chamadas).every(botao =>
    botao.tipo === 'button' && botao.atributos.type === 'button'));
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent, 'main()');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    '4 estrutura(s) de controle (total)');
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, sala.textoCompleto);
  assert.ok(painel.filhos.some(filho => filho.textContent === 'Profundidade: '
    && filho.filhos[0].textContent === '0'));
  assert.ok(painel.filhos.some(filho => filho.textContent === 'Complexidade: '
    && filho.filhos[0].textContent === '11'));
});

test('inspector atualiza callers, callees e caminho ao trocar de função', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['a', 'b'] },
    { nome: 'a', chamadas: ['comum'] },
    { nome: 'b', chamadas: ['comum'] },
    { nome: 'comum', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'a' }, obterEstruturaDaFuncao(grafo, 'a'));
  assert.deepEqual(botoesDaLista(conteudoDaSecao(painel, 'callers-funcao'))
    .map(botao => botao.textContent),
    ['main()']);
  assert.deepEqual(botoesDaLista(conteudoDaSecao(painel, 'callees-funcao'))
    .map(botao => botao.textContent),
    ['comum()']);
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent, 'main() → a()');

  atualizarPainelDeSala({ ...sala, nome: 'comum' }, obterEstruturaDaFuncao(grafo, 'comum'));
  assert.deepEqual(botoesDaLista(conteudoDaSecao(painel, 'callers-funcao'))
    .map(botao => botao.textContent),
    ['a()', 'b()']);
  assert.equal(conteudoDaSecao(painel, 'callees-funcao').textContent, 'Nenhuma função conhecida');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    'main() → a() → comum()');
});

test('função isolada e estruturas ausentes ou zero recebem mensagens neutras', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: [] }, { nome: 'isolada', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'isolada', estruturasControle: 0 },
    obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(conteudoDaSecao(painel, 'callers-funcao').textContent,
    'Nenhuma chamada conhecida');
  assert.equal(conteudoDaSecao(painel, 'callees-funcao').textContent,
    'Nenhuma função conhecida');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    'Não alcançável a partir da entrada');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    'Nenhuma estrutura de controle');

  atualizarPainelDeSala({ ...sala, estruturasControle: undefined },
    obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    'Informação não disponível');
  assert.doesNotMatch(descreverSala({ ...sala, estruturasControle: undefined }), /undefined/);
});

test('nomes e código com aparência de HTML permanecem como texto no DOM', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const nome = '<img src=x onerror=alert(1)>';
  const grafo = criarGrafo([
    { nome: 'main', chamadas: [nome] }, { nome, chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome, textoCompleto: 'void f(){ /* <script> */ }' },
    obterEstruturaDaFuncao(grafo, nome));
  assert.equal(encontrar(painel, 'nome-funcao').textContent, `${nome}()`);
  assert.equal(botoesDaLista(conteudoDaSecao(painel, 'callers-funcao'))[0].textContent,
    'main()');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    `main() → ${nome}()`);
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, 'void f(){ /* <script> */ }');
  assert.equal(painel.filhos.some(filho => filho.tipo === 'img'), false);
});

test('botões de callers e callees notificam o nome correto sem interpretar HTML', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const selecionados = [];
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['alvo'] },
    { nome: 'alvo', chamadas: ['<seguro>'] },
    { nome: '<seguro>', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'alvo' },
    obterEstruturaDaFuncao(grafo, 'alvo'), nome => selecionados.push(nome));
  const caller = botoesDaLista(conteudoDaSecao(painel, 'callers-funcao'))[0];
  const callee = botoesDaLista(conteudoDaSecao(painel, 'callees-funcao'))[0];
  assert.equal(caller.tipo, 'button');
  assert.equal(callee.tipo, 'button');
  assert.equal(callee.textContent, '<seguro>()');
  caller.emitir('click');
  callee.emitir('click');
  assert.deepEqual(selecionados, ['main', '<seguro>']);
  assert.equal(callee.filhos.length, 0);
});

test('sem main, caminho mostra o nome real da entrada', () => {
  const ambiente = criarAmbiente();
  const grafo = criarGrafo([{ nome: 'inicio', chamadas: [] }]);
  atualizarPainelDeSala({ ...sala, nome: 'inicio' }, obterEstruturaDaFuncao(grafo, 'inicio'));
  assert.equal(conteudoDaSecao(ambiente.elementos.get('info-sala'), 'caminho-funcao').textContent,
    'inicio()');
});

function prepararBusca(nomes, aoSelecionar = () => {}) {
  const ambiente = criarAmbiente();
  inicializarBuscaFuncoes();
  configurarBuscaFuncoes(nomes, aoSelecionar);
  const campo = ambiente.elementos.get('busca-funcao');
  const painel = ambiente.elementos.get('resultados-busca');
  return { ambiente, campo, painel, buscar(texto) {
    campo.value = texto;
    campo.emitir('input');
  } };
}

function botoesDaBusca(painel) {
  return painel.filhos[0]?.tipo === 'ul'
    ? painel.filhos[0].filhos.map(item => item.filhos[0]) : [];
}

test('busca vazia não mostra resultados e consulta parcial ignora caixa e preserva ordem', () => {
  const busca = prepararBusca(['carregar', 'processar', 'processarArquivo', 'salvar']);
  assert.equal(busca.painel.filhos.length, 0);
  busca.buscar('PROCESS');
  assert.deepEqual(botoesDaBusca(busca.painel).map(botao => botao.textContent),
    ['processar()', 'processarArquivo()']);
  assert.ok(botoesDaBusca(busca.painel).every(botao =>
    botao.tipo === 'button' && botao.atributos.type === 'button'));
  busca.buscar('  ');
  assert.equal(busca.painel.filhos.length, 0);
});

test('busca sem correspondência mostra mensagem e Enter escolhe o primeiro resultado', () => {
  const selecionados = [];
  const busca = prepararBusca(['processar', 'processarArquivo'],
    nome => selecionados.push(nome));
  busca.buscar('inexistente');
  assert.equal(busca.painel.filhos[0].textContent, 'Nenhuma função encontrada.');
  const semResultado = busca.campo.emitir('keydown', { key: 'Enter' });
  assert.equal(semResultado.prevenido, undefined);
  busca.buscar('process');
  const enter = busca.campo.emitir('keydown', { key: 'Enter' });
  assert.equal(enter.prevenido, true);
  assert.deepEqual(selecionados, ['processar']);
});

test('resultado isolado e nome com aparência de HTML são texto seguro e clicáveis', () => {
  const selecionados = [];
  const nome = '<img src=x onerror=alert(1)>';
  const busca = prepararBusca(['main', 'isolada', nome],
    escolhido => selecionados.push(escolhido));
  busca.buscar('isol');
  botoesDaBusca(busca.painel)[0].emitir('click');
  busca.buscar('<img');
  const botao = botoesDaBusca(busca.painel)[0];
  assert.equal(botao.textContent, `${nome}()`);
  assert.equal(botao.filhos.length, 0);
  botao.emitir('click');
  assert.deepEqual(selecionados, ['isolada', nome]);
});

test('configurar nova dungeon e sair limpam consulta, resultados e callback anterior', () => {
  const antigo = [];
  const novo = [];
  const busca = prepararBusca(['antiga'], nome => antigo.push(nome));
  busca.buscar('ant');
  configurarBuscaFuncoes(['nova'], nome => novo.push(nome));
  assert.equal(busca.campo.ouvintes.get('input').size, 1);
  assert.equal(busca.campo.ouvintes.get('keydown').size, 1);
  assert.equal(busca.campo.value, '');
  assert.equal(busca.painel.filhos.length, 0);
  busca.buscar('ant');
  assert.equal(busca.painel.filhos[0].textContent, 'Nenhuma função encontrada.');
  busca.buscar('nov');
  botoesDaBusca(busca.painel)[0].emitir('click');
  assert.deepEqual(antigo, []);
  assert.deepEqual(novo, ['nova']);
  limparBuscaFuncoes();
  assert.equal(busca.campo.value, '');
  assert.equal(busca.painel.filhos.length, 0);
});

test('inspector mostra contagens reais e recursão direta sem interpretar código como HTML', () => {
  const ambiente = criarAmbiente();
  const funcoes = analisarFuncoes(`void f(){
    printf("<img src=x onerror=alert(1)> if for while switch case");
    if (1) {} if (0) {} for (;;) {} while (0) {}
    switch (1) { case 1: break; case 2: break; }
    f();
  }
  int main(){f();}`);
  const grafo = criarGrafo(funcoes);
  const funcao = funcoes.find(item => item.nome === 'f');
  atualizarPainelDeSala(funcao, obterEstruturaDaFuncao(grafo, 'f'));
  const painel = ambiente.elementos.get('info-sala');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    '7 estrutura(s) de controle (total)');
  const secao = painel.filhos.find(filho => filho.className ===
    'secao-inspector estruturas-funcao');
  assert.deepEqual(secao.filhos[2].filhos.map(item => item.textContent),
    ['if: 2', 'for: 1', 'while: 1', 'switch: 1', 'case: 2']);
  assert.equal(conteudoDaSecao(painel, 'ciclo-funcao').textContent,
    'Recursão direta; participa de ciclo de chamadas');
  assert.match(encontrar(painel, 'codigo-funcao').textContent, /<img src=x onerror=alert\(1\)>/);
  assert.equal(painel.filhos.some(filho => filho.tipo === 'img'), false);
});

test('inspector trata zeros de forma neutra e distingue ciclo indireto de ausência de ciclo', () => {
  const ambiente = criarAmbiente();
  const funcoes = analisarFuncoes(`void a(){b();}
    void b(){a();}
    void isolada(){}
    int main(){a();}`);
  const grafo = criarGrafo(funcoes);
  const painel = ambiente.elementos.get('info-sala');
  const a = funcoes.find(funcao => funcao.nome === 'a');
  atualizarPainelDeSala(a, obterEstruturaDaFuncao(grafo, 'a'));
  assert.equal(conteudoDaSecao(painel, 'ciclo-funcao').textContent,
    'Participa de ciclo de chamadas');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    'Nenhuma estrutura de controle');
  assert.equal(painel.filhos.find(filho => filho.className ===
    'secao-inspector estruturas-funcao').filhos.length, 2);
  const isolada = funcoes.find(funcao => funcao.nome === 'isolada');
  atualizarPainelDeSala(isolada, obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(conteudoDaSecao(painel, 'ciclo-funcao').textContent, 'Sem ciclo detectado');
  assert.equal(conteudoDaSecao(painel, 'callers-funcao').textContent,
    'Nenhuma chamada conhecida');
});
