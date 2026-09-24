// Converte arestas reais do grafo em segmentos geométricos compartilhados.

export function criarSegmentosDeCorredores(salas, arestas = []) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  const segmentos = [];
  const segmentosConhecidos = new Set();

  for (const aresta of arestas) {
    const origem = salasPorNome.get(aresta?.origem);
    const destino = salasPorNome.get(aresta?.destino);
    if (!origem || !destino || origem === destino) continue;

    const chave = `${aresta.origem}->${aresta.destino}`;
    if (segmentosConhecidos.has(chave)) continue;

    segmentosConhecidos.add(chave);
    segmentos.push({
      origem: aresta.origem,
      destino: aresta.destino,
      inicio: centroDaSala(origem),
      fim: centroDaSala(destino),
    });
  }

  return segmentos;
}

function centroDaSala(sala) {
  return {
    x: sala.x + sala.largura / 2,
    y: sala.y + sala.altura / 2,
  };
}
