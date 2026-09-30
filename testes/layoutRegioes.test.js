import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularLayoutRegioes, calcularProfundidadesRegioes, construirRelacoesRegioes, organizarSalasNaRegiao, calcularLayoutRegionalCompleto } from '../js/layoutRegioes.js';

function regiao(id, tipo, titulo = id) {
  return { id, tipo, titulo, funcoes: [] };
}

test('lista vazia não cria regiões fictícias', () => {
  assert.deepEqual(calcularLayoutRegioes([]), new Map());
});

test('entrada ocupa a referência central do macro-layout', () => {
  const layout = calcularLayoutRegioes([
    regiao('entrada', 'entrada'),
  ]);

  assert.deepEqual(layout.get('entrada'), {
    x: 0,
    y: 0,
    largura: 220,
    altura: 180,
  });
});

test('alas conectadas ocupam colunas conforme a profundidade regional', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'ala:1', tipo: 'ala', titulo: 'Ala 1', funcoes: ['a'] },
    { id: 'ala:2', tipo: 'ala', titulo: 'Ala 2', funcoes: ['b'] },
    { id: 'ala:3', tipo: 'ala', titulo: 'Ala 3', funcoes: ['c'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'a' },
      { origem: 'a', destino: 'b' },
      { origem: 'a', destino: 'c' },
    ],
  };

  const layout = calcularLayoutRegioes(regioes, grafo);

  assert.ok(layout.get('entrada').x < layout.get('ala:1').x);
  assert.ok(layout.get('ala:1').x < layout.get('ala:2').x);
  assert.equal(layout.get('ala:2').x, layout.get('ala:3').x);
  assert.notEqual(layout.get('ala:2').y, layout.get('ala:3').y);
});

test('criptas ficam afastadas do conjunto principal alcançável', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'ala:1', tipo: 'ala', titulo: 'Ala 1', funcoes: ['a'] },
    { id: 'isoladas', tipo: 'isoladas', titulo: 'Criptas', funcoes: ['fantasma'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'a' },
    ],
  };

  const layout = calcularLayoutRegioes(regioes, grafo);

  assert.ok(layout.get('isoladas').x > layout.get('entrada').x);
  assert.ok(layout.get('isoladas').x > layout.get('ala:1').x);
});

test('resultado é determinístico e não modifica regiões', () => {
  const regioes = [
    regiao('entrada', 'entrada'),
    regiao('ala:parser', 'ala'),
    regiao('hub', 'hub'),
    regiao('isoladas', 'isoladas'),
  ];

  const antes = structuredClone(regioes);
  const primeiro = calcularLayoutRegioes(regioes);

  assert.deepEqual(calcularLayoutRegioes(regioes), primeiro);
  assert.deepEqual(regioes, antes);
});

test('relações entre regiões seguem somente chamadas reais entre suas funções', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada',
      funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser',
      funcoes: ['parse', 'validar'] },
    { id: 'lexer', tipo: 'ala', titulo: 'Ala Lexer',
      funcoes: ['tokenizar'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'parse' },
      { origem: 'parse', destino: 'validar' },
      { origem: 'validar', destino: 'tokenizar' },
    ],
  };

  const relacoes = construirRelacoesRegioes(regioes, grafo);

  assert.deepEqual([...relacoes.get('entrada')], ['parser']);
  assert.deepEqual([...relacoes.get('parser')], ['lexer']);
  assert.deepEqual([...relacoes.get('lexer')], []);
});

test('chamadas internas da mesma região não viram ligação entre regiões', () => {
  const regioes = [
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser',
      funcoes: ['parse', 'validar'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'parse', destino: 'validar' },
      { origem: 'validar', destino: 'parse' },
    ],
  };

  const relacoes = construirRelacoesRegioes(regioes, grafo);

  assert.deepEqual([...relacoes.get('parser')], []);
});

