// Calcula o macro-layout das regiões sem alterar salas, grafo ou corredores.

const LARGURA_REGIAO_BASE = 220;
const ALTURA_REGIAO_BASE = 180;
const GAP_HORIZONTAL_REGIOES = 90;
const GAP_VERTICAL_REGIOES = 70;

export function construirRelacoesRegioes(regioes, grafo) {
  const regiaoPorFuncao = new Map();

  for (const regiao of regioes ?? []) {
    for (const nome of regiao.funcoes ?? []) {
      regiaoPorFuncao.set(nome, regiao.id);
    }
  }

  const relacoes = new Map(
    (regioes ?? []).map(regiao => [regiao.id, new Set()])
  );

  for (const aresta of grafo?.arestas ?? []) {
    const origem = regiaoPorFuncao.get(aresta.origem);
    const destino = regiaoPorFuncao.get(aresta.destino);

    if (!origem || !destino || origem === destino) continue;

    relacoes.get(origem)?.add(destino);
  }

  return relacoes;
}

export function calcularProfundidadesRegioes(regioes, grafo) {
  const relacoes = construirRelacoesRegioes(regioes, grafo);
  const profundidades = new Map();

  const entrada = (regioes ?? []).find(regiao => regiao.tipo === 'entrada') ?? null;
  if (!entrada) return profundidades;

  const fila = [entrada.id];
  profundidades.set(entrada.id, 0);

  while (fila.length) {
    const atual = fila.shift();
    const profundidadeAtual = profundidades.get(atual);

    for (const destino of relacoes.get(atual) ?? []) {
      if (profundidades.has(destino)) continue;
      profundidades.set(destino, profundidadeAtual + 1);
      fila.push(destino);
    }
  }

  return profundidades;
}

export function calcularLayoutRegioes(regioes, grafo) {
  if (!regioes?.length) return new Map();

  const entrada = regioes.find(regiao => regiao.tipo === 'entrada') ?? null;
  const isoladas = regioes.find(regiao => regiao.tipo === 'isoladas') ?? null;
  const profundidades = calcularProfundidadesRegioes(regioes, grafo);

  const layout = new Map();

  if (entrada) {
    layout.set(entrada.id, {
      x: 0,
      y: 0,
      largura: LARGURA_REGIAO_BASE,
      altura: ALTURA_REGIAO_BASE,
    });
  }

  const regioesAlcancaveis = regioes.filter(regiao =>
    regiao.id !== entrada?.id &&
    regiao.id !== isoladas?.id &&
    profundidades.has(regiao.id)
  );

  const porProfundidade = new Map();
  for (const regiao of regioesAlcancaveis) {
    const profundidade = profundidades.get(regiao.id);
    if (!porProfundidade.has(profundidade)) porProfundidade.set(profundidade, []);
    porProfundidade.get(profundidade).push(regiao);
  }

  for (const [profundidade, grupo] of [...porProfundidade.entries()].sort((a, b) => a[0] - b[0])) {
    grupo.forEach((regiao, indice) => {
      layout.set(regiao.id, {
        x: profundidade * (LARGURA_REGIAO_BASE + GAP_HORIZONTAL_REGIOES),
        y: indice * (ALTURA_REGIAO_BASE + GAP_VERTICAL_REGIOES) -
          ((grupo.length - 1) * (ALTURA_REGIAO_BASE + GAP_VERTICAL_REGIOES)) / 2,
        largura: LARGURA_REGIAO_BASE,
        altura: ALTURA_REGIAO_BASE,
      });
    });
  }

  if (isoladas) {
    const maiorProfundidade = Math.max(0, ...profundidades.values());
    layout.set(isoladas.id, {
      x: (maiorProfundidade + 2) * (LARGURA_REGIAO_BASE + GAP_HORIZONTAL_REGIOES),
      y: 0,
      largura: LARGURA_REGIAO_BASE,
      altura: ALTURA_REGIAO_BASE,
    });
  }

  return layout;
}

