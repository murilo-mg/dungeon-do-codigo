// Nomeia regiões a partir das relações do grafo, sem depender da geometria.

const MINIMO_CALLERS_HUB = 3;
const PREFIXOS_OPERACIONAIS = new Set([
  'get', 'set', 'create', 'delete', 'remove', 'add', 'find', 'init', 'free',
  'read', 'write', 'load', 'save', 'update', 'process', 'handle', 'make', 'new',
]);

export function humanizarPrefixo(prefixo) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(prefixo)) return null;
  if (prefixo.toLowerCase() === 'parse') return 'Parser';
  if (prefixo.length <= 3 && !/[aeiou]/i.test(prefixo)) return prefixo.toUpperCase();
  return prefixo[0].toUpperCase() + prefixo.slice(1).toLowerCase();
}

function prefixoDe(nome) {
  return /^([A-Za-z][A-Za-z0-9]*)_[A-Za-z0-9_]+$/.exec(nome)?.[1] ?? null;
}

export function encontrarPrefixoConfiavel(nomes) {
  if (nomes.length < 2) return null;
  const prefixo = prefixoDe(nomes[0]);
  return prefixo && !PREFIXOS_OPERACIONAIS.has(prefixo.toLowerCase()) &&
    nomes.every(nome => prefixoDe(nome) === prefixo) ? prefixo : null;
}

export function criarRegioesMasmorra(grafo) {
  if (!grafo.nos.has(grafo.entrada)) return [];

  const nomes = [...grafo.nos.keys()];
  const hubs = new Set(nomes.filter(nome => nome !== grafo.entrada &&
    grafo.nos.get(nome).alcancavel &&
    new Set(grafo.nos.get(nome).chamadaPor.filter(caller => caller !== nome &&
      grafo.nos.get(caller).alcancavel)).size >=
      MINIMO_CALLERS_HUB));
  const isoladas = nomes.filter(nome => nome !== grafo.entrada &&
    !grafo.nos.get(nome).alcancavel);
  const normais = nomes.filter(nome => nome !== grafo.entrada && !hubs.has(nome) &&
    grafo.nos.get(nome).alcancavel);
  const regioesPorNome = new Map();
  const candidatosPorPrefixo = new Map();

  for (const nome of normais) {
    const prefixo = prefixoDe(nome);
    if (!prefixo) continue;
    if (!candidatosPorPrefixo.has(prefixo)) candidatosPorPrefixo.set(prefixo, []);
    candidatosPorPrefixo.get(prefixo).push(nome);
  }
  for (const [prefixo, membros] of candidatosPorPrefixo) {
    if (prefixo.toLowerCase() === 'main' || !encontrarPrefixoConfiavel(membros)) continue;
    const regiao = { id: `ala:${prefixo}`, tipo: 'ala',
      titulo: `Ala ${humanizarPrefixo(prefixo)}`, funcoes: membros };
    for (const nome of membros) regioesPorNome.set(nome, regiao);
  }

  const vizinhos = new Map(normais.map(nome => [nome, []]));
  for (const { origem, destino } of grafo.arestas) {
    if (!vizinhos.has(origem) || !vizinhos.has(destino)) continue;
    vizinhos.get(origem).push(destino);
    vizinhos.get(destino).push(origem);
  }
  let numeroAla = 0;
  const visitadas = new Set(regioesPorNome.keys());
  for (const nome of normais) {
    if (visitadas.has(nome)) continue;
    const membros = [];
    const fila = [nome];
    visitadas.add(nome);
    for (let indice = 0; indice < fila.length; indice++) {
      const atual = fila[indice];
      membros.push(atual);
      for (const vizinho of vizinhos.get(atual)) {
        if (visitadas.has(vizinho)) continue;
        visitadas.add(vizinho);
        fila.push(vizinho);
      }
    }
    numeroAla++;
    const regiao = { id: `ala:${numeroAla}`, tipo: 'ala',
      titulo: `Ala ${numeroAla}`, funcoes: membros };
    for (const membro of membros) regioesPorNome.set(membro, regiao);
  }

  const regioes = [{ id: 'entrada', tipo: 'entrada', titulo: 'Entrada da Dungeon',
    funcoes: [grafo.entrada] }];
  const adicionadas = new Set();
  for (const nome of normais) {
    const regiao = regioesPorNome.get(nome);
    if (adicionadas.has(regiao.id)) continue;
    adicionadas.add(regiao.id);
    regioes.push(regiao);
  }
  if (hubs.size) regioes.push({ id: 'hub', tipo: 'hub', titulo: 'Salão Central',
    funcoes: nomes.filter(nome => hubs.has(nome)) });
  if (isoladas.length) regioes.push({ id: 'isoladas', tipo: 'isoladas',
    titulo: 'Criptas Isoladas', funcoes: isoladas });
  return regioes;
}
