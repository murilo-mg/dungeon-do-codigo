import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proximoZoomDiscreto } from '../js/zoomDiscreto.js';

test('Encaixar em 42% entra nos níveis canônicos e volta pelo mesmo caminho', () => {
  let zoom = 0.42;
  const ida = [zoom];
  for (let indice = 0; indice < 7; indice++) {
    zoom = proximoZoomDiscreto(zoom, 0.42, 1);
    ida.push(zoom);
  }
  assert.deepEqual(ida, [0.42, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  assert.equal(proximoZoomDiscreto(2, 0.42, 1), 2);

  const volta = [zoom];
  for (let indice = 0; indice < 7; indice++) {
    zoom = proximoZoomDiscreto(zoom, 0.42, -1);
    volta.push(zoom);
  }
  assert.deepEqual(volta, [...ida].reverse());
  assert.equal(proximoZoomDiscreto(0.42, 0.42, -1), 0.42);
});

test('Encaixar em 63% pula 50% e se mantém como mínimo', () => {
  assert.equal(proximoZoomDiscreto(0.63, 0.63, 1), 0.75);
  assert.equal(proximoZoomDiscreto(0.75, 0.63, -1), 0.63);
  assert.equal(proximoZoomDiscreto(0.63, 0.63, -1), 0.63);
});

test('Encaixar coincidente com 75% não duplica degraus', () => {
  assert.equal(proximoZoomDiscreto(0.75, 0.75, 1), 1);
  assert.equal(proximoZoomDiscreto(1, 0.75, -1), 0.75);
  assert.equal(proximoZoomDiscreto(1, 1, -1), 1);
});

test('valor intermediário converge para o próximo degrau em cada direção', () => {
  assert.equal(proximoZoomDiscreto(0.67, 0.42, 1), 0.75);
  assert.equal(proximoZoomDiscreto(0.67, 0.42, -1), 0.5);
});
