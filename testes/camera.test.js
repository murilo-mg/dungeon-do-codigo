import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atualizarCamera, criarCamera, definirZoom, dimensoesVisiveis,
  encaixarCamera, zoomParaEncaixar } from '../js/camera.js';

function criarCameraGrande() {
  return criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 1200,
    alturaMundo: 1000,
  });
}

test('câmera começa em 100% e mantém os valores físicos do mundo', () => {
  const camera = criarCameraGrande();
  assert.equal(camera.zoom, 1);
  assert.deepEqual(dimensoesVisiveis(camera), { largura: 560, altura: 480 });
  assert.deepEqual({ larguraMundo: camera.larguraMundo, alturaMundo: camera.alturaMundo },
    { larguraMundo: 1200, alturaMundo: 1000 });
});

test('zoom de 50% dobra a região visível e o clamp usa essa região', () => {
  const camera = definirZoom(criarCameraGrande(), 0.5);
  assert.deepEqual(dimensoesVisiveis(camera), { largura: 1120, altura: 960 });
  const final = atualizarCamera(camera, { x: 1200, y: 1000 });
  assert.deepEqual({ x: final.x, y: final.y }, { x: 80, y: 40 });
});

test('alvo perto da borda permanece dentro dos limites após zoom', () => {
  const camera = definirZoom(criarCameraGrande(), 2);
  assert.deepEqual({ x: atualizarCamera(camera, { x: 0, y: 0 }).x,
    y: atualizarCamera(camera, { x: 0, y: 0 }).y }, { x: 0, y: 0 });
  assert.deepEqual({ x: atualizarCamera(camera, { x: 1200, y: 1000 }).x,
    y: atualizarCamera(camera, { x: 1200, y: 1000 }).y }, { x: 920, y: 760 });
});

test('zoom manual respeita máximo e mínimo da dungeon', () => {
  const camera = criarCameraGrande();
  assert.equal(definirZoom(camera, 3).zoom, 2);
  assert.equal(definirZoom(camera, 0.01).zoom, zoomParaEncaixar(camera));
});

test('valores inválidos preservam câmera finita', () => {
  const camera = atualizarCamera(criarCameraGrande(), { x: 600, y: 500 });
  for (const valor of [0, -1, NaN, Infinity, -Infinity]) {
    assert.deepEqual(definirZoom(camera, valor), camera);
  }
});

for (const [nome, larguraMundo, alturaMundo, esperado] of [
  ['largo', 2800, 480, 0.2],
  ['alto', 560, 2400, 0.2],
  ['largo e alto', 2800, 4800, 0.1],
  ['menor que viewport', 300, 200, 1],
]) {
  test(`encaixar mundo ${nome} mostra toda a dungeon sem ampliar além de 100%`, () => {
    const camera = criarCamera({ larguraViewport: 560, alturaViewport: 480,
      larguraMundo, alturaMundo });
    const encaixada = encaixarCamera(camera);
    assert.equal(encaixada.zoom, esperado);
    assert.deepEqual({ x: encaixada.x, y: encaixada.y }, { x: 0, y: 0 });
    const visivel = dimensoesVisiveis(encaixada);
    assert.ok(visivel.largura >= larguraMundo);
    assert.ok(visivel.altura >= alturaMundo);
  });
}

test('zoom e encaixe não mutam a câmera e são determinísticos', () => {
  const camera = criarCameraGrande();
  assert.deepEqual(definirZoom(camera, 1.25), definirZoom(camera, 1.25));
  assert.deepEqual(encaixarCamera(camera), encaixarCamera(camera));
  assert.deepEqual(camera, criarCameraGrande());
});

test('mundo igual ao viewport mantém a câmera em 0,0', () => {
  const camera = criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 560,
    alturaMundo: 480,
  });

  assert.deepEqual(atualizarCamera(camera, { x: 280, y: 240 }), {
    ...camera,
    x: 0,
    y: 0,
  });
});

test('canto superior esquerdo limita a câmera em 0,0', () => {
  const camera = atualizarCamera(criarCameraGrande(), { x: 0, y: 0 });

  assert.equal(camera.x, 0);
  assert.equal(camera.y, 0);
});

test('centro do mundo centraliza o alvo no viewport', () => {
  const camera = atualizarCamera(criarCameraGrande(), { x: 600, y: 500 });

  assert.equal(camera.x, 320);
  assert.equal(camera.y, 260);
});

test('bordas direita e inferior limitam a câmera ao máximo', () => {
  const camera = atualizarCamera(criarCameraGrande(), { x: 1199, y: 999 });

  assert.equal(camera.x, 640);
  assert.equal(camera.y, 520);
});

test('canto inferior direito usa os dois limites máximos', () => {
  const camera = atualizarCamera(criarCameraGrande(), { x: 1200, y: 1000 });

  assert.deepEqual({ x: camera.x, y: camera.y }, { x: 640, y: 520 });
});

test('mundo maior apenas horizontalmente limita somente x', () => {
  const camera = criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 1000,
    alturaMundo: 480,
  });

  const atualizada = atualizarCamera(camera, { x: 800, y: 240 });
  assert.equal(atualizada.x, 440);
  assert.equal(atualizada.y, 0);
});

test('mundo maior apenas verticalmente limita somente y', () => {
  const camera = criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 560,
    alturaMundo: 900,
  });

  const atualizada = atualizarCamera(camera, { x: 280, y: 700 });
  assert.equal(atualizada.x, 0);
  assert.equal(atualizada.y, 420);
});

test('câmera nunca assume valores negativos ou ultrapassa o mundo', () => {
  const camera = criarCameraGrande();
  for (const alvo of [
    { x: -100, y: -100 },
    { x: 0, y: 0 },
    { x: 600, y: 500 },
    { x: 2000, y: 2000 },
  ]) {
    const atualizada = atualizarCamera(camera, alvo);
    assert.ok(atualizada.x >= 0);
    assert.ok(atualizada.y >= 0);
    assert.ok(atualizada.x <= camera.larguraMundo - camera.larguraViewport);
    assert.ok(atualizada.y <= camera.alturaMundo - camera.alturaViewport);
  }
});

test('mundo menor ou igual ao viewport permanece em 0,0', () => {
  const camera = criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 300,
    alturaMundo: 200,
  });

  assert.deepEqual(atualizarCamera(camera, { x: 1500, y: 1500 }), {
    ...camera,
    x: 0,
    y: 0,
  });
});

test('mesma entrada produz resultado determinístico', () => {
  const camera = criarCameraGrande();
  assert.deepEqual(
    atualizarCamera(camera, { x: 777, y: 321 }),
    atualizarCamera(camera, { x: 777, y: 321 })
  );
});
