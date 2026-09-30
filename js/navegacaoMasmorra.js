// Traça deslocamentos apenas dentro de salas e sobre percursos físicos existentes.

import { chaveDoPercurso } from './corredores.js';
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

export function calcularRotaCaminhavel(salas, segmentos, posicaoAtual, nomeDestino, local = null) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  if (!salasPorNome.has(nomeDestino)) return null;

  const rotas = agruparRotas(segmentos, salasPorNome);
  const vizinhos = new Map([...salasPorNome.keys()].map(nome => [nome, []]));
  for (const rota of rotas) {
    const custo = comprimento(rota.pontos);
    if (custo === 0) continue;
    vizinhos.get(rota.origem).push({ nome: rota.destino, custo, pontos: rota.pontos });
    vizinhos.get(rota.destino).push({ nome: rota.origem, custo, pontos: [...rota.pontos].reverse() });
  }

  const acessos = [];
  const salaAtual = local ? salasPorNome.get(local.sala)
    : salas.find(sala => estaNaSala(posicaoAtual, sala));
  if (salaAtual) {
    const ponto = centro(salaAtual);
    acessos.push({ nome: salaAtual.nome, custo: distancia(posicaoAtual, ponto), pontos: [ponto] });
  } else {
    for (const rota of rotas) {
      if (local && !local.corredores.includes(rota.id)) continue;
      for (let indice = 1; indice < rota.pontos.length; indice++) {
        const ponto = projecaoNoSegmento(posicaoAtual, rota.pontos[indice - 1], rota.pontos[indice]);
        const afastamento = distancia(posicaoAtual, ponto);
        if (!pontoNoTrecho(posicaoAtual, {
          inicio: rota.pontos[indice - 1], fim: rota.pontos[indice],
        })) continue;
        const ateOrigem = [ponto, ...rota.pontos.slice(0, indice).reverse()];
        const ateDestino = [ponto, ...rota.pontos.slice(indice)];
        acessos.push({ nome: rota.origem,
          custo: afastamento + comprimento(ateOrigem), pontos: ateOrigem });
        acessos.push({ nome: rota.destino,
          custo: afastamento + comprimento(ateDestino), pontos: ateDestino });
      }
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
      anteriores.set(vizinho.nome, { nome: atual, pontos: vizinho.pontos });
    }
  }
  if (!custos.has(nomeDestino)) return null;

  const etapas = [];
  let nome = nomeDestino;
  while (anteriores.get(nome) !== null) {
    const anterior = anteriores.get(nome);
    etapas.unshift(anterior.pontos);
    nome = anterior.nome;
  }
  return simplificarPontos([...acessosPorSala.get(nome).pontos, ...etapas.flat()]);
}
