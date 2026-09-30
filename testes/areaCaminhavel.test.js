import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAreaCaminhavel, localizarNaArea, moverNaArea } from '../js/areaCaminhavel.js';
import { chaveDoCorredor, criarSegmentosDeCorredores, LARGURA_CORREDOR } from '../js/corredores.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';
import { criarPersonagem, atualizarPersonagem } from '../js/personagem.js';
import { criarGrafo } from '../js/grafoC.js';
import { construirMasmorra } from '../js/masmorra.js';

const sala = (nome, x, y, largura = 40, altura = 40) => ({ nome, x, y, largura, altura });

function cenario(salas, arestas, inicio, segmentos = criarSegmentosDeCorredores(salas, arestas)) {
  const area = criarAreaCaminhavel(salas, segmentos);
  let estado = { ...inicio, local: localizarNaArea(area, inicio) };
  return {
    area, segmentos,
    get estado() { return estado; },
    mover(x, y) {
      estado = moverNaArea(area, estado.local, estado, { x, y });
      return estado;
    },
  };
}

test('sala isolada permite movimento livre dentro dela e bloqueia paredes e vazio', () => {
  const mundo = cenario([sala('a', 20, 20)], [], { x: 40, y: 40 });
  const livre = mundo.mover(7, -9);
  assert.ok(Math.abs(livre.x - 47) < 1e-6 && Math.abs(livre.y - 31) < 1e-6);
  assert.deepEqual(livre.local, { sala: 'a', corredores: [] });
  for (const [dx, dy] of [[100, 0], [0, 100], [-100, 0], [0, -100], [300, 300]]) {
    const ponto = mundo.mover(dx, dy);
    assert.ok(ponto.x >= 20 && ponto.x <= 60);
    assert.ok(ponto.y >= 20 && ponto.y <= 60);
    assert.equal(ponto.local.sala, 'a');
  }
});

test('salas próximas sem chamada não viram passagem, mesmo com um salto grande', () => {
  const mundo = cenario([sala('a', 20, 20), sala('b', 60.1, 20)], [], { x: 40, y: 40 });
  const final = mundo.mover(1000, 0);
  assert.ok(final.x <= 60 && final.x > 59.99);
  assert.equal(final.local.sala, 'a');
});

test('diagonal desliza junto à parede sem atravessá-la nem prender os dois eixos', () => {
  const mundo = cenario([sala('a', 20, 20, 40, 120)], [], { x: 55, y: 40 });
  const final = mundo.mover(40, 40);
  assert.ok(final.x <= 60 && final.x > 59.99);
  assert.ok(Math.abs(final.y - 80) < 1e-6);
});

test('conexão real admite ida e volta pelas portas com folga lateral no corredor', () => {
  const salas = [sala('a', 20, 20), sala('b', 180, 20)];
  const mundo = cenario(salas, [{ origem: 'a', destino: 'b' }], { x: 40, y: 43 });
  const noCorredor = mundo.mover(60, 0);
  assert.ok(Math.abs(noCorredor.y - 43) < 1e-6); // Não prende ao centro y=40.
  assert.equal(noCorredor.local.sala, null);
  assert.ok(Math.abs(mundo.mover(0, 100).y - (40 + LARGURA_CORREDOR / 2)) < 0.001);
  assert.equal(mundo.mover(100, 0).local.sala, 'b');
  assert.equal(mundo.mover(-160, 0).local.sala, 'a');
});

test('parede ao lado de uma porta continua fechada', () => {
  const mundo = cenario([sala('a', 20, 20), sala('b', 180, 20)],
    [{ origem: 'a', destino: 'b' }], { x: 40, y: 40 - LARGURA_CORREDOR / 2 - 3 });
  assert.ok(mundo.mover(150, 0).x <= 60);
  mundo.mover(0, LARGURA_CORREDOR / 2 + 3);
  assert.equal(mundo.mover(140, 0).local.sala, 'b');
});

test('cotovelos mantêm continuidade e bloqueiam corte diagonal pelo vazio', () => {
  const mundo = cenario([sala('a', 20, 20), sala('b', 220, 120)],
    [{ origem: 'a', destino: 'b' }], { x: 40, y: 40 });
  mundo.mover(100, 0);
  const canto = mundo.mover(40, 40);
  assert.ok(canto.x <= 140 + LARGURA_CORREDOR / 2 && canto.y > 60);
  mundo.mover(140 - canto.x, 140 - canto.y);
  assert.equal(mundo.mover(100, 0).local.sala, 'b');
});

const salasCruzadas = [sala('a', 20, 100), sala('b', 260, 100),
  sala('c', 140, 20), sala('d', 140, 220)];
