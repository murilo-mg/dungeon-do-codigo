import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo } from '../js/grafoC.js';
import { calcularLayoutMasmorra } from '../js/layoutMasmorra.js';

const TAMANHOS = [5, 15, 30, 60];

function criarFuncao(nome, chamadas = [], complexidade = 0) {
  return { nome, chamadas, complexidade };
}

function criarFuncoes(quantidade, tipo) {
  const nomes = Array.from(
    { length: quantidade - 1 },
    (_, indice) => `f${String(indice + 1).padStart(2, '0')}`
  );
  const chamadas = new Map(nomes.map(nome => [nome, []]));

  if (tipo === 'cadeia') {
    chamadas.set('main', nomes.slice(0, 1));
    nomes.forEach((nome, indice) => {
      chamadas.set(nome, nomes.slice(indice + 1, indice + 2));
    });
  } else if (tipo === 'mesmoNivel') {
    chamadas.set('main', nomes);
  } else {
    chamadas.set('main', nomes.slice(0, 2));
    for (let indice = 0; indice < Math.floor((quantidade - 1) / 2) - 1; indice++) {
      const origem = nomes[indice];
      const destino = nomes[indice + 1];
      chamadas.set(origem, [destino]);
    }
    const isolada = nomes[Math.floor((quantidade - 1) / 2)];
    chamadas.set(isolada, nomes.slice(Math.floor((quantidade - 1) / 2) + 1, Math.floor((quantidade - 1) / 2) + 2));
  }

  return [
    criarFuncao('main', chamadas.get('main'), 0),
    ...nomes.map((nome, indice) => criarFuncao(
      nome,
      chamadas.get(nome),
      indice % 3 === 0 ? 0 : indice % 3 === 1 ? 4 : 8
    )),
  ];
}

function retangulosSobrepostos(layout) {
  const entradas = [...layout.entries()];
  let quantidade = 0;

  for (let primeiro = 0; primeiro < entradas.length; primeiro++) {
    const [, a] = entradas[primeiro];
    for (let segundo = primeiro + 1; segundo < entradas.length; segundo++) {
      const [, b] = entradas[segundo];
      const separacaoHorizontal = a.x + a.largura <= b.x || b.x + b.largura <= a.x;
      const separacaoVertical = a.y + a.altura <= b.y || b.y + b.altura <= a.y;
      if (!separacaoHorizontal && !separacaoVertical) quantidade++;
    }
  }

  return quantidade;
}

function menorDistanciaVerticalNoMesmoNivel(grafo, layout) {
  const porProfundidade = new Map();
  for (const [nome, no] of grafo.nos) {
    if (no.profundidade === null) continue;
    if (!porProfundidade.has(no.profundidade)) porProfundidade.set(no.profundidade, []);
    const dimensoes = layout.get(nome);
    porProfundidade.get(no.profundidade).push(dimensoes.y + dimensoes.altura / 2);
  }

  let menor = Infinity;
  for (const centros of porProfundidade.values()) {
    centros.sort((a, b) => a - b);
    for (let indice = 1; indice < centros.length; indice++) {
      menor = Math.min(menor, centros[indice] - centros[indice - 1]);
    }
  }
  return Number.isFinite(menor) ? menor : null;
}

function medirCenario(funcoes, inicio) {
  const grafo = criarGrafo(funcoes);
  const depoisDoGrafo = performance.now();
  const layout = calcularLayoutMasmorra(grafo, funcoes);
  const fim = performance.now();
  const foraDosLimites = [...layout.values()].filter(dimensoes =>
    dimensoes.x < 0 || dimensoes.y < 0 ||
    dimensoes.x + dimensoes.largura > 560 ||
    dimensoes.y + dimensoes.altura > 480
  ).length;

  return {
    quantidade: funcoes.length,
    entradas: layout.size,
    sobreposicoes: retangulosSobrepostos(layout),
    menorDistanciaVertical: menorDistanciaVerticalNoMesmoNivel(grafo, layout),
    colunas: new Set([...layout.values()].map(dimensoes => dimensoes.x)).size,
    foraDosLimites,
    tempoGrafoMs: depoisDoGrafo - inicio,
    tempoLayoutMs: fim - depoisDoGrafo,
    grafo,
    layout,
  };
}

function validarIntegridade(relatorio, funcoes) {
  assert.equal(relatorio.entradas, funcoes.length);
  assert.equal(relatorio.foraDosLimites, 0);

  for (const dimensoes of relatorio.layout.values()) {
    assert.ok(Number.isFinite(dimensoes.x));
    assert.ok(Number.isFinite(dimensoes.y));
    assert.ok(Number.isFinite(dimensoes.largura));
    assert.ok(Number.isFinite(dimensoes.altura));
    assert.ok(dimensoes.largura > 0);
    assert.ok(dimensoes.altura > 0);
  }
}

test('mede o layout em cadeias, níveis amplos e combinações maiores', () => {
  const relatorios = [];

  for (const quantidade of TAMANHOS) {
    for (const tipo of ['cadeia', 'mesmoNivel', 'combinacao']) {
      const funcoes = criarFuncoes(quantidade, tipo);
      const inicio = performance.now();
      const relatorio = medirCenario(funcoes, inicio);
      validarIntegridade(relatorio, funcoes);
      assert.deepEqual(relatorio.layout, calcularLayoutMasmorra(relatorio.grafo, funcoes));

      if (tipo === 'combinacao') {
        assert.ok([...relatorio.grafo.nos.values()].some(no => !no.alcancavel));
      }

      relatorios.push({
        quantidade,
        tipo,
        sobreposicoes: relatorio.sobreposicoes,
        menorDistanciaVertical: relatorio.menorDistanciaVertical,
        colunas: relatorio.colunas,
        foraDosLimites: relatorio.foraDosLimites,
        tempoGrafoMs: Number(relatorio.tempoGrafoMs.toFixed(3)),
        tempoLayoutMs: Number(relatorio.tempoLayoutMs.toFixed(3)),
      });
    }
  }

  console.log('Resultados de estresse do layout:', JSON.stringify(relatorios, null, 2));
});

test('nomes longos não influenciam as posições geométricas', () => {
  const curtas = criarFuncoes(5, 'cadeia');
  const nomesCurtos = new Map(curtas.map(funcao => [funcao.nome, `${funcao.nome}_com_um_nome_muito_longo_para_o_teste`]));
  const longas = curtas.map(funcao => ({
    ...funcao,
    nome: nomesCurtos.get(funcao.nome),
    chamadas: funcao.chamadas.map(chamada => nomesCurtos.get(chamada)),
  }));
  const layoutCurto = calcularLayoutMasmorra(criarGrafo(curtas), curtas);
  const layoutLongo = calcularLayoutMasmorra(criarGrafo(longas), longas);

  assert.deepEqual(
    [...layoutCurto.values()].map(({ x, y, largura, altura }) => ({ x, y, largura, altura })),
    [...layoutLongo.values()].map(({ x, y, largura, altura }) => ({ x, y, largura, altura }))
  );
});
