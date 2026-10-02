// Traça deslocamentos apenas dentro de salas e sobre percursos físicos existentes.

import { chaveDoPercurso, calcularJuncoesCorredores } from './corredores.js';
import { pontoNoTrecho } from './areaCaminhavel.js';

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

function comprimento(pontos) {
  return pontos.reduce((total, ponto, indice) =>
    total + (indice ? distancia(pontos[indice - 1], ponto) : 0), 0);
}

function agruparRotas(segmentos, salasPorNome) {
  const porRelacao = new Map();
  for (const segmento of segmentos) {
    if (!salasPorNome.has(segmento.origem) || !salasPorNome.has(segmento.destino)) continue;
    const chave = chaveDoPercurso(segmento);
    if (!porRelacao.has(chave)) porRelacao.set(chave, {
      id: chave, origem: segmento.origem, destino: segmento.destino, pontos: [segmento.inicio],
    });
    porRelacao.get(chave).pontos.push(segmento.fim);
  }
  return [...porRelacao.values()].map(rota => ({
    ...rota,
    pontos: [...acessoInterno(salasPorNome.get(rota.origem), rota.pontos[0]), ...rota.pontos,
      ...acessoInterno(salasPorNome.get(rota.destino), rota.pontos.at(-1)).reverse()],
  }));
}

function acessoInterno(sala, porta) {
  const c = centro(sala);
  // Alinha com a porta dentro da sala; a diagonal chegava raspando a quina.
  return [c, porta.x === sala.x || porta.x === sala.x + sala.largura
    ? { x: c.x, y: porta.y } : { x: porta.x, y: c.y }];
}

function simplificarPontos(pontos) {
  const resultado = [];
  for (const ponto of pontos) {
    const anterior = resultado.at(-1);
    if (anterior && distancia(ponto, anterior) === 0) continue;
    const penultimo = resultado.at(-2);
    if (penultimo) {
      const a = { x: anterior.x - penultimo.x, y: anterior.y - penultimo.y };
      const b = { x: ponto.x - anterior.x, y: ponto.y - anterior.y };
      if (Math.abs(a.x * b.y - a.y * b.x) < 1e-9 && a.x * b.x + a.y * b.y > 0) {
        resultado.pop();
      }
    }
    resultado.push(ponto);
  }
  return resultado;
}

function pontoNoEixo(ponto, inicio, fim) {
  const projecao = projecaoNoSegmento(ponto, inicio, fim);
  return distancia(ponto, projecao) < 1e-8;
}

// As junções pertencem à circulação física. A malha conserva cada percurso nos
// cruzamentos independentes e não acrescenta chamadas ao grafo do programa.
function criarMalha(salasPorNome, segmentos, rotas) {
  const nos = new Map();
  const trechos = [];
  const cortes = new Map(rotas.map(rota => [rota.id, []]));
  const rotasPorId = new Map(rotas.map(rota => [rota.id, rota]));
  const chaveSala = nome => JSON.stringify(['sala', nome]);
  const chavePonto = (rota, ponto) => {
    for (const nome of [rota.origem, rota.destino]) {
      if (distancia(ponto, centro(salasPorNome.get(nome))) < 1e-8) return chaveSala(nome);
    }
    return JSON.stringify(['percurso', rota.id, ponto.x, ponto.y]);
  };
  const ligar = (a, b, pontos) => {
    if (!nos.has(a)) nos.set(a, []);
    if (!nos.has(b)) nos.set(b, []);
    const custo = comprimento(pontos);
    if (a === b) return;
    nos.get(a).push({ no: b, custo, pontos: pontos.slice(1) });
    nos.get(b).push({ no: a, custo, pontos: pontos.slice(0, -1).reverse() });
  };
  for (const nome of salasPorNome.keys()) nos.set(chaveSala(nome), []);
  const juncoes = calcularJuncoesCorredores(segmentos).filter(juncao =>
    juncao.ids.every(id => rotasPorId.has(id)));
  for (const juncao of juncoes) {
    cortes.get(juncao.ids[0]).push(juncao.pontoA);
    cortes.get(juncao.ids[1]).push(juncao.pontoB);
  }
  for (const rota of rotas) {
    for (let i = 1; i < rota.pontos.length; i++) {
      const a = rota.pontos[i - 1], b = rota.pontos[i];
      if (distancia(a, b) < 1e-8) continue;
      const pontos = [a, ...cortes.get(rota.id).filter(ponto => pontoNoEixo(ponto, a, b)), b]
        .sort((p, q) => distancia(a, p) - distancia(a, q));
      for (let j = 1; j < pontos.length; j++) {
        if (distancia(pontos[j - 1], pontos[j]) < 1e-8) continue;
        const inicio = pontos[j - 1], fim = pontos[j];
        const noInicio = chavePonto(rota, inicio), noFim = chavePonto(rota, fim);
        ligar(noInicio, noFim, [inicio, fim]);
        trechos.push({ id: rota.id, inicio, fim, noInicio, noFim });
      }
    }
  }
  for (const juncao of juncoes) {
    const a = chavePonto(rotasPorId.get(juncao.ids[0]), juncao.pontoA);
    const b = chavePonto(rotasPorId.get(juncao.ids[1]), juncao.pontoB);
    ligar(a, b, [juncao.pontoA, juncao.pontoB]);
  }
  return { nos, trechos, chaveSala };
}