export function organizarSalasNaRegiao(regiao, salas, gap = 48, grafo = null) {
  const regular = organizarGradeRegional(regiao, salas, gap, false);
  if (!grafo || regular.salas.size < 3) return regular;
  const serpentina = organizarGradeRegional(regiao, salas, gap, true);
  const comprimento = grade => grafo.arestas.reduce((total, aresta) => {
    const a = grade.salas.get(aresta.origem);
    const b = grade.salas.get(aresta.destino);
    return !a || !b ? total : total +
      Math.abs(a.x + a.largura / 2 - b.x - b.largura / 2) +
      Math.abs(a.y + a.altura / 2 - b.y - b.altura / 2);
  }, 0);
  // A serpentina evita voltar à margem oposta em cadeias que mudam de fileira.
  return comprimento(serpentina) < comprimento(regular) ? serpentina : regular;
}

function organizarGradeRegional(regiao, salas, gap, serpentina) {
  const salasPorNome = new Map(
    (salas ?? []).map(sala => [sala.nome, sala])
  );

  const membros = (regiao?.funcoes ?? [])
    .map(nome => salasPorNome.get(nome))
    .filter(Boolean);

  if (!membros.length) {
    return {
      salas: new Map(),
      largura: 0,
      altura: 0,
    };
  }

  const quantidadeColunas = Math.ceil(Math.sqrt(membros.length));
  const colunaDaSala = indice => serpentina && Math.floor(indice / quantidadeColunas) % 2
    ? quantidadeColunas - 1 - indice % quantidadeColunas : indice % quantidadeColunas;
  const quantidadeLinhas = Math.ceil(
    membros.length / quantidadeColunas
  );

  const largurasColunas = Array(quantidadeColunas).fill(0);
  const alturasLinhas = Array(quantidadeLinhas).fill(0);

  membros.forEach((sala, indice) => {
    const coluna = colunaDaSala(indice);
    const linha = Math.floor(indice / quantidadeColunas);

    largurasColunas[coluna] = Math.max(
      largurasColunas[coluna],
      sala.largura
    );

    alturasLinhas[linha] = Math.max(
      alturasLinhas[linha],
      sala.altura
    );
  });

  const offsetsX = [];
  let x = 0;

  for (const largura of largurasColunas) {
    offsetsX.push(x);
    x += largura + gap;
  }

  const offsetsY = [];
  let y = 0;

  for (const altura of alturasLinhas) {
    offsetsY.push(y);
    y += altura + gap;
  }

  const resultado = new Map();

  membros.forEach((sala, indice) => {
    const coluna = colunaDaSala(indice);
    const linha = Math.floor(indice / quantidadeColunas);

    resultado.set(sala.nome, {
      ...sala,
      x: offsetsX[coluna] +
        (largurasColunas[coluna] - sala.largura) / 2,
      y: offsetsY[linha] +
        (alturasLinhas[linha] - sala.altura) / 2,
    });
  });

  return {
    salas: resultado,
    largura:
      largurasColunas.reduce((total, largura) => total + largura, 0) +
      gap * Math.max(0, quantidadeColunas - 1),
    altura:
      alturasLinhas.reduce((total, altura) => total + altura, 0) +
      gap * Math.max(0, quantidadeLinhas - 1),
  };
}

const PADDING_REGIAO = 28;
const ALTURA_CABECALHO_REGIAO = 52;
const MARGEM_MUNDO_REGIONAL = 40;
const GAP_REGIOES = 64;
const GAP_CRIPTAS = 112;
const PROPORCAO_CONJUNTO = 1.65;
const PESO_PROPORCAO_PLANTA = 1.4;

