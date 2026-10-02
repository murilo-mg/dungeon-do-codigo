import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const ler = caminho => readFileSync(resolve(raiz, caminho), 'utf8');

test('site usa somente scripts, folhas de estilo e fontes locais existentes', () => {
  const html = ler('index.html');
  assert.doesNotMatch(html, /<script[^>]*>\s*[^<\s]|\son\w+\s*=|\sstyle\s*=/i);
  for (const [, caminho] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.doesNotMatch(caminho, /^(?:https?:|\/\/|data:|javascript:)/i);
    assert.ok(existsSync(resolve(raiz, caminho)), caminho);
  }
  for (const nome of readdirSync(resolve(raiz, 'css')).filter(nome => nome.endsWith('.css'))) {
    const css = ler(`css/${nome}`);
    for (const [, caminho] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
      assert.doesNotMatch(caminho, /^(?:https?:|\/\/|data:)/i);
      assert.ok(existsSync(resolve(raiz, 'css', caminho)), caminho);
    }
  }
  assert.match(ler('assets/fontes/OFL-cinzel.txt'), /SIL OPEN FONT LICENSE/);
  assert.match(ler('assets/fontes/OFL-jetbrainsmono.txt'), /SIL OPEN FONT LICENSE/);
});

test('CSP permite módulos e Workers locais e bloqueia conexões, objetos e inline', () => {
  const meta = ler('index.html').match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const diretiva of ["script-src 'self'", "worker-src 'self'", "font-src 'self'",
    "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(meta.split(';').map(s => s.trim()).includes(diretiva), diretiva);
  }
  assert.doesNotMatch(meta, /unsafe-inline|unsafe-eval|https?:|data:|blob:/);
  const cabecalhos = ler('_headers');
  assert.ok(cabecalhos.includes(`Content-Security-Policy: ${meta}; frame-ancestors 'none'`));
  assert.match(cabecalhos, /X-Content-Type-Options: nosniff/);
  assert.match(cabecalhos, /Referrer-Policy: no-referrer/);
});

test('módulos não interpretam a entrada como HTML ou JavaScript nem enviam dados', () => {
  // Defesa de regressão sobre os pontos conhecidos; não substitui análise de fluxo.
  for (const nome of readdirSync(resolve(raiz, 'js')).filter(nome => nome.endsWith('.js'))) {
    const codigo = ler(`js/${nome}`);
    assert.doesNotMatch(codigo, /\b(?:innerHTML|outerHTML|insertAdjacentHTML|eval)\b|new\s+Function\s*\(/, nome);
    assert.doesNotMatch(codigo, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\b/, nome);
    for (const [, caminho] of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(caminho.startsWith('./'), caminho);
      assert.ok(existsSync(resolve(raiz, 'js', caminho)), caminho);
    }
  }
});
