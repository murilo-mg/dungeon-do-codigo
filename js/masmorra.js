// Responsável por transformar a lista de funções analisadas
// em salas posicionadas geometricamente ao redor da sala inicial (main).

const RAIO_DISTRIBUICAO = 170;
const CENTRO_X = 280;
const CENTRO_Y = 240;

export function construirMasmorra(funcoes) {
  if (funcoes.length === 0) return [];

  const funcaoPrincipal = encontrarFuncaoPrincipal(funcoes);
  const relacoes = calcularRelacoesEntreFuncoes(funcoes, funcaoPrincipal);
  const outrasFuncoes = funcoes.filter(funcao => funcao !== funcaoPrincipal);
  const quantidade = outrasFuncoes.length || 1;

  const salas = [
    criarSalaInicial(
      funcaoPrincipal,
      relacoes.get(funcaoPrincipal.nome)
    ),
  ];

  outrasFuncoes.forEach((funcao, indice) => {
    salas.push(
      criarSalaSecundaria(
        funcao,
        indice,
        quantidade,
        funcaoPrincipal,
        relacoes.get(funcao.nome)
      )
    );
  });

  return salas;
}

function encontrarFuncaoPrincipal(funcoes) {
  const indiceMain = funcoes.findIndex(funcao => funcao.nome === 'main');
  return indiceMain >= 0 ? funcoes[indiceMain] : funcoes[0];
  function calcularRelacoesEntreFuncoes(funcoes, funcaoPrincipal) {
  const funcoesPorNome = new Map(
    funcoes.map(funcao => [funcao.nome, funcao])
  );

  const relacoes = new Map(
    funcoes.map(funcao => [
      funcao.nome,
      {
        chamadaPor: [],
        profundidade: null,
      },
    ])
  );

  funcoes.forEach(funcao => {
    for (const nomeChamado of funcao.chamadas ?? []) {
      if (!funcoesPorNome.has(nomeChamado)) continue;

      const relacao = relacoes.get(nomeChamado);

      if (!relacao.chamadaPor.includes(funcao.nome)) {
        relacao.chamadaPor.push(funcao.nome);
      }
    }
  });

  relacoes.get(funcaoPrincipal.nome).profundidade = 0;

  const fila = [funcaoPrincipal.nome];

  for (let indice = 0; indice < fila.length; indice++) {
    const nomeAtual = fila[indice];
    const funcaoAtual = funcoesPorNome.get(nomeAtual);
    const profundidadeAtual = relacoes.get(nomeAtual).profundidade;

    for (const nomeChamado of funcaoAtual.chamadas ?? []) {
      const relacaoChamada = relacoes.get(nomeChamado);

      if (!relacaoChamada) continue;
      if (relacaoChamada.profundidade !== null) continue;

      relacaoChamada.profundidade = profundidadeAtual + 1;
      fila.push(nomeChamado);
    }
  }

  return relacoes;
}
}

function calcularRelacoesEntreFuncoes(funcoes, funcaoPrincipal) {
  const funcoesPorNome = new Map(
    funcoes.map(funcao => [funcao.nome, funcao])
  );

  const relacoes = new Map(
    funcoes.map(funcao => [
      funcao.nome,
      {
        chamadaPor: [],
        profundidade: null,
      },
    ])
  );

  funcoes.forEach(funcao => {
    for (const nomeChamado of funcao.chamadas ?? []) {
      if (!funcoesPorNome.has(nomeChamado)) continue;

      const relacao = relacoes.get(nomeChamado);

      if (!relacao.chamadaPor.includes(funcao.nome)) {
        relacao.chamadaPor.push(funcao.nome);
      }
    }
  });

  relacoes.get(funcaoPrincipal.nome).profundidade = 0;

  const fila = [funcaoPrincipal.nome];

  for (let indice = 0; indice < fila.length; indice++) {
    const nomeAtual = fila[indice];
    const funcaoAtual = funcoesPorNome.get(nomeAtual);
    const profundidadeAtual = relacoes.get(nomeAtual).profundidade;

    for (const nomeChamado of funcaoAtual.chamadas ?? []) {
      const relacaoChamada = relacoes.get(nomeChamado);

      if (!relacaoChamada) continue;
      if (relacaoChamada.profundidade !== null) continue;

      relacaoChamada.profundidade = profundidadeAtual + 1;
      fila.push(nomeChamado);
    }
  }

  return relacoes;
}

function criarSalaInicial(funcaoPrincipal, relacao) {
  return {
    ...funcaoPrincipal,
    chamadaPor: relacao.chamadaPor,
    profundidade: relacao.profundidade,
    ehSalaInicial: true,
    x: CENTRO_X - 45,
    y: CENTRO_Y - 40,
    largura: 90,
    altura: 80,
  };
}

function criarSalaSecundaria(
  funcao,
  indice,
  quantidade,
  funcaoPrincipal,
  relacao
) {
  const angulo = (indice / quantidade) * Math.PI * 2 - Math.PI / 2;
  const tamanho = tamanhoPorComplexidade(funcao.complexidade);
  const posicaoX = CENTRO_X + Math.cos(angulo) * RAIO_DISTRIBUICAO - tamanho / 2;
  const posicaoY = CENTRO_Y + Math.sin(angulo) * RAIO_DISTRIBUICAO - tamanho / 2;

return {
  ...funcao,
  chamadaPor: relacao.chamadaPor,
  profundidade: relacao.profundidade,
  ehSalaInicial: false,
  x: posicaoX,
  y: posicaoY,
  largura: tamanho,
  altura: tamanho,
  ehChamadaPelaPrincipal: relacao.chamadaPor.includes(funcaoPrincipal.nome),
};
}

export function tamanhoPorComplexidade(complexidade) {
  if (complexidade <= 2) return 60;
  if (complexidade <= 6) return 80;
  return 105;
}

export function corPorSala(sala) {
  if (sala.ehSalaInicial) return '#c9a227';
  if (sala.complexidade <= 2) return '#5a7d3a';
  if (sala.complexidade <= 6) return '#c2601a';
  return '#8f2323';
}