function distribuirTerritorios(alcancaveis, hub, entrada, isoladas, dimensoes, colunas) {
  const quantidade = alcancaveis.length + (hub ? 1 : 0);
  const linhas = Math.ceil(quantidade / colunas);
  const colunaCentral = Math.floor(colunas / 2);
  const linhaCentral = Math.floor(linhas / 2);
  const grade = [];
  let proxima = 0;
  const quantidadeCentral = hub ? Math.min(colunas, quantidade) : 0;
  const restantes = quantidade - quantidadeCentral;
  const outrasLinhas = linhas - (hub ? 1 : 0);
  let linhaSecundaria = 0;

  for (let linha = 0; linha < linhas; linha++) {
    const central = hub && linha === linhaCentral;
    const ocupadas = central ? quantidadeCentral :
      Math.floor(restantes / outrasLinhas) +
      (linhaSecundaria++ < restantes % outrasLinhas ? 1 : 0);

    for (let indice = 0; indice < ocupadas; indice++) {
      const coluna = ocupadas === 1 ? colunaCentral :
        Math.round(indice * (colunas - 1) / (ocupadas - 1));
      const regiao = hub && linha === linhaCentral && coluna === colunaCentral
        ? hub
        : alcancaveis[proxima++];
      if (regiao) grade.push({ regiao, coluna, linha });
    }
  }

  const larguras = Array(colunas).fill(0);
  const alturas = Array(linhas).fill(0);

  for (const { regiao, coluna, linha } of grade) {
    const tamanho = dimensoes.get(regiao.id);
    larguras[coluna] = Math.max(larguras[coluna], tamanho.largura);
    alturas[linha] = Math.max(alturas[linha], tamanho.altura);
  }

  const offsets = tamanhos => tamanhos.reduce((lista, tamanho, indice) => {
    lista.push(indice ? lista[indice - 1] + tamanhos[indice - 1] + GAP_REGIOES : 0);
    return lista;
  }, []);
  const offsetsX = offsets(larguras);
  const offsetsY = offsets(alturas);
  const basesColunas = Array(colunas).fill(0);
  const territorios = new Map();

  for (const { regiao, coluna, linha } of grade) {
    const tamanho = dimensoes.get(regiao.id);
    territorios.set(regiao.id, {
      ...tamanho,
      x: offsetsX[coluna] + (larguras[coluna] - tamanho.largura) / 2,
      // Sem salão central, cada coluna aproveita a altura real de suas alas.
      // O hub conserva o alinhamento que o mantém cercado pelas outras regiões.
      y: hub ? offsetsY[linha] + (alturas[linha] - tamanho.altura) / 2 : basesColunas[coluna],
    });
    basesColunas[coluna] += tamanho.altura + GAP_REGIOES;
  }

  const largura = larguras.reduce((total, valor) => total + valor, 0) +
    GAP_REGIOES * Math.max(0, colunas - 1);
  const altura = Math.max(0, ...[...territorios.values()].map(item => item.y + item.altura));

  if (entrada) {
    const tamanho = dimensoes.get(entrada.id);
    territorios.set(entrada.id, {
      ...tamanho,
      x: (largura - tamanho.largura) / 2,
      y: quantidade ? altura + GAP_REGIOES : 0,
    });
  }

  if (isoladas) {
    const tamanho = dimensoes.get(isoladas.id);
    const porta = territorios.get(entrada?.id);
    territorios.set(isoladas.id, {
      ...tamanho,
      x: porta
        ? Math.max(porta.x + porta.largura + GAP_CRIPTAS, largura - tamanho.largura)
        : largura + (quantidade ? GAP_CRIPTAS : 0),
      // O afastamento lateral já distingue as Criptas; uma segunda faixa vazia
      // abaixo do conjunto só diminuía as salas na visão Encaixar.
      y: quantidade ? altura + GAP_REGIOES : 0,
    });
  }

  return territorios;
}

