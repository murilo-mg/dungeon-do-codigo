// Seleciona sinais visuais a partir dos metadados já calculados da função.
const ESTRUTURAS = [
  ['if', 'I'],
  ['for', 'F'],
  ['while', 'W'],
  ['switch', 'S'],
];

export function obterMarcadoresEstruturais(sala) {
  return {
    estruturas: ESTRUTURAS
      .filter(([tipo]) => sala.estruturasPorTipo?.[tipo] > 0)
      .map(([, marcador]) => marcador),
    chamada: sala.recursivaDireta ? 'R' : sala.participaDeCiclo ? 'C' : null,
  };
}
