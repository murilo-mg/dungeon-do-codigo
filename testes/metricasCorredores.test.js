import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo } from '../js/grafoC.js';
import { calcularLayoutMasmorra } from '../js/layoutMasmorra.js';
import { criarSegmentosDeCorredores } from '../js/corredores.js';
import { medirCorredores } from './metricasCorredores.js';

function sala(nome, centroX, centroY, largura = 2, altura = 2) {
  return { nome, x: centroX - largura / 2, y: centroY - altura / 2, largura, altura };
}

function segmento(origem, destino, salas) {
  return criarSegmentosDeCorredores(salas, [{ origem, destino }])[0];
}

function medirFuncoes(funcoes) {
  const grafo = criarGrafo(funcoes);
  const layout = calcularLayoutMasmorra(grafo, funcoes);
  const salas = [...layout.salas].map(([nome, dimensoes]) => ({ nome, ...dimensoes }));
  const segmentos = criarSegmentosDeCorredores(salas, grafo.arestas);
  return medirCorredores(salas, segmentos);
}

function funcao(nome, chamadas = []) {
  return { nome, chamadas, complexidade: 0 };
}

test('cruzamento transversal conta apenas pares sem sala compartilhada', () => {
  const salas = [sala('a', 0, 0), sala('b', 10, 10),
    sala('c', 0, 10), sala('d', 10, 0)];
  const segmentos = [segmento('a', 'b', salas), segmento('c', 'd', salas)];
  const resultado = medirCorredores(salas, segmentos);
  assert.equal(resultado.cruzamentos, 1);
  assert.equal(resultado.corredoresAtravessandoSalas, 0);
  assert.equal(resultado.comprimentoTotal, 2 * Math.hypot(10, 10));

  const compartilhados = [segmento('a', 'b', salas), segmento('a', 'd', salas)];
  assert.equal(medirCorredores(salas, compartilhados).cruzamentos, 0);
});

test('atravessamento exige trecho no interior aberto da terceira sala', () => {
  const pontas = [sala('a', 0, 5), sala('b', 20, 5)];
  const corredor = segmento('a', 'b', pontas);
  assert.equal(medirCorredores([...pontas, sala('meio', 10, 5, 4, 2)],
    [corredor]).corredoresAtravessandoSalas, 1);
  assert.equal(medirCorredores([...pontas, sala('borda', 10, 6, 4, 2)],
    [corredor]).corredoresAtravessandoSalas, 0);

  const diagonais = [sala('c', 0, 0), sala('d', 20, 20)];
  assert.equal(medirCorredores([...diagonais,
    { nome: 'canto', x: 8, y: 10, largura: 2, altura: 2 }],
    [segmento('c', 'd', diagonais)]).corredoresAtravessandoSalas, 0);
});

test('ciclo em sentidos contrários termina e mede os dois segmentos', () => {
  const salas = [sala('a', 0, 5), sala('b', 20, 5), sala('terceira', 10, 5)];
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'a', destino: 'b' }, { origem: 'b', destino: 'a' },
    { origem: 'a', destino: 'a' },
  ]);
  assert.deepEqual(medirCorredores(salas, segmentos), {
    cruzamentos: 0, corredoresAtravessandoSalas: 2, comprimentoTotal: 40,
  });
});

test('trechos colineares sobrepostos não são cruzamentos transversais', () => {
  const salas = [sala('a', 0, 0), sala('b', 30, 0),
    sala('c', 10, 0), sala('d', 20, 0)];
  assert.equal(medirCorredores(salas, [segmento('a', 'b', salas),
    segmento('c', 'd', salas)]).cruzamentos, 0);
});

test('linha de base: cadeia, ramificação, callers e cruzamento pelo layout atual', () => {
  const cenarios = {
    cadeia: [funcao('main', ['a']), funcao('a', ['b']), funcao('b', ['c']), funcao('c')],
    ramificacao: [funcao('main', ['a', 'b']), funcao('a', ['c']),
      funcao('b', ['d']), funcao('c'), funcao('d')],
    callers: [funcao('main', ['a', 'b']), funcao('a', ['c']),
      funcao('b', ['c']), funcao('c')],
    cruzado: [funcao('main', ['a', 'b']), funcao('a', ['d']),
      funcao('b', ['c']), funcao('c'), funcao('d')],
  };
  const resultados = Object.fromEntries(Object.entries(cenarios).map(([nome, funcoes]) => {
    const metricas = medirFuncoes(funcoes);
    return [nome, { ...metricas,
      comprimentoTotal: Number(metricas.comprimentoTotal.toFixed(2)) }];
  }));
  console.log('Linha de base dos corredores:', JSON.stringify(resultados));
  assert.deepEqual(resultados, {
    cadeia: { cruzamentos: 0, corredoresAtravessandoSalas: 0, comprimentoTotal: 255 },
    ramificacao: { cruzamentos: 0, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 366.16 },
    callers: { cruzamentos: 0, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 385.04 },
    cruzado: { cruzamentos: 1, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 432.43 },
  });
});
