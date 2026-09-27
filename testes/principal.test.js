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
  assert.deepEqual(secao('callees-funcao').filhos.map(filho => filho.filhos[0].textContent), ['a()']);

  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  ambiente.avancar(30);
  ambiente.janela.emitir('keyup', { key: 'ArrowRight' });

  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'a()');
  assert.deepEqual(secao('callers-funcao').filhos.map(filho => filho.filhos[0].textContent), ['main()']);
  assert.equal(secao('callees-funcao').textContent, 'Nenhuma função conhecida');
  assert.equal(secao('caminho-funcao').textContent, 'main() → a()');
  ambiente.elementos.get('botao-voltar').emitir('click');
});

test('navegação pelo inspector troca a função e retoma a sala física ao clicar no mapa', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?navegacao-estrutural');
  ambiente.documento.emitir('DOMContentLoaded');
  ambiente.elementos.get('entrada-codigo').value =
    'void a(){}\nvoid b(){}\nvoid c(){}\nvoid d(){}\n'
    + 'void e(){}\nvoid f(){}\nvoid g(){}\nvoid h(){}\n'
    + 'void distante(){}\nint main(){a();b();c();d();e();f();g();h();distante();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();

  const painel = ambiente.elementos.get('info-sala');
  const canvas = ambiente.elementos.get('canvas-jogo');
  const cameraInicial = canvas.translacoes.at(-1);
  const lista = painel.filhos.find(filho => filho.className ===
    'secao-inspector callees-funcao').filhos[1];
  const botao = lista.filhos.map(item => item.filhos[0])
    .find(candidato => candidato.textContent === 'distante()');
  assert.equal(botao.textContent, 'distante()');
  botao.emitir('click');
  ambiente.avancar();
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'distante()');
  assert.ok(canvas.translacoes.at(-1).y < cameraInicial.y);

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'main()');
  assert.deepEqual(canvas.translacoes.at(-1), cameraInicial);
  ambiente.elementos.get('botao-voltar').emitir('click');
});

test('busca usa a seleção existente, foca sala isolada e limpa ao gerar outra dungeon', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?busca-funcoes');
  ambiente.documento.emitir('DOMContentLoaded');
  const entrada = ambiente.elementos.get('entrada-codigo');
  entrada.value = 'void isolada(){}\nvoid a(){b();}\nvoid b(){c();}\n'
    + 'void c(){d();}\nvoid d(){e();}\nvoid e(){}\nint main(){a();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();

  const campo = ambiente.elementos.get('busca-funcao');
  const resultados = ambiente.elementos.get('resultados-busca');
  const painel = ambiente.elementos.get('info-sala');
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.equal(campo.value, '');
  campo.value = 'ISOL';
  campo.emitir('input');
  assert.equal(resultados.filhos[0].filhos[0].filhos[0].textContent, 'isolada()');
  resultados.filhos[0].filhos[0].filhos[0].emitir('click');
  ambiente.avancar();
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'isolada()');
  assert.ok(canvas.translacoes.at(-1).x < 0);
  assert.equal(painel.filhos.find(filho => filho.className ===
    'secao-inspector caminho-funcao').filhos[1].textContent,
    'Não alcançável a partir da entrada');

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'main()');
  assert.equal(canvas.translacoes.at(-1).x, 0);

  ambiente.elementos.get('botao-voltar').emitir('click');
  assert.equal(campo.value, '');
  assert.equal(resultados.filhos.length, 0);
  entrada.value = 'void nova(){}\nint main(){nova();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  campo.value = 'isol';
  campo.emitir('input');
  assert.equal(resultados.filhos[0].textContent, 'Nenhuma função encontrada.');
  ambiente.elementos.get('botao-voltar').emitir('click');
});

test('controles de câmera convivem com caller, callee, busca e nova dungeon', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?zoom-integracao');
  ambiente.documento.emitir('DOMContentLoaded');
  const entrada = ambiente.elementos.get('entrada-codigo');
  entrada.value = 'void f(){}\nvoid e(){f();}\nvoid d(){e();}\nvoid c(){d();}\n'
    + 'void b(){c();}\nvoid a(){b();}\nint main(){a();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  const zoom = ambiente.elementos.get('camera-zoom');
  const painel = ambiente.elementos.get('info-sala');
  const nome = () => encontrar(painel, 'nome-funcao').textContent;
  const botaoRelacao = classe => painel.filhos.find(filho =>
    filho.className === `secao-inspector ${classe}`).filhos[1].filhos[0].filhos[0];
  const canvas = ambiente.elementos.get('canvas-jogo');

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.documento.emitir('pointerdown', { composedPath: () => [ambiente.elementos.get('camera-encaixar')] });
  assert.equal(ambiente.janela.emitir('keydown', { key: 'ArrowRight' }).prevenido, undefined);
  ambiente.elementos.get('camera-encaixar').emitir('click');
  assert.notEqual(zoom.textContent, '100%');
  botaoRelacao('callees-funcao').emitir('click');
  assert.equal(nome(), 'a()');
  assert.equal(zoom.textContent, '100%');
  ambiente.elementos.get('camera-encaixar').emitir('click');
  botaoRelacao('callers-funcao').emitir('click');
  assert.equal(nome(), 'main()');
  assert.equal(zoom.textContent, '100%');
  ambiente.elementos.get('camera-encaixar').emitir('click');
  const busca = ambiente.elementos.get('busca-funcao');
  busca.value = 'b';
  busca.emitir('input');
  ambiente.elementos.get('resultados-busca').filhos[0].filhos[0].filhos[0].emitir('click');
  assert.equal(nome(), 'b()');
  assert.equal(zoom.textContent, '100%');
  ambiente.elementos.get('camera-encaixar').emitir('click');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  assert.equal(zoom.textContent, '100%');
  ambiente.elementos.get('camera-aproximar').emitir('click');
  assert.notEqual(zoom.textContent, '100%');
  ambiente.elementos.get('camera-zoom').emitir('click');
  assert.equal(zoom.textContent, '100%');
  ambiente.elementos.get('botao-voltar').emitir('click');
  entrada.value = 'int main(){return 0;}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  assert.equal(zoom.textContent, '100%');
  assert.equal(ambiente.elementos.get('camera-encaixar').ouvintes.get('click').size, 1);
  ambiente.elementos.get('botao-voltar').emitir('click');
});

