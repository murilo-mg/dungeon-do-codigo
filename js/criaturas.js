// A mesma definição visual serve à criatura da sala e ao retrato do painel.
import { PALETA, desenharPixels } from './pixelArt.js';

const CRIATURAS = {
  baixo: {
    nome: 'Gosma de musgo', nivel: 'baixo', cor: PALETA.musgo, preenchimento: 25,
    cores: { p: '#10191d', m: '#588344', s: '#304c35', b: '#70974d',
      l: '#b6c574', r: '#f3ebce', o: '#d8b757', e: '#10191d' },
    desenho: ['..............', '..............', '.......pp.....', '......pbbp....',
      '....ppbllbpp..', '...pbblbbbmmp.', '..pblrbmmmmmp.', '..pbmmmmmmmmp.',
      '.pbmmreemreemp', '.pbmmeemmeemmp',
      '.pmmmmmmsmmmp.', '.pmmmmpepmmmp.', '.pmsmmmmmsmmp.',
      '.pssmmmmmmssp.', '..pssmmssssp..', '...pppppppp...'],
  },
  medio: {
    nome: 'Sentinela de brasa', nivel: 'médio', cor: PALETA.brasa, preenchimento: 60,
    cores: { p: '#10191d', c: '#b55d27', s: '#703b28', b: '#e7913b',
      g: '#567075', t: '#9bb4ac', r: '#f4d7a1', e: '#102024', o: '#eac361' },
    desenho: ['.....pppp.....', '....pbtcbp....', '...pbtttcbp...', '...ptggggtp...',
      '...pgroorgp...', '...pggeeggp...', '....pggggp....', '..ppcbccbcpp..',
      '.ptpbcoocbpbp.', '.pgpbccccbpbp.', '.pgppscscppbp.', '.ptpccoocspbp.',
      '..ppcscsscpp..', '...psccccsp...', '....pgppgp....', '...ptp..ptp...'],
  },
  alto: {
    nome: 'Guardião das profundezas', nivel: 'alto', cor: PALETA.sangue, preenchimento: 100,
    cores: { p: '#151721', s: '#a93736', c: '#642a33', b: '#d05a43',
      h: '#b0a48f', r: '#e5d8b4', o: '#ffd16a', e: '#151721', g: '#615963' },
    desenho: ['.rp........pr.', '.prp......prp.', '..phrpppprhp..', '..psbssssbsp..',
      '..pbossssobp..', '..pspeeeepsp..', '...psrerrsp...', '...ppsccspp...',
      '.ppbssbbssbpp.', 'prpsssggsssprp', 'phpbssoossbphp',
      '.ppcssssccspp.', '..psbssssbsp..', '..psccssccsp..', '..pgcp..pcgp..',
      '.prppp..ppprp.'],
  },
};

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
  desenharPixels(contexto, criatura.desenho, criatura.cores, x - 7 * escala,
    y - 9 * escala - respiracao, escala);
  contexto.restore();
}
