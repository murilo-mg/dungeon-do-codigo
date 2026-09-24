// Representa a estrutura de chamadas entre as funções analisadas.

export function criarGrafo(funcoes) {
  const nos = new Map(
    funcoes.map(funcao => [
      funcao.nome,
      {
        nome: funcao.nome,
        funcao,
        chamadaPor: [],
        profundidade: null,
        alcancavel: false,
      },
    ])
  );

  const entrada = encontrarEntrada(funcoes);
  const arestas = [];
  const arestasConhecidas = new Set();

  for (const funcao of funcoes) {
    for (const nomeChamado of funcao.chamadas ?? []) {
      const noDestino = nos.get(nomeChamado);
      if (!noDestino) continue;

      const chaveAresta = `${funcao.nome}->${nomeChamado}`;
      if (arestasConhecidas.has(chaveAresta)) continue;

      arestasConhecidas.add(chaveAresta);
      arestas.push({ origem: funcao.nome, destino: nomeChamado });
      noDestino.chamadaPor.push(funcao.nome);
    }
  }

  calcularAlcanceEDistancias(entrada, nos);

  return { entrada, nos, arestas };
}

function encontrarEntrada(funcoes) {
  return funcoes.find(funcao => funcao.nome === 'main')?.nome
    ?? funcoes[0]?.nome
    ?? null;
}

function calcularAlcanceEDistancias(entrada, nos) {
  if (entrada === null) return;

  const noEntrada = nos.get(entrada);
  noEntrada.alcancavel = true;
  noEntrada.profundidade = 0;

  const fila = [entrada];
  for (let indice = 0; indice < fila.length; indice++) {
    const nomeAtual = fila[indice];
    const noAtual = nos.get(nomeAtual);
    const profundidadeSeguinte = noAtual.profundidade + 1;

    for (const aresta of noAtual.funcao.chamadas ?? []) {
      const noDestino = nos.get(aresta);
      if (!noDestino || noDestino.alcancavel) continue;

      noDestino.alcancavel = true;
      noDestino.profundidade = profundidadeSeguinte;
      fila.push(aresta);
    }
  }
}

// BFS pelas arestas: o primeiro predecessor preserva a ordem estrutural
// e produz um caminho mínimo, inclusive na presença de ciclos.
export function encontrarCaminhoDaEntrada(grafo, nomeDestino) {
  if (!grafo.nos.has(grafo.entrada) || !grafo.nos.has(nomeDestino)) return null;

  const adjacencias = new Map();
  for (const { origem, destino } of grafo.arestas) {
    if (!adjacencias.has(origem)) adjacencias.set(origem, []);
    adjacencias.get(origem).push(destino);
  }
  const predecessores = new Map([[grafo.entrada, null]]);
  const fila = [grafo.entrada];
  for (let indice = 0; indice < fila.length; indice++) {
    const atual = fila[indice];
    if (atual === nomeDestino) {
      const caminho = [];
      for (let nome = atual; nome !== null; nome = predecessores.get(nome)) {
        caminho.push(nome);
      }
      return caminho.reverse();
    }
    for (const destino of adjacencias.get(atual) ?? []) {
      if (!grafo.nos.has(destino) || predecessores.has(destino)) continue;
      predecessores.set(destino, atual);
      fila.push(destino);
    }
  }
  return null;
}

export function obterEstruturaDaFuncao(grafo, nome) {
  const no = grafo.nos.get(nome);
  if (!no) return null;
  return {
    profundidade: no.profundidade,
    ehEntrada: nome === grafo.entrada,
    callers: [...no.chamadaPor],
    callees: grafo.arestas.filter(aresta => aresta.origem === nome)
      .map(aresta => aresta.destino),
    caminho: encontrarCaminhoDaEntrada(grafo, nome),
  };
}