test('arestas repetidas não duplicam relação entre regiões', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada',
      funcoes: ['main'] },
    { id: 'ala', tipo: 'ala', titulo: 'Ala 1',
      funcoes: ['a', 'b'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'a' },
      { origem: 'main', destino: 'b' },
    ],
  };

  const relacoes = construirRelacoesRegioes(regioes, grafo);

  assert.deepEqual([...relacoes.get('entrada')], ['ala']);
});

test('funções desconhecidas não criam regiões ou relações artificiais', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada',
      funcoes: ['main'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'printf' },
      { origem: 'externa', destino: 'main' },
    ],
  };

  const relacoes = construirRelacoesRegioes(regioes, grafo);

  assert.deepEqual([...relacoes.keys()], ['entrada']);
  assert.deepEqual([...relacoes.get('entrada')], []);
});

test('profundidades das regiões seguem o alcance a partir da entrada', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser', funcoes: ['parse'] },
    { id: 'lexer', tipo: 'ala', titulo: 'Ala Lexer', funcoes: ['tokenizar'] },
    { id: 'rbt', tipo: 'ala', titulo: 'Ala RBT', funcoes: ['rotacionar'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'parse' },
      { origem: 'parse', destino: 'tokenizar' },
      { origem: 'parse', destino: 'rotacionar' },
    ],
  };

  const profundidades = calcularProfundidadesRegioes(regioes, grafo);

  assert.equal(profundidades.get('entrada'), 0);
  assert.equal(profundidades.get('parser'), 1);
  assert.equal(profundidades.get('lexer'), 2);
  assert.equal(profundidades.get('rbt'), 2);
});

test('regiões inalcançáveis não recebem profundidade artificial', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'isolada', tipo: 'ala', titulo: 'Ala Solta', funcoes: ['x'] },
  ];

  const grafo = {
    arestas: [],
  };

  const profundidades = calcularProfundidadesRegioes(regioes, grafo);

  assert.equal(profundidades.get('entrada'), 0);
  assert.equal(profundidades.has('isolada'), false);
});

test('macro-layout organiza regiões alcançáveis por profundidade', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser', funcoes: ['parse'] },
    { id: 'lexer', tipo: 'ala', titulo: 'Ala Lexer', funcoes: ['tokenizar'] },
    { id: 'rbt', tipo: 'ala', titulo: 'Ala RBT', funcoes: ['rotacionar'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'parse' },
      { origem: 'parse', destino: 'tokenizar' },
      { origem: 'parse', destino: 'rotacionar' },
    ],
  };

  const layout = calcularLayoutRegioes(regioes, grafo);

  assert.ok(layout.get('entrada').x < layout.get('parser').x);
  assert.ok(layout.get('parser').x < layout.get('lexer').x);
  assert.equal(layout.get('lexer').x, layout.get('rbt').x);
  assert.notEqual(layout.get('lexer').y, layout.get('rbt').y);
});

test('criptas isoladas ficam depois das regiões alcançáveis', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser', funcoes: ['parse'] },
    { id: 'isoladas', tipo: 'isoladas', titulo: 'Criptas', funcoes: ['fantasma'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'parse' },
    ],
  };

  const layout = calcularLayoutRegioes(regioes, grafo);

  assert.ok(layout.get('isoladas').x > layout.get('parser').x);
});

test('uma região com uma sala preserva seu tamanho', () => {
  const regiao = {
    id: 'parser',
    tipo: 'ala',
    titulo: 'Ala Parser',
    funcoes: ['parse'],
  };

  const salas = [
    { nome: 'parse', x: 100, y: 200, largura: 80, altura: 60 },
  ];

  const resultado = organizarSalasNaRegiao(regiao, salas);

  assert.deepEqual(resultado.salas.get('parse'), {
    nome: 'parse',
    x: 0,
    y: 0,
    largura: 80,
    altura: 60,
  });

  assert.equal(resultado.largura, 80);
  assert.equal(resultado.altura, 60);
});

