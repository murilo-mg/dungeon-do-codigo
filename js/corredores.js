// Cada relação conserva sua identidade mesmo quando o caminho tem vários trechos.
export const LARGURA_CORREDOR = 32;
const FOLGA_SALAS = LARGURA_CORREDOR / 2 + 6;
const EPSILON = 1e-8;
const CUSTO_PISO_COMPARTILHADO = 0.55;
const CUSTO_PISOS_PROXIMOS = 3;
const CUSTO_CURVA = LARGURA_CORREDOR / 2;
const SEPARACAO_PISOS = LARGURA_CORREDOR + 10;

export function chaveDoCorredor(origem, destino) {
  return JSON.stringify([origem, destino]);
}

// Identidade física separa galerias de chamadas com os mesmos extremos.
export function chaveDoPercurso(segmento) {
  return segmento.id ?? chaveDoCorredor(segmento.origem, segmento.destino);
}

export function calcularCaminhoEntreSalas(salas, origem, destino, exigirFolga = true, rede = []) {
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
  const caminho = encontrarCaminho(inicio, fim, obstaculos, FOLGA_SALAS, aceitar, rede);
  if (caminho) return recortar(caminho);
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
    const desvio = encontrarCaminho(a.fora, b.fora, salas, FOLGA_SALAS, undefined, rede);
    if (desvio) return simplificar([a.porta, ...desvio, b.porta]);
  }
  // Só plantas legadas sem espaço admitem o desvio estreito. Antes disso,
  // procure todas as portas seguras: uma rota junto à parede pode cortar o piso.
  const estreito = exigirFolga ? null : encontrarCaminho(inicio, fim, obstaculos, 0, aceitar);
  if (estreito) return recortar(estreito);
  return null;
}

function limitesDoPiso(trecho) {
  const raio = LARGURA_CORREDOR / 2;
  return {
    esquerda: Math.min(trecho.inicio.x, trecho.fim.x) - raio,
    direita: Math.max(trecho.inicio.x, trecho.fim.x) + raio,
    topo: Math.min(trecho.inicio.y, trecho.fim.y) - raio,
    base: Math.max(trecho.inicio.y, trecho.fim.y) + raio,
  };
}

function horizontal(trecho) { return trecho.inicio.y === trecho.fim.y; }
function vertical(trecho) { return trecho.inicio.x === trecho.fim.x; }
function entre(valor, a, b) {
  return valor >= Math.min(a, b) - EPSILON && valor <= Math.max(a, b) + EPSILON;
}
function limitar(valor, a, b) { return Math.max(Math.min(a, b), Math.min(Math.max(a, b), valor)); }

// A conexão pertence ao piso final. Ela nunca adiciona chamadas ao grafo C.
export function trechosFisicamenteConectados(a, b) {
  if ((!horizontal(a) && !vertical(a)) || (!horizontal(b) && !vertical(b))) return false;
  if (horizontal(a) === horizontal(b)) {
    const eixo = horizontal(a) ? 'x' : 'y';
    const perpendicular = horizontal(a) ? 'y' : 'x';
    const distancia = Math.abs(a.inicio[perpendicular] - b.inicio[perpendicular]);
    const sobreposicao = Math.min(Math.max(a.inicio[eixo], a.fim[eixo]),
      Math.max(b.inicio[eixo], b.fim[eixo])) -
      Math.max(Math.min(a.inicio[eixo], a.fim[eixo]), Math.min(b.inicio[eixo], b.fim[eixo]));
    return distancia <= LARGURA_CORREDOR + EPSILON &&
      (sobreposicao >= -EPSILON || distancia < EPSILON && sobreposicao >= -LARGURA_CORREDOR);
  }
  const h = horizontal(a) ? a : b;
  const v = horizontal(a) ? b : a;
  const x = v.inicio.x, y = h.inicio.y;
  const dx = Math.abs(x - limitar(x, h.inicio.x, h.fim.x));
  const dy = Math.abs(y - limitar(y, v.inicio.y, v.fim.y));
  // O piso tem espessura e pontas quadradas. Um T pode estar aberto mesmo que
  // o eixo termine antes do outro eixo; contatos apenas entre quinas não bastam.
  if (dx > EPSILON || dy > EPSILON) return Math.min(dx, dy) < EPSILON &&
    Math.max(dx, dy) <= LARGURA_CORREDOR + EPSILON;
  // Um encontro de pontas é uma junção; atravessamentos interiores usam ponte.
  return [h.inicio.x, h.fim.x].some(valor => Math.abs(x - valor) < EPSILON) ||
    [v.inicio.y, v.fim.y].some(valor => Math.abs(y - valor) < EPSILON);
}