const arestasCruzadas = [{ origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' }];

test('cruzamento não permite mudar de corredor durante movimento manual', () => {
  const mundo = cenario(salasCruzadas, arestasCruzadas, { x: 40, y: 120 });
  mundo.mover(120, 0);
  assert.ok(mundo.mover(0, 100).y <= 120 + LARGURA_CORREDOR / 2);
  assert.deepEqual(mundo.estado.local.corredores, [chaveDoCorredor('a', 'b')]);
  mundo.mover(0, -5);
  assert.equal(mundo.mover(120, 0).local.sala, 'b');
});

test('navegação automática iniciada no cruzamento respeita o corredor físico atual', () => {
  const mundo = cenario(salasCruzadas, arestasCruzadas, { x: 40, y: 120 });
  mundo.mover(120, 0);
  const { estado } = mundo;
  assert.equal(calcularRotaCaminhavel(salasCruzadas, mundo.segmentos,
    estado, 'd', estado.local), null);
  assert.ok(calcularRotaCaminhavel(salasCruzadas, mundo.segmentos,
    estado, 'b', estado.local));
});

test('saídas coincidentes conservam alternativas até a escolha física da curva', () => {
  const salas = [sala('a', 20, 80), sala('b', 180, 80), sala('c', 100, 180)];
  const segmentos = [
    { origem: 'a', destino: 'b', inicio: { x: 60, y: 100 }, fim: { x: 180, y: 100 } },
    { origem: 'a', destino: 'c', inicio: { x: 60, y: 100 }, fim: { x: 120, y: 100 } },
    { origem: 'a', destino: 'c', inicio: { x: 120, y: 100 }, fim: { x: 120, y: 180 } },
  ];
  for (const destino of ['b', 'c']) {
    const mundo = cenario(salas, [], { x: 40, y: 100 }, segmentos);
    mundo.mover(80, 0);
    assert.equal(mundo.estado.local.corredores.length, 2);
    const final = destino === 'b' ? mundo.mover(80, 0) : mundo.mover(0, 100);
    assert.equal(final.local.sala, destino);
  }
});

test('junção com trecho compartilhado permite trocar de percurso sem entrar em sala', () => {
  const salas = [
    sala('a', 0, 0), sala('b', 300, 0),
    sala('c', 0, 200), sala('d', 300, 200),
  ];
  const segmentos = [
    { id: 'a-b', origem: 'a', destino: 'b', inicio: { x: 40, y: 20 }, fim: { x: 200, y: 20 } },
    { id: 'a-b', origem: 'a', destino: 'b', inicio: { x: 200, y: 20 }, fim: { x: 200, y: 120 } },
    { id: 'a-b', origem: 'a', destino: 'b', inicio: { x: 200, y: 120 }, fim: { x: 300, y: 120 } },
    { id: 'a-b', origem: 'a', destino: 'b', inicio: { x: 300, y: 120 }, fim: { x: 300, y: 20 } },
    { id: 'c-d', origem: 'c', destino: 'd', inicio: { x: 40, y: 220 }, fim: { x: 200, y: 220 } },
    { id: 'c-d', origem: 'c', destino: 'd', inicio: { x: 200, y: 220 }, fim: { x: 200, y: 120 } },
    { id: 'c-d', origem: 'c', destino: 'd', inicio: { x: 200, y: 120 }, fim: { x: 300, y: 120 } },
    { id: 'c-d', origem: 'c', destino: 'd', inicio: { x: 300, y: 120 }, fim: { x: 300, y: 220 } },
  ];
  const mundo = cenario(salas, [], { x: 40, y: 20 }, segmentos);

  mundo.mover(160, 0);
  mundo.mover(0, 99);

  const junção = mundo.mover(0, 1);
  assert.deepEqual(junção.local.corredores, ['a-b', 'c-d']);
  mundo.mover(100, 0);
  assert.equal(mundo.mover(0, 100).local.sala, 'd');
});

test('sala atravessada geometricamente não vira entrada por coincidência', () => {
  const salas = [sala('a', 20, 100), sala('b', 260, 100), sala('c', 140, 100)];
  const segmentos = [{ origem: 'a', destino: 'b',
    inicio: { x: 60, y: 120 }, fim: { x: 260, y: 120 } }];
  const mundo = cenario(salas, [], { x: 40, y: 120 }, segmentos);
  mundo.mover(120, 0);
  assert.equal(mundo.estado.local.sala, null);
  assert.ok(mundo.mover(0, 50).y <= 120 + LARGURA_CORREDOR / 2);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, mundo.estado, 'c', mundo.estado.local), null);
});