test('quatro salas são distribuídas em grade de duas por duas', () => {
  const regiao = {
    id: 'parser',
    tipo: 'ala',
    titulo: 'Ala Parser',
    funcoes: ['a', 'b', 'c', 'd'],
  };

  const salas = ['a', 'b', 'c', 'd'].map(nome => ({
    nome,
    x: 0,
    y: 0,
    largura: 60,
    altura: 60,
  }));

  const resultado = organizarSalasNaRegiao(regiao, salas);

  assert.equal(resultado.salas.get('a').y, resultado.salas.get('b').y);
  assert.equal(resultado.salas.get('c').y, resultado.salas.get('d').y);

  assert.equal(resultado.salas.get('a').x, resultado.salas.get('c').x);
  assert.equal(resultado.salas.get('b').x, resultado.salas.get('d').x);

  assert.ok(resultado.salas.get('b').x > resultado.salas.get('a').x);
  assert.ok(resultado.salas.get('c').y > resultado.salas.get('a').y);
});

test('salas de tamanhos diferentes não se sobrepõem dentro da região', () => {
  const regiao = {
    id: 'ala',
    tipo: 'ala',
    titulo: 'Ala',
    funcoes: ['a', 'b', 'c', 'd', 'e'],
  };

  const salas = [
    { nome: 'a', largura: 60, altura: 60 },
    { nome: 'b', largura: 80, altura: 80 },
    { nome: 'c', largura: 105, altura: 105 },
    { nome: 'd', largura: 60, altura: 60 },
    { nome: 'e', largura: 80, altura: 80 },
  ].map(sala => ({ x: 0, y: 0, ...sala }));

  const resultado = organizarSalasNaRegiao(regiao, salas);
  const posicionadas = [...resultado.salas.values()];

  for (let i = 0; i < posicionadas.length; i++) {
    for (let j = i + 1; j < posicionadas.length; j++) {
      const a = posicionadas[i];
      const b = posicionadas[j];

      const separadas =
        a.x + a.largura <= b.x ||
        b.x + b.largura <= a.x ||
        a.y + a.altura <= b.y ||
        b.y + b.altura <= a.y;

      assert.equal(separadas, true);
    }
  }
});

test('organização interna é determinística e não modifica as salas originais', () => {
  const regiao = {
    id: 'ala',
    tipo: 'ala',
    titulo: 'Ala',
    funcoes: ['a', 'b', 'c'],
  };

  const salas = [
    { nome: 'a', x: 10, y: 20, largura: 60, altura: 60 },
    { nome: 'b', x: 30, y: 40, largura: 80, altura: 80 },
    { nome: 'c', x: 50, y: 60, largura: 105, altura: 105 },
  ];

  const antes = structuredClone(salas);

  const primeiro = organizarSalasNaRegiao(regiao, salas);
  const segundo = organizarSalasNaRegiao(regiao, salas);

  assert.deepEqual(primeiro, segundo);
  assert.deepEqual(salas, antes);
});

test('layout completo coloca salas dentro dos territórios de suas regiões', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Ala Parser', funcoes: ['a', 'b'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'a' },
      { origem: 'a', destino: 'b' },
    ],
  };

  const salas = [
    { nome: 'main', x: 0, y: 0, largura: 90, altura: 80 },
    { nome: 'a', x: 0, y: 0, largura: 60, altura: 60 },
    { nome: 'b', x: 0, y: 0, largura: 80, altura: 80 },
  ];

  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);

  for (const regiao of regioes) {
    const territorio = resultado.territorios.get(regiao.id);

    for (const nome of regiao.funcoes) {
      const sala = resultado.salas.get(nome);

      assert.ok(sala.x >= territorio.x);
      assert.ok(sala.y >= territorio.y);
      assert.ok(
        sala.x + sala.largura <=
        territorio.x + territorio.largura
      );
      assert.ok(
        sala.y + sala.altura <=
        territorio.y + territorio.altura
      );
    }
  }
});

