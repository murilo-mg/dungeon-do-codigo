// Cada relação conserva sua identidade mesmo quando o caminho tem vários trechos.
export const LARGURA_CORREDOR = 24;
const FOLGA_SALAS = LARGURA_CORREDOR / 2 + 6;

export function chaveDoCorredor(origem, destino) {
  return JSON.stringify([origem, destino]);
}

// Identidade física separa galerias de chamadas com os mesmos extremos.
export function chaveDoPercurso(segmento) {
  return segmento.id ?? chaveDoCorredor(segmento.origem, segmento.destino);
}

export function calcularCaminhoEntreSalas(salas, origem, destino, exigirFolga = true) {
  const inicio = centroDaSala(origem);
  const fim = centroDaSala(destino);
  const obstaculos = salas.filter(sala => sala !== origem && sala !== destino);
  const recortar = caminho => recortarNaSala(recortarNaSala(caminho, origem).reverse(), destino).reverse();
  const portaCabe = (p, sala) => {
    // Salas miniatura usadas pelo layout legado continuam admitindo rotas pontuais.
    if (Math.min(sala.largura, sala.altura) < LARGURA_CORREDOR) return true;
    const r = LARGURA_CORREDOR / 2;
    return p.x === sala.x || p.x === sala.x + sala.largura
      ? p.y >= sala.y + r && p.y <= sala.y + sala.altura - r
      : p.x >= sala.x + r && p.x <= sala.x + sala.largura - r;
  };
  const aceitar = caminho => {
    const pontos = recortar(caminho);
    return portaCabe(pontos[0], origem) && portaCabe(pontos.at(-1), destino);
  };
  const caminho = encontrarCaminho(inicio, fim, obstaculos, FOLGA_SALAS, aceitar);
  if (caminho) return recortar(caminho);
  // O layout legado tem intervalos menores que a margem arquitetônica. Preserve
  // seu desvio sem margem somente quando as portas ainda comportarem a passagem.
  const estreito = exigirFolga ? null : encontrarCaminho(inicio, fim, obstaculos, 0, aceitar);
  if (estreito) return recortar(estreito);
  // A grade pode chegar por uma porta estreita demais. Portas centrais explícitas
  // oferecem alternativas sem diminuir a folga corporal ou atravessar uma sala.
  const portas = sala => {
    const c = centroDaSala(sala);
    return [[sala.x, c.y, -1, 0], [sala.x + sala.largura, c.y, 1, 0],
      [c.x, sala.y, 0, -1], [c.x, sala.y + sala.altura, 0, 1]].map(([x, y, dx, dy]) =>
      ({ porta: { x, y }, fora: { x: x + dx * FOLGA_SALAS, y: y + dy * FOLGA_SALAS } }));
  };
  const pares = portas(origem).flatMap(a => portas(destino).map(b => ({ a, b,
    custo: Math.abs(a.fora.x - b.fora.x) + Math.abs(a.fora.y - b.fora.y) })));
  pares.sort((a, b) => a.custo - b.custo);
  for (const { a, b } of pares) {
    if ([a.fora, b.fora].some(p => p.x < 0 || p.y < 0)) continue;
    if (!trechoLivre(a.porta, a.fora, limitesComFolga(salas.filter(s => s !== origem), FOLGA_SALAS)) ||
        !trechoLivre(b.porta, b.fora, limitesComFolga(salas.filter(s => s !== destino), FOLGA_SALAS))) continue;
    const desvio = encontrarCaminho(a.fora, b.fora, salas, FOLGA_SALAS);
    if (desvio) return simplificar([a.porta, ...desvio, b.porta]);
  }
  return null;
}

