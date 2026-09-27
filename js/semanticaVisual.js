// Seleciona sinais visuais a partir dos metadados já calculados da função.
import { corPorSala } from './masmorra.js';
import { PALETA } from './pixelArt.js';

const ESTRUTURAS = [
  ['if', 'I'],
  ['for', 'F'],
  ['while', 'W'],
  ['switch', 'S'],
];

export const LIMIAR_IDENTIFICACAO = 0.75;
export const LIMIAR_DETALHES = 1;

export function obterNivelDetalhe(zoom) {
  if (zoom >= LIMIAR_DETALHES) return 'proxima';
  if (zoom >= LIMIAR_IDENTIFICACAO) return 'intermediaria';
  return 'distante';
}

export function obterMarcadoresEstruturais(sala) {
  return {
    estruturas: ESTRUTURAS
      .filter(([tipo]) => sala.estruturasPorTipo?.[tipo] > 0)
      .map(([, marcador]) => marcador),
    chamada: sala.recursivaDireta ? 'R' : sala.participaDeCiclo ? 'C' : null,
  };
}

export function obterEstiloVisualDaSala(sala, modo) {
  if (modo === 'estrutura') {
    return {
      corBase: sala.ehSalaInicial ? PALETA.pedraClara : PALETA.pedra,
      exibirCriatura: false,
      destacarMarcadores: true,
    };
  }
  return { corBase: corPorSala(sala), exibirCriatura: true, destacarMarcadores: false };
}
