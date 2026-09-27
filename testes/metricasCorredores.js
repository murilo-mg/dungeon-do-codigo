// Diagnóstico da geometria atual: segmentos retos entre centros das salas.
const EPSILON = 1e-9;

function orientacao(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function ladosOpostos(a, b) {
  return (a > EPSILON && b < -EPSILON) || (a < -EPSILON && b > EPSILON);
}

function corredoresSeCruzam(a, b) {
  if (a.origem === b.origem || a.origem === b.destino ||
      a.destino === b.origem || a.destino === b.destino) return false;

  return ladosOpostos(
    orientacao(a.inicio, a.fim, b.inicio),
    orientacao(a.inicio, a.fim, b.fim)
  ) && ladosOpostos(
    orientacao(b.inicio, b.fim, a.inicio),
    orientacao(b.inicio, b.fim, a.fim)
  );
}

function atravessaInterior(segmento, sala) {
  let inicio = 0;
  let fim = 1;
  for (const [eixo, minimo, maximo] of [
    ['x', sala.x, sala.x + sala.largura],
    ['y', sala.y, sala.y + sala.altura],
  ]) {
    const ponto = segmento.inicio[eixo];
    const delta = segmento.fim[eixo] - ponto;
    if (Math.abs(delta) < EPSILON) {
      if (ponto <= minimo + EPSILON || ponto >= maximo - EPSILON) return false;
      continue;
    }
    inicio = Math.max(inicio, Math.min((minimo - ponto) / delta, (maximo - ponto) / delta));
    fim = Math.min(fim, Math.max((minimo - ponto) / delta, (maximo - ponto) / delta));
  }
  // Intervalo aberto: tocar só uma borda ou um canto não ocupa o interior.
  return fim - inicio > EPSILON;
}

export function medirCorredores(salas, segmentos) {
  let cruzamentos = 0;
  let corredoresAtravessandoSalas = 0;
  let comprimentoTotal = 0;

  segmentos.forEach((segmento, indice) => {
    comprimentoTotal += Math.hypot(
      segmento.fim.x - segmento.inicio.x,
      segmento.fim.y - segmento.inicio.y
    );
    if (salas.some(sala => sala.nome !== segmento.origem &&
        sala.nome !== segmento.destino && atravessaInterior(segmento, sala))) {
      corredoresAtravessandoSalas++;
    }
    for (let outro = indice + 1; outro < segmentos.length; outro++) {
      if (corredoresSeCruzam(segmento, segmentos[outro])) cruzamentos++;
    }
  });

  return { cruzamentos, corredoresAtravessandoSalas, comprimentoTotal };
}
