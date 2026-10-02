import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo } from '../js/grafoC.js';
import { construirMasmorra } from '../js/masmorra.js';
import { calcularJuncoesCorredores, calcularCruzamentosCorredores,
  criarSegmentosDeCorredores, extrairPortasDosCorredores, LARGURA_CORREDOR } from '../js/corredores.js';
import { criarAreaCaminhavel, localizarNaArea, moverNaArea } from '../js/areaCaminhavel.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';
import { RAIO_BASE_PERSONAGEM } from '../js/personagem.js';

const sala = (nome, x, y) => ({ nome, x, y, largura: 60, altura: 60 });
const centro = s => ({ x: s.x + s.largura / 2, y: s.y + s.altura / 2 });
const trecho = (id, origem, destino, x1, y1, x2, y2) =>
  ({ id, origem, destino, inicio: { x: x1, y: y1 }, fim: { x: x2, y: y2 } });

function percorrer(area, segmentos, inicio, destino) {
  let estado = { ...inicio, local: localizarNaArea(area, inicio) };
  const rota = calcularRotaCaminhavel([...area.salas.values()], segmentos, estado, destino, estado.local);
  assert.ok(rota, `rota até ${destino}`);
  for (const ponto of rota) {
    estado = moverNaArea(area, estado.local, estado,
      { x: ponto.x - estado.x, y: ponto.y - estado.y });
    assert.ok(Math.hypot(ponto.x - estado.x, ponto.y - estado.y) < 1e-6,
      `${destino}: bloqueio antes de ${JSON.stringify(ponto)} em ${JSON.stringify(estado)}`);
  }
  assert.equal(estado.local.sala, destino);
}

test('pisos paralelos contínuos permitem travessia lateral com corpo e partida fracionária', () => {
  for (const distancia of [6, 18, LARGURA_CORREDOR - 0.1, LARGURA_CORREDOR]) {
    const salas = [sala('a', 0, 70), sala('b', 400, 70),
      sala('c', 100, 200), sala('d', 300, 200)];
    const segmentos = [trecho('ab', 'a', 'b', 60, 100, 400, 100),
      trecho('cd', 'c', 'd', 100, 100 + distancia, 360, 100 + distancia)];
    const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
    const inicial = { x: 210.3, y: 99.7, local: { sala: null, corredores: ['ab'] } };
    const final = moverNaArea(area, inicial.local, inicial, { x: 0, y: distancia + 0.3 });
    assert.ok(Math.abs(final.y - (100 + distancia)) < 1e-6, `separação ${distancia}`);
    assert.ok(final.local.corredores.includes('cd'));
    const volta = moverNaArea(area, final.local, final, { x: 0, y: -distancia });
    assert.ok(Math.abs(volta.y - 100) < 1e-6);
    assert.ok(volta.local.corredores.includes('ab'));
  }
});

test('uma lacuna real entre pisos continua bloqueada', () => {
  const salas = [sala('a', 0, 70), sala('b', 400, 70), sala('c', 0, 200), sala('d', 400, 200)];
  const distancia = LARGURA_CORREDOR + 1;
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 400, 100),
    trecho('cd', 'c', 'd', 60, 100 + distancia, 400, 100 + distancia)];
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  const inicio = { x: 200, y: 100, local: { sala: null, corredores: ['ab'] } };
  const final = moverNaArea(area, inicio.local, inicio, { x: 0, y: distancia });
  assert.ok(final.y <= 100 + LARGURA_CORREDOR / 2 - RAIO_BASE_PERSONAGEM + 1e-6);
  assert.deepEqual(calcularJuncoesCorredores(segmentos), []);
});

