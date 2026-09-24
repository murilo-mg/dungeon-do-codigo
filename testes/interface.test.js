import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente, encontrar } from './ambiente.js';
import { atualizarPainelDeSala, exibirTelaDeConfiguracao, descreverSala, exibirTelaDeJogo } from '../js/interface.js';

const sala = { nome: 'investigar', linhas: 12, estruturasControle: 4, complexidade: 11,
  textoCompleto: 'void investigar() { printf("<script> & texto"); }' };

test('digita progressivamente e troca de sala sem manter animações antigas', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  atualizarPainelDeSala(sala);
  ambiente.avancar(5);
  const antiga = encontrar(painel, 'descricao-sala');
  assert.ok(antiga.textContent.length > 0 && antiga.textContent.length < descreverSala(sala).length);
  const trechoAntigo = antiga.textContent;
  const nova = { ...sala, nome: 'nova', complexidade: 0 };
  atualizarPainelDeSala(nova);
  assert.equal(ambiente.pendentes.size, 1);
  ambiente.avancar(240);
  assert.equal(antiga.textContent, trechoAntigo);
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(nova));
  assert.equal(encontrar(painel, 'preenchimento-perigo').style.transform, 'scaleX(0.25)');
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, sala.textoCompleto);
  assert.equal(ambiente.pendentes.size, 0);
});

test('cancela ao sair da sala ou voltar ao editor', () => {
  const ambiente = criarAmbiente();
  atualizarPainelDeSala(sala);
  atualizarPainelDeSala(null);
  assert.equal(ambiente.pendentes.size, 0);
  atualizarPainelDeSala(sala);
  exibirTelaDeConfiguracao();
  assert.equal(ambiente.pendentes.size, 0);
  assert.equal(ambiente.preferencia.ouvintes.get('change').size, 0);
  assert.equal(ambiente.elementos.get('entrada-codigo').focado, true);
});

test('alterna entre a tela de entrada e a exploração', () => {
  const ambiente = criarAmbiente();

  exibirTelaDeJogo();

  assert.equal(
    ambiente.elementos.get('tela-entrada').style.display,
    'none'
  );

  assert.equal(
    ambiente.elementos.get('area-jogo').style.display,
    'flex'
  );

  exibirTelaDeConfiguracao();

  assert.equal(
    ambiente.elementos.get('tela-entrada').style.display,
    'flex'
  );

  assert.equal(
    ambiente.elementos.get('area-jogo').style.display,
    'none'
  );
});

test('redução de movimento exibe tudo imediatamente e funciona durante a digitação', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  ambiente.preferencia.matches = true;
  atualizarPainelDeSala(sala);
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(sala));
  assert.equal(encontrar(painel, 'preenchimento-perigo').style.transform, 'scaleX(1)');
  assert.equal(ambiente.pendentes.size, 0);
  ambiente.preferencia.matches = false;
  atualizarPainelDeSala(sala);
  ambiente.avancar(5);
  ambiente.preferencia.emitir('change', { matches: true });
  assert.equal(encontrar(painel, 'descricao-sala').textContent, descreverSala(sala));
  assert.equal(ambiente.pendentes.size, 0);
});
