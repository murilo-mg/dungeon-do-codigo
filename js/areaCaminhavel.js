// Colisão sobre a geometria existente; não conhece Canvas, câmera ou grafo.
import { chaveDoPercurso, calcularJuncoesCorredores, extrairPortasDosCorredores,
  LARGURA_CORREDOR } from './corredores.js';

const RAIO_CORREDOR = LARGURA_CORREDOR / 2;
const PASSO_MAXIMO = 1;
const EPSILON = 1e-8;

export function pontoNaSala(ponto, sala) {
  return ponto.x >= sala.x && ponto.x <= sala.x + sala.largura &&
    ponto.y >= sala.y && ponto.y <= sala.y + sala.altura;
}

function pertoDaPorta(ponto, porta) {
  return porta && Math.abs(ponto.x - porta.x) <= RAIO_CORREDOR + EPSILON &&
    Math.abs(ponto.y - porta.y) <= RAIO_CORREDOR + EPSILON;
}

function pertoDaJuncao(ponto, juncao, margem = 0) {
  const { x, y, largura, altura } = juncao.area;
  return ponto.x >= x - margem - EPSILON && ponto.x <= x + largura + margem + EPSILON &&
    ponto.y >= y - margem - EPSILON && ponto.y <= y + altura + margem + EPSILON;
}

function atravessaJuncao(anterior, ponto, juncao) {
  let entrada = 0, saida = 1;
  for (const [eixo, tamanho] of [['x', 'largura'], ['y', 'altura']]) {
    const minimo = juncao.area[eixo], maximo = minimo + juncao.area[tamanho];
    const delta = ponto[eixo] - anterior[eixo];
    if (Math.abs(delta) < EPSILON) {
      if (anterior[eixo] < minimo - EPSILON || anterior[eixo] > maximo + EPSILON) return false;
    } else {
      const a = (minimo - anterior[eixo]) / delta, b = (maximo - anterior[eixo]) / delta;
      entrada = Math.max(entrada, Math.min(a, b));
      saida = Math.min(saida, Math.max(a, b));
    }
  }
  return entrada <= saida + EPSILON;
}

function expandirPercursosConectados(area, ids, anterior, ponto) {
  const resultado = new Set(ids);
  const fila = [...ids];
  for (const id of fila) {
    for (const juncao of area.juncoes) {
      // Uma faixa compartilhada pode ser menor que um passo, ou ter largura
      // zero quando dois pisos encostam. Testa a travessia, não só o ponto final.
      if (!juncao.ids.includes(id) || !atravessaJuncao(anterior, ponto, juncao)) continue;
      for (const outroId of juncao.ids) if (!resultado.has(outroId)) {
        resultado.add(outroId);
        fila.push(outroId);
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
        entrada: null, saida: null, segmentos: [] });
    }
    const corredor = corredores.get(id);
    corredor.segmentos.push(segmento);
  }
  const validos = segmentos.filter(segmento => corredores.has(chaveDoPercurso(segmento)));
  const portas = extrairPortasDosCorredores(salas, validos);
  for (const porta of portas) for (const id of porta.ids) {
    const corredor = corredores.get(id);
    corredor[corredor.origem === porta.nomeSala ? 'entrada' : 'saida'] = porta.ponto;
    porSala.get(porta.nomeSala).push(id);
  }
  return { salas: salasPorNome, corredores, porSala, raioPersonagem,
    portas, juncoes: calcularJuncoesCorredores(validos) };
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
    if (pontoNaSala(ponto, sala)) return [local];
    const candidatos = area.porSala.get(local.sala).filter(id => {
      const corredor = area.corredores.get(id);
      const porta = corredor.origem === local.sala ? corredor.entrada : corredor.saida;
      return pertoDaPorta(anterior, porta) &&
        corredor.segmentos.some(trecho => pontoNoTrecho(ponto, trecho));
    });
    return candidatos.length ? [{ sala: null, corredores: candidatos }] : [];
  }

  const alternativas = [];
  for (const id of local.corredores) {
    const corredor = area.corredores.get(id);
    for (const [nome, porta] of [[corredor.origem, corredor.entrada],
      [corredor.destino, corredor.saida]]) {
      const sala = area.salas.get(nome);
      if (pontoNaSala(ponto, sala) && pertoDaPorta(anterior, porta)) {
        alternativas.push({ sala: nome, corredores: [] });
      }
    }
  }
  // Conserva todas as alternativas ainda coincidentes, sem incorporar caminhos
  // encontrados num cruzamento. A direção escolhida resolve a ambiguidade.
  const candidatos = expandirPercursosConectados(area, local.corredores, anterior, ponto)
    .filter(id => area.corredores.get(id).segmentos.some(trecho => pontoNoTrecho(ponto, trecho)));
  if (candidatos.length) alternativas.push({ sala: null, corredores: candidatos });
  return alternativas;
}

function tentarPasso(area, estado, dx, dy) {
  const ponto = { x: estado.x + dx, y: estado.y + dy };
  const alternativas = transicao(area, estado.local, estado, ponto);
  // Uma sala próxima pode rejeitar a base; isso não fecha o corredor de origem.
  const local = alternativas.find(opcao => corpoCabeNaArea(area, opcao, ponto));
  return local ? { ...ponto, local } : null;
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
  const trechos = corredores.flatMap(corredor => corredor.segmentos);
  // Ao atravessar uma união, a base pode ainda ocupar o piso que o centro deixou.
  // Somente trechos da junção local dão esse apoio; cruzamentos não emprestam piso.
  for (const juncao of area.juncoes) {
    if (juncao.ids.some(id => ids.includes(id)) && pertoDaJuncao(ponto, juncao, raio)) {
      trechos.push(...juncao.trechos);
    }
  }
  return [-raio, 0, raio].every(dx => [-raio, 0, raio].every(dy => {
    const amostra = { x: ponto.x + dx, y: ponto.y + dy };
    return salas.some(sala => pontoNaSala(amostra, sala)) ||
      trechos.some(trecho => pontoNoTrecho(amostra, trecho));
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
