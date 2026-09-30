import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';
import { encaixarMasmorra, focarSala, iniciarJogo, pararJogo,
  restaurarZoomCamera } from '../js/jogo.js';

function criarMundo() {
  return {
    salas: [
      { nome: 'main', complexidade: 0, x: 60, y: 60, largura: 80, altura: 80,
        ehSalaInicial: true },
      { nome: 'distante', complexidade: 4, x: 900, y: 700, largura: 80, altura: 80 },
    ],
    larguraMundo: 1600,
    alturaMundo: 1200,
  };
}

test('bitmap usa o viewport disponível e redimensionar conserva Encaixar e coordenadas físicas', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  canvas.clientWidth = 1000;
  canvas.clientHeight = 600;
  const mundo = criarMundo();
  const antes = structuredClone(mundo);
  const zooms = [];
  iniciarJogo(mundo, [], () => {}, undefined, zoom => zooms.push(zoom));
  ambiente.avancar();
  assert.equal(canvas.width, 1000);
  assert.equal(canvas.height, 600);
  const personagem = canvas.posicoesPersonagem.at(-1);

  assert.equal(encaixarMasmorra(), 0.5);
  canvas.clientWidth = 720;
  canvas.clientHeight = 480;
  ambiente.janela.emitir('resize');
  ambiente.avancar();
  assert.equal(canvas.width, 720);
  assert.equal(canvas.height, 480);
  assert.equal(zooms.at(-1), 0.4);
  assert.deepEqual(canvas.escalas.at(-1), { x: 0.4, y: 0.4 });
  assert.equal(canvas.translacoes.at(-1).x, 100);
  assert.equal(Math.abs(canvas.translacoes.at(-1).y), 0);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), personagem);
  assert.deepEqual(mundo, antes);
  pararJogo();
});

test('resize mantém foco da sala e clique com borda e escala CSS', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const mundo = criarMundo();
  const selecoes = [];
  iniciarJogo(mundo, [], () => {}, undefined, undefined, nome => {
    selecoes.push(nome);
    return focarSala(nome);
  });
  ambiente.avancar();
  const personagem = canvas.posicoesPersonagem.at(-1);
  focarSala('distante');
  canvas.clientWidth = 800;
  canvas.clientHeight = 600;
  ambiente.janela.emitir('resize');
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), { x: 1, y: 1 });
  assert.deepEqual(canvas.translacoes.at(-1), { x: -540, y: -440 });
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), personagem);

  // A escala CSS pode diferir do bitmap enquanto o observador aguarda o layout.
  canvas.clientWidth = 400;
  canvas.clientHeight = 300;
  canvas.clientLeft = 1;
  canvas.clientTop = 1;
  canvas.retangulo = { left: 30, top: 40, width: 402, height: 302 };
  canvas.emitir('click', { clientX: 231, clientY: 191, button: 0, detail: 1 });
  assert.deepEqual(selecoes, ['distante']);
  assert.equal(restaurarZoomCamera(), 1);
  pararJogo();
});

test('observador acompanha mudanças do contêiner e é desligado ao sair do jogo', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  let atualizar;
  let observado;
  let desconectado = false;
  ambiente.janela.ResizeObserver = class {
    constructor(callback) { atualizar = callback; }
    observe(elemento) { observado = elemento; }
    disconnect() { desconectado = true; }
  };
  iniciarJogo(criarMundo(), [], () => {});
  assert.equal(observado, canvas);
  canvas.clientWidth = 900;
  canvas.clientHeight = 500;
  atualizar();
  assert.equal(canvas.width, 900);
  assert.equal(canvas.height, 500);
  canvas.clientWidth = 0;
  canvas.clientHeight = 0;
  atualizar();
  assert.equal(canvas.width, 900);
  assert.equal(canvas.height, 500);

  pararJogo();
  assert.equal(desconectado, true);
  assert.equal(ambiente.janela.ouvintes.get('resize').size, 0);
  canvas.clientWidth = 700;
  atualizar();
  assert.equal(canvas.width, 900);
});
