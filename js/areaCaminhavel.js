// Colisão sobre a geometria existente; não conhece Canvas, câmera ou grafo.
import { chaveDoPercurso, LARGURA_CORREDOR } from './corredores.js';

const RAIO_CORREDOR = LARGURA_CORREDOR / 2;
const PASSO_MAXIMO = 1;
const EPSILON = 1e-8;

export function pontoNaSala(ponto, sala) {
  return ponto.x >= sala.x && ponto.x <= sala.x + sala.largura &&
    ponto.y >= sala.y && ponto.y <= sala.y + sala.altura;
}

function pertoDaPorta(ponto, porta) {
  return Math.abs(ponto.x - porta.x) <= RAIO_CORREDOR + EPSILON &&
    Math.abs(ponto.y - porta.y) <= RAIO_CORREDOR + EPSILON;
}

function pontoNoEixo(ponto, trecho) {
  if (trecho.inicio.y === trecho.fim.y) {
    return ponto.y === trecho.inicio.y &&
      ponto.x >= Math.min(trecho.inicio.x, trecho.fim.x) - EPSILON &&
      ponto.x <= Math.max(trecho.inicio.x, trecho.fim.x) + EPSILON;
  }
  if (trecho.inicio.x === trecho.fim.x) {
    return ponto.x === trecho.inicio.x &&
      ponto.y >= Math.min(trecho.inicio.y, trecho.fim.y) - EPSILON &&
      ponto.y <= Math.max(trecho.inicio.y, trecho.fim.y) + EPSILON;
  }
  return false;
}

function trechosFisicamenteConectados(a, b) {
  const aHorizontal = a.inicio.y === a.fim.y;
  const bHorizontal = b.inicio.y === b.fim.y;

  if (aHorizontal && bHorizontal && a.inicio.y === b.inicio.y) {
    return Math.min(a.fim.x, a.inicio.x) <= Math.max(b.inicio.x, b.fim.x) + EPSILON &&
      Math.min(b.fim.x, b.inicio.x) <= Math.max(a.inicio.x, a.fim.x) + EPSILON;
  }

  if (!aHorizontal && !bHorizontal && a.inicio.x === b.inicio.x) {
    return Math.min(a.fim.y, a.inicio.y) <= Math.max(b.inicio.y, b.fim.y) + EPSILON &&
      Math.min(b.fim.y, b.inicio.y) <= Math.max(a.inicio.y, a.fim.y) + EPSILON;
  }

  return [a.inicio, a.fim].some(ponto => pontoNoEixo(ponto, b)) ||
    [b.inicio, b.fim].some(ponto => pontoNoEixo(ponto, a));
}

function expandirPercursosConectados(area, ids, anterior, ponto) {
  const resultado = new Set(ids);
  for (const id of ids) {
    const atual = area.corredores.get(id);
    for (const trechoAtual of atual.segmentos) {
      if (!pontoNoTrecho(anterior, trechoAtual) && !pontoNoTrecho(ponto, trechoAtual)) continue;
      for (const [outroId, outro] of area.corredores) {
        if (outroId === id) continue;
        if (outro.segmentos.some(trecho =>
          pontoNoTrecho(ponto, trecho) && trechosFisicamenteConectados(trechoAtual, trecho))) {
          resultado.add(outroId);
        }
      }
    }
  }
  return [...resultado];
}

