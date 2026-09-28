import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo } from '../js/grafoC.js';
import { criarRegioesMasmorra, encontrarPrefixoConfiavel,
  humanizarPrefixo } from '../js/regioesMasmorra.js';

function funcao(nome, chamadas = []) {
  return { nome, chamadas };
}

function regiaoDe(regioes, nome) {
  return regioes.find(regiao => regiao.funcoes.includes(nome));
}

test('prefixos técnicos geram títulos ligados ao código, sem tradução arbitrária', () => {
  const grupos = [
    [['parse_primary', 'parse_expression', 'parse_unary'], 'Ala Parser'],
    [['rbt_insert', 'rbt_delete', 'rbt_search'], 'Ala RBT'],
    [['vm_push', 'vm_pop', 'vm_execute'], 'Ala VM'],
    [['usuario_criar', 'usuario_buscar', 'usuario_remover'], 'Ala Usuario'],
    [['grafo_criar', 'grafo_buscar'], 'Ala Grafo'],
  ];
  const nomes = grupos.flatMap(([membros]) => membros);
  const grafo = criarGrafo([funcao('main', nomes), ...nomes.map(nome => funcao(nome))]);
  const regioes = criarRegioesMasmorra(grafo);
  for (const [membros, titulo] of grupos) {
    assert.equal(regiaoDe(regioes, membros[0]).titulo, titulo);
    assert.deepEqual(regiaoDe(regioes, membros[0]).funcoes, membros);
  }
  assert.equal(regiaoDe(regioes, 'main').tipo, 'entrada');
  assert.equal(regioes.some(regiao => regiao.titulo === 'Ala Main'), false);
});

test('humanização e prefixo confiável permanecem funções puras', () => {
  assert.deepEqual(['vm', 'rbt', 'parse', 'grafo', 'usuario', 'memoria']
    .map(humanizarPrefixo), ['VM', 'RBT', 'Parser', 'Grafo', 'Usuario', 'Memoria']);
  assert.equal(encontrarPrefixoConfiavel(['usuario_criar', 'usuario_buscar']), 'usuario');
  assert.equal(encontrarPrefixoConfiavel(['parse_primary', 'grafico_buscar']), null);
  assert.equal(encontrarPrefixoConfiavel(['parse_primary']), null);
  assert.equal(humanizarPrefixo('<script>'), null);
});

test('prefixos operacionais get e create não viram domínios de ala', () => {
  for (const [nomes, tituloIndevido] of [
    [['get_usuario', 'get_config', 'get_tempo'], 'Ala Get'],
    [['create_node', 'create_window', 'create_file'], 'Ala Create'],
  ]) {
    const grafo = criarGrafo([funcao('main', nomes), ...nomes.map(nome => funcao(nome))]);
    const regioes = criarRegioesMasmorra(grafo);
    assert.equal(encontrarPrefixoConfiavel(nomes), null);
    assert.equal(regioes.some(regiao => regiao.titulo === tituloIndevido), false);
    assert.deepEqual(nomes.map(nome => regiaoDe(regioes, nome).titulo),
      ['Ala 1', 'Ala 2', 'Ala 3']);
    assert.deepEqual(criarRegioesMasmorra(grafo), regioes);
  }
});

test('lista operacional também bloqueia variações maiúsculas sem bloquear domínios válidos', () => {
  for (const prefixo of [
    'get', 'set', 'create', 'delete', 'remove', 'add', 'find', 'init', 'free',
    'read', 'write', 'load', 'save', 'update', 'process', 'handle', 'make', 'new',
    'GET',
  ]) {
    assert.equal(encontrarPrefixoConfiavel([`${prefixo}_a`, `${prefixo}_b`]), null);
  }
  assert.equal(encontrarPrefixoConfiavel(['grafo_criar', 'grafo_buscar']), 'grafo');
});

test('sem prefixo confiável, alas numeradas seguem relações e ordem estrutural', () => {
  const grafo = criarGrafo([
    funcao('main', ['alpha', 'gamma']),
    funcao('alpha', ['beta']), funcao('beta'),
    funcao('gamma', ['delta']), funcao('delta'),
  ]);
  const antes = structuredClone(grafo);
  const regioes = criarRegioesMasmorra(grafo);
  assert.equal(regiaoDe(regioes, 'alpha').titulo, 'Ala 1');
  assert.deepEqual(regiaoDe(regioes, 'alpha').funcoes, ['alpha', 'beta']);
  assert.equal(regiaoDe(regioes, 'gamma').titulo, 'Ala 2');
  assert.deepEqual(regiaoDe(regioes, 'gamma').funcoes, ['gamma', 'delta']);
  assert.deepEqual(criarRegioesMasmorra(grafo), regioes);
  assert.deepEqual(grafo, antes);
});

