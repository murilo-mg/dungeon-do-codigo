// Degraus dos botões de zoom; Encaixar permanece o mínimo próprio de cada dungeon.
const NIVEIS_CANONICOS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function proximoZoomDiscreto(zoomAtual, zoomEncaixar, direcao) {
  const niveis = [zoomEncaixar, ...NIVEIS_CANONICOS.filter(nivel => nivel > zoomEncaixar)];
  if (direcao > 0) return niveis.find(nivel => nivel > zoomAtual) ?? niveis.at(-1);
  return niveis.findLast(nivel => nivel < zoomAtual) ?? zoomEncaixar;
}
