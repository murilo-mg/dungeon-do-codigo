import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFormaTerritorio } from '../js/layoutRegioes.js';
import { pedraSobreCorredor } from '../js/desenhoMasmorra.js';

const territorio = { x: 20, y: 20, largura: 360, altura: 330 };
const salas = [
  { nome: 'a', x: 48, y: 100, largura: 100, altura: 80 },
  { nome: 'b', x: 172, y: 100, largura: 180, altura: 80 },
  { nome: 'c', x: 48, y: 204, largura: 100, altura: 110 },
];

test('envelope acompanha fileira incompleta sem mudar salas ou limites do mundo', () => {
  const antes = structuredClone({ territorio, salas });
  const forma = calcularFormaTerritorio(territorio, salas);
  assert.deepEqual({ territorio, salas }, antes);
  assert.deepEqual(forma, calcularFormaTerritorio(territorio, salas));
  const ultima = forma.faixas.at(-1);
  assert.equal(ultima.x + ultima.largura, salas[2].x + salas[2].largura + 20);
  assert.ok(ultima.largura < forma.faixas.find(faixa => faixa.y === 80).largura);
  for (const faixa of forma.faixas) {
    assert.ok(faixa.altura > 0 && faixa.largura > 0);
    assert.ok(faixa.x >= territorio.x && faixa.y >= territorio.y);
    assert.ok(faixa.x + faixa.largura <= territorio.x + territorio.largura);
    assert.ok(faixa.y + faixa.altura <= territorio.y + territorio.altura);
  }
});

test('todas as salas permanecem dentro do envelope em toda sua altura', () => {
  const { faixas, paredes } = calcularFormaTerritorio(territorio, salas);
  for (const sala of salas) {
    for (let y = sala.y; y < sala.y + sala.altura; y++) {
      const faixa = faixas.find(item => y >= item.y && y < item.y + item.altura);
      assert.ok(faixa && faixa.x < sala.x && faixa.x + faixa.largura > sala.x + sala.largura);
    }
    assert.ok(paredes.every(parede => parede.x + parede.largura <= sala.x ||
      parede.x >= sala.x + sala.largura || parede.y + parede.altura <= sala.y ||
      parede.y >= sala.y + sala.altura));
  }
});

test('forma vazia e sala única não criam espaços ou relações fictícias', () => {
  assert.deepEqual(calcularFormaTerritorio(territorio, []), { faixas: [], paredes: [] });
  const forma = calcularFormaTerritorio(territorio, [salas[0]]);
  assert.equal(forma.faixas.at(-1).y + forma.faixas.at(-1).altura, 200);
  assert.deepEqual(forma, calcularFormaTerritorio({ ...territorio, titulo: 'Outro nome' }, [salas[0]]));
});

test('somente segmentos reais abrem a parede, nos dois sentidos físicos', () => {
  const pedra = { x: 40, y: 80, largura: 12, altura: 8 };
  const vertical = { inicio: { x: 46, y: 40 }, fim: { x: 46, y: 120 } };
  const horizontal = { inicio: { x: 10, y: 84 }, fim: { x: 100, y: 84 } };
  assert.equal(pedraSobreCorredor(pedra, []), false);
  for (const segmento of [vertical, horizontal]) {
    assert.equal(pedraSobreCorredor(pedra, [segmento]), true);
    assert.equal(pedraSobreCorredor(pedra, [{ inicio: segmento.fim, fim: segmento.inicio }]), true);
  }
  assert.equal(pedraSobreCorredor(pedra, [
    { inicio: { x: 46, y: 10 }, fim: { x: 46, y: 50 } },
    { inicio: { x: 80, y: 40 }, fim: { x: 80, y: 120 } },
  ]), false);
});
