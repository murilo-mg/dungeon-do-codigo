import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarFuncoes, ErroAnaliseC } from '../js/analisadorC.js';

test('ignora chaves e marcadores de comentário em textos, preservando a função inteira', () => {
  for (const mensagem of ['}', '{', '// texto', '/* texto */', 'http://exemplo.test', '🗝️ } //']) {
    const fonte = `void f() { printf("${mensagem}"); return; }`;
    const funcoes = analisarFuncoes(fonte);
    assert.equal(funcoes.length, 1);
    assert.equal(funcoes[0].textoCompleto, fonte);
    assert.ok(funcoes[0].corpo.endsWith('return; '));
  }
});

test('conta apenas estruturas reais, ignorando palavras em strings e comentários', () => {
  const [funcao] = analisarFuncoes(`void f() {
    printf("if for while switch case");
    // if for while switch case }
    /* if for while switch case { */
    if (1) { for (;;) { break; } }
  }`);
  assert.equal(funcao.estruturasControle, 2);
  assert.equal(funcao.linhas, 2);
  assert.equal(funcao.complexidade, 4);
});

test('interpreta aspas escapadas, barras invertidas e literais de caracteres', () => {
  const fonte = String.raw`void f() {
    printf("aspas: \" } // if");
    printf("barra: \\");
    char chave = '}';
    char aspas = '\'';
    char barra = '\\';
    if (chave) { return; }
  }`;
  const [funcao] = analisarFuncoes(fonte);
  assert.equal(funcao.textoCompleto, fonte);
  assert.equal(funcao.estruturasControle, 1);
  assert.equal(funcao.linhas, 6);
});

test('mantém comentários no código exibido e ignora funções falsas dentro deles', () => {
  const funcao = `void /* anotação */ f() {
    /* explicação com } e if */
    return;
  }`;
  const funcoes = analisarFuncoes(`/* void falsa() { } */\n${funcao}\n// void outra() { }`);
  assert.equal(funcoes.length, 1);
  assert.equal(funcoes[0].nome, 'f');
  assert.equal(funcoes[0].textoCompleto, funcao);
  assert.equal(funcoes[0].linhas, 1);
  assert.equal(funcoes[0].estruturasControle, 0);
});

test('preserva posições com CRLF, acentos e caracteres Unicode', () => {
  const fonte = 'void f() {\r\n  printf("ação 🐉 }");\r\n  return;\r\n}';
  const [funcao] = analisarFuncoes(`// 🗝️ introdução\r\n${fonte}`);
  assert.equal(funcao.textoCompleto, fonte);
  assert.equal(funcao.linhas, 2);
});

test('comentário com continuação de linha não transforma seu texto em código', () => {
  for (const quebra of ['\n', '\r\n']) {
    const fonte = ['void f() {', '  // comentário \\', '  } if for while', '  return;', '}'].join(quebra);
    const [funcao] = analisarFuncoes(fonte);
    assert.equal(funcao.textoCompleto, fonte);
    assert.equal(funcao.estruturasControle, 0);
    assert.equal(funcao.linhas, 1);
  }
});

test('extrai várias funções com blocos aninhados sem transformar blocos em salas', () => {
  const funcoes = analisarFuncoes(`void f() {
    if (1) { while (0) {} }
  }
  int main() { f(); return 0; }`);
  assert.deepEqual(funcoes.map(funcao => funcao.nome), ['f', 'main']);
  assert.equal(funcoes[0].estruturasControle, 2);
  assert.equal(funcoes[1].estruturasControle, 0);
});

for (const [caso, fonte, mensagem, linha] of [
  ['corpo incompleto', '\nvoid f() { return;', /chave de abertura sem fechamento/, 2],
  ['bloco aninhado incompleto', 'void f() { if (1) { return; }', /chave de abertura sem fechamento/, 1],
  ['fechamento excedente', 'void f() {}\n}', /fechamento sem abertura/, 2],
  ['string incompleta', 'void f() {\n  printf("texto);\n}', /aspas duplas sem fechamento/, 2],
  ['caractere incompleto', "void f() { char c = 'x; }", /caractere sem fechamento/, 1],
  ['comentário incompleto', 'void f() {}\n/* comentário', /Comentário de bloco sem fechamento/, 2],
]) {
  test(`recusa ${caso} e informa a linha`, () => {
    assert.throws(() => analisarFuncoes(fonte), erro => {
      assert.ok(erro instanceof ErroAnaliseC);
      assert.match(erro.message, mensagem);
      assert.equal(erro.linha, linha);
      return true;
    });
    assert.equal(analisarFuncoes('void valida() {}')[0].nome, 'valida');
  });
}

test('entrada sem funções não cria descritores', () => {
  for (const fonte of ['', '   ', '// comentário', '/* comentário */', 'int f(void);']) {
    assert.deepEqual(analisarFuncoes(fonte), []);
  }
});
