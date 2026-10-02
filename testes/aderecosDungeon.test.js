import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desenharAdereco, limitesAdereco } from '../js/aderecosDungeon.js';
import { criarCenario } from '../js/cenario.js';

const tipos = ['bandeira', 'caixa', 'bau', 'barril', 'cranio'];

test('adereços ocupam seus limites inteiros em ambas as versões visuais', () => {
  for (const tipo of tipos) for (const escala of [1, 2, 3]) for (const detalhar of [false, true]) {
    const limites = limitesAdereco(tipo, 73.3, 86.7, escala);
    const desenhar = () => {
      const pixels = [];
      const ctx = { fillRect(x, y, largura, altura) {
        pixels.push({ x, y, largura, altura, cor: this.fillStyle });
      } };
      desenharAdereco(ctx, tipo, 73.3, 86.7, detalhar, escala);
      return pixels;
    };
    const pixels = desenhar();
    assert.ok(pixels.length > 30, tipo);
    assert.deepEqual(desenhar(), pixels);
    for (const pixel of pixels) {
      assert.ok(Number.isInteger(pixel.x) && Number.isInteger(pixel.y));
      assert.ok(pixel.x >= limites.x && pixel.y >= limites.y);
      assert.ok(pixel.x + pixel.largura <= limites.x + limites.largura);
      assert.ok(pixel.y + pixel.altura <= limites.y + limites.altura);
      assert.match(pixel.cor, /^#[a-f0-9]{6}$/);
    }
  }
});

test('cenário inclui os novos tipos sem empilhar objetos ou ocupar salas', () => {
  const salas = [{ x: 235, y: 200, largura: 90, altura: 80 },
    { x: 250, y: 40, largura: 60, altura: 60 }];
  const antes = structuredClone(salas);
  const cenario = criarCenario(salas, 560, 480);
  for (const tipo of tipos) assert.ok(cenario.decoracoes.some(d => d.tipo === tipo), tipo);
  const areas = cenario.decoracoes.filter(d => tipos.includes(d.tipo))
    .map(d => limitesAdereco(d.tipo, d.x, d.y));
  const separados = (a, b) => a.x + a.largura <= b.x || b.x + b.largura <= a.x ||
    a.y + a.altura <= b.y || b.y + b.altura <= a.y;
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    assert.ok(area.x >= 0 && area.y >= 0 && area.x + area.largura <= 560 && area.y + area.altura <= 480);
    for (const sala of salas) assert.ok(separados(area, sala));
    for (const outra of areas.slice(i + 1)) assert.ok(separados(area, outra));
  }
  assert.deepEqual(criarCenario(salas, 560, 480), cenario);
  assert.deepEqual(salas, antes);
});
