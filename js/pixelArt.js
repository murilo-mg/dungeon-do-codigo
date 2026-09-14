// Paleta compartilhada com css/estilo.css e desenhos em pixels inteiros.
export const PALETA = {
  pedraEscura: '#181410', pedra: '#241e17', pedraClara: '#332a1f',
  pergaminho: '#e8dcc0', pergaminhoFraco: '#a89a7d', brasa: '#c2601a',
  brasaClara: '#e9822f', musgo: '#5a7d3a', sangue: '#8f2323', ouro: '#c9a227',
};

export function desenharPixels(contexto, desenho, cores, x, y, escala = 2, espelhar = false) {
  const largura = desenho[0].length;
  desenho.forEach((linha, indiceY) => {
    [...linha].forEach((pixel, indiceX) => {
      if (!cores[pixel]) return;
      contexto.fillStyle = cores[pixel];
      contexto.fillRect(Math.round(x) + (espelhar ? largura - 1 - indiceX : indiceX) * escala,
        Math.round(y) + indiceY * escala, escala, escala);
    });
  });
}
