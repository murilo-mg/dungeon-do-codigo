import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirMasmorra } from '../js/masmorra.js';

function criarFuncao(nome, chamadas = []) {
  return {
    nome,
    corpo: chamadas.map(chamada => `${chamada}();`).join(' '),
    textoCompleto: `void ${nome}() {}`,
    linhas: 0,
    estruturasControle: 0,
    complexidade: 0,
    chamadas,
  };
}

test('lista vazia produz uma masmorra vazia, sem sala fictícia', () => {
  assert.deepEqual(construirMasmorra([]), []);
});

test('preserva os dados da sala inicial com main ou com a primeira função disponível', () => {
  const auxiliar = criarFuncao('auxiliar');

  assert.equal(construirMasmorra([auxiliar])[0].nome, 'auxiliar');
  assert.equal(construirMasmorra([auxiliar])[0].profundidade, 0);

  const principal = criarFuncao('main', ['auxiliar']);
  const salas = construirMasmorra([auxiliar, principal]);

  assert.equal(salas.length, 2);
  assert.equal(salas[0].nome, 'main');
  assert.equal(salas[0].ehSalaInicial, true);
  assert.equal(salas[0].profundidade, 0);

  assert.equal(salas[1].ehChamadaPelaPrincipal, true);
  assert.equal(salas[1].profundidade, 1);

  assert.deepEqual(
    [auxiliar, principal].map(funcao => funcao.nome),
    ['auxiliar', 'main']
  );
});

test('calcula chamadas recebidas e profundidade a partir da função inicial', () => {
  const funcoes = [
    criarFuncao('validar'),
    criarFuncao('salvar', ['processar']),
    criarFuncao('processar', ['salvar']),
    criarFuncao('carregar', ['validar']),
    criarFuncao('isolada'),
    criarFuncao('main', ['carregar', 'processar']),
  ];

  const salas = construirMasmorra(funcoes);
  const porNome = new Map(
    salas.map(sala => [sala.nome, sala])
  );

  assert.equal(porNome.get('main').profundidade, 0);

  assert.equal(porNome.get('carregar').profundidade, 1);
  assert.deepEqual(
    porNome.get('carregar').chamadaPor,
    ['main']
  );

  assert.equal(porNome.get('processar').profundidade, 1);
  assert.deepEqual(
    new Set(porNome.get('processar').chamadaPor),
    new Set(['main', 'salvar'])
  );

  assert.equal(porNome.get('validar').profundidade, 2);
  assert.deepEqual(
    porNome.get('validar').chamadaPor,
    ['carregar']
  );

  assert.equal(porNome.get('salvar').profundidade, 2);
  assert.deepEqual(
    porNome.get('salvar').chamadaPor,
    ['processar']
  );

  assert.equal(porNome.get('isolada').profundidade, null);

  assert.equal(
    funcoes.some(funcao => 'profundidade' in funcao),
    false
  );
});

test('organiza salas em colunas conforme a profundidade das chamadas', () => {
  const funcoes = [
    criarFuncao('validar'),
    criarFuncao('salvar'),
    criarFuncao('carregar', ['validar']),
    criarFuncao('processar', ['salvar']),
    criarFuncao('isolada'),
    criarFuncao('main', ['carregar', 'processar']),
  ];

  const salas = construirMasmorra(funcoes);

  const porNome = new Map(
    salas.map(sala => [sala.nome, sala])
  );

  const main = porNome.get('main');
  const carregar = porNome.get('carregar');
  const processar = porNome.get('processar');
  const validar = porNome.get('validar');
  const salvar = porNome.get('salvar');
  const isolada = porNome.get('isolada');

  assert.ok(main.x < carregar.x);
  assert.equal(carregar.x, processar.x);

  assert.ok(carregar.x < validar.x);
  assert.equal(validar.x, salvar.x);

  assert.notEqual(carregar.y, processar.y);
  assert.notEqual(validar.y, salvar.y);

  assert.ok(isolada.x > validar.x);
  assert.equal(isolada.profundidade, null);
});