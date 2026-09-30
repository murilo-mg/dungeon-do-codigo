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
  // A métrica precisa continuar reconhecendo diagonais, mesmo que o roteamento
  // atual prefira caminhos ortogonais e contorne esses obstáculos.
  const centro = nome => {
    const sala = salas.find(sala => sala.nome === nome);
    return { x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 };
  };
  return { origem, destino, inicio: centro(origem), fim: centro(destino) };
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

test('ciclo em sentidos contrários mede ambos os caminhos que contornam uma sala', () => {
  const salas = [sala('a', 0, 5), sala('b', 20, 5), sala('terceira', 10, 5)];
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'a', destino: 'b' }, { origem: 'b', destino: 'a' },
    { origem: 'a', destino: 'a' },
  ]);
  assert.deepEqual(medirCorredores(salas, segmentos), {
    cruzamentos: 0, corredoresAtravessandoSalas: 0, comprimentoTotal: 39,
  });
});

test('trechos colineares sobrepostos não são cruzamentos transversais', () => {
  const salas = [sala('a', 0, 0), sala('b', 30, 0),
    sala('c', 10, 0), sala('d', 20, 0)];
  assert.equal(medirCorredores(salas, [segmento('a', 'b', salas),
    segmento('c', 'd', salas)]).cruzamentos, 0);
});

test('ordenação e caminhos entre bordas preservam cenários simples sem cruzamento', () => {
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
  console.log('Métricas dos caminhos entre bordas:', JSON.stringify(resultados));
  // Portas precisam caber na parede: rotas que antes saíam pela quina agora
  // percorrem uma borda segura, aumentando o comprimento sem mudar relações.
  assert.deepEqual(resultados, {
    cadeia: { cruzamentos: 0, corredoresAtravessandoSalas: 0, comprimentoTotal: 60 },
    ramificacao: { cruzamentos: 0, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 160 },
    callers: { cruzamentos: 0, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 240 },
    cruzado: { cruzamentos: 0, corredoresAtravessandoSalas: 0,
      comprimentoTotal: 160 },
  });
  assert.ok(resultados.cruzado.cruzamentos < 1);
  assert.ok(resultados.cruzado.comprimentoTotal < 432.43);
});
