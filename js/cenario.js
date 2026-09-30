// Ambiente gerado uma vez por masmorra. Nada é sorteado durante o desenho.
import { PALETA } from './pixelArt.js';
import { LARGURA_CORREDOR } from './corredores.js';

function distanciaDoSegmento(ponto, inicio, fim) {
  const x = fim.x - inicio.x;
  const y = fim.y - inicio.y;
  const tamanhoQuadrado = x * x + y * y;
  const proporcao = tamanhoQuadrado ? Math.max(0, Math.min(1,
    ((ponto.x - inicio.x) * x + (ponto.y - inicio.y) * y) / tamanhoQuadrado)) : 0;
  return Math.hypot(ponto.x - inicio.x - x * proporcao, ponto.y - inicio.y - y * proporcao);
}

export function posicaoLivreParaDecoracao(ponto, salas, segmentos = []) {
  if (salas.some(sala => ponto.x >= sala.x - 18 && ponto.x <= sala.x + sala.largura + 18 &&
    ponto.y >= sala.y - 22 && ponto.y <= sala.y + sala.altura + 22)) return false;
  return segmentos.every(segmento =>
    distanciaDoSegmento(ponto, segmento.inicio, segmento.fim) > LARGURA_CORREDOR / 2 + 22
  );
}

export function criarCenario(salas, largura, altura, segmentos = []) {
  const decoracoes = [];
  let indice = 0;
  for (let y = 35; y < altura - 24; y += 70) {
    for (let x = 30; x < largura - 24; x += 70) {
      indice++;
      const ponto = { x: x + (indice * 37 % 31) - 15, y: y + (indice * 23 % 29) - 14 };
      if (indice % 2 === 0 || !posicaoLivreParaDecoracao(ponto, salas, segmentos)) continue;
      decoracoes.push({ ...ponto, tipo: indice % 5 === 0 ? 'tocha'
        : indice % 7 === 0 ? 'coluna' : 'pedra', fase: indice });
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
    if (decoracao.tipo === 'coluna') {
      contexto.fillStyle = '#080e11';
      contexto.fillRect(x - 10, y + 5, 21, 8);
      contexto.fillStyle = '#384448';
      contexto.fillRect(x - 8, y + 3, 16, 7);
      contexto.fillStyle = '#556064';
      contexto.fillRect(x - 5, y - 11, 10, 16);
      contexto.fillStyle = '#798080';
      contexto.fillRect(x - 6, y - 12, 12, 3);
      contexto.fillRect(x - 4, y - 8, 2, 12);
      contexto.fillStyle = '#283438';
      contexto.fillRect(x + 1, y - 10, 2, 13);
      contexto.fillStyle = '#334b39';
      contexto.fillRect(x - 8, y + 4, 7, 3);
      contexto.fillStyle = '#303e43';
      contexto.fillRect(x + 11, y + 8, 5, 4);
      return;
    }
    if (decoracao.tipo === 'pedra') {
      // Relevo dentro da margem livre de 22px já verificada na geração.
      // Os fragmentos fixos quebram o vazio sem criar novas superfícies transitáveis.
      for (let i = 0; i < 7; i++) {
        const px = x - 15 + (decoracao.fase * 7 + i * 11) % 24;
        const py = y - 10 + (decoracao.fase * 3 + i * 7) % 16;
        contexto.fillStyle = '#080e11';
        contexto.fillRect(px - 2, py + 3, 12, 8);
        contexto.fillStyle = i % 2 ? '#263137' : '#202b30';
        contexto.fillRect(px, py, 9, 8);
        contexto.fillStyle = '#344046';
        contexto.fillRect(px + 1, py, 6, 2);
        if (i % 3 === 0) {
          contexto.fillStyle = '#293e34';
          contexto.fillRect(px - 2, py + 5, 6, 4);
          contexto.fillStyle = '#3b4d37';
          contexto.fillRect(px, py + 4, 3, 2);
        }
      }
      return;
    }
    const chama = tempo > 0 ? Math.floor(tempo * 5 + decoracao.fase) % 2 : 0;
    contexto.globalAlpha = 0.07;
    contexto.fillStyle = PALETA.brasaClara;
    contexto.fillRect(x - 12, y - 16, 24, 24);
    contexto.globalAlpha = 1;
    contexto.fillStyle = '#10191e';
    contexto.fillRect(x - 8, y + 5, 16, 8);
    contexto.fillStyle = '#3c484b';
    contexto.fillRect(x - 6, y + 3, 12, 5);
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