test('a base do jogador atravessa as portas com a folga lateral do piso mais largo', () => {
  const salas = [sala('a', 0, 70), sala('b', 400, 70)];
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 400, 100)];
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  const folga = LARGURA_CORREDOR / 2 - RAIO_BASE_PERSONAGEM;
  const inicio = { x: 30, y: 100 + folga };
  const ida = moverNaArea(area, localizarNaArea(area, inicio), inicio, { x: 400, y: 0 });
  assert.equal(ida.x, 430);
  assert.equal(ida.local.sala, 'b');
  const volta = moverNaArea(area, ida.local, ida, { x: -400, y: 0 });
  assert.equal(volta.x, 30);
  assert.equal(volta.local.sala, 'a');
  const meio = { x: 200, y: 100, local: { sala: null, corredores: ['ab'] } };
  const parede = moverNaArea(area, meio.local, meio, { x: 0, y: 30 });
  assert.ok(Math.abs(parede.y - (100 + folga)) < 1e-6);
});

test('pontas quadradas mantêm a continuidade onde os eixos paralelos terminam', () => {
  const salas = [sala('a', 0, 70), sala('b', 500, 70), sala('c', 0, 200), sala('d', 500, 200)];
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 200, 100),
    trecho('cd', 'c', 'd', 200, 106, 400, 106)];
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  const estado = { x: 200, y: 100, local: { sala: null, corredores: ['ab'] } };
  const final = moverNaArea(area, estado.local, estado, { x: 0, y: 6 });
  assert.equal(final.y, 106);
  assert.ok(final.local.corredores.includes('cd'));
});

test('encontro em T considera a espessura do piso, mesmo com eixos desencontrados', () => {
  const salas = [sala('a', 0, 70), sala('b', 100, 200), sala('c', 176, 0), sala('d', 176, 260)];
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 200, 100),
    trecho('ab', 'a', 'b', 200, 100, 200, 230),
    trecho('ab', 'a', 'b', 200, 230, 160, 230),
    trecho('cd', 'c', 'd', 206, 60, 206, 260)];
  assert.equal(calcularJuncoesCorredores([segmentos[0], segmentos.at(-1)]).length, 1);
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  let estado = { x: 190, y: 100, local: { sala: null, corredores: ['ab'] } };
  estado = moverNaArea(area, estado.local, estado, { x: 16, y: 0 });
  assert.ok(Math.abs(estado.x - 206) < 1e-6);
  estado = moverNaArea(area, estado.local, estado, { x: 0, y: -70 });
  assert.equal(estado.local.sala, 'c');
  percorrer(area, segmentos, centro(salas[0]), 'c');
});

test('X interior próximo de curva tem ponte, sem junção nem atalho automático', () => {
  const salas = [sala('a', 0, 70), sala('b', 240, 70), sala('c', 70, 0), sala('d', 70, 200)];
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 240, 100),
    trecho('cd', 'c', 'd', 100, 60, 100, 105)];
  // O segmento vertical cruza cinco pixels antes da curva: a ponte não pode sumir.
  assert.ok(calcularCruzamentosCorredores(segmentos).some(p => p.x === 100 && p.y === 100));
  // Usa só o X puro para verificar que a interseção não cria chamada/passagem.
  const cruzados = [segmentos[0], trecho('cd', 'c', 'd', 100, 60, 100, 200)];
  assert.deepEqual(calcularJuncoesCorredores(cruzados), []);
  assert.equal(calcularRotaCaminhavel(salas, cruzados, centro(salas[0]), 'd'), null);
});

test('curva com chão compartilhado não recebe ponte que sugira separação inexistente', () => {
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 240, 100),
    trecho('cd', 'c', 'd', 100, 60, 100, 105),
    trecho('cd', 'c', 'd', 100, 105, 120, 105)];
  assert.ok(calcularJuncoesCorredores(segmentos).length);
  assert.deepEqual(calcularCruzamentosCorredores(segmentos), []);
});

test('junção compartilhada pode ser percorrida manualmente e pelo automático sem novas arestas', () => {
  const salas = [sala('a', 0, 70), sala('b', 400, 70), sala('c', 100, 200), sala('d', 300, 200)];
  const segmentos = [trecho('ab', 'a', 'b', 60, 100, 400, 100),
    trecho('cd', 'c', 'd', 130, 200, 130, 106),
    trecho('cd', 'c', 'd', 130, 106, 330, 106),
    trecho('cd', 'c', 'd', 330, 106, 330, 200)];
  const antes = structuredClone({ salas, segmentos });
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  percorrer(area, segmentos, centro(salas[0]), 'd');
  percorrer(area, segmentos, centro(salas[3]), 'a');
  assert.deepEqual({ salas, segmentos }, antes);
});

