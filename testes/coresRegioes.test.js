import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CORES_ALAS,
  COR_ISOLADAS,
  atribuirCoresRegioes,
} from '../js/semanticaVisual.js';

test('cores das alas são determinísticas e distintas', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada' },
    { id: 'parser', tipo: 'ala' },
    { id: 'lexer', tipo: 'ala' },
    { id: 'isoladas', tipo: 'isoladas' },
  ];

  const primeira = atribuirCoresRegioes(regioes);
  const segunda = atribuirCoresRegioes(regioes);

  assert.deepEqual([...primeira], [...segunda]);

  assert.equal(primeira.get('parser'), CORES_ALAS[0]);
  assert.equal(primeira.get('lexer'), CORES_ALAS[1]);
  assert.notEqual(
    primeira.get('parser'),
    primeira.get('lexer')
  );

  assert.equal(
    primeira.get('isoladas'),
    COR_ISOLADAS
  );
});

test('paleta de alas é reutilizada de forma previsível', () => {
  const regioes = Array.from(
    { length: CORES_ALAS.length + 1 },
    (_, indice) => ({
      id: `ala:${indice}`,
      tipo: 'ala',
    })
  );

  const cores = atribuirCoresRegioes(regioes);

  assert.equal(
    cores.get(`ala:${CORES_ALAS.length}`),
    CORES_ALAS[0]
  );
});
