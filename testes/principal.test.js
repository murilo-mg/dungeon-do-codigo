import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente, encontrar } from './ambiente.js';

test('gerar avisa sobre código inválido, mantém o editor e permite corrigir a entrada', async () => {
  const ambiente = criarAmbiente();

  await import('../js/principal.js');
  ambiente.documento.emitir('DOMContentLoaded');

  const entrada = ambiente.elementos.get('entrada-codigo');
  const areaJogo = ambiente.elementos.get('area-jogo');
  const configuracao = ambiente.elementos.get('painel-configuracao');
  const mensagemErro = ambiente.elementos.get('mensagem-erro');

  areaJogo.style.display = 'none';
  configuracao.style.display = 'block';

  const exemplo = entrada.value;

  entrada.value = 'void f() { return;';
  ambiente.elementos.get('botao-gerar').emitir('click');

  assert.match(
    mensagemErro.textContent,
    /chave de abertura sem fechamento.*Linha 1/
  );

  assert.equal(areaJogo.style.display, 'none');
  assert.equal(configuracao.style.display, 'block');
  assert.equal(entrada.focado, true);
  assert.equal(ambiente.pendentes.size, 0);

  entrada.value = exemplo;
  ambiente.elementos.get('botao-gerar').emitir('click');

  ambiente.avancar(2);

  assert.equal(mensagemErro.textContent, '');
  assert.equal(areaJogo.style.display, 'flex');

  ambiente.elementos.get('botao-voltar').emitir('click');

  assert.equal(ambiente.pendentes.size, 0);

  entrada.value = '';
  ambiente.elementos.get('botao-gerar').emitir('click');

  assert.match(
    mensagemErro.textContent,
    /Cole um código em C antes de gerar a dungeon/
  );

  assert.equal(areaJogo.style.display, 'none');
});

test('ao caminhar para outra sala, inspector recebe relações e caminho do grafo atual', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?inspector-estrutural');
  ambiente.documento.emitir('DOMContentLoaded');
  ambiente.elementos.get('entrada-codigo').value =
    'void a(void) {}\nint main(void) { a(); return 0; }';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();

  const painel = ambiente.elementos.get('info-sala');
  const secao = classe => painel.filhos.find(filho =>
    filho.className === `secao-inspector ${classe}`).filhos[1];
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'main()');
  assert.equal(secao('caminho-funcao').textContent, 'main()');
  assert.deepEqual(secao('callees-funcao').filhos.map(filho => filho.textContent), ['a()']);

  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  ambiente.avancar(30);
  ambiente.janela.emitir('keyup', { key: 'ArrowRight' });

  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'a()');
  assert.deepEqual(secao('callers-funcao').filhos.map(filho => filho.textContent), ['main()']);
  assert.equal(secao('callees-funcao').textContent, 'Nenhuma função conhecida');
  assert.equal(secao('caminho-funcao').textContent, 'main() → a()');
  ambiente.elementos.get('botao-voltar').emitir('click');
});
