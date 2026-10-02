// Adereços decorativos compartilhados pelo cenário e pela página inicial.
// As silhuetas não atribuem importância, loot ou perigo às funções.
import { desenharPixels } from './pixelArt.js';

const CORES = {
  o: '#101513', d: '#38251a', w: '#6b4526', W: '#946439', l: '#b88a50',
  i: '#424945', I: '#7d8273', g: '#94713a', G: '#d0a052',
  r: '#3e1b1c', R: '#722c29', c: '#9b4833',
  b: '#bfb092', B: '#e6d6b0', s: '#7d7563',
};

const ARTES = {
  bandeira: [
    'oggggggggggo',
    'gGGGGGGGGGGg',
    '.gRccccRRRg.',
    '.gRccRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcGRRGRrg.',
    '.gRGRRRRGrg.',
    '.gRGRRRRGrg.',
    '.gGRRGGRRgg.',
    '.gRGRRRRGrg.',
    '.gRGRRRRGrg.',
    '.gRcGRRGRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.gRcRRRRRrg.',
    '.ggcRRRRrgg.',
    '..ggRRRRgg..',
    '...ggRRgg...',
    '....gGgg....',
    '.....gg.....',
  ],
  caixa: [
    '.oooooooooooooo.',
    'oGllllllllllllwo',
    'oGWWWWWWWWWWWWwo',
    'oGWwWwWwWwWwWWwo',
    'ogllWWWWWWWWllgo',
    'ogWllWwWwWWllwgo',
    'ogWwllWWWWllWwgo',
    'ogWWWllWWllWWWgo',
    'ogWwWWllllWwWWgo',
    'ogWWWllWWllWWWgo',
    'ogWwllWWWWllWwgo',
    'ogWllWwWwWWllwgo',
    'ogllWWWWWWWWllgo',
    'ogwwwwwwwwwwwwgo',
    'oGGGGGGGGGGGGGgo',
    '.oooooooooooooo.',
  ],
  bau: [
    '...oooooooooooo...',
    '..oWWlWWWWlWWwwo..',
    '.oWWlWWWlWWWlWwwo.',
    'oWlWWWWWlWWWWlwwwo',
    'oWWWWWWlWWWWWWwwwo',
    'oIGGGGGGGGGGGGGGIo',
    'oIwwwwwwIIwwwwwwIo',
    'oIWwWwWWIGWWwWwwIo',
    'oIWWWWWWIGWWWWwwIo',
    'oIWwWwWWIIWWwWwwIo',
    'oIWWWWWWWWWWWWwwIo',
    'oIwwwwwwwwwwwwwwIo',
    'oIGGGGGGGGGGGGGGIo',
    '.oooooooooooooooo.',
  ],
  barril: [
    '...oooooo...',
    '..olllllwo..',
    '.oWWwwWwwwo.',
    '.oIGGGGGIIo.',
    'oIWWWWWwwIIo',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oWwWWwWwwwwO',
    'oIWWWWWwwIIo',
    '.oIGGGGGIIo.',
    '.owwwwwwwwo.',
    '..oooooooo..',
  ].map(linha => linha.replaceAll('O', 'o')),
  cranio: [
    '....oooo....',
    '..ooBBBBoo..',
    '.oBBBBBBBbo.',
    '.oBBbBBBBbo.',
    'oBooBBooBboo',
    'oBooBBooBboo',
    '.obBooBBbbo.',
    '..obBBbbbo..',
    '..obobobbo..',
    '...oooooo...',
    '.ss......ss.',
    'sbsssssssbbs',
  ],
};

export function limitesAdereco(tipo, x, y, escala = 2) {
  const arte = ARTES[tipo];
  return { x: Math.round(x - arte[0].length * escala / 2), y: Math.round(y - arte.length * escala / 2),
    largura: arte[0].length * escala, altura: arte.length * escala };
}

export function desenharAdereco(contexto, tipo, x, y, detalhar = true, escala = 2) {
  const limites = limitesAdereco(tipo, x, y, escala);
  const cores = detalhar ? CORES : { ...CORES, l: CORES.W, I: CORES.i, c: CORES.R, B: CORES.b };
  desenharPixels(contexto, ARTES[tipo], cores, limites.x, limites.y, escala);
}
