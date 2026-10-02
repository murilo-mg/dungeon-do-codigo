// Ambiente gerado uma vez por masmorra. Nada é sorteado durante o desenho.
import { PALETA } from './pixelArt.js';
import { LARGURA_CORREDOR } from './corredores.js';
import { desenharRochaMusgosa, desenharTocha, pedraSobreCorredor } from './desenhoMasmorra.js';
import { desenharAdereco, limitesAdereco } from './aderecosDungeon.js';

const TIPOS_ADERECOS = ['caixa', 'bau', 'barril', 'cranio'];

function limitesDecoracao(decoracao) {
  if (TIPOS_ADERECOS.includes(decoracao.tipo) || decoracao.tipo === 'bandeira') {
    return limitesAdereco(decoracao.tipo, decoracao.x, decoracao.y);
  }
  return { x: decoracao.x - 16, y: decoracao.y - 24, largura: 32, altura: 40 };
}

function sobrepoe(a, b, margem = 0) {
  return a.x < b.x + b.largura + margem && a.x + a.largura > b.x - margem &&
    a.y < b.y + b.altura + margem && a.y + a.altura > b.y - margem;
}

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
  const terreno = [];
  const adicionar = decoracao => {
    const area = limitesDecoracao(decoracao);
    if (area.x < 0 || area.y < 0 || area.x + area.largura > largura || area.y + area.altura > altura ||
        salas.some(sala => sobrepoe(area, sala, 6)) || pedraSobreCorredor(area, segmentos) ||
        decoracoes.some(outra => sobrepoe(area, limitesDecoracao(outra), 5))) return false;
    decoracoes.push(decoracao);
    return true;
  };
  // Estandartes ficam ao lado das paredes, sem cobrir placas ou portas.
  salas.forEach((sala, fase) => {
    for (const x of [sala.x - 38, sala.x + sala.largura + 38]) {
      if (adicionar({ x, y: sala.y + sala.altura / 2, tipo: 'bandeira', fase })) break;
    }
  });
  // Textura fixa do terreno bruto: não acrescenta piso ou área caminhável.
  for (let y = 22; y < altura - 22; y += 38) {
    for (let x = 22; x < largura - 22; x += 38) {
      const fase = Math.abs(Math.imul(x, 73856093) ^ Math.imul(y, 19349663));
      const ponto = {
        x: Math.max(18, Math.min(largura - 18, x + fase % 25 - 12)),
        y: Math.max(22, Math.min(altura - 22, y + (fase >>> 4) % 25 - 12)),
      };
      if (!posicaoLivreParaDecoracao(ponto, salas, segmentos)) continue;
      terreno.push({ ...ponto, fase });
    }
  }
  let indice = 0;
  let variedade = 0;
  for (let y = 35; y < altura - 24; y += 70) {
    for (let x = 30; x < largura - 24; x += 70) {
      indice++;
      const ponto = { x: x + (indice * 37 % 31) - 15, y: y + (indice * 23 % 29) - 14 };
      if (indice % 2 === 0 || !posicaoLivreParaDecoracao(ponto, salas, segmentos)) continue;
      const tipo = indice % 5 === 0 ? 'tocha' : indice % 7 === 0 ? 'coluna' :
        indice % 3 === 0 ? TIPOS_ADERECOS[variedade % TIPOS_ADERECOS.length] : 'pedra';
      if (adicionar({ ...ponto, tipo, fase: indice }) && TIPOS_ADERECOS.includes(tipo)) variedade++;
    }
  }
  const nuvens = Array.from({ length: 6 }, (_, indiceNuvem) => ({
    x: indiceNuvem * largura / 6, y: 24 + (indiceNuvem * 83) % Math.max(1, altura - 100),
    escala: indiceNuvem % 2 ? 2 : 3, velocidade: indiceNuvem % 2 ? 3 : 1.5,
    opacidade: indiceNuvem % 2 ? 0.07 : 0.04,
  }));
  return { decoracoes, terreno, nuvens, largura };
}

export function desenharFundo(contexto, cenario, tempo, zoom = 1) {
  contexto.save();
  for (const { x, y, fase } of cenario.terreno ?? []) {
    const deslocamento = fase % 5;
    contexto.fillStyle = fase % 3 ? '#111d21' : '#14221f';
    contexto.fillRect(x - 15 + deslocamento, y - 11, 28 - deslocamento, 21);
    contexto.fillRect(x - 18, y - 6 + deslocamento, 36, 10);
    contexto.fillStyle = '#1b292b';
    contexto.fillRect(x - 12 + deslocamento, y - 8, 15 + fase % 8, 4);
    contexto.fillStyle = '#0a1418';
    contexto.fillRect(x + 5, y + 6, 12, 3);
    contexto.fillStyle = fase % 2 ? '#26392e' : '#203032';
    contexto.fillRect(x - 8, y + 4, 10 + deslocamento, 3);
    if (zoom >= 0.5) {
      for (let i = 0; i < 5; i++) {
        const px = x - 16 + (fase + i * 13) % 31;
        const py = y - 9 + ((fase >>> 3) + i * 7) % 18;
        contexto.fillStyle = i % 2 ? '#34413b' : '#091317';
        contexto.fillRect(px, py, i % 2 ? 2 : 3, 1);
      }
    }
  }
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

export function desenharDecoracoes(contexto, cenario, tempo, zoom = 1) {
  contexto.save();
  cenario.decoracoes.forEach(decoracao => {
    const { x, y } = decoracao;
    if (TIPOS_ADERECOS.includes(decoracao.tipo) || decoracao.tipo === 'bandeira') {
      desenharAdereco(contexto, decoracao.tipo, x, y, zoom >= 0.5);
      return;
    }
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
      if (zoom >= 0.5) {
        contexto.fillStyle = '#182328';
        contexto.fillRect(x - 1, y - 12, 4, 2);
        contexto.fillRect(x + 1, y - 10, 1, 4);
        contexto.fillStyle = '#a0a394';
        contexto.fillRect(x - 5, y - 12, 3, 1);
        contexto.fillStyle = '#35462f';
        contexto.fillRect(x - 11, y + 2, 4, 5);
        contexto.fillStyle = '#526443';
        contexto.fillRect(x - 10, y + 1, 2, 3);
        contexto.fillStyle = '#5e6862';
        contexto.fillRect(x + 11, y + 8, 4, 1);
      }
      return;
    }
    if (decoracao.tipo === 'pedra') {
      // A silhueta inteira cabe na margem livre verificada na geração.
      desenharRochaMusgosa(contexto, { x: x - 16, y: y - 13, largura: 32, altura: 26 },
        decoracao.fase, zoom >= 0.5);
      return;
    }
    contexto.fillStyle = '#10191e';
    contexto.fillRect(x - 8, y + 5, 16, 8);
    contexto.fillStyle = '#3c484b';
    contexto.fillRect(x - 6, y + 3, 12, 5);
    contexto.fillStyle = PALETA.pedraClara;
    contexto.fillRect(x - 3, y, 6, 9);
    contexto.fillStyle = PALETA.pergaminhoFraco;
    contexto.fillRect(x - 2, y + 1, 4, 2);
    desenharTocha(contexto, x, y - 1, tempo ? tempo + decoracao.fase : 0);
  });
  contexto.restore();
}