export function calcularJuncoesCorredores(segmentos) {
  const juncoes = [];
  for (let indiceA = 0; indiceA < segmentos.length; indiceA++) {
    const a = segmentos[indiceA];
    for (let indiceB = indiceA + 1; indiceB < segmentos.length; indiceB++) {
      const b = segmentos[indiceB];
      const ids = [chaveDoPercurso(a), chaveDoPercurso(b)];
      if (ids[0] === ids[1] || !trechosFisicamenteConectados(a, b)) continue;
      const la = limitesDoPiso(a), lb = limitesDoPiso(b);
      const x = Math.max(la.esquerda, lb.esquerda);
      const y = Math.max(la.topo, lb.topo);
      const area = { x, y, largura: Math.min(la.direita, lb.direita) - x,
        altura: Math.min(la.base, lb.base) - y };
      const paralela = horizontal(a) === horizontal(b);
      let pontoA, pontoB;
      if (paralela) {
        const eixo = horizontal(a) ? 'x' : 'y';
        const perpendicular = horizontal(a) ? 'y' : 'x';
        const minimo = Math.max(Math.min(a.inicio[eixo], a.fim[eixo]),
          Math.min(b.inicio[eixo], b.fim[eixo]));
        const maximo = Math.min(Math.max(a.inicio[eixo], a.fim[eixo]),
          Math.max(b.inicio[eixo], b.fim[eixo]));
        const meio = (minimo + maximo) / 2;
        pontoA = { [eixo]: limitar(meio, a.inicio[eixo], a.fim[eixo]), [perpendicular]: a.inicio[perpendicular] };
        pontoB = { [eixo]: limitar(meio, b.inicio[eixo], b.fim[eixo]), [perpendicular]: b.inicio[perpendicular] };
      } else {
        pontoA = { x: limitar(b.inicio.x, a.inicio.x, a.fim.x),
          y: limitar(b.inicio.y, a.inicio.y, a.fim.y) };
        pontoB = { x: limitar(pontoA.x, b.inicio.x, b.fim.x),
          y: limitar(pontoA.y, b.inicio.y, b.fim.y) };
      }
      juncoes.push({ ids, trechos: [a, b], area, pontoA, pontoB });
    }
  }
  return juncoes;
}

export function extrairPortasDosCorredores(salas, segmentos) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  const percursos = new Map();
  for (const trecho of segmentos) {
    const id = chaveDoPercurso(trecho);
    if (!percursos.has(id)) percursos.set(id, { primeiro: trecho, ultimo: trecho });
    percursos.get(id).ultimo = trecho;
  }
  const portas = new Map();
  for (const [id, { primeiro, ultimo }] of percursos) {
    for (const [nomeSala, ponto, trecho] of [[primeiro.origem, primeiro.inicio, primeiro],
      [ultimo.destino, ultimo.fim, ultimo]]) {
      const sala = salasPorNome.get(nomeSala);
      if (!sala || !entre(ponto.x, sala.x, sala.x + sala.largura) ||
          !entre(ponto.y, sala.y, sala.y + sala.altura)) continue;
      const vertical = ponto.x === sala.x || ponto.x === sala.x + sala.largura;
      if (!vertical && ponto.y !== sala.y && ponto.y !== sala.y + sala.altura) continue;
      const chave = JSON.stringify([nomeSala, ponto.x, ponto.y]);
      if (!portas.has(chave)) portas.set(chave,
        { nomeSala, ponto, vertical, ids: [], segmentos: [] });
      portas.get(chave).ids.push(id);
      portas.get(chave).segmentos.push(trecho);
    }
  }
  return [...portas.values()];
}