test('território cresce quando a região possui muitas salas', () => {
  const nomes = Array.from({ length: 9 }, (_, indice) => `f${indice}`);

  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'ala', tipo: 'ala', titulo: 'Ala Grande', funcoes: nomes },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'f0' },
      ...nomes.slice(0, -1).map((nome, indice) => ({
        origem: nome,
        destino: nomes[indice + 1],
      })),
    ],
  };

  const salas = [
    { nome: 'main', x: 0, y: 0, largura: 90, altura: 80 },
    ...nomes.map(nome => ({
      nome,
      x: 0,
      y: 0,
      largura: 80,
      altura: 80,
    })),
  ];

  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const territorio = resultado.territorios.get('ala');

  assert.ok(territorio.largura > 220);
  assert.ok(territorio.altura > 180);
});

test('territórios não se sobrepõem', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'a', tipo: 'ala', titulo: 'Ala A', funcoes: ['fa'] },
    { id: 'b', tipo: 'ala', titulo: 'Ala B', funcoes: ['fb'] },
    { id: 'c', tipo: 'ala', titulo: 'Ala C', funcoes: ['fc'] },
    { id: 'isoladas', tipo: 'isoladas', titulo: 'Criptas', funcoes: ['x'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'fa' },
      { origem: 'fa', destino: 'fb' },
      { origem: 'fa', destino: 'fc' },
    ],
  };

  const salas = ['main', 'fa', 'fb', 'fc', 'x'].map(nome => ({
    nome,
    x: 0,
    y: 0,
    largura: nome === 'main' ? 90 : 60,
    altura: nome === 'main' ? 80 : 60,
  }));

  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const territorios = [...resultado.territorios.values()];

  for (let i = 0; i < territorios.length; i++) {
    for (let j = i + 1; j < territorios.length; j++) {
      const a = territorios[i];
      const b = territorios[j];

      const separados =
        a.x + a.largura <= b.x ||
        b.x + b.largura <= a.x ||
        a.y + a.altura <= b.y ||
        b.y + b.altura <= a.y;

      assert.equal(separados, true);
    }
  }
});

test('layout completo preserva entrada e produz mundo positivo e determinístico', () => {
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada', funcoes: ['main'] },
    { id: 'parser', tipo: 'ala', titulo: 'Parser', funcoes: ['parse'] },
  ];

  const grafo = {
    arestas: [
      { origem: 'main', destino: 'parse' },
    ],
  };

  const salas = [
    { nome: 'main', x: 100, y: 100, largura: 90, altura: 80 },
    { nome: 'parse', x: 300, y: 200, largura: 60, altura: 60 },
  ];

  const antes = structuredClone({ regioes, grafo, salas });

  const primeiro = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const segundo = calcularLayoutRegionalCompleto(regioes, grafo, salas);

  assert.deepEqual(primeiro, segundo);
  assert.deepEqual({ regioes, grafo, salas }, antes);

  assert.ok(primeiro.salas.get('main'));
  assert.ok(primeiro.larguraMundo >= 560);
  assert.ok(primeiro.alturaMundo >= 480);

  for (const territorio of primeiro.territorios.values()) {
    assert.ok(territorio.x >= 0);
    assert.ok(territorio.y >= 0);
  }
});

function criarConjuntoRegional(quantidade, { hub = false, cadeia = false } = {}) {
  const nomes = Array.from({ length: quantidade }, (_, indice) => `f${indice}`);
  const regioes = [
    { id: 'entrada', tipo: 'entrada', funcoes: ['main'] },
    ...nomes.map(nome => ({ id: nome, tipo: 'ala', funcoes: [nome] })),
    ...(hub ? [{ id: 'hub', tipo: 'hub', funcoes: ['central'] }] : []),
    { id: 'isoladas', tipo: 'isoladas', funcoes: ['solta'] },
  ];
  const grafo = {
    arestas: nomes.map((destino, indice) => ({
      origem: cadeia && indice ? nomes[indice - 1] : 'main', destino,
    })),
  };
  if (hub) grafo.arestas.push({ origem: 'main', destino: 'central' });
  const salas = regioes.flatMap(regiao => regiao.funcoes.map(nome => ({
    nome, x: 17, y: 29, largura: 80, altura: 80,
  })));
  return { regioes, grafo, salas };
}