// Cruzar no desenho não cria uma conexão: o identificador de cada rota persiste.
export function calcularCruzamentosCorredores(segmentos) {
  const cruzamentos = new Map();
  const margem = LARGURA_CORREDOR;
  for (const horizontal of segmentos.filter(s => s.inicio.y === s.fim.y)) {
    for (const vertical of segmentos.filter(s => s.inicio.x === s.fim.x)) {
      if (chaveDoPercurso(horizontal) === chaveDoPercurso(vertical)) continue;
      const x = vertical.inicio.x;
      const y = horizontal.inicio.y;
      if (x <= Math.min(horizontal.inicio.x, horizontal.fim.x) + margem ||
          x >= Math.max(horizontal.inicio.x, horizontal.fim.x) - margem ||
          y <= Math.min(vertical.inicio.y, vertical.fim.y) + margem ||
          y >= Math.max(vertical.inicio.y, vertical.fim.y) - margem) continue;
      cruzamentos.set(`${x},${y}`, { x, y, origem: horizontal.origem, destino: horizontal.destino,
        ...(horizontal.tipo ? { tipo: horizontal.tipo } : {}) });
    }
  }
  return [...cruzamentos.values()];
}

export function criarSegmentosDeCorredores(salas, arestas = []) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  const segmentos = [];
  const segmentosConhecidos = new Set();

  for (const aresta of arestas) {
    const origem = salasPorNome.get(aresta?.origem);
    const destino = salasPorNome.get(aresta?.destino);
    if (!origem || !destino || origem === destino) continue;

    const chave = chaveDoCorredor(aresta.origem, aresta.destino);
    if (segmentosConhecidos.has(chave)) continue;

    segmentosConhecidos.add(chave);
    const inicio = centroDaSala(origem);
    const fim = centroDaSala(destino);
    const caminho = calcularCaminhoEntreSalas(salas, origem, destino, false);

    // Geometrias inválidas (por exemplo, salas sobrepostas) conservam a ligação
    // direta anterior; o fallback é identificável e não inventa outra relação.
    const pontos = caminho ?? [inicio, fim];
    for (let indice = 1; indice < pontos.length; indice++) {
      if (pontos[indice - 1].x === pontos[indice].x &&
          pontos[indice - 1].y === pontos[indice].y) continue;
      segmentos.push({
        origem: aresta.origem,
        destino: aresta.destino,
        inicio: pontos[indice - 1],
        fim: pontos[indice],
        ...(caminho ? {} : { fallbackDireto: true }),
      });
    }
  }

  return segmentos;
}

function simplificar(pontos) {
  const resultado = [];
  for (const ponto of pontos) {
    const anterior = resultado.at(-1);
    if (anterior?.x === ponto.x && anterior.y === ponto.y) continue;
    const penultimo = resultado.at(-2);
    if (penultimo && ((penultimo.x === anterior.x && anterior.x === ponto.x) ||
        (penultimo.y === anterior.y && anterior.y === ponto.y))) resultado.pop();
    resultado.push(ponto);
  }
  return resultado;
}

function recortarNaSala(pontos, sala) {
  const dentro = ponto => ponto.x >= sala.x && ponto.x <= sala.x + sala.largura &&
    ponto.y >= sala.y && ponto.y <= sala.y + sala.altura;
  const indice = pontos.findIndex(ponto => !dentro(ponto));
  if (indice < 1) return pontos;
  const a = pontos[indice - 1];
  const b = pontos[indice];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const proporcao = Math.min(
    dx > 0 ? (sala.x + sala.largura - a.x) / dx :
      dx < 0 ? (sala.x - a.x) / dx : Infinity,
    dy > 0 ? (sala.y + sala.altura - a.y) / dy :
      dy < 0 ? (sala.y - a.y) / dy : Infinity
  );
  return [{ x: a.x + dx * proporcao, y: a.y + dy * proporcao }, ...pontos.slice(indice)];
}

function trechoLivre(a, b, obstaculos) {
  return obstaculos.every(obstaculo => a.x === b.x
    ? a.x <= obstaculo.esquerda || a.x >= obstaculo.direita ||
      Math.max(a.y, b.y) <= obstaculo.topo || Math.min(a.y, b.y) >= obstaculo.base
    : a.y <= obstaculo.topo || a.y >= obstaculo.base ||
      Math.max(a.x, b.x) <= obstaculo.esquerda || Math.min(a.x, b.x) >= obstaculo.direita);
}

