// Seleciona sinais visuais a partir dos metadados já calculados da função.
import { corPorSala } from './masmorra.js';
import { PALETA } from './pixelArt.js';
import { chaveDoCorredor } from './corredores.js';

export function classificarVisualmenteCorredores(regioes, arestas) {
  const porFuncao = new Map(regioes.flatMap(regiao =>
    regiao.funcoes.map(nome => [nome, regiao.id])));
  return new Map(arestas.map(aresta => {
    const origem = porFuncao.get(aresta.origem);
    const destino = porFuncao.get(aresta.destino);
    return [chaveDoCorredor(aresta.origem, aresta.destino),
      origem === undefined || destino === undefined ? 'sem-regiao'
        : origem === destino ? 'interno' : 'entre-regioes'];
  }));
}

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

// Geometria usada somente pelo desenho; a classificação continua em masmorra.regioes.
export function calcularLimitesVisuaisRegioes(regioes, salas, margem = 20) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  return regioes.flatMap(regiao => {
    const membros = regiao.funcoes.map(nome => salasPorNome.get(nome)).filter(Boolean);
    if (!membros.length) return [];
    let esquerda = Infinity;
    let topo = Infinity;
    let direita = -Infinity;
    let base = -Infinity;
    for (const sala of membros) {
      esquerda = Math.min(esquerda, sala.x);
      topo = Math.min(topo, sala.y);
      direita = Math.max(direita, sala.x + sala.largura);
      base = Math.max(base, sala.y + sala.altura);
    }
    return [{ id: regiao.id, tipo: regiao.tipo, titulo: regiao.titulo,
      x: esquerda - margem, y: topo - margem,
      largura: direita - esquerda + margem * 2,
      altura: base - topo + margem * 2 }];
  });
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

// Identidade visual das regiões.
// A cor da região serve apenas para distinguir territórios.
// A cor de cada sala continua representando sua complexidade.
export const CORES_ALAS = [
  '#4f8fd6',
  '#5faa6a',
  '#a06ad0',
  '#d0645a',
  '#3fb0b0',
  '#d878a8',
  '#a3b84a',
  '#8f9ce0',
];

export const COR_ISOLADAS = '#8a8378';

export function atribuirCoresRegioes(regioes) {
  const cores = new Map();
  let indiceAla = 0;

  for (const regiao of regioes ?? []) {
    if (regiao.tipo === 'entrada') {
      cores.set(regiao.id, PALETA.ouro);
      continue;
    }

    if (regiao.tipo === 'hub') {
      cores.set(regiao.id, PALETA.pergaminho);
      continue;
    }

    if (regiao.tipo === 'isoladas') {
      cores.set(regiao.id, COR_ISOLADAS);
      continue;
    }

    cores.set(
      regiao.id,
      CORES_ALAS[indiceAla % CORES_ALAS.length]
    );

    indiceAla++;
  }

  return cores;
}
