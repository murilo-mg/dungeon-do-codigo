import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMIAR_DETALHES, LIMIAR_IDENTIFICACAO, obterEstiloVisualDaSala,
  obterMarcadoresEstruturais, obterNivelDetalhe, obterEstiloNomeSala } from '../js/semanticaVisual.js';
import { GLIFOS_MARCADORES, PALETA } from '../js/pixelArt.js';
import { corPorSala } from '../js/masmorra.js';

const semEstruturas = { if: 0, for: 0, while: 0, switch: 0, case: 0 };

test('zoom semântico classifica mapa, identificação e detalhes nos limiares exatos', () => {
  assert.equal(obterNivelDetalhe(0.25), 'distante');
  assert.equal(obterNivelDetalhe(LIMIAR_IDENTIFICACAO - 0.001), 'distante');
  assert.equal(obterNivelDetalhe(LIMIAR_IDENTIFICACAO), 'intermediaria');
  assert.equal(obterNivelDetalhe(LIMIAR_DETALHES - 0.001), 'intermediaria');
  assert.equal(obterNivelDetalhe(LIMIAR_DETALHES), 'proxima');
  assert.equal(obterNivelDetalhe(2), 'proxima');
  assert.ok(LIMIAR_IDENTIFICACAO < LIMIAR_DETALHES);
});

test('nomes permanecem legíveis em salas grandes ao encaixar e simplificam salas pequenas', () => {
  const grande = { largura: 100, altura: 80 };
  const pequena = { largura: 60, altura: 60 };
  const antes = structuredClone({ grande, pequena });
  assert.equal(obterEstiloNomeSala(grande, 0.69).visivel, true);
  assert.equal(obterEstiloNomeSala(pequena, 0.5).visivel, false);
  assert.equal(obterEstiloNomeSala(grande, 0.25).visivel, false);
  for (const zoom of [0.69, 0.75, 1, 1.5, 2]) {
    assert.ok(Math.abs(obterEstiloNomeSala(grande, zoom).fonte * zoom - 10) < 0.001);
  }
  assert.deepEqual({ grande, pequena }, antes);
});

for (const [tipo, marcador] of [
  ['if', 'I'], ['for', 'F'], ['while', 'W'], ['switch', 'S'],
]) {
  test(`${tipo} produz um marcador ${marcador} quando presente`, () => {
    assert.deepEqual(obterMarcadoresEstruturais({
      estruturasPorTipo: { ...semEstruturas, [tipo]: 1 },
    }), { estruturas: [marcador], chamada: null });
  });
}

test('sala sem estruturas ou chamada cíclica não recebe marcador', () => {
  assert.deepEqual(obterMarcadoresEstruturais({ estruturasPorTipo: semEstruturas }),
    { estruturas: [], chamada: null });
  assert.deepEqual(obterMarcadoresEstruturais({}),
    { estruturas: [], chamada: null });
});

test('tipos múltiplos seguem a ordem I, F, W, S e não são duplicados pela quantidade', () => {
  const sala = { estruturasPorTipo: { switch: 3, while: 2, for: 4, if: 5, case: 7 } };
  assert.deepEqual(obterMarcadoresEstruturais(sala).estruturas, ['I', 'F', 'W', 'S']);
  assert.deepEqual(obterMarcadoresEstruturais(sala).estruturas, ['I', 'F', 'W', 'S']);
  assert.equal(sala.estruturasPorTipo.if, 5);
});

test('case isolado não cria marcador de switch', () => {
  assert.deepEqual(obterMarcadoresEstruturais({
    estruturasPorTipo: { ...semEstruturas, case: 2 },
  }).estruturas, []);
});

test('recursão direta gera R sem C mesmo quando participa de ciclo', () => {
  assert.deepEqual(obterMarcadoresEstruturais({
    recursivaDireta: true, participaDeCiclo: true,
  }), { estruturas: [], chamada: 'R' });
});

test('ciclo indireto gera C e função acíclica não gera indicador', () => {
  assert.equal(obterMarcadoresEstruturais({
    recursivaDireta: false, participaDeCiclo: true,
  }).chamada, 'C');
  assert.equal(obterMarcadoresEstruturais({
    recursivaDireta: false, participaDeCiclo: false,
  }).chamada, null);
});

test('todos os marcadores têm glifos de 5 por 5 pixels inteiros', () => {
  const desenhos = new Set();
  for (const marcador of ['I', 'F', 'W', 'S', 'R', 'C']) {
    const linhas = GLIFOS_MARCADORES[marcador];
    assert.equal(linhas.length, 5);
    assert.ok(linhas.every(linha => linha.length === 5 && /^[.1]+$/.test(linha)));
    desenhos.add(linhas.join(''));
  }
  assert.equal(desenhos.size, 6);
});

test('seleção dos marcadores não modifica metadados nem geometria da sala', () => {
  const sala = { x: 100, y: 100, largura: 60, altura: 60, complexidade: 4,
    estruturasPorTipo: { ...semEstruturas, if: 3 }, participaDeCiclo: true };
  const anterior = structuredClone(sala);
  obterMarcadoresEstruturais(sala);
  assert.deepEqual(sala, anterior);
});

test('estilo de Complexidade mantém cor original e criaturas; Estrutura usa pedra neutra', () => {
  const comum = { complexidade: 8, ehSalaInicial: false, x: 10, largura: 60 };
  const inicial = { ...comum, ehSalaInicial: true };
  const anterior = structuredClone(comum);
  assert.deepEqual(obterEstiloVisualDaSala(comum, 'complexidade'), {
    corBase: corPorSala(comum), exibirCriatura: true, destacarMarcadores: false,
  });
  assert.deepEqual(obterEstiloVisualDaSala(inicial, 'complexidade'), {
    corBase: corPorSala(inicial), exibirCriatura: true, destacarMarcadores: false,
  });
  assert.deepEqual(obterEstiloVisualDaSala(comum, 'estrutura'), {
    corBase: PALETA.pedra, exibirCriatura: false, destacarMarcadores: true,
  });
  assert.equal(obterEstiloVisualDaSala(inicial, 'estrutura').corBase, PALETA.pedraClara);
  assert.deepEqual(comum, anterior);
});
