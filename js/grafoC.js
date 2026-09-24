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