test('entrada sem main usa a função escolhida pelo grafo e nunca cria Ala Main', () => {
  const grafo = criarGrafo([
    funcao('inicio', ['main_auxiliar', 'main_final']),
    funcao('main_auxiliar'), funcao('main_final'),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.deepEqual(regiaoDe(regioes, 'inicio'), {
    id: 'entrada', tipo: 'entrada', titulo: 'Entrada da Dungeon', funcoes: ['inicio'],
  });
  assert.equal(regiaoDe(regioes, 'main_auxiliar').titulo, 'Ala 1');
  assert.equal(regiaoDe(regioes, 'main_final').titulo, 'Ala 2');
  assert.equal(regioes.some(regiao => regiao.titulo === 'Ala Main'), false);
});

test('três callers reais identificam hub sem misturá-lo às criptas isoladas', () => {
  const grafo = criarGrafo([
    funcao('main', ['a', 'b', 'c']),
    funcao('a', ['isolada_nome']), funcao('b', ['isolada_nome']),
    funcao('c', ['isolada_nome']), funcao('isolada_nome'),
    funcao('solta'),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.equal(regiaoDe(regioes, 'isolada_nome').titulo, 'Salão Central');
  assert.equal(regiaoDe(regioes, 'isolada_nome').tipo, 'hub');
  assert.equal(regiaoDe(regioes, 'solta').titulo, 'Criptas Isoladas');
  assert.equal(regiaoDe(regioes, 'solta').tipo, 'isoladas');
  assert.equal(regiaoDe(regioes, 'solta').funcoes.includes('isolada_nome'), false);
  const todasAsFuncoes = regioes.flatMap(regiao => regiao.funcoes);
  assert.equal(todasAsFuncoes.length, grafo.nos.size);
  assert.equal(new Set(todasAsFuncoes).size, grafo.nos.size);
});

test('nome sugestivo não define hub, e dois callers não bastam', () => {
  const grafo = criarGrafo([
    funcao('main', ['a', 'b', 'c']),
    funcao('a', ['hub_falso', 'comum']),
    funcao('b', ['hub_falso', 'comum']),
    funcao('c', ['comum']),
    funcao('hub_falso'), funcao('comum'),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.notEqual(regiaoDe(regioes, 'hub_falso').tipo, 'hub');
  assert.equal(regiaoDe(regioes, 'comum').tipo, 'hub');
});

test('callers inalcançáveis não promovem uma função alcançável a hub', () => {
  const grafo = criarGrafo([
    funcao('main', ['util']), funcao('util'),
    funcao('a', ['util']), funcao('b', ['util']), funcao('c', ['util']),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.equal(regiaoDe(regioes, 'util').tipo, 'ala');
  assert.equal(regioes.some(regiao => regiao.tipo === 'hub'), false);
  assert.deepEqual(regiaoDe(regioes, 'a').funcoes, ['a', 'b', 'c']);
});

test('ciclos terminam e chamadas repetidas não contam como callers adicionais', () => {
  const grafo = criarGrafo([
    funcao('main', ['a']),
    funcao('a', ['b', 'b', 'b']),
    funcao('b', ['a']),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.deepEqual(regiaoDe(regioes, 'a').funcoes, ['a', 'b']);
  assert.equal(regioes.some(regiao => regiao.tipo === 'hub'), false);
  assert.deepEqual(criarRegioesMasmorra(grafo), regioes);
});

test('componente inalcançável inteiro vira Criptas Isoladas, sem HTML nos títulos', () => {
  const nomeEstranho = '<img src=x onerror=alert(1)>_ajuda';
  const grafo = criarGrafo([
    funcao('main'), funcao('x', ['alvo']), funcao('y', ['alvo']),
    funcao('z', ['alvo']), funcao('alvo'), funcao(nomeEstranho),
  ]);
  const regioes = criarRegioesMasmorra(grafo);
  assert.equal(regiaoDe(regioes, 'alvo').tipo, 'isoladas');
  assert.equal(regiaoDe(regioes, nomeEstranho).tipo, 'isoladas');
  assert.deepEqual(regiaoDe(regioes, 'alvo').funcoes,
    ['x', 'y', 'z', 'alvo', nomeEstranho]);
  assert.equal(regioes.some(regiao => regiao.tipo === 'hub'), false);
  assert.ok(regioes.every(regiao => !regiao.titulo.includes('<')));
  const todasAsFuncoes = regioes.flatMap(regiao => regiao.funcoes);
  assert.equal(todasAsFuncoes.length, grafo.nos.size);
  assert.equal(new Set(todasAsFuncoes).size, grafo.nos.size);
  assert.deepEqual(criarRegioesMasmorra(grafo), regioes);
});

test('grafo vazio não produz região fictícia', () => {
  assert.deepEqual(criarRegioesMasmorra(criarGrafo([])), []);
});