function verificarLimitesESobreposicoes(resultado) {
  const territorios = [...resultado.territorios.values()];
  for (const territorio of territorios) {
    assert.ok(territorio.x >= 0 && territorio.y >= 0);
    assert.ok(territorio.x + territorio.largura <= resultado.larguraMundo);
    assert.ok(territorio.y + territorio.altura <= resultado.alturaMundo);
  }
  for (let i = 0; i < territorios.length; i++) {
    for (let j = i + 1; j < territorios.length; j++) {
      const a = territorios[i];
      const b = territorios[j];
      assert.ok(a.x + a.largura <= b.x || b.x + b.largura <= a.x ||
        a.y + a.altura <= b.y || b.y + b.altura <= a.y);
    }
  }
}

test('alas sem hub empilham pela altura real, sem herdar vazios da coluna vizinha', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(12);
  salas.forEach((sala, indice) => { sala.altura += (indice % 3) * 70; });
  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const colunas = new Map();
  for (const regiao of regioes.filter(regiao => regiao.tipo === 'ala')) {
    const territorio = resultado.territorios.get(regiao.id);
    const centro = territorio.x + territorio.largura / 2;
    if (!colunas.has(centro)) colunas.set(centro, []);
    colunas.get(centro).push(territorio);
  }
  let vizinhos = 0;
  for (const coluna of colunas.values()) {
    coluna.sort((a, b) => a.y - b.y);
    for (let i = 1; i < coluna.length; i++) {
      assert.equal(coluna[i].y - coluna[i - 1].y - coluna[i - 1].altura, 64);
      vizinhos++;
    }
  }
  assert.ok(vizinhos > 0);
  verificarLimitesESobreposicoes(resultado);
});

test('cadeia dentro da ala vira serpentina apenas quando encurta chamadas reais', () => {
  const salas = Array.from({ length: 8 }, (_, i) => ({ nome: `f${i}`, largura: 60, altura: 60 }));
  const regiao = { funcoes: salas.map(sala => sala.nome) };
  const grafo = { arestas: salas.slice(1).map((sala, i) => ({ origem: `f${i}`, destino: sala.nome })) };
  const antes = structuredClone({ salas, regiao, grafo });
  const regular = organizarSalasNaRegiao(regiao, salas);
  const ajustada = organizarSalasNaRegiao(regiao, salas, 48, grafo);
  const comprimento = grade => grafo.arestas.reduce((total, aresta) => {
    const a = grade.salas.get(aresta.origem), b = grade.salas.get(aresta.destino);
    return total + Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }, 0);
  assert.ok(comprimento(ajustada) < comprimento(regular));
  assert.equal(ajustada.largura, regular.largura);
  assert.equal(ajustada.altura, regular.altura);
  assert.deepEqual(organizarSalasNaRegiao(regiao, salas, 48, { arestas: [] }), regular);
  assert.deepEqual(organizarSalasNaRegiao(regiao, salas, 48, grafo), ajustada);
  assert.deepEqual({ salas, regiao, grafo }, antes);
});

test('entrada fica abaixo do conjunto e Criptas preservam afastamento lateral', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(8, { hub: true });
  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const entrada = resultado.territorios.get('entrada');
  const criptas = resultado.territorios.get('isoladas');
  const alcancaveis = [...resultado.territorios.entries()]
    .filter(([id]) => id !== 'entrada' && id !== 'isoladas')
    .map(([, territorio]) => territorio);
  const baseConjunto = Math.max(...alcancaveis.map(item => item.y + item.altura));

  assert.ok(entrada.y > baseConjunto);
  assert.equal(criptas.y, entrada.y);
  assert.ok(criptas.x - entrada.x - entrada.largura >= 112);
  verificarLimitesESobreposicoes(resultado);
});