export function calcularRotaCaminhavel(salas, segmentos, posicaoAtual, nomeDestino, local = null) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  if (!salasPorNome.has(nomeDestino)) return null;
  const rotas = agruparRotas(segmentos, salasPorNome);
  const malha = criarMalha(salasPorNome, segmentos, rotas);
  const acessos = [];
  const salaAtual = local ? salasPorNome.get(local.sala)
    : salas.find(sala => estaNaSala(posicaoAtual, sala));
  if (salaAtual) {
    const ponto = centro(salaAtual);
    acessos.push({ no: malha.chaveSala(salaAtual.nome), custo: distancia(posicaoAtual, ponto), pontos: [ponto] });
  } else {
    for (const trecho of malha.trechos) {
      if (local && !local.corredores.includes(trecho.id)) continue;
      if (!pontoNoTrecho(posicaoAtual, trecho)) continue;
      const ponto = projecaoNoSegmento(posicaoAtual, trecho.inicio, trecho.fim);
      const afastamento = distancia(posicaoAtual, ponto);
      for (const [no, extremo] of [[trecho.noInicio, trecho.inicio], [trecho.noFim, trecho.fim]]) {
        acessos.push({ no, custo: afastamento + distancia(ponto, extremo), pontos: [ponto, extremo] });
      }
    }
  }
  if (acessos.length === 0) return null;

  const custos = new Map();
  const anteriores = new Map();
  const acessosPorNo = new Map();
  for (const acesso of acessos) {
    if (acesso.custo >= (custos.get(acesso.no) ?? Infinity)) continue;
    custos.set(acesso.no, acesso.custo);
    anteriores.set(acesso.no, null);
    acessosPorNo.set(acesso.no, acesso);
  }
  const destino = malha.chaveSala(nomeDestino);
  const visitados = new Set();
  while (true) {
    let atual = null;
    for (const [no, custo] of custos) {
      if (!visitados.has(no) && (atual === null || custo < custos.get(atual))) atual = no;
    }
    if (atual === null || atual === destino) break;
    visitados.add(atual);
    for (const vizinho of malha.nos.get(atual)) {
      const novoCusto = custos.get(atual) + vizinho.custo;
      if (novoCusto >= (custos.get(vizinho.no) ?? Infinity)) continue;
      custos.set(vizinho.no, novoCusto);
      anteriores.set(vizinho.no, { no: atual, pontos: vizinho.pontos });
    }
  }
  if (!custos.has(destino)) return null;
  const etapas = [];
  let no = destino;
  while (anteriores.get(no) !== null) {
    const anterior = anteriores.get(no);
    etapas.unshift(anterior.pontos);
    no = anterior.no;
  }
  return simplificarPontos([...acessosPorNo.get(no).pontos, ...etapas.flat()]);
}
