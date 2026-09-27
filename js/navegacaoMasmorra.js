// Traça deslocamentos apenas dentro de salas e sobre corredores já existentes.

const RAIO_CORREDOR = 5; // O traço atual dos corredores tem 10 px de largura.

function centro(sala) {
  return { x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 };
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function projecaoNoSegmento(ponto, inicio, fim) {
  const dx = fim.x - inicio.x;
  const dy = fim.y - inicio.y;
  const quadrado = dx * dx + dy * dy;
  if (quadrado === 0) return inicio;
  const proporcao = Math.max(0, Math.min(1,
    ((ponto.x - inicio.x) * dx + (ponto.y - inicio.y) * dy) / quadrado));
  return { x: inicio.x + proporcao * dx, y: inicio.y + proporcao * dy };
}

function estaNaSala(ponto, sala) {
  return ponto.x >= sala.x && ponto.x <= sala.x + sala.largura &&
    ponto.y >= sala.y && ponto.y <= sala.y + sala.altura;
}

export function calcularRotaCaminhavel(salas, segmentos, posicaoAtual, nomeDestino) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  if (!salasPorNome.has(nomeDestino)) return null;

  const vizinhos = new Map([...salasPorNome.keys()].map(nome => [nome, []]));
  for (const segmento of segmentos) {
    if (!vizinhos.has(segmento.origem) || !vizinhos.has(segmento.destino)) continue;
    const comprimento = distancia(segmento.inicio, segmento.fim);
    if (comprimento === 0) continue;
    vizinhos.get(segmento.origem).push({ nome: segmento.destino, custo: comprimento });
    vizinhos.get(segmento.destino).push({ nome: segmento.origem, custo: comprimento });
  }

  const acessos = [];
  const salaAtual = salas.find(sala => estaNaSala(posicaoAtual, sala));
  if (salaAtual) {
    const ponto = centro(salaAtual);
    acessos.push({ nome: salaAtual.nome, custo: distancia(posicaoAtual, ponto), pontos: [ponto] });
  } else {
    for (const segmento of segmentos) {
      if (!vizinhos.has(segmento.origem) || !vizinhos.has(segmento.destino)) continue;
      const ponto = projecaoNoSegmento(posicaoAtual, segmento.inicio, segmento.fim);
      const afastamento = distancia(posicaoAtual, ponto);
      if (afastamento > RAIO_CORREDOR) continue;
      acessos.push({ nome: segmento.origem,
        custo: afastamento + distancia(ponto, segmento.inicio),
        pontos: [ponto, segmento.inicio] });
      acessos.push({ nome: segmento.destino,
        custo: afastamento + distancia(ponto, segmento.fim),
        pontos: [ponto, segmento.fim] });
    }
  }
  if (acessos.length === 0) return null;

  const custos = new Map();
  const anteriores = new Map();
  const acessosPorSala = new Map();
  for (const acesso of acessos) {
    if (acesso.custo >= (custos.get(acesso.nome) ?? Infinity)) continue;
    custos.set(acesso.nome, acesso.custo);
    anteriores.set(acesso.nome, null);
    acessosPorSala.set(acesso.nome, acesso);
  }

  const visitados = new Set();
  while (true) {
    let atual = null;
    for (const [nome, custo] of custos) {
      if (!visitados.has(nome) && (atual === null || custo < custos.get(atual))) atual = nome;
    }
    if (atual === null || atual === nomeDestino) break;
    visitados.add(atual);
    for (const vizinho of vizinhos.get(atual)) {
      const novoCusto = custos.get(atual) + vizinho.custo;
      if (novoCusto >= (custos.get(vizinho.nome) ?? Infinity)) continue;
      custos.set(vizinho.nome, novoCusto);
      anteriores.set(vizinho.nome, atual);
    }
  }
  if (!custos.has(nomeDestino)) return null;

  const nomes = [];
  for (let nome = nomeDestino; nome !== null; nome = anteriores.get(nome)) nomes.push(nome);
  nomes.reverse();
  const pontos = [...acessosPorSala.get(nomes[0]).pontos,
    ...nomes.slice(1).map(nome => centro(salasPorNome.get(nome)))];
  return pontos.filter((ponto, indice) => indice === 0 || distancia(ponto, pontos[indice - 1]) > 0);
}
