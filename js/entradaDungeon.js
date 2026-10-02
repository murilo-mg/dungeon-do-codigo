// Cenografia estática da entrada. Não analisa o editor nem participa do jogo.
import { desenharAdereco } from './aderecosDungeon.js';
import { desenharPedra, desenharTocha, desenharVegetacao,
  desenharAlvenariaSala, desenharRedeCorredores, desenharPortaisSalas } from './desenhoMasmorra.js';
import { extrairPortasDosCorredores } from './corredores.js';
import { criarPersonagem, desenharPersonagem } from './personagem.js';
import { desenharCriatura } from './criaturas.js';

export function desenharParedeEntrada(ctx, largura, altura) {
  ctx.fillStyle = '#0e1110';
  ctx.fillRect(0, 0, largura, altura);
  const tons = ['#292821', '#25251f', '#2d2a23', '#222521', '#302b22'];
  for (let y = -10, linha = 0; y < altura; y += 19, linha++) {
    for (let x = -30 + linha % 2 * 16; x < largura; x += 33) {
      const fase = Math.abs(Math.floor(x * 13 + y * 7));
      desenharPedra(ctx, x, y, 32, 18, tons[fase % tons.length], fase);
      ctx.fillStyle = '#080d0b';
      if (fase % 5 === 0) {
        ctx.fillRect(x + 7, y + 6, 1, 7);
        ctx.fillRect(x + 8, y + 11, 5, 1);
      }
      for (let i = 0; i < 9; i++) {
        const px = x + 3 + (fase + i * 11) % 26;
        const py = y + 3 + (fase * 3 + i * 7) % 12;
        ctx.fillStyle = i % 3 ? '#74715b24' : '#070b0a66';
        ctx.fillRect(px, py, i % 2 ? 1 : 2, 1);
      }
    }
  }
  // Nichos laterais conservam o centro escuro para a leitura do editor.
  const laterais = largura < 270 ? [12, largura - 12] : [28, largura - 28];
  for (const x of laterais) {
    ctx.fillStyle = '#080d0b99';
    ctx.fillRect(x - 18, 0, 36, altura);
    for (let y = 0; y < altura - 22; y += 23) {
      desenharPedra(ctx, x - 14, y, 28, 22, '#34332a', y);
      desenharPedra(ctx, x - 16, y, 6, 22, '#4b4635', y + 1);
      if (y % 3 === 0) desenharVegetacao(ctx,
        { x: x - 20, y: y + 12, largura: 25, altura: 21 }, y, true);
    }
  }
  if (largura > 300) {
    const margemPainel = (largura - 1000 / 3) / 2;
    const xBandeira = Math.min(laterais[0] + 37, Math.max(laterais[0] + 5, margemPainel - 18));
    for (const x of [xBandeira, largura - xBandeira]) {
      desenharAdereco(ctx, 'bandeira', x, 38, true, 2);
    }
  }
  const sombra = ctx.createRadialGradient(largura / 2, altura * 0.32, 12,
    largura / 2, altura * 0.32, largura * 0.6);
  sombra.addColorStop(0, '#090b0bc7');
  sombra.addColorStop(0.6, '#090b0b85');
  sombra.addColorStop(1, '#090b0b00');
  ctx.fillStyle = sombra;
  ctx.fillRect(0, 0, largura, altura);
  for (const x of laterais) {
    for (const y of [altura * 0.31, altura * 0.69]) desenharTocha(ctx, x, Math.floor(y), 0);
  }
  if (largura > 300) {
    desenharTocha(ctx, laterais[0] + 78, 28, 0);
    desenharTocha(ctx, laterais[1] - 78, 28, 0);
  }
  for (let x = 0; x < largura; x += 29) {
    desenharPedra(ctx, x, altura - 18, 28, 17, '#4a4231', x);
  }
  if (largura > 300) {
    desenharAdereco(ctx, 'caixa', 48, altura - 36, true, 2);
    desenharAdereco(ctx, 'caixa', 48, altura - 66, true, 2);
    desenharAdereco(ctx, 'bau', 34, altura - 31, true, 2);
    desenharAdereco(ctx, 'cranio', 78, altura - 28, true, 1);
    desenharAdereco(ctx, 'barril', largura - 38, altura - 60, true, 2);
    desenharAdereco(ctx, 'caixa', largura - 54, altura - 35, true, 2);
    desenharAdereco(ctx, 'cranio', largura - 78, altura - 24, true, 1);
    for (const x of [16, 95, largura - 90, largura - 20]) {
      desenharVegetacao(ctx, { x, y: altura - 31, largura: 25, altura: 21 }, x, true);
    }
  }
}

export function desenharPreviaEntrada(ctx) {
  const salas = [{ nome: 'main', x: 17, y: 44, largura: 108, altura: 106 },
    { nome: 'processar', x: 228, y: 26, largura: 166, altura: 124 }];
  const caminho = [{ origem: 'main', destino: 'processar',
    inicio: { x: 125, y: 110 }, fim: { x: 228, y: 110 } }];
  ctx.clearRect(0, 0, 412, 172);
  desenharRedeCorredores(ctx, caminho, [], 1);
  salas.forEach((sala, i) => {
    ctx.fillStyle = i ? '#45332d' : '#423d2c';
    ctx.fillRect(sala.x, sala.y, sala.largura, sala.altura);
    desenharAlvenariaSala(ctx, sala, i ? '#c2601a' : '#c9a227', true);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${sala.nome}()`, sala.x + sala.largura / 2, sala.y + 16);
    desenharTocha(ctx, sala.x + 8, sala.y + 70, 0);
    desenharTocha(ctx, sala.x + sala.largura - 8, sala.y + 70, 0);
  });
  desenharPersonagem(ctx, criarPersonagem(72, 110), true);
  desenharCriatura(ctx, 3, 325, 115, 2, 0);
  desenharAdereco(ctx, 'cranio', 257, 119, true, 1);
  desenharAdereco(ctx, 'caixa', 365, 61, true, 1);
  desenharPortaisSalas(ctx, extrairPortasDosCorredores(salas, caminho), 0, true);
}

export function inicializarDecoracaoEntrada() {
  const fundo = document.getElementById('fundo-entrada');
  if (!fundo) return;
  const desenhar = () => {
    if (!fundo.clientWidth || !fundo.clientHeight) return;
    // Resolução nativa baixa conserva os pixels e limita o bitmap decorativo.
    fundo.width = Math.ceil(fundo.clientWidth / 3);
    fundo.height = Math.ceil(fundo.clientHeight / 3);
    desenharParedeEntrada(fundo.getContext('2d'), fundo.width, fundo.height);
  };
  desenhar();
  if (typeof ResizeObserver === 'function') {
    const observador = new ResizeObserver(desenhar);
    observador.observe(fundo);
  } else {
    window.addEventListener('resize', desenhar);
  }
  const previa = document.getElementById('preview-mapa');
  if (previa) desenharPreviaEntrada(previa.getContext('2d'));
}
