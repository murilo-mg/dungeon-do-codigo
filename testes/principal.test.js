import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';

test('gerar avisa sobre código incompleto, mantém o editor e permite corrigir a entrada', async () => {
  const ambiente = criarAmbiente();
  const avisos = [];
  globalThis.alert = mensagem => avisos.push(mensagem);
  await import('../js/principal.js');
  ambiente.documento.emitir('DOMContentLoaded');
  const entrada = ambiente.elementos.get('entrada-codigo');
  const areaJogo = ambiente.elementos.get('area-jogo');
  const configuracao = ambiente.elementos.get('painel-configuracao');
  areaJogo.style.display = 'none';
  configuracao.style.display = 'block';
  const exemplo = entrada.value;
  entrada.value = 'void f() { return;';
  ambiente.elementos.get('botao-gerar').emitir('click');
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /chave de abertura sem fechamento.*Linha 1/);
  assert.equal(areaJogo.style.display, 'none');
  assert.equal(configuracao.style.display, 'block');
  assert.equal(entrada.focado, true);
  assert.equal(ambiente.pendentes.size, 0);

  entrada.value = exemplo;
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar(2);
  assert.equal(avisos.length, 1);
  assert.equal(areaJogo.style.display, 'flex');
  ambiente.elementos.get('botao-voltar').emitir('click');
  assert.equal(ambiente.pendentes.size, 0);

  entrada.value = '';
  ambiente.elementos.get('botao-gerar').emitir('click');
  assert.equal(avisos.length, 2);
  assert.match(avisos[1], /encontrar funções/);
  assert.equal(areaJogo.style.display, 'none');
  delete globalThis.alert;
});
