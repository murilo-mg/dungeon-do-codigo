import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSegmentosDeCorredores, calcularCruzamentosCorredores, LARGURA_CORREDOR } from '../js/corredores.js';
import { medirCorredores } from './metricasCorredores.js';

const salas = [
  { nome: 'main', x: 0, y: 0, largura: 20, altura: 20 },
  { nome: 'a', x: 100, y: 0, largura: 20, altura: 20 },
  { nome: 'b', x: 200, y: 0, largura: 20, altura: 20 },
  { nome: 'c', x: 100, y: 100, largura: 20, altura: 20 },
  { nome: 'isolada', x: 300, y: 100, largura: 20, altura: 20 },
];

test('piso ampliado contorna terceira sala com toda a sua largura', () => {
  const mundo = [
    { nome: 'a', x: 20, y: 100, largura: 60, altura: 60 },
    { nome: 'b', x: 400, y: 100, largura: 60, altura: 60 },
    { nome: 'obstaculo', x: 190, y: 80, largura: 90, altura: 100 },
  ];
  const trechos = criarSegmentosDeCorredores(mundo, [{ origem: 'a', destino: 'b' }]);
  const raio = LARGURA_CORREDOR / 2;
  assert.equal(LARGURA_CORREDOR, 32);
  assert.ok(trechos.length > 1);
  for (const trecho of trechos) {
    assert.ok(!trecho.fallbackDireto);
    const esquerda = Math.min(trecho.inicio.x, trecho.fim.x) - raio;
    const direita = Math.max(trecho.inicio.x, trecho.fim.x) + raio;
    const topo = Math.min(trecho.inicio.y, trecho.fim.y) - raio;
    const base = Math.max(trecho.inicio.y, trecho.fim.y) + raio;
    assert.ok(direita <= 190 || esquerda >= 280 || base <= 80 || topo >= 180);
  }
});

test('ponte identifica cruzamento interior sem criar ligação nem marcar cotovelo', () => {
  const a = { origem: 'a', destino: 'b', inicio: { x: 0, y: 100 }, fim: { x: 300, y: 100 } };
  const b = { origem: 'c', destino: 'd', inicio: { x: 150, y: 0 }, fim: { x: 150, y: 300 } };
  const antes = structuredClone([a, b]);
  assert.deepEqual(calcularCruzamentosCorredores([a, b]), [{ x: 150, y: 100, origem: 'a', destino: 'b' }]);
  assert.deepEqual([a, b], antes);
  assert.deepEqual(calcularCruzamentosCorredores([a, { ...b, origem: 'a', destino: 'b' }]), []);
  assert.deepEqual(calcularCruzamentosCorredores([a, { ...b, inicio: { x: 300, y: 100 }, fim: { x: 300, y: 300 } }]), []);
  assert.equal(calcularCruzamentosCorredores([a, b, { ...a, origem: 'e' }]).length, 1);
});

function nomesDosSegmentos(segmentos) {
  // Uma relação pode ocupar vários trechos sem criar outras chamadas.
  return [...new Set(segmentos.map(segmento => `${segmento.origem}->${segmento.destino}`))];
}

test('cria apenas o corredor main -> a', () => {
  assert.deepEqual(
    nomesDosSegmentos(criarSegmentosDeCorredores(salas, [
      { origem: 'main', destino: 'a' },
    ])),
    ['main->a']
  );
});

test('não cria main -> b quando a chamada é main -> a -> b', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'a' },
    { origem: 'a', destino: 'b' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['main->a', 'a->b']);
});

test('preserva ramificação e múltiplos callers', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'a' },
    { origem: 'main', destino: 'b' },
    { origem: 'a', destino: 'c' },
    { origem: 'b', destino: 'c' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), [
    'main->a', 'main->b', 'a->c', 'b->c',
  ]);
});

test('ignora função isolada, sala ausente e aresta duplicada', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'ausente' },
    { origem: 'main', destino: 'a' },
    { origem: 'main', destino: 'a' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['main->a']);
});

test('ignora autoaresta sem criar segmento degenerado', () => {
  assert.deepEqual(
    criarSegmentosDeCorredores(salas, [{ origem: 'a', destino: 'a' }]),
    []
  );
});

test('preserva os dois segmentos de um ciclo sem recursão de renderização', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'a', destino: 'b' },
    { origem: 'b', destino: 'a' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['a->b', 'b->a']);
});

function naBorda(ponto, sala) {
  return ponto.x >= sala.x && ponto.x <= sala.x + sala.largura &&
    ponto.y >= sala.y && ponto.y <= sala.y + sala.altura &&
    (ponto.x === sala.x || ponto.x === sala.x + sala.largura ||
      ponto.y === sala.y || ponto.y === sala.y + sala.altura);
}

test('caminho ortogonal contínuo conecta bordas sem alterar salas ou arestas', () => {
  const arestas = [{ origem: 'main', destino: 'c' }];
  const antes = structuredClone({ salas, arestas });
  const segmentos = criarSegmentosDeCorredores(salas, arestas);
  assert.ok(segmentos.length > 1);
  assert.ok(naBorda(segmentos[0].inicio, salas[0]));
  assert.ok(naBorda(segmentos.at(-1).fim, salas[3]));
  for (let indice = 0; indice < segmentos.length; indice++) {
    const { inicio, fim, origem, destino, fallbackDireto } = segmentos[indice];
    assert.equal(origem, 'main');
    assert.equal(destino, 'c');
    assert.ok(inicio.x === fim.x || inicio.y === fim.y);
    assert.notDeepEqual(inicio, fim);
    assert.equal(fallbackDireto, undefined);
    if (indice) assert.deepEqual(inicio, segmentos[indice - 1].fim);
  }
  assert.deepEqual({ salas, arestas }, antes);
  assert.deepEqual(segmentos, criarSegmentosDeCorredores(salas, arestas));
});

test('desvia de salas alheias em vez de transformar o atravessamento em conexão', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [{ origem: 'main', destino: 'b' }]);
  assert.ok(segmentos.length >= 3);
  assert.equal(medirCorredores(salas, segmentos).corredoresAtravessandoSalas, 0);
  assert.ok(segmentos.every(segmento => !segmento.fallbackDireto));
  assert.ok(naBorda(segmentos[0].inicio, salas[0]));
  assert.ok(naBorda(segmentos.at(-1).fim, salas[2]));
  assert.deepEqual(nomesDosSegmentos(segmentos), ['main->b']);
});

test('geometria sobreposta usa fallback direto identificável sem criar aresta', () => {
  const sobrepostas = [salas[0], salas[2],
    { nome: 'bloqueio', x: 0, y: 0, largura: 100, altura: 100 }];
  const segmentos = criarSegmentosDeCorredores(sobrepostas,
    [{ origem: 'main', destino: 'b' }]);
  assert.deepEqual(segmentos, [{ origem: 'main', destino: 'b',
    inicio: { x: 10, y: 10 }, fim: { x: 210, y: 10 }, fallbackDireto: true }]);
});