function limitesComFolga(salas, folga) {
  return salas.map(sala => ({
    esquerda: sala.x - folga, direita: sala.x + sala.largura + folga,
    topo: sala.y - folga, base: sala.y + sala.altura + folga,
  }));
}

function encontrarCaminho(inicio, fim, salas, folga, aceitar = () => true) {
  const obstaculos = limitesComFolga(salas, folga);
  const meioX = (inicio.x + fim.x) / 2;
  const meioY = (inicio.y + fim.y) / 2;
  const candidatos = [
    [inicio, { x: meioX, y: inicio.y }, { x: meioX, y: fim.y }, fim],
    [inicio, { x: inicio.x, y: meioY }, { x: fim.x, y: meioY }, fim],
    [inicio, { x: fim.x, y: inicio.y }, fim],
    [inicio, { x: inicio.x, y: fim.y }, fim],
  ].map(simplificar);
  const simples = candidatos.find(pontos => aceitar(pontos) && pontos.every((ponto, indice) =>
    !indice || trechoLivre(pontos[indice - 1], ponto, obstaculos)));
  if (simples) return simples;

  // A grade usa apenas linhas de borda: o desvio não depende da resolução,
  // do zoom ou de uma malha de pixels proporcional ao tamanho do mundo.
  const xs = [...new Set([inicio.x, fim.x,
    ...obstaculos.flatMap(obstaculo => [obstaculo.esquerda, obstaculo.direita])])]
    .filter(x => x >= 0).sort((a, b) => a - b);
  const ys = [...new Set([inicio.y, fim.y,
    ...obstaculos.flatMap(obstaculo => [obstaculo.topo, obstaculo.base])])]
    .filter(y => y >= 0).sort((a, b) => a - b);
  const chave = (x, y) => y * xs.length + x;
  const ponto = indice => ({ x: xs[indice % xs.length], y: ys[Math.floor(indice / xs.length)] });
  const inicial = chave(xs.indexOf(inicio.x), ys.indexOf(inicio.y));
  const final = chave(xs.indexOf(fim.x), ys.indexOf(fim.y));
  const custos = new Map([[inicial, 0]]);
  const anteriores = new Map();
  const abertos = [{ indice: inicial, estimativa: 0, custo: 0 }];

  while (abertos.length) {
    const atual = abertos.pop();
    if (atual.custo !== custos.get(atual.indice)) continue;
    if (atual.indice === final) {
      const pontos = [];
      for (let indice = final; indice !== undefined; indice = anteriores.get(indice)) {
        pontos.push(ponto(indice));
      }
      const resultado = simplificar(pontos.reverse());
      return aceitar(resultado) ? resultado : null;
    }
    const x = atual.indice % xs.length;
    const y = Math.floor(atual.indice / xs.length);
    const origem = ponto(atual.indice);
    for (const [nx, ny] of [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue;
      const indice = chave(nx, ny);
      const destino = ponto(indice);
      if (!trechoLivre(origem, destino, obstaculos)) continue;
      const custo = atual.custo + Math.abs(destino.x - origem.x) + Math.abs(destino.y - origem.y);
      if (custo >= (custos.get(indice) ?? Infinity)) continue;
      custos.set(indice, custo);
      anteriores.set(indice, atual.indice);
      const estimativa = custo + Math.abs(destino.x - fim.x) + Math.abs(destino.y - fim.y);
      // Ordem estável em empates mantém o mesmo desvio para a mesma entrada.
      let esquerda = 0;
      let direita = abertos.length;
      while (esquerda < direita) {
        const meio = (esquerda + direita) >>> 1;
        if (abertos[meio].estimativa >= estimativa) esquerda = meio + 1;
        else direita = meio;
      }
      abertos.splice(esquerda, 0, { indice, estimativa, custo });
    }
  }
  return null;
}

function centroDaSala(sala) {
  return {
    x: sala.x + sala.largura / 2,
    y: sala.y + sala.altura / 2,
  };
}