test('portas pertencem só às extremidades reais dentro da borda e são compartilhadas pela física', () => {
  const salas = [sala('a', 20, 20), sala('b', 240, 20)];
  const segmentos = [trecho('ab', 'a', 'b', 80, 50, 160, 50),
    trecho('ab', 'a', 'b', 160, 50, 160, 80),
    trecho('ab', 'a', 'b', 160, 80, 220, 80),
    trecho('ab', 'a', 'b', 220, 80, 220, 50),
    trecho('ab', 'a', 'b', 220, 50, 240, 50)];
  const portas = extrairPortasDosCorredores(salas, segmentos);
  assert.deepEqual(portas.map(p => [p.nomeSala, p.ponto, p.vertical]),
    [['a', { x: 80, y: 50 }, true], ['b', { x: 240, y: 50 }, true]]);
  assert.deepEqual(criarAreaCaminhavel(salas, segmentos).portas, portas);
  const invalidos = [trecho('falso', 'a', 'b', 80, 200, 240, 200)];
  assert.deepEqual(extrairPortasDosCorredores(salas, invalidos), []);
  assert.deepEqual(criarAreaCaminhavel(salas, invalidos).porSala.get('a'), []);
});

function funcoesDensas(semente, quantidade) {
  let estado = semente;
  const proximo = () => ((estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const nomes = Array.from({ length: quantidade }, (_, i) => i ? `f_${i}` : 'main');
  return nomes.map(nome => ({ nome, chamadas: [...new Set(Array.from({ length: 3 },
    () => nomes[Math.floor(proximo() * quantidade)]))], complexidade: Math.floor(proximo() * 20), linhas: 10 }));
}

for (const [semente, quantidade] of [[3, 13], [9, 29]]) {
  test(`mapa denso ${quantidade}: todas as salas visitáveis com raio real, nos dois sentidos`, () => {
    // Semente 3 reproduz a rota que antes raspava f_9 e prendia a base do jogador.
    const funcoes = funcoesDensas(semente, quantidade);
    const grafo = criarGrafo(funcoes);
    const mundo = construirMasmorra(funcoes, grafo, { layoutRegional: true });
    const antes = structuredClone({ grafo, mundo });
    const chamadas = criarSegmentosDeCorredores(mundo.salas, grafo.arestas);
    assert.deepEqual(chamadas, criarSegmentosDeCorredores(mundo.salas, grafo.arestas));
    assert.ok(chamadas.every(t => !t.fallbackDireto));
    const segmentos = [...chamadas, ...mundo.passagensExploracao];
    for (const t of segmentos) {
      const raio = LARGURA_CORREDOR / 2;
      const x = Math.min(t.inicio.x, t.fim.x) - raio;
      const y = Math.min(t.inicio.y, t.fim.y) - raio;
      const direita = Math.max(t.inicio.x, t.fim.x) + raio;
      const base = Math.max(t.inicio.y, t.fim.y) + raio;
      assert.ok(x >= 0 && y >= 0 && direita <= mundo.larguraMundo && base <= mundo.alturaMundo);
      for (const s of mundo.salas.filter(s => s.nome !== t.origem && s.nome !== t.destino)) {
        assert.ok(direita <= s.x || x >= s.x + s.largura || base <= s.y || y >= s.y + s.altura,
          `piso de ${t.origem} → ${t.destino} atravessa ${s.nome}`);
      }
    }
    const area = criarAreaCaminhavel(mundo.salas, segmentos, RAIO_BASE_PERSONAGEM);
    const entrada = mundo.salas[0];
    for (const sala of mundo.salas) {
      percorrer(area, segmentos, centro(entrada), sala.nome);
      percorrer(area, segmentos, centro(sala), entrada.nome);
    }
    assert.deepEqual({ grafo, mundo }, antes);
  });
}
