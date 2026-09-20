// A mesma definição visual serve à criatura da sala e ao retrato do painel.
import { PALETA, desenharPixels } from './pixelArt.js';

const CRIATURAS = {
  baixo: {
    nome: 'Gosma de musgo', nivel: 'baixo', cor: PALETA.musgo, preenchimento: 25,
    desenho: ['............', '............', '............', '....pppp....',
      '...pmmmmp...', '..pmmrrmmp..', '..pmrmmmmp..', '.pmmmmmmmmp.',
      '.pmpmmpmmmp.', '.pmmmmmmmmp.', '.pmmpppmmmp.', '..pmmmmmmp..',
      '.ppmmmmmmpp.', '..pppppppp..'],
  },
  medio: {
    nome: 'Sentinela de brasa', nivel: 'médio', cor: PALETA.brasa, preenchimento: 60,
    desenho: ['....pppp....', '...pbbbbp...', '..pbbrrbbp..', '..pbbppbbp..',
      '..pprpprpp..', '...pbbbbp...', '..ppbccbpp..', '.pbbccccbbp.',
      '.prpcoocprp.', '.pppccccppp.', '..pccccccp..', '...pppppp...',
      '...pcppcp...', '..ppp..ppp..'],
  },
  alto: {
    nome: 'Guardião das profundezas', nivel: 'alto', cor: PALETA.sangue, preenchimento: 100,
    desenho: ['.rp......pr.', '.prp....prp.', '..psppppsp..', '..pssssssp..',
      '.psbrssrbsp.', '.pspssspssp.', '..psprpssp..', '.ppsssssspp.',
      'pssssoossssp', 'prpssssssprp', '.ppsssssspp.', '.pssssssssp.',
      '..psppppsp..', '.pppp..pppp.'],
  },
};
const CORES = { p: PALETA.pedraEscura, m: PALETA.musgo, r: PALETA.pergaminho,
  b: PALETA.brasaClara, c: PALETA.brasa, s: PALETA.sangue, o: PALETA.ouro };

export function obterCriatura(complexidade) {
  if (complexidade <= 2) return CRIATURAS.baixo;
  if (complexidade <= 6) return CRIATURAS.medio;
  return CRIATURAS.alto;
}

export function desenharCriatura(contexto, complexidade, x, y, escala = 2, tempo = 0) {
  const criatura = obterCriatura(complexidade);
  const respiracao = tempo > 0 ? Math.floor(tempo * 1.5) % 2 : 0;
  contexto.save();
  contexto.fillStyle = '#00000044';
  contexto.fillRect(Math.round(x - 5 * escala), Math.round(y + 5 * escala), 10 * escala, 2 * escala);
  desenharPixels(contexto, criatura.desenho, CORES, x - 6 * escala,
    y - 7 * escala - respiracao, escala);
  contexto.restore();
}