test('hub mantém alas dos dois lados e acima e abaixo do salão', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(8, { hub: true });
  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const hub = resultado.territorios.get('hub');
  const alas = regioes.filter(regiao => regiao.tipo === 'ala')
    .map(regiao => resultado.territorios.get(regiao.id));

  assert.ok(alas.some(ala => ala.x + ala.largura < hub.x));
  assert.ok(alas.some(ala => ala.x > hub.x + hub.largura));
  assert.ok(alas.some(ala => ala.y + ala.altura < hub.y));
  assert.ok(alas.some(ala => ala.y > hub.y + hub.altura));
});

test('placa da região tem espaço próprio acima das salas e largura mínima', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(1);
  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);

  for (const regiao of regioes) {
    const territorio = resultado.territorios.get(regiao.id);
    assert.ok(territorio.largura >= 220);
    for (const nome of regiao.funcoes) {
      assert.ok(resultado.salas.get(nome).y >= territorio.y + 80);
    }
  }
});

test('muitas alas e cadeia profunda ocupam as duas dimensões sem sobreposição', () => {
  for (const cadeia of [false, true]) {
    const { regioes, grafo, salas } = criarConjuntoRegional(32, { cadeia });
    const antes = structuredClone({ regioes, grafo, salas });
    const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
    const proporcao = resultado.larguraMundo / resultado.alturaMundo;

    assert.equal(resultado.territorios.size, regioes.length);
    assert.equal(resultado.salas.size, salas.length);
    assert.ok(proporcao > 0.7 && proporcao < 1.8);
    assert.deepEqual(calcularLayoutRegionalCompleto(regioes, grafo, salas), resultado);
    assert.deepEqual({ regioes, grafo, salas }, antes);
    verificarLimitesESobreposicoes(resultado);
  }
});

test('uma ala grande não impõe seu tamanho a todos os intervalos do mapa', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(12);
  salas.find(sala => sala.nome === 'f0').largura = 620;
  salas.find(sala => sala.nome === 'f0').altura = 420;
  const resultado = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const pequenas = regioes.filter(regiao => regiao.tipo === 'ala' && regiao.id !== 'f0')
    .map(regiao => resultado.territorios.get(regiao.id));
  const distancias = pequenas.flatMap((a, indice) => pequenas.slice(indice + 1)
    .filter(b => a.y === b.y)
    .map(b => Math.abs(a.x - b.x)));

  assert.ok(Math.min(...distancias) < 400);
  for (const original of salas) {
    const posicionada = resultado.salas.get(original.nome);
    assert.equal(posicionada.largura, original.largura);
    assert.equal(posicionada.altura, original.altura);
  }
  verificarLimitesESobreposicoes(resultado);
});

test('títulos longos não alteram a composição nem inventam dados da região', () => {
  const { regioes, grafo, salas } = criarConjuntoRegional(4, { hub: true });
  const primeiro = calcularLayoutRegionalCompleto(regioes, grafo, salas);
  const renomeadas = regioes.map(regiao => ({
    ...regiao, titulo: 'Um nome de ala bastante longo para testar a geometria',
  }));

  assert.deepEqual(calcularLayoutRegionalCompleto(renomeadas, grafo, salas), primeiro);
});

test('layout completo vazio e entrada única preservam limites e todas as salas', () => {
  const vazio = calcularLayoutRegionalCompleto([], { arestas: [] }, []);
  assert.equal(vazio.territorios.size, 0);
  assert.equal(vazio.salas.size, 0);
  const resultado = calcularLayoutRegionalCompleto(
    [{ id: 'entrada', tipo: 'entrada', funcoes: ['iniciar'] }],
    { arestas: [] },
    [{ nome: 'iniciar', largura: 80, altura: 80 }]
  );
  assert.equal(resultado.territorios.size, 1);
  assert.equal(resultado.salas.size, 1);
  verificarLimitesESobreposicoes(resultado);
});
