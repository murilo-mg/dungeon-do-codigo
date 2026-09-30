import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_ARQUIVO_C, validarArquivoC } from '../js/entradaCodigo.js';

test('aceita .c e .C sem depender do tipo MIME', () => {
  for (const nome of ['programa.c', 'PROGRAMA.C']) {
    assert.equal(validarArquivoC({ name: nome, size: 10, type: '' }), null);
  }
});

test('rejeita extensões diferentes e nomes sem extensão', () => {
  for (const nome of ['programa.txt', 'programa.cpp', 'programa.h', 'programa.js',
    'programa', '.c']) {
    assert.match(validarArquivoC({ name: nome, size: 10 }), /extensão \.c/);
  }
});

test('aceita 512 KiB exatos e rejeita tamanho maior antes da leitura', () => {
  assert.equal(LIMITE_ARQUIVO_C, 512 * 1024);
  assert.equal(validarArquivoC({ name: 'limite.c', size: LIMITE_ARQUIVO_C }), null);
  assert.match(validarArquivoC({ name: 'grande.c', size: LIMITE_ARQUIVO_C + 1 }),
    /limite é 512 KiB/);
});
