import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSegmentosDeCorredores } from '../js/corredores.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';

const salas = [
  { nome: 'main', x: 60, y: 60, largura: 80, altura: 80 },
  { nome: 'A', x: 170, y: 70, largura: 60, altura: 60 },
  { nome: 'B', x: 170, y: 170, largura: 60, altura: 60 },
  { nome: 'isolada', x: 370, y: 70, largura: 60, altura: 60 },
];
const segmentos = criarSegmentosDeCorredores(salas, [
  { origem: 'main', destino: 'A' }, { origem: 'A', destino: 'B' },
]);

test('rota segue centros de salas e corredores reais sem cortar caminho', () => {
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'B'), [
    { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 200, y: 200 }, 'main'), [
    { x: 200, y: 200 }, { x: 200, y: 100 }, { x: 100, y: 100 },
  ]);
});

test('partida sobre corredor segue a faixa existente até uma sala conectada', () => {
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 150, y: 103 }, 'B'), [
    { x: 150, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
});

test('fora da faixa e destino desconectado não produzem caminho artificial', () => {
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 150, y: 120 }, 'B'), null);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'isolada'), null);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'ausente'), null);
});

test('trecho colinear compartilhado oferece a mesma junção do movimento manual sem modificar dados', () => {
  const salasCruzadas = [
    { nome: 'a', x: 70, y: 70, largura: 60, altura: 60 },
    { nome: 'b', x: 270, y: 270, largura: 60, altura: 60 },
    { nome: 'c', x: 70, y: 270, largura: 60, altura: 60 },
    { nome: 'd', x: 270, y: 70, largura: 60, altura: 60 },
  ];
  const corredores = criarSegmentosDeCorredores(salasCruzadas, [
    { origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' },
  ]);
  const salasAntes = structuredClone(salasCruzadas);
  const corredoresAntes = structuredClone(corredores);

  // O roteamento ortogonal compartilha o eixo vertical entre as duas curvas.
  // O automático agora usa essa junção que já era permitida pelo movimento manual.
  assert.deepEqual(calcularRotaCaminhavel(salasCruzadas, corredores, { x: 100, y: 100 }, 'd'),
    [{ x: 100, y: 100 }, { x: 300, y: 100 }]);
  assert.deepEqual(salasCruzadas, salasAntes);
  assert.deepEqual(corredores, corredoresAntes);
});

test('ciclos e chamadas em sentidos opostos terminam sem alterar o grafo físico', () => {
  const corredores = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'A' }, { origem: 'A', destino: 'main' },
    { origem: 'A', destino: 'B' }, { origem: 'B', destino: 'A' },
    { origem: 'B', destino: 'B' },
  ]);
  const antes = structuredClone(corredores);
  assert.deepEqual(calcularRotaCaminhavel(salas, corredores,
    { x: 100, y: 100 }, 'B'), [
    { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
  assert.deepEqual(corredores, antes);
});

const salasComCurvas = [
  { nome: 'origem', x: 20, y: 20, largura: 20, altura: 20 },
  { nome: 'destino', x: 220, y: 120, largura: 20, altura: 20 },
];
const corredoresComCurvas = criarSegmentosDeCorredores(salasComCurvas,
  [{ origem: 'origem', destino: 'destino' }]);

test('navegação percorre todos os cotovelos da mesma relação em ambos os sentidos', () => {
  const caminho = [
    { x: 30, y: 30 }, { x: 130, y: 30 }, { x: 130, y: 130 }, { x: 230, y: 130 },
  ];
  assert.deepEqual(calcularRotaCaminhavel(salasComCurvas, corredoresComCurvas,
    caminho[0], 'destino'), caminho);
  assert.deepEqual(calcularRotaCaminhavel(salasComCurvas, corredoresComCurvas,
    caminho.at(-1), 'origem'), [...caminho].reverse());
});

test('partida no trecho intermediário mantém as curvas restantes até qualquer ponta', () => {
  assert.deepEqual(calcularRotaCaminhavel(salasComCurvas, corredoresComCurvas,
    { x: 133, y: 80 }, 'destino'), [
    { x: 130, y: 80 }, { x: 130, y: 130 }, { x: 230, y: 130 },
  ]);
  assert.deepEqual(calcularRotaCaminhavel(salasComCurvas, corredoresComCurvas,
    { x: 133, y: 80 }, 'origem'), [
    { x: 130, y: 80 }, { x: 130, y: 30 }, { x: 30, y: 30 },
  ]);
});

test('custo da rota considera o caminho inteiro em vez do menor trecho da aresta', () => {
  const salas = ['a', 'b', 'c'].map((nome, indice) =>
    ({ nome, x: 10 + indice * 100, y: 10, largura: 20, altura: 20 }));
  const segmentos = [
    { origem: 'a', destino: 'c', inicio: { x: 20, y: 20 }, fim: { x: 20, y: 420 } },
    { origem: 'a', destino: 'c', inicio: { x: 20, y: 420 }, fim: { x: 220, y: 420 } },
    { origem: 'a', destino: 'c', inicio: { x: 220, y: 420 }, fim: { x: 220, y: 20 } },
    { origem: 'a', destino: 'b', inicio: { x: 20, y: 20 }, fim: { x: 120, y: 20 } },
    { origem: 'b', destino: 'c', inicio: { x: 120, y: 20 }, fim: { x: 220, y: 20 } },
  ];
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 20, y: 20 }, 'c'),
    [{ x: 20, y: 20 }, { x: 220, y: 20 }]);
});

test('cruzamento ortogonal não conecta componentes independentes', () => {
  const salas = [
    { nome: 'a', x: 90, y: 190, largura: 20, altura: 20 },
    { nome: 'b', x: 290, y: 190, largura: 20, altura: 20 },
    { nome: 'c', x: 190, y: 90, largura: 20, altura: 20 },
    { nome: 'd', x: 190, y: 290, largura: 20, altura: 20 },
  ];
  const segmentos = criarSegmentosDeCorredores(salas,
    [{ origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' }]);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 200 }, 'd'), null);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 150, y: 200 }, 'd'), null);
});