function comporTerritorios(alcancaveis, hub, entrada, isoladas, dimensoes, relacoes) {
  const quantidade = alcancaveis.length + (hub ? 1 : 0);
  const limiteColunas = Math.max(1, Math.min(quantidade, Math.ceil(Math.sqrt(quantidade)) * 2));
  let melhor = new Map();
  let menorCusto = Infinity;

  const avaliar = territorios => {
    const retangulos = [...territorios.values()];
    if (!retangulos.length) return 0;
    const largura = Math.max(...retangulos.map(item => item.x + item.largura)) -
      Math.min(...retangulos.map(item => item.x));
    const altura = Math.max(...retangulos.map(item => item.y + item.altura)) -
      Math.min(...retangulos.map(item => item.y));
    let distancia = 0;
    for (const [origem, destinos] of relacoes) {
      const a = territorios.get(origem);
      if (!a) continue;
      for (const destino of destinos) {
        const b = territorios.get(destino);
        if (b) distancia += Math.abs(a.x + a.largura / 2 - b.x - b.largura / 2) +
          Math.abs(a.y + a.altura / 2 - b.y - b.altura / 2);
      }
    }
    // Relações reais influenciam proximidade; significado e membros não mudam.
    const proporcao = hub ? 1.3 : PROPORCAO_CONJUNTO;
    return largura * altura * (1 + PESO_PROPORCAO_PLANTA * Math.abs(Math.log(largura / altura / proporcao))) +
      distancia * Math.sqrt(largura * altura) * 0.18;
  };

  for (let colunas = 1; colunas <= limiteColunas; colunas++) {
    // Uma coluna central mantém o salão entre as alas, independentemente dos títulos.
    if (hub && colunas % 2 === 0) continue;
    let territorios = distribuirTerritorios(
      alcancaveis, hub, entrada, isoladas, dimensoes, colunas
    );
    const retangulos = [...territorios.values()];
    if (!retangulos.length) return melhor;
    let custo = avaliar(territorios);
    const ordem = [...alcancaveis];
    // Compare plantas já organizadas: uma ordem inicial ruim não deve eliminar
    // uma grade compacta antes de aproximar as regiões que possuem chamadas.
    for (let passagem = 0; passagem < 2; passagem++) {
      for (let i = 0; i < ordem.length; i++) {
        for (let j = i + 1; j < ordem.length; j++) {
          [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
          const candidato = distribuirTerritorios(ordem, hub, entrada, isoladas, dimensoes, colunas);
          const novoCusto = avaliar(candidato);
          if (novoCusto < custo) { territorios = candidato; custo = novoCusto; }
          else [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
        }
      }
    }

    if (custo < menorCusto) {
      melhor = territorios;
      menorCusto = custo;
    }
  }

  return melhor;
}

export function calcularLayoutRegionalCompleto(regioes, grafo, salas) {
  if (!regioes?.length) {
    return {
      territorios: new Map(),
      salas: new Map(),
      larguraMundo: 560,
      alturaMundo: 480,
    };
  }

  const internos = new Map();
  const dimensoes = new Map();

  for (const regiao of regioes) {
    const interno = organizarSalasNaRegiao(regiao, salas, 48, grafo);
    internos.set(regiao.id, interno);

    dimensoes.set(regiao.id, {
      largura: Math.max(
        LARGURA_REGIAO_BASE,
        interno.largura + PADDING_REGIAO * 2
      ),
      altura: Math.max(
        ALTURA_REGIAO_BASE,
        interno.altura +
          PADDING_REGIAO * 2 +
          ALTURA_CABECALHO_REGIAO
      ),
    });
  }

  const profundidades = calcularProfundidadesRegioes(regioes, grafo);

  const entrada =
    regioes.find(regiao => regiao.tipo === 'entrada') ?? null;

  const hub =
    regioes.find(regiao =>
      regiao.tipo === 'hub' &&
      profundidades.has(regiao.id)
    ) ?? null;

  const isoladas =
    regioes.find(regiao => regiao.tipo === 'isoladas') ?? null;

  const ordemOriginal = new Map(
    regioes.map((regiao, indice) => [regiao.id, indice])
  );

  const alcancaveis = regioes
    .filter(regiao =>
      profundidades.has(regiao.id) &&
      regiao.id !== entrada?.id &&
      regiao.id !== hub?.id &&
      regiao.id !== isoladas?.id
    )
    .sort((a, b) =>
      profundidades.get(a.id) - profundidades.get(b.id) ||
      ordemOriginal.get(a.id) - ordemOriginal.get(b.id)
    );

  const territoriosBrutos = comporTerritorios(
    alcancaveis, hub, entrada, isoladas, dimensoes, construirRelacoesRegioes(regioes, grafo)
  );

  if (!territoriosBrutos.size) {
    return {
      territorios: new Map(),
      salas: new Map(),
      larguraMundo: 560,
      alturaMundo: 480,
    };
  }

  const esquerda = Math.min(
    ...[...territoriosBrutos.values()].map(item => item.x)
  );

  const topo = Math.min(
    ...[...territoriosBrutos.values()].map(item => item.y)
  );

  const deslocamentoX = MARGEM_MUNDO_REGIONAL - esquerda;
  const deslocamentoY = MARGEM_MUNDO_REGIONAL - topo;

  const territorios = new Map();

  for (const [id, territorio] of territoriosBrutos) {
    territorios.set(id, {
      ...territorio,
      x: territorio.x + deslocamentoX,
      y: territorio.y + deslocamentoY,
    });
  }

  const salasFinais = new Map();

  for (const regiao of regioes) {
    const territorio = territorios.get(regiao.id);
    const interno = internos.get(regiao.id);

    if (!territorio || !interno?.salas.size) continue;

    const larguraUtil =
      territorio.largura - PADDING_REGIAO * 2;

    const deslocamentoInternoX =
      (larguraUtil - interno.largura) / 2;

    for (const [nome, sala] of interno.salas) {
      salasFinais.set(nome, {
        ...sala,
        x:
          territorio.x +
          PADDING_REGIAO +
          deslocamentoInternoX +
          sala.x,
        y:
          territorio.y +
          PADDING_REGIAO +
          ALTURA_CABECALHO_REGIAO +
          sala.y,
      });
    }
  }

  const direita = Math.max(
    ...[...territorios.values()].map(
      item => item.x + item.largura
    )
  );

  const base = Math.max(
    ...[...territorios.values()].map(
      item => item.y + item.altura
    )
  );

  return {
    territorios,
    salas: salasFinais,
    larguraMundo: Math.max(
      560,
      direita + MARGEM_MUNDO_REGIONAL
    ),
    alturaMundo: Math.max(
      480,
      base + MARGEM_MUNDO_REGIONAL
    ),
  };
}
const MARGEM_ENVELOPE = 20;

// Envelope arquitetônico decorativo. As salas e os caminhos mantêm sua geometria.
export function calcularFormaTerritorio(territorio, salas) {
  const { x, y, largura, altura } = territorio;
  if (!salas.length) return { faixas: [], paredes: [] };
  const topoSalas = Math.min(...salas.map(sala => sala.y)) - MARGEM_ENVELOPE;
  const base = Math.min(y + altura, Math.max(...salas.map(sala => sala.y + sala.altura)) + MARGEM_ENVELOPE);
  const cortes = [...new Set([y, topoSalas, base, ...salas.flatMap(sala =>
    [Math.max(topoSalas, sala.y - MARGEM_ENVELOPE), Math.min(base, sala.y + sala.altura + MARGEM_ENVELOPE)])])]
    .filter(valor => valor >= y && valor <= base).sort((a, b) => a - b);
  const faixas = [];
  for (let i = 0; i < cortes.length - 1; i++) {
    const inicio = cortes[i];
    const fim = cortes[i + 1];
    const presentes = salas.filter(sala => sala.y - MARGEM_ENVELOPE < fim && sala.y + sala.altura + MARGEM_ENVELOPE > inicio);
    // O cabeçalho e os intervalos entre fileiras unem o envelope, não a navegação.
    const esquerda = inicio < topoSalas || !presentes.length ? x + 12
      : Math.max(x, Math.min(...presentes.map(sala => sala.x)) - MARGEM_ENVELOPE);
    const direita = inicio < topoSalas || !presentes.length ? x + largura - 12
      : Math.min(x + largura, Math.max(...presentes.map(sala => sala.x + sala.largura)) + MARGEM_ENVELOPE);
    faixas.push({ x: esquerda, y: inicio, largura: direita - esquerda, altura: fim - inicio });
  }
  const paredes = [];
  const horizontal = (inicio, fim, py) => {
    if (fim > inicio) paredes.push({ x: inicio, y: py - 4, largura: fim - inicio, altura: 8 });
  };
  faixas.forEach((faixa, i) => {
    const direita = faixa.x + faixa.largura;
    paredes.push({ x: faixa.x - 4, y: faixa.y, largura: 8, altura: faixa.altura },
      { x: direita - 4, y: faixa.y, largura: 8, altura: faixa.altura });
    const anterior = faixas[i - 1];
    if (!anterior) horizontal(faixa.x, direita, faixa.y);
    else {
      horizontal(Math.min(faixa.x, anterior.x), Math.max(faixa.x, anterior.x), faixa.y);
      horizontal(Math.min(direita, anterior.x + anterior.largura),
        Math.max(direita, anterior.x + anterior.largura), faixa.y);
    }
    if (i === faixas.length - 1) horizontal(faixa.x, direita, faixa.y + faixa.altura);
  });
  return { faixas, paredes };
}