export function pontoNoTrecho(ponto, { inicio, fim }) {
  if (inicio.x === fim.x || inicio.y === fim.y) {
    return ponto.x >= Math.min(inicio.x, fim.x) - RAIO_CORREDOR &&
      ponto.x <= Math.max(inicio.x, fim.x) + RAIO_CORREDOR &&
      ponto.y >= Math.min(inicio.y, fim.y) - RAIO_CORREDOR &&
      ponto.y <= Math.max(inicio.y, fim.y) + RAIO_CORREDOR;
  }
  // Compatibilidade com o fallback direto do roteador em geometrias inválidas.
  const dx = fim.x - inicio.x;
  const dy = fim.y - inicio.y;
  const t = Math.max(0, Math.min(1,
    ((ponto.x - inicio.x) * dx + (ponto.y - inicio.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ponto.x - inicio.x - dx * t, ponto.y - inicio.y - dy * t) <= RAIO_CORREDOR;
}

export function criarAreaCaminhavel(salas, segmentos, raioPersonagem = 0) {
  const salasPorNome = new Map(salas.map(sala => [sala.nome, sala]));
  const corredores = new Map();
  const porSala = new Map(salas.map(sala => [sala.nome, []]));
  for (const segmento of segmentos) {
    if (!salasPorNome.has(segmento.origem) || !salasPorNome.has(segmento.destino)) continue;
    const id = chaveDoPercurso(segmento);
    if (!corredores.has(id)) {
      corredores.set(id, { id, origem: segmento.origem, destino: segmento.destino,
        entrada: segmento.inicio, saida: segmento.fim, segmentos: [] });
      porSala.get(segmento.origem).push(id);
      porSala.get(segmento.destino).push(id);
    }
    const corredor = corredores.get(id);
    corredor.segmentos.push(segmento);
    corredor.saida = segmento.fim;
  }
  return { salas: salasPorNome, corredores, porSala, raioPersonagem };
}

export function localizarNaArea(area, ponto) {
  const sala = [...area.salas.values()].find(sala => pontoNaSala(ponto, sala));
  // Só a inicialização localiza por coordenadas. Durante o movimento, a identidade
  // persiste mesmo quando dois caminhos ocupam os mesmos pixels.
  return sala ? { sala: sala.nome, corredores: [] } : { sala: null, corredores: [] };
}

function transicao(area, local, anterior, ponto) {
  if (local.sala !== null) {
    const sala = area.salas.get(local.sala);
    if (pontoNaSala(ponto, sala)) return local;
    const candidatos = area.porSala.get(local.sala).filter(id => {
      const corredor = area.corredores.get(id);
      const porta = corredor.origem === local.sala ? corredor.entrada : corredor.saida;
      return pertoDaPorta(anterior, porta) &&
        corredor.segmentos.some(trecho => pontoNoTrecho(ponto, trecho));
    });
    return candidatos.length ? { sala: null, corredores: candidatos } : null;
  }

  for (const id of local.corredores) {
    const corredor = area.corredores.get(id);
    for (const [nome, porta] of [[corredor.origem, corredor.entrada],
      [corredor.destino, corredor.saida]]) {
      if (pertoDaPorta(anterior, porta) && pontoNaSala(ponto, area.salas.get(nome))) {
        return { sala: nome, corredores: [] };
      }
    }
  }
  // Conserva todas as alternativas ainda coincidentes, sem incorporar caminhos
  // encontrados num cruzamento. A direção escolhida resolve a ambiguidade.
  const candidatos = expandirPercursosConectados(area, local.corredores, anterior, ponto)
    .filter(id => area.corredores.get(id).segmentos.some(trecho => pontoNoTrecho(ponto, trecho)));
  return candidatos.length ? { sala: null, corredores: candidatos } : null;
}

function tentarPasso(area, estado, dx, dy) {
  const ponto = { x: estado.x + dx, y: estado.y + dy };
  const local = transicao(area, estado.local, estado, ponto);
  if (!local || !corpoCabeNaArea(area, local, ponto)) return null;
  return { ...ponto, local };
}

function corpoCabeNaArea(area, local, ponto) {
  const raio = area.raioPersonagem;
  if (!raio) return true;
  const salas = local.sala === null ? [] : [area.salas.get(local.sala)];
  const ids = local.sala === null ? local.corredores : area.porSala.get(local.sala)
    .filter(id => {
      const corredor = area.corredores.get(id);
      return pertoDaPorta(ponto, corredor.origem === local.sala ? corredor.entrada : corredor.saida);
    });
  const corredores = ids.map(id => area.corredores.get(id));
  if (local.sala === null) for (const corredor of corredores) {
    salas.push(area.salas.get(corredor.origem), area.salas.get(corredor.destino));
  }
  // A base ocupa espaço, mas nunca empresta piso de um caminho que só cruza aqui.
  return [-raio, 0, raio].every(dx => [-raio, 0, raio].every(dy => {
    const amostra = { x: ponto.x + dx, y: ponto.y + dy };
    return salas.some(sala => pontoNaSala(amostra, sala)) ||
      corredores.some(corredor => corredor.segmentos.some(trecho => pontoNoTrecho(amostra, trecho)));
  }));
}

function deslizarEixo(area, estado, dx, dy) {
  const completo = tentarPasso(area, estado, dx, dy);
  if (completo) return completo;
  // Aproxima a borda sem ultrapassá-la; evita um recuo visível de um passo inteiro.
  let livre = 0;
  let bloqueado = 1;
  let resultado = estado;
  for (let i = 0; i < 16; i++) {
    const meio = (livre + bloqueado) / 2;
    const tentativa = tentarPasso(area, estado, dx * meio, dy * meio);
    if (tentativa) { livre = meio; resultado = tentativa; }
    else bloqueado = meio;
  }
  return resultado;
}

export function moverNaArea(area, local, posicao, deslocamento) {
  let estado = { x: posicao.x, y: posicao.y, local };
  if (!Number.isFinite(deslocamento.x) || !Number.isFinite(deslocamento.y)) return estado;
  const passos = Math.ceil(Math.hypot(deslocamento.x, deslocamento.y) / PASSO_MAXIMO);
  for (let i = 0; i < passos; i++) {
    const dx = deslocamento.x / passos;
    const dy = deslocamento.y / passos;
    const completo = tentarPasso(area, estado, dx, dy);
    if (completo) estado = completo;
    else {
      if (dx) estado = deslizarEixo(area, estado, dx, 0);
      if (dy) estado = deslizarEixo(area, estado, 0, dy);
    }
  }
  return estado;
}
