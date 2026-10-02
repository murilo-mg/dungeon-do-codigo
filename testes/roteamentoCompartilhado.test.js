import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCasoConvergente } from './casoConvergente.js';
import { criarGrafo } from '../js/grafoC.js';
import { construirMasmorra } from '../js/masmorra.js';
import { calcularCaminhoEntreSalas, criarSegmentosDeCorredores, calcularCruzamentosCorredores,
  chaveDoCorredor, LARGURA_CORREDOR } from '../js/corredores.js';
import { criarAreaCaminhavel, localizarNaArea, moverNaArea } from '../js/areaCaminhavel.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';
import { RAIO_BASE_PERSONAGEM } from '../js/personagem.js';

const centro = sala => ({ x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 });

function comprimentoUnico(segmentos) {
  const linhas = new Map();
  for (const trecho of segmentos) {
    const eixo = trecho.inicio.y === trecho.fim.y ? 'x' : 'y';
    const chave = JSON.stringify([eixo, trecho.inicio[eixo === 'x' ? 'y' : 'x']]);
    if (!linhas.has(chave)) linhas.set(chave, []);
    linhas.get(chave).push([Math.min(trecho.inicio[eixo], trecho.fim[eixo]),
      Math.max(trecho.inicio[eixo], trecho.fim[eixo])]);
  }
  let comprimento = 0;
  for (const intervalos of linhas.values()) {
    intervalos.sort((a, b) => a[0] - b[0]);
    let fim = -Infinity;
    for (const [a, b] of intervalos) {
      comprimento += Math.max(0, b - Math.max(a, fim));
      fim = Math.max(fim, b);
    }
  }
  return comprimento;
}

test('chamadas convergentes compartilham piso e cabem numa planta compacta', () => {
  const funcoes = criarCasoConvergente(), grafo = criarGrafo(funcoes);
  const mundo = construirMasmorra(funcoes, grafo, { layoutRegional: true });
  const antes = structuredClone({ funcoes, grafo, mundo });
  const segmentos = criarSegmentosDeCorredores(mundo.salas, grafo.arestas);
  const porNome = new Map(mundo.salas.map(s => [s.nome, s]));
  const independentes = grafo.arestas.flatMap(aresta => {
    if (aresta.origem === aresta.destino) return [];
    const pontos = calcularCaminhoEntreSalas(mundo.salas,
      porNome.get(aresta.origem), porNome.get(aresta.destino));
    assert.ok(pontos);
    return pontos.slice(1).map((fim, i) => ({ ...aresta, inicio: pontos[i], fim }));
  });
  const reais = new Set(grafo.arestas.filter(a => a.origem !== a.destino)
    .map(a => chaveDoCorredor(a.origem, a.destino)));
  assert.deepEqual(new Set(segmentos.map(t => chaveDoCorredor(t.origem, t.destino))), reais);
  assert.ok(mundo.larguraMundo / mundo.alturaMundo >= 0.9, 'evita uma torre de alas');
  assert.ok(mundo.larguraMundo / mundo.alturaMundo <= 1.8, 'evita uma faixa horizontal');
  for (let i = 0; i < mundo.salas.length; i++) {
    const a = mundo.salas[i];
    for (const b of mundo.salas.slice(i + 1)) {
      assert.ok(a.x + a.largura <= b.x || b.x + b.largura <= a.x ||
        a.y + a.altura <= b.y || b.y + b.altura <= a.y, `${a.nome} sobrepõe ${b.nome}`);
    }
  }
  assert.ok(comprimentoUnico(segmentos) < comprimentoUnico(independentes) * 0.8);
  const pontes = calcularCruzamentosCorredores([...segmentos, ...mundo.passagensExploracao]);
  assert.ok(pontes.length <= 8, `pontes muito próximas: ${pontes.length}`);
  assert.ok(pontes.length < calcularCruzamentosCorredores([...independentes, ...mundo.passagensExploracao]).length);

  for (const trecho of segmentos) {
    assert.ok(!trecho.fallbackDireto);
    const raio = LARGURA_CORREDOR / 2;
    const x = Math.min(trecho.inicio.x, trecho.fim.x) - raio;
    const y = Math.min(trecho.inicio.y, trecho.fim.y) - raio;
    const direita = Math.max(trecho.inicio.x, trecho.fim.x) + raio;
    const base = Math.max(trecho.inicio.y, trecho.fim.y) + raio;
    assert.ok(x >= 0 && y >= 0 && direita <= mundo.larguraMundo && base <= mundo.alturaMundo);
    for (const sala of mundo.salas.filter(s => s.nome !== trecho.origem && s.nome !== trecho.destino)) {
      assert.ok(direita <= sala.x || x >= sala.x + sala.largura || base <= sala.y || y >= sala.y + sala.altura,
        `${trecho.origem} → ${trecho.destino} ocupa ${sala.nome}`);
    }
  }
  assert.deepEqual(criarSegmentosDeCorredores(mundo.salas, grafo.arestas), segmentos);
  assert.deepEqual(construirMasmorra(funcoes, grafo, { layoutRegional: true }), mundo);
  assert.deepEqual({ funcoes, grafo, mundo }, antes);
});

test('planta convergente permite visitar todas as salas com a colisão real', () => {
  const funcoes = criarCasoConvergente(), grafo = criarGrafo(funcoes);
  const mundo = construirMasmorra(funcoes, grafo, { layoutRegional: true });
  const segmentos = [...criarSegmentosDeCorredores(mundo.salas, grafo.arestas), ...mundo.passagensExploracao];
  const area = criarAreaCaminhavel(mundo.salas, segmentos, RAIO_BASE_PERSONAGEM);
  const entrada = mundo.salas[0];
  for (const sala of mundo.salas) for (const [origem, destino] of [[entrada, sala], [sala, entrada]]) {
    let estado = { ...centro(origem), local: localizarNaArea(area, centro(origem)) };
    const rota = calcularRotaCaminhavel(mundo.salas, segmentos, estado, destino.nome, estado.local);
    assert.ok(rota, `${origem.nome} → ${destino.nome}`);
    for (const ponto of rota) {
      estado = moverNaArea(area, estado.local, estado,
        { x: ponto.x - estado.x, y: ponto.y - estado.y });
      assert.ok(Math.hypot(ponto.x - estado.x, ponto.y - estado.y) < 1e-6,
        `bloqueio entre ${origem.nome} e ${destino.nome} em ${JSON.stringify(ponto)}`);
    }
    assert.equal(estado.local.sala, destino.nome);
  }
});
