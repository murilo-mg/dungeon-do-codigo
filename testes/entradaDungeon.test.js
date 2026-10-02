import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';

function ambienteComDecoracao() {
  const ambiente = criarAmbiente();
  for (const [id, largura, altura] of [
    ['fundo-entrada', 1440, 900], ['preview-mapa', 412, 172],
  ]) {
    const canvas = ambiente.documento.createElement('canvas');
    Object.assign(canvas, { clientWidth: largura, clientHeight: altura });
    ambiente.elementos.set(id, canvas);
  }
  return ambiente;
}

test('entrada decorada inicializa os controles e acompanha o viewport pelo observador', async () => {
  const ambiente = ambienteComDecoracao();
  const anterior = globalThis.ResizeObserver;
  let observador;
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observador = this; }
    observe(elemento) { this.elemento = elemento; }
  };
  try {
    await import('../js/principal.js?entrada-decorada');
    ambiente.documento.emitir('DOMContentLoaded');
    const fundo = ambiente.elementos.get('fundo-entrada');
    assert.equal(observador.elemento, fundo);
    assert.deepEqual([fundo.width, fundo.height], [480, 300]);
    const previa = ambiente.elementos.get('preview-mapa');
    assert.deepEqual(previa.textos.map(t => t.texto), ['main()', 'processar()']);
    assert.equal(previa.salvamentos, previa.restauracoes);
    assert.match(ambiente.elementos.get('entrada-codigo').value, /int main\(\)/);
    assert.equal(ambiente.elementos.get('botao-gerar').ouvintes.get('click').size, 1);
    assert.equal(ambiente.pendentes.size, 0, 'a decoração não inicia animação contínua');
    fundo.clientWidth = 900;
    fundo.clientHeight = 600;
    observador.callback();
    assert.deepEqual([fundo.width, fundo.height], [300, 200]);
    fundo.clientWidth = fundo.clientHeight = 0;
    observador.callback();
    assert.deepEqual([fundo.width, fundo.height], [300, 200], 'ocultar a entrada conserva o bitmap');
  } finally {
    if (anterior === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = anterior;
  }
});

test('sem ResizeObserver a decoração acompanha resize e o fluxo gerar/voltar continua funcionando', async () => {
  const ambiente = ambienteComDecoracao();
  const anterior = globalThis.ResizeObserver;
  delete globalThis.ResizeObserver;
  try {
    await import('../js/principal.js?entrada-sem-observador');
    ambiente.documento.emitir('DOMContentLoaded');
    const fundo = ambiente.elementos.get('fundo-entrada');
    fundo.clientWidth = 390;
    fundo.clientHeight = 844;
    ambiente.janela.emitir('resize');
    assert.deepEqual([fundo.width, fundo.height], [130, 282]);
    const editor = ambiente.elementos.get('entrada-codigo');
    editor.value = 'int main(void) { return 0; }';
    ambiente.elementos.get('botao-gerar').emitir('click');
    ambiente.avancar(2);
    assert.equal(ambiente.elementos.get('area-jogo').style.display, 'flex');
    assert.ok(ambiente.pendentes.size > 0);
    ambiente.elementos.get('botao-voltar').emitir('click');
    assert.equal(ambiente.elementos.get('area-jogo').style.display, 'none');
    assert.equal(ambiente.elementos.get('tela-entrada').style.display, 'flex');
    assert.equal(editor.value, 'int main(void) { return 0; }');
    assert.equal(ambiente.pendentes.size, 0);
  } finally {
    if (anterior === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = anterior;
  }
});