test('colisão não altera salas ou segmentos', () => {
  const salas = [sala('a', 20, 20), sala('b', 180, 20)];
  const segmentos = criarSegmentosDeCorredores(salas, [{ origem: 'a', destino: 'b' }]);
  const antes = structuredClone({ salas, segmentos });
  const mundo = cenario(salas, [], { x: 40, y: 40 }, segmentos);
  mundo.mover(160, 0);
  mundo.mover(-160, 0);
  assert.deepEqual({ salas, segmentos }, antes);
});

test('automático pode partir da folga externa de um cotovelo sem prender ao centro', () => {
  const salas = [sala('a', 20, 20), sala('b', 220, 120)];
  const mundo = cenario(salas, [{ origem: 'a', destino: 'b' }], { x: 40, y: 40 });
  mundo.mover(100, 0);
  mundo.mover(4, -4);
  const rota = calcularRotaCaminhavel(salas, mundo.segmentos,
    mundo.estado, 'b', mundo.estado.local);
  assert.ok(rota);
  for (const ponto of rota) mundo.mover(ponto.x - mundo.estado.x, ponto.y - mundo.estado.y);
  assert.equal(mundo.estado.local.sala, 'b');
});

test('movimento com colisão mantém velocidade em 30, 60 e 144 Hz e para a animação na parede', () => {
  for (const quadros of [30, 60, 144]) {
    const salas = [sala('a', 20, 20), sala('b', 260, 20)];
    const area = criarAreaCaminhavel(salas,
      criarSegmentosDeCorredores(salas, [{ origem: 'a', destino: 'b' }]));
    const jogador = criarPersonagem(40, 40);
    let local = localizarNaArea(area, jogador);
    const resolver = (ponto, delta) => {
      const resultado = moverNaArea(area, local, ponto, delta);
      local = resultado.local;
      return resultado;
    };
    for (let i = 0; i < quadros; i++) atualizarPersonagem(jogador, { x: 1, y: 0 },
      1 / quadros, { largura: 400, altura: 200 }, false, resolver);
    assert.ok(Math.abs(jogador.x - 196) < 1e-6);
    assert.ok(jogador.andando);
    for (let i = 0; i < quadros; i++) atualizarPersonagem(jogador, { x: 0, y: 1 },
      1 / quadros, { largura: 400, altura: 200 }, true, resolver);
    assert.ok(jogador.y <= 40 + LARGURA_CORREDOR / 2);
    assert.equal(jogador.andando, false);
    assert.deepEqual(jogador.passos, []);
  }
});

test('mundo vazio bloqueia deslocamento e não cria piso artificial', () => {
  const mundo = cenario([], [], { x: 280, y: 240 });
  assert.deepEqual(mundo.mover(100, 100), {
    x: 280, y: 240, local: { sala: null, corredores: [] },
  });
});

test('layout regional mantém todas as chamadas caminháveis nos dois sentidos', () => {
  const funcoes = [
    { nome: 'main', chamadas: ['parse_a', 'parse_b', 'vm_a'] },
    { nome: 'parse_a', chamadas: ['comum', 'parse_b'] },
    { nome: 'parse_b', chamadas: ['comum', 'vm_b'] },
    { nome: 'vm_a', chamadas: ['comum', 'vm_b'] },
    { nome: 'vm_b', chamadas: ['vm_a'] },
    { nome: 'comum', chamadas: [] },
    { nome: 'solta_a', chamadas: ['solta_b'] },
    { nome: 'solta_b', chamadas: [] },
  ].map((funcao, indice) => ({ ...funcao, complexidade: indice * 3, linhas: 10 }));
  const grafo = criarGrafo(funcoes);
  const mundo = construirMasmorra(funcoes, grafo, { layoutRegional: true });
  const segmentos = criarSegmentosDeCorredores(mundo.salas, grafo.arestas);
  assert.ok(segmentos.every(segmento => !segmento.fallbackDireto));
  for (const aresta of grafo.arestas) {
    for (const [origem, destino] of [[aresta.origem, aresta.destino], [aresta.destino, aresta.origem]]) {
      const sala = mundo.salas.find(sala => sala.nome === origem);
      const fisica = cenario(mundo.salas, [],
        { x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 }, segmentos);
      const rota = calcularRotaCaminhavel(mundo.salas, segmentos,
        fisica.estado, destino, fisica.estado.local);
      assert.ok(rota, `${origem} → ${destino}`);
      for (const ponto of rota) fisica.mover(ponto.x - fisica.estado.x, ponto.y - fisica.estado.y);
      assert.equal(fisica.estado.local.sala, destino, `${origem} → ${destino}`);
    }
  }
});
