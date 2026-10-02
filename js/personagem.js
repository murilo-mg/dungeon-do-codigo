// Estado, movimento e animação do aventureiro, sem eventos ou acesso ao DOM.
import { PALETA, desenharPixels } from './pixelArt.js';

export const VELOCIDADE_PERSONAGEM = 156; // Pixels por segundo (2,6 por quadro a 60 Hz).
export const RAIO_BASE_PERSONAGEM = 10;
const DURACAO_PASSO = 0.8;
const INTERVALO_PASSO = 0.14;
const QUADROS_CAMINHADA = [0, 1, 0, 2];
const CORES = { p: '#13191c', c: '#cb6b27', b: '#ec9c42', s: '#8b431e',
  r: '#edbc83', h: '#ac7147', e: '#382c24', o: '#d6b266',
  g: '#a1bbc1', t: '#51666d', k: '#46322a', l: '#715443' };
const CORPOS = {
  baixo: ['.....pppp.....', '....pbbbbp....', '...pbccccbp...', '...pcrrrrcp...',
    '...prerrerp...', '...phrrrrhp...', '....phhhhp....', '...psccccsp...',
    '..prbccccbrp..', '..prbcccbprp..', '..ppccccccpp..', '..pgpcoccpcp..',
    '..pgpcccccsp..', '...ppccccpp...'],
  cima: ['.....pppp.....', '....pbbbbp....', '...pbccccbp...', '...pbccccbp...',
    '...pbccsscp...', '...pccssscp...', '....pccccp....', '...psccccsp...',
    '..prbccccbrp..', '..prbcsccbrp..', '..ppbcscccpp..', '..pgpcoccpcp..',
    '..pgpcscscsp..', '...ppccccpp...'],
  direita: ['.....pppp.....', '.....pbbbp....', '....pbcccbp...', '....pcrrrrp...',
    '....phrerrpp..', '.....phrrrp...', '.....phhhp....', '....pscccp....',
    '...pbcccbrp...', '...pbccprhp...', '...psccpppp...', '..pgpcoccp....',
    '..pgpcccsp....', '...ppccppp....'],
};
const PERNAS = [
  ['....pkppkp....', '...plp..plp...'],
  ['...pkp..ppp...', '...plp........'],
  ['...ppp..pkp...', '........plp...'],
];

export function criarPersonagem(x, y) {
  return { x, y, direcao: 'baixo', andando: false, tempoAndando: 0,
    tempoParado: 0, tempoPasso: 0, pe: 1, passos: [] };
}

export function atualizarPersonagem(jogador, direcao, segundos, limites,
  reduzirMovimento = false, resolverMovimento = null) {
  const comprimento = Math.hypot(direcao.x, direcao.y);
  const anterior = { x: jogador.x, y: jogador.y };
  if (comprimento) {
    jogador.direcao = direcao.x ? (direcao.x > 0 ? 'direita' : 'esquerda')
      : (direcao.y > 0 ? 'baixo' : 'cima');
    const deslocamento = {
      x: direcao.x / comprimento * VELOCIDADE_PERSONAGEM * segundos,
      y: direcao.y / comprimento * VELOCIDADE_PERSONAGEM * segundos,
    };
    const posicao = resolverMovimento ? resolverMovimento(anterior, deslocamento) : {
      x: Math.max(12, Math.min(limites.largura - 12, jogador.x + deslocamento.x)),
      y: Math.max(14, Math.min(limites.altura - 14, jogador.y + deslocamento.y)),
    };
    jogador.x = posicao.x;
    jogador.y = posicao.y;
  }
  jogador.andando = jogador.x !== anterior.x || jogador.y !== anterior.y;
  jogador.tempoAndando = jogador.andando ? jogador.tempoAndando + segundos : 0;
  jogador.tempoParado = jogador.andando ? 0 : jogador.tempoParado + segundos;
  jogador.passos = reduzirMovimento ? [] : jogador.passos
    .map(passo => ({ ...passo, vida: passo.vida - segundos })).filter(passo => passo.vida > 0);
  if (!jogador.andando || reduzirMovimento) {
    jogador.tempoPasso = 0;
    return;
  }
  jogador.tempoPasso += segundos;
  if (jogador.tempoPasso >= INTERVALO_PASSO) {
    jogador.tempoPasso %= INTERVALO_PASSO;
    jogador.pe *= -1;
    jogador.passos.push({ x: anterior.x - direcao.y / comprimento * jogador.pe * 3,
      y: anterior.y + 11 + direcao.x / comprimento * jogador.pe * 3,
      vida: DURACAO_PASSO, horizontal: direcao.x !== 0 });
    jogador.passos = jogador.passos.slice(-16);
  }
}

export function desenharPassos(contexto, jogador) {
  contexto.save();
  contexto.fillStyle = PALETA.pergaminhoFraco;
  jogador.passos.forEach(passo => {
    contexto.globalAlpha = passo.vida / DURACAO_PASSO * 0.32;
    contexto.fillRect(Math.round(passo.x), Math.round(passo.y), passo.horizontal ? 4 : 2,
      passo.horizontal ? 2 : 4);
  });
  contexto.restore();
}

export function desenharPersonagem(contexto, jogador, reduzirMovimento = false) {
  const quadro = jogador.andando && !reduzirMovimento
    ? QUADROS_CAMINHADA[Math.floor(jogador.tempoAndando / INTERVALO_PASSO) % 4] : 0;
  const respiracao = !reduzirMovimento && jogador.tempoParado > 3
    ? Math.floor((jogador.tempoParado - 3) * 2) % 2 : 0;
  const corpo = CORPOS[jogador.direcao === 'esquerda' ? 'direita' : jogador.direcao];
  contexto.save();
  contexto.fillStyle = '#00000055';
  contexto.fillRect(Math.round(jogador.x - 10), Math.round(jogador.y + 10), 20, 5);
  desenharPixels(contexto, [...corpo, ...PERNAS[quadro]], CORES,
    jogador.x - 14, jogador.y - 18 - respiracao, 2, jogador.direcao === 'esquerda');
  contexto.restore();
}