test('perfil estrutural e ciclos chegam ao inspector por exploração, relações e busca', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?perfil-estrutural');
  ambiente.documento.emitir('DOMContentLoaded');
  ambiente.elementos.get('entrada-codigo').value =
    'void a(){if (1) {} b();}\nvoid b(){a();}\nint main(){a();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  const painel = ambiente.elementos.get('info-sala');
  const conteudo = classe => painel.filhos.find(filho =>
    filho.className === `secao-inspector ${classe}`).filhos[1];
  assert.equal(conteudo('ciclo-funcao').textContent, 'Sem ciclo detectado');
  conteudo('callees-funcao').filhos[0].filhos[0].emitir('click');
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'a()');
  assert.equal(conteudo('ciclo-funcao').textContent, 'Participa de ciclo de chamadas');
  assert.equal(conteudo('estruturas-funcao').textContent, '1 estrutura(s) de controle (total)');
  assert.equal(painel.filhos.find(filho => filho.className ===
    'secao-inspector estruturas-funcao').filhos[2].filhos[0].textContent, 'if: 1');
  conteudo('callers-funcao').filhos.map(item => item.filhos[0])
    .find(botao => botao.textContent === 'main()').emitir('click');
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'main()');
  const busca = ambiente.elementos.get('busca-funcao');
  busca.value = 'b';
  busca.emitir('input');
  ambiente.elementos.get('resultados-busca').filhos[0].filhos[0].filhos[0].emitir('click');
  assert.equal(encontrar(painel, 'nome-funcao').textContent, 'b()');
  assert.equal(conteudo('ciclo-funcao').textContent, 'Participa de ciclo de chamadas');
  ambiente.elementos.get('botao-voltar').emitir('click');
});

test('modo visual convive com busca, relações, câmera e reinício da dungeon', async () => {
  const ambiente = criarAmbiente();
  await import('../js/principal.js?modos-visuais');
  ambiente.documento.emitir('DOMContentLoaded');
  const entrada = ambiente.elementos.get('entrada-codigo');
  entrada.value = 'void f(){if (1) {}}\nvoid e(){f();}\nvoid d(){e();}\n'
    + 'void c(){d();}\nvoid b(){c();}\nvoid a(){b();}\nint main(){a();}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  const estrutura = ambiente.elementos.get('modo-estrutura');
  const complexidade = ambiente.elementos.get('modo-complexidade');
  const canvas = ambiente.elementos.get('canvas-jogo');
  const painel = ambiente.elementos.get('info-sala');
  const nome = () => encontrar(painel, 'nome-funcao').textContent;
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  const busca = ambiente.elementos.get('busca-funcao');
  busca.value = 'f';
  busca.emitir('input');
  ambiente.elementos.get('resultados-busca').filhos[0].filhos[0].filhos[0].emitir('click');
  assert.equal(nome(), 'f()');
  ambiente.avancar();
  const foco = canvas.translacoes.at(-1);
  estrutura.emitir('click');
  ambiente.avancar();
  assert.equal(nome(), 'f()');
  assert.deepEqual(canvas.translacoes.at(-1), foco);
  assert.equal(estrutura.atributos['aria-pressed'], 'true');
  const callers = painel.filhos.find(filho => filho.className ===
    'secao-inspector callers-funcao').filhos[1];
  callers.filhos[0].filhos[0].emitir('click');
  assert.equal(nome(), 'e()');
  ambiente.elementos.get('camera-encaixar').emitir('click');
  ambiente.avancar();
  const escala = canvas.escalas.at(-1);
  const translacao = canvas.translacoes.at(-1);
  complexidade.emitir('click');
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), escala);
  assert.deepEqual(canvas.translacoes.at(-1), translacao);
  assert.equal(nome(), 'e()');
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  estrutura.emitir('click');
  ambiente.elementos.get('botao-voltar').emitir('click');
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  entrada.value = 'int main(){return 0;}';
  ambiente.elementos.get('botao-gerar').emitir('click');
  ambiente.avancar();
  assert.equal(complexidade.atributos['aria-pressed'], 'true');
  assert.equal(estrutura.atributos['aria-pressed'], 'false');
  assert.equal(estrutura.ouvintes.get('click').size, 1);
  assert.equal(complexidade.ouvintes.get('click').size, 1);
  ambiente.elementos.get('botao-voltar').emitir('click');
});