// Cruzar no desenho não cria uma conexão: o identificador de cada rota persiste.
export function calcularCruzamentosCorredores(segmentos) {
  const cruzamentos = new Map();
  const juncoes = calcularJuncoesCorredores(segmentos);
  const unidosNoPonto = (a, b, x, y) => {
    const ids = new Set([chaveDoPercurso(a)]);
    for (const id of ids) for (const juncao of juncoes) {
      const area = juncao.area;
      if (juncao.ids.includes(id) && x >= area.x && x <= area.x + area.largura &&
          y >= area.y && y <= area.y + area.altura) juncao.ids.forEach(outro => ids.add(outro));
    }
    return ids.has(chaveDoPercurso(b));
  };
  const margem = EPSILON;
  for (const horizontal of segmentos.filter(s => s.inicio.y === s.fim.y)) {
    for (const vertical of segmentos.filter(s => s.inicio.x === s.fim.x)) {
      if (chaveDoPercurso(horizontal) === chaveDoPercurso(vertical)) continue;
      const x = vertical.inicio.x;
      const y = horizontal.inicio.y;
      if (x <= Math.min(horizontal.inicio.x, horizontal.fim.x) + margem ||
          x >= Math.max(horizontal.inicio.x, horizontal.fim.x) - margem ||
          y <= Math.min(vertical.inicio.y, vertical.fim.y) + margem ||
          y >= Math.max(vertical.inicio.y, vertical.fim.y) - margem) continue;
      // Uma terceira faixa pode compartilhar esta mesma junção. Nesse caso
      // desenhar uma ponte sugeriria uma separação que a física não possui.
      if (unidosNoPonto(horizontal, vertical, x, y)) continue;
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

  const percursos = new Map();
  const distancia = aresta => {
    const a = salasPorNome.get(aresta?.origem), b = salasPorNome.get(aresta?.destino);
    if (!a || !b) return Infinity;
    const inicio = centroDaSala(a), fim = centroDaSala(b);
    return Math.abs(inicio.x - fim.x) + Math.abs(inicio.y - fim.y);
  };
  // Passagens locais orientam as longas. A ordem externa das relações permanece
  // a do grafo; compartilhar piso não cria nem remove uma chamada.
  const ordenadas = [...arestas].sort((a, b) => distancia(a) - distancia(b));
  for (const aresta of ordenadas) {
    const origem = salasPorNome.get(aresta?.origem);
    const destino = salasPorNome.get(aresta?.destino);
    if (!origem || !destino || origem === destino) continue;

    const chave = chaveDoCorredor(aresta.origem, aresta.destino);
    if (segmentosConhecidos.has(chave)) continue;

    segmentosConhecidos.add(chave);
    const inicio = centroDaSala(origem);
    const fim = centroDaSala(destino);
    const caminho = calcularCaminhoEntreSalas(salas, origem, destino, false, segmentos);

    // Geometrias inválidas (por exemplo, salas sobrepostas) conservam a ligação
    // direta anterior; o fallback é identificável e não inventa outra relação.
    const pontos = caminho ?? [inicio, fim];
    const percurso = [];
    for (let indice = 1; indice < pontos.length; indice++) {
      if (pontos[indice - 1].x === pontos[indice].x &&
          pontos[indice - 1].y === pontos[indice].y) continue;
      percurso.push({
        origem: aresta.origem,
        destino: aresta.destino,
        inicio: pontos[indice - 1],
        fim: pontos[indice],
        ...(caminho ? {} : { fallbackDireto: true }),
      });
    }
    percursos.set(chave, percurso);
    segmentos.push(...percurso.filter(trecho => !trecho.fallbackDireto));
  }

  return [...new Set(arestas.map(aresta => chaveDoCorredor(aresta?.origem, aresta?.destino)))]
    .flatMap(chave => percursos.get(chave) ?? []);
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

function custoDoTrecho(a, b, rede) {
  const eixo = a.y === b.y ? 'x' : 'y';
  const perpendicular = eixo === 'x' ? 'y' : 'x';
  const minimo = Math.min(a[eixo], b[eixo]), maximo = Math.max(a[eixo], b[eixo]);
  const faixas = [];
  const cruzamentos = new Set();
  for (const trecho of rede) {
    if ((trecho.inicio.y === trecho.fim.y) === (eixo === 'x')) {
      const distancia = Math.abs(a[perpendicular] - trecho.inicio[perpendicular]);
      if (distancia >= SEPARACAO_PISOS) continue;
      const inicio = Math.max(minimo, Math.min(trecho.inicio[eixo], trecho.fim[eixo]));
      const fim = Math.min(maximo, Math.max(trecho.inicio[eixo], trecho.fim[eixo]));
      if (fim > inicio) faixas.push({ inicio, fim, compartilhada: distancia < EPSILON });
    } else if (entre(a[perpendicular], trecho.inicio[perpendicular], trecho.fim[perpendicular]) &&
        trecho.inicio[eixo] > minimo && trecho.inicio[eixo] < maximo) {
      cruzamentos.add(trecho.inicio[eixo]);
    }
  }
  const cortes = [...new Set([minimo, maximo, ...faixas.flatMap(faixa => [faixa.inicio, faixa.fim])])]
    .sort((a, b) => a - b);
  let custo = 0;
  for (let indice = 1; indice < cortes.length; indice++) {
    const meio = (cortes[indice - 1] + cortes[indice]) / 2;
    const presentes = faixas.filter(faixa => meio > faixa.inicio && meio < faixa.fim);
    const fator = presentes.some(faixa => faixa.compartilhada) ? CUSTO_PISO_COMPARTILHADO :
      presentes.length ? CUSTO_PISOS_PROXIMOS : 1;
    custo += (cortes[indice] - cortes[indice - 1]) * fator;
  }
  for (const ponto of cruzamentos) {
    if (!faixas.some(faixa => faixa.compartilhada && entre(ponto, faixa.inicio, faixa.fim))) {
      custo += LARGURA_CORREDOR;
    }
  }
  return custo;
}

function encontrarCaminho(inicio, fim, salas, folga, aceitar = () => true, rede = []) {
  const obstaculos = limitesComFolga(salas, folga);
  const meioX = (inicio.x + fim.x) / 2;
  const meioY = (inicio.y + fim.y) / 2;
  const candidatos = [
    [inicio, { x: meioX, y: inicio.y }, { x: meioX, y: fim.y }, fim],
    [inicio, { x: inicio.x, y: meioY }, { x: fim.x, y: meioY }, fim],
    [inicio, { x: fim.x, y: inicio.y }, fim],
    [inicio, { x: inicio.x, y: fim.y }, fim],
    ...[...new Set(rede.filter(vertical).map(t => t.inicio.x))].map(x =>
      [inicio, { x, y: inicio.y }, { x, y: fim.y }, fim]),
    ...[...new Set(rede.filter(horizontal).map(t => t.inicio.y))].map(y =>
      [inicio, { x: inicio.x, y }, { x: fim.x, y }, fim]),
  ].map(simplificar);
  const custoCaminho = pontos => pontos.slice(1).reduce((total, ponto, indice) =>
    total + custoDoTrecho(pontos[indice], ponto, rede), CUSTO_CURVA * Math.max(0, pontos.length - 2));
  const livres = candidatos.filter(pontos => aceitar(pontos) && pontos.every((ponto, indice) =>
    !indice || trechoLivre(pontos[indice - 1], ponto, obstaculos)));
  const simples = rede.length ? livres.sort((a, b) => custoCaminho(a) - custoCaminho(b))[0] : livres[0];
  if (simples) return simples;

  // A grade usa apenas linhas de borda: o desvio não depende da resolução,
  // do zoom ou de uma malha de pixels proporcional ao tamanho do mundo.
  const xs = [...new Set([inicio.x, fim.x,
    ...obstaculos.flatMap(obstaculo => [obstaculo.esquerda, obstaculo.direita]),
    ...rede.flatMap(trecho => [trecho.inicio.x, trecho.fim.x])])]
    .filter(x => x >= 0).sort((a, b) => a - b);
  const ys = [...new Set([inicio.y, fim.y,
    ...obstaculos.flatMap(obstaculo => [obstaculo.topo, obstaculo.base]),
    ...rede.flatMap(trecho => [trecho.inicio.y, trecho.fim.y])])]
    .filter(y => y >= 0).sort((a, b) => a - b);
  const chave = (x, y, direcao = 0) => (y * xs.length + x) * 3 + direcao;
  const ponto = indice => { const posicao = Math.floor(indice / 3);
    return { x: xs[posicao % xs.length], y: ys[Math.floor(posicao / xs.length)] }; };
  const inicial = chave(xs.indexOf(inicio.x), ys.indexOf(inicio.y));
  const custos = new Map([[inicial, 0]]);
  const anteriores = new Map();
  const abertos = [{ indice: inicial, estimativa: 0, custo: 0 }];

  while (abertos.length) {
    const atual = abertos.pop();
    if (atual.custo !== custos.get(atual.indice)) continue;
    const posicao = ponto(atual.indice);
    if (posicao.x === fim.x && posicao.y === fim.y) {
      const pontos = [];
      for (let indice = atual.indice; indice !== undefined; indice = anteriores.get(indice)) {
        pontos.push(ponto(indice));
      }
      const resultado = simplificar(pontos.reverse());
      if (aceitar(resultado)) return resultado;
      continue;
    }
    const x = Math.floor(atual.indice / 3) % xs.length;
    const y = Math.floor(Math.floor(atual.indice / 3) / xs.length);
    const origem = ponto(atual.indice);
    for (const [nx, ny] of [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue;
      const direcao = nx === x ? 2 : 1;
      const indice = chave(nx, ny, direcao);
      const destino = ponto(indice);
      if (!trechoLivre(origem, destino, obstaculos)) continue;
      const curva = rede.length && atual.indice % 3 && atual.indice % 3 !== direcao ? CUSTO_CURVA : 0;
      const custo = atual.custo + custoDoTrecho(origem, destino, rede) + curva;
      if (custo >= (custos.get(indice) ?? Infinity)) continue;
      custos.set(indice, custo);
      anteriores.set(indice, atual.indice);
      const estimativa = custo + (rede.length ? CUSTO_PISO_COMPARTILHADO : 1) *
        (Math.abs(destino.x - fim.x) + Math.abs(destino.y - fim.y));
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
