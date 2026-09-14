// Ambiente gerado uma vez por masmorra. Nada é sorteado durante o desenho.
import { PALETA } from './pixelArt.js';

function distanciaDoSegmento(ponto, inicio, fim) {
  const x = fim.x - inicio.x;
  const y = fim.y - inicio.y;
  const tamanhoQuadrado = x * x + y * y;
  const proporcao = tamanhoQuadrado ? Math.max(0, Math.min(1,
    ((ponto.x - inicio.x) * x + (ponto.y - inicio.y) * y) / tamanhoQuadrado)) : 0;
  return Math.hypot(ponto.x - inicio.x - x * proporcao, ponto.y - inicio.y - y * proporcao);
}

function centroDaSala(sala) {
  return { x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 };
}

export function posicaoLivreParaDecoracao(ponto, salas) {
  if (salas.some(sala => ponto.x >= sala.x - 18 && ponto.x <= sala.x + sala.largura + 18 &&
    ponto.y >= sala.y - 22 && ponto.y <= sala.y + sala.altura + 22)) return false;
  const inicial = salas.find(sala => sala.ehSalaInicial);
  return !inicial || salas.every(sala => sala === inicial ||
    distanciaDoSegmento(ponto, centroDaSala(inicial), centroDaSala(sala)) > 22);
}

export function criarCenario(salas, largura, altura) {
  const decoracoes = [];
  let indice = 0;
  for (let y = 35; y < altura - 24; y += 70) {
    for (let x = 30; x < largura - 24; x += 70) {
      indice++;
      const ponto = { x: x + (indice * 17 % 19) - 9, y: y + (indice * 11 % 15) - 7 };
      if (indice % 2 === 0 || !posicaoLivreParaDecoracao(ponto, salas)) continue;
      decoracoes.push({ ...ponto, tipo: indice % 5 === 0 ? 'tocha' : 'pedra', fase: indice });
    }
  }
  const nuvens = Array.from({ length: 6 }, (_, indiceNuvem) => ({
    x: indiceNuvem * largura / 6, y: 24 + (indiceNuvem * 83) % Math.max(1, altura - 100),
    escala: indiceNuvem % 2 ? 2 : 3, velocidade: indiceNuvem % 2 ? 3 : 1.5,
    opacidade: indiceNuvem % 2 ? 0.07 : 0.04,
  }));
  return { decoracoes, nuvens, largura };
}

export function desenharFundo(contexto, cenario, tempo) {
  contexto.save();
  contexto.fillStyle = PALETA.pergaminhoFraco;
  cenario.nuvens.forEach(nuvem => {
    const largura = 48 * nuvem.escala;
    const x = Math.floor((nuvem.x + tempo * nuvem.velocidade) % (cenario.largura + largura) - largura);
    const y = nuvem.y;
    contexto.globalAlpha = nuvem.opacidade;
    contexto.fillRect(x + 12 * nuvem.escala, y, 20 * nuvem.escala, 4 * nuvem.escala);
    contexto.fillRect(x + 5 * nuvem.escala, y + 4 * nuvem.escala, 35 * nuvem.escala, 5 * nuvem.escala);
    contexto.fillRect(x, y + 9 * nuvem.escala, largura, 5 * nuvem.escala);
    contexto.fillRect(x + 8 * nuvem.escala, y + 14 * nuvem.escala, 34 * nuvem.escala, 3 * nuvem.escala);
  });
  contexto.restore();
}

export function desenharDecoracoes(contexto, cenario, tempo) {
  contexto.save();
  cenario.decoracoes.forEach(decoracao => {
    const { x, y } = decoracao;
    if (decoracao.tipo === 'pedra') {
      contexto.fillStyle = PALETA.pedra;
      contexto.fillRect(x - 5, y - 2, 10, 5);
      contexto.fillStyle = PALETA.pedraClara;
      contexto.fillRect(x - 3, y - 4, 6, 2);
      contexto.fillRect(x + 8, y + 3, 3, 2);
      return;
    }
    const chama = tempo > 0 ? Math.floor(tempo * 5 + decoracao.fase) % 2 : 0;
    contexto.globalAlpha = 0.07;
    contexto.fillStyle = PALETA.brasaClara;
    contexto.fillRect(x - 12, y - 16, 24, 24);
    contexto.globalAlpha = 1;
    contexto.fillStyle = PALETA.pedraClara;
    contexto.fillRect(x - 3, y, 6, 9);
    contexto.fillStyle = PALETA.pergaminhoFraco;
    contexto.fillRect(x - 2, y + 1, 4, 2);
    contexto.fillStyle = PALETA.brasa;
    contexto.fillRect(x - 4, y - 8 - chama * 2, 8, 9 + chama * 2);
    contexto.fillStyle = PALETA.brasaClara;
    contexto.fillRect(x - 2, y - 7, 4, 7);
    contexto.fillStyle = PALETA.ouro;
    contexto.fillRect(x, y - 5 + chama, 2, 4);
  });
  contexto.restore();
}
