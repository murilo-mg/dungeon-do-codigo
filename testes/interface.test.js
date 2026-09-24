import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente, encontrar } from './ambiente.js';
import { atualizarEstadoControles, atualizarPainelDeSala, exibirTelaDeConfiguracao, descreverSala, exibirTelaDeJogo } from '../js/interface.js';
import { criarGrafo, obterEstruturaDaFuncao } from '../js/grafoC.js';

const sala = { nome: 'investigar', linhas: 12, estruturasControle: 4, complexidade: 11,
  textoCompleto: 'void investigar() { printf("<script> & texto"); }' };

test('mostra quando os controles da exploração estão ativos', () => {
  const ambiente = criarAmbiente();

  atualizarEstadoControles(false);

  assert.equal(
    ambiente.elementos.get('status-indicador').className,
    'status-indicador'
  );

  assert.equal(
    ambiente.elementos.get('status-controles-texto').textContent,
    'Clique no mapa para explorar · WASD / setas'
  );

  atualizarEstadoControles(true);

  assert.equal(
    ambiente.elementos.get('status-indicador').className,
    'status-indicador ativo'
  );

  assert.equal(
    ambiente.elementos.get('status-controles-texto').textContent,
    'Exploração ativa · WASD / setas · Esc libera'
  );
});

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

function conteudoDaSecao(painel, classe) {
  const secao = painel.filhos.find(filho => filho.className === `secao-inspector ${classe}`);
  assert.ok(secao, `seção ${classe} ausente`);
  return secao.filhos[1];
}

test('inspector apresenta entrada, callees, profundidade, estruturas e código', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['validar', 'salvar', 'printf'] },
    { nome: 'validar', chamadas: [] }, { nome: 'salvar', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'main', estruturasControle: 4 },
    obterEstruturaDaFuncao(grafo, 'main'));

  assert.equal(conteudoDaSecao(painel, 'callers-funcao').textContent, 'Entrada do programa');
  const chamadas = conteudoDaSecao(painel, 'callees-funcao');
  assert.equal(chamadas.tipo, 'ul');
  assert.deepEqual(chamadas.filhos.map(filho => filho.textContent), ['validar()', 'salvar()']);
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent, 'main()');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    '4 estrutura(s) de controle (total)');
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, sala.textoCompleto);
  assert.ok(painel.filhos.some(filho => filho.textContent === 'Profundidade: '
    && filho.filhos[0].textContent === '0'));
  assert.ok(painel.filhos.some(filho => filho.textContent === 'Complexidade: '
    && filho.filhos[0].textContent === '11'));
});

test('inspector atualiza callers, callees e caminho ao trocar de função', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['a', 'b'] },
    { nome: 'a', chamadas: ['comum'] },
    { nome: 'b', chamadas: ['comum'] },
    { nome: 'comum', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'a' }, obterEstruturaDaFuncao(grafo, 'a'));
  assert.deepEqual(conteudoDaSecao(painel, 'callers-funcao').filhos.map(filho => filho.textContent),
    ['main()']);
  assert.deepEqual(conteudoDaSecao(painel, 'callees-funcao').filhos.map(filho => filho.textContent),
    ['comum()']);
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent, 'main() → a()');

  atualizarPainelDeSala({ ...sala, nome: 'comum' }, obterEstruturaDaFuncao(grafo, 'comum'));
  assert.deepEqual(conteudoDaSecao(painel, 'callers-funcao').filhos.map(filho => filho.textContent),
    ['a()', 'b()']);
  assert.equal(conteudoDaSecao(painel, 'callees-funcao').textContent, 'Nenhuma função conhecida');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    'main() → a() → comum()');
});

test('função isolada e estruturas ausentes ou zero recebem mensagens neutras', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const grafo = criarGrafo([
    { nome: 'main', chamadas: [] }, { nome: 'isolada', chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome: 'isolada', estruturasControle: 0 },
    obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(conteudoDaSecao(painel, 'callers-funcao').textContent,
    'Nenhuma chamada conhecida');
  assert.equal(conteudoDaSecao(painel, 'callees-funcao').textContent,
    'Nenhuma função conhecida');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    'Não alcançável a partir da entrada');
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    'Nenhuma estrutura de controle');

  atualizarPainelDeSala({ ...sala, estruturasControle: undefined },
    obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(conteudoDaSecao(painel, 'estruturas-funcao').textContent,
    'Informação não disponível');
  assert.doesNotMatch(descreverSala({ ...sala, estruturasControle: undefined }), /undefined/);
});

test('nomes e código com aparência de HTML permanecem como texto no DOM', () => {
  const ambiente = criarAmbiente();
  const painel = ambiente.elementos.get('info-sala');
  const nome = '<img src=x onerror=alert(1)>';
  const grafo = criarGrafo([
    { nome: 'main', chamadas: [nome] }, { nome, chamadas: [] },
  ]);
  atualizarPainelDeSala({ ...sala, nome, textoCompleto: 'void f(){ /* <script> */ }' },
    obterEstruturaDaFuncao(grafo, nome));
  assert.equal(encontrar(painel, 'nome-funcao').textContent, `${nome}()`);
  assert.equal(conteudoDaSecao(painel, 'callers-funcao').filhos[0].textContent, 'main()');
  assert.equal(conteudoDaSecao(painel, 'caminho-funcao').textContent,
    `main() → ${nome}()`);
  assert.equal(encontrar(painel, 'codigo-funcao').textContent, 'void f(){ /* <script> */ }');
  assert.equal(painel.filhos.some(filho => filho.tipo === 'img'), false);
});

test('sem main, caminho mostra o nome real da entrada', () => {
  const ambiente = criarAmbiente();
  const grafo = criarGrafo([{ nome: 'inicio', chamadas: [] }]);
  atualizarPainelDeSala({ ...sala, nome: 'inicio' }, obterEstruturaDaFuncao(grafo, 'inicio'));
  assert.equal(conteudoDaSecao(ambiente.elementos.get('info-sala'), 'caminho-funcao').textContent,
    'inicio()');
});
