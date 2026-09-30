import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificarVisualmenteCorredores } from '../js/semanticaVisual.js';
import { chaveDoCorredor } from '../js/corredores.js';
import { desenharPlacaRegiao } from '../js/desenhoMasmorra.js';
import { criarAmbiente } from './ambiente.js';

test('acabamento local ou entre alas usa só membros existentes, sem importância inferida', () => {
  const regioes = [{ id: 'r1', funcoes: ['main', 'a'] }, { id: 'r2', funcoes: ['b'] }];
  const arestas = [{ origem: 'main', destino: 'a' }, { origem: 'a', destino: 'b' },
    { origem: 'ausente', destino: 'b' }];
  const antes = structuredClone({ regioes, arestas });
  const estilos = classificarVisualmenteCorredores(regioes, arestas);
  assert.equal(estilos.get(chaveDoCorredor('main', 'a')), 'interno');
  assert.equal(estilos.get(chaveDoCorredor('a', 'b')), 'entre-regioes');
  assert.equal(estilos.get(chaveDoCorredor('ausente', 'b')), 'sem-regiao');
  assert.equal(estilos.size, arestas.length);
  assert.deepEqual({ regioes, arestas }, antes);
});

test('placa distante aumenta o título, mantém duas linhas separadas e cabe no cabeçalho', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const contexto = canvas.getContext('2d');
  // Medição proporcional à fonte, para capturar regressões escondidas por fonte fixa.
  contexto.measureText = function(texto) { return { width: texto.length * parseFloat(this.font.replace('bold ', '')) * 0.6 }; };
  const regiao = { x: 0, y: 0, largura: 220, ancora: { y: 80 },
    titulo: 'Entrada da Dungeon', membros: [{}] };
  desenharPlacaRegiao(contexto, regiao, '#ffcc00', 0.35);
  assert.equal(canvas.textos.length, 2);
  assert.equal(canvas.textos.map(item => item.texto).join(' '), regiao.titulo);
  assert.ok(canvas.textos[1].y - canvas.textos[0].y >= 16);
  assert.ok(canvas.textos.every(item => item.y <= 53));
  canvas.textos = [];
  desenharPlacaRegiao(contexto, { ...regiao, titulo: 'Ala 1' }, '#ffcc00', 0.35);
  assert.ok(parseFloat(canvas.textos[0].fonte.replace('bold ', '')) > 18);
});
