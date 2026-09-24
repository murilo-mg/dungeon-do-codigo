import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atualizarCamera, criarCamera } from '../js/camera.js';

function criarCameraGrande() {
  return criarCamera({
    larguraViewport: 560,
    alturaViewport: 480,
    larguraMundo: 1200,
    alturaMundo: 1000,
  });
}

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
