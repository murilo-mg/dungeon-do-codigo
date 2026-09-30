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
        recursivaDireta: false,
        participaDeCiclo: false,
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

  marcarCiclos(nos, arestas);
  calcularAlcanceEDistancias(entrada, nos);

  return { entrada, nos, arestas };
}

function marcarCiclos(nos, arestas) {
  const adjacencias = new Map([...nos.keys()].map(nome => [nome, []]));
  for (const { origem, destino } of arestas) {
    adjacencias.get(origem).push(destino);
    if (origem === destino) nos.get(origem).recursivaDireta = true;
  }

  for (const [nome, no] of nos) {
    const visitados = new Set();
    const pendentes = [...adjacencias.get(nome)];
    while (pendentes.length > 0) {
      const atual = pendentes.pop();
      if (atual === nome) {
        no.participaDeCiclo = true;
        break;
      }
      if (visitados.has(atual)) continue;
      visitados.add(atual);
      pendentes.push(...adjacencias.get(atual));
    }
  }
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

// Considera todas as cadeias de chamadas até a primeira chegada à função alvo.
export function calcularContextoTopologico(grafo, nomeSelecionado) {
  if (!grafo.nos.has(nomeSelecionado)) return null;

  const funcoes = new Set([nomeSelecionado]);
  const arestas = new Map();
  if (nomeSelecionado === grafo.entrada) return { funcoes, arestas };

  const saidas = new Map();
  const entradas = new Map();
  for (const { origem, destino } of grafo.arestas) {
    if (!saidas.has(origem)) saidas.set(origem, []);
    if (!entradas.has(destino)) entradas.set(destino, []);
    saidas.get(origem).push(destino);
    entradas.get(destino).push(origem);
  }

  // Não passa pelo alvo ao avançar: descendentes que só podem ser alcançados
  // depois da seleção não viram ancestrais por causa de um ciclo de retorno.
  const antesDoAlvo = visitarRelacoes(grafo.entrada, saidas, nomeSelecionado);
  const ateOAlvo = visitarRelacoes(nomeSelecionado, entradas);
  for (const nome of antesDoAlvo) {
    if (ateOAlvo.has(nome)) funcoes.add(nome);
  }
  for (const { origem, destino } of grafo.arestas) {
    if (origem === nomeSelecionado || !funcoes.has(origem) || !funcoes.has(destino)) continue;
    if (!arestas.has(origem)) arestas.set(origem, new Set());
    arestas.get(origem).add(destino);
  }
  return { funcoes, arestas };
}

function visitarRelacoes(inicio, adjacencias, ignorado = null) {
  const visitados = new Set([inicio]);
  const fila = [inicio];
  for (let indice = 0; indice < fila.length; indice++) {
    for (const vizinho of adjacencias.get(fila[indice]) ?? []) {
      if (vizinho === ignorado || visitados.has(vizinho)) continue;
      visitados.add(vizinho);
      fila.push(vizinho);
    }
  }
  return visitados;
}

export function obterEstruturaDaFuncao(grafo, nome) {
  const no = grafo.nos.get(nome);
  if (!no) return null;
  return {
    profundidade: no.profundidade,
    ehEntrada: nome === grafo.entrada,
    recursivaDireta: no.recursivaDireta,
    participaDeCiclo: no.participaDeCiclo,
    callers: [...no.chamadaPor],
    callees: grafo.arestas.filter(aresta => aresta.origem === nome)
      .map(aresta => aresta.destino),
    caminho: encontrarCaminhoDaEntrada(grafo, nome),
  };
}
