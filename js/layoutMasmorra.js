// Calcula somente a geometria das salas a partir do grafo e das funções.

const LARGURA_VIEWPORT = 560;
const ALTURA_VIEWPORT = 480;
const MARGEM_EXTERNA = 24;
const GAP_HORIZONTAL = 20;
const GAP_VERTICAL = 20;

export function calcularLayoutMasmorra(grafo, funcoes) {
  if (funcoes.length === 0) {
    return {
      salas: new Map(),
      larguraMundo: LARGURA_VIEWPORT,
      alturaMundo: ALTURA_VIEWPORT,
    };
  }

  const funcaoPrincipal = grafo.nos.get(grafo.entrada).funcao;
  const niveis = agruparPorProfundidade(grafo, funcoes);
  const colunas = [...niveis.entries()]
    .sort(([chaveA], [chaveB]) => {
      if (chaveA === 'isoladas') return 1;
      if (chaveB === 'isoladas') return -1;
      return chaveA - chaveB;
    })
    .map(([, funcoesDoNivel]) => funcoesDoNivel);
  const largurasDasColunas = colunas.map(funcoesDaColuna =>
    Math.max(...funcoesDaColuna.map(funcao =>
      dimensoesDaFuncao(funcao, funcao === funcaoPrincipal).largura
    ))
  );
  const larguraConteudo = soma(largurasDasColunas) +
    GAP_HORIZONTAL * Math.max(0, colunas.length - 1);
  const larguraMundo = Math.max(
    LARGURA_VIEWPORT,
    larguraConteudo + MARGEM_EXTERNA * 2
  );
  const alturasDosNiveis = colunas.map(funcoesDoNivel =>
    alturaDoNivel(funcoesDoNivel, funcaoPrincipal)
  );
  const alturaConteudo = Math.max(...alturasDosNiveis, 0);
  const alturaMundo = Math.max(
    ALTURA_VIEWPORT,
    alturaConteudo + MARGEM_EXTERNA * 2
  );
  const salas = new Map();
  const inicioX = (larguraMundo - larguraConteudo) / 2;
  let x = inicioX;

  colunas.forEach((funcoesDoNivel, indiceColuna) => {
    const larguraColuna = largurasDasColunas[indiceColuna];
    const alturaNivel = alturasDosNiveis[indiceColuna];
    let y = (alturaMundo - alturaNivel) / 2;

    funcoesDoNivel.forEach(funcao => {
      const dimensoes = dimensoesDaFuncao(funcao, funcao === funcaoPrincipal);
      salas.set(funcao.nome, {
        x: x + (larguraColuna - dimensoes.largura) / 2,
        y,
        ...dimensoes,
      });
      y += dimensoes.altura + GAP_VERTICAL;
    });

    x += larguraColuna + GAP_HORIZONTAL;
  });

  return { salas, larguraMundo, alturaMundo };
}

function agruparPorProfundidade(grafo, funcoes) {
  const niveis = new Map();

  funcoes.forEach(funcao => {
    const profundidade = grafo.nos.get(funcao.nome).profundidade;
    const chave = profundidade === null ? 'isoladas' : profundidade;

    if (!niveis.has(chave)) niveis.set(chave, []);
    niveis.get(chave).push(funcao);
  });

  return niveis;
}

function dimensoesDaFuncao(funcao, ehInicial) {
  const tamanho = ehInicial ? 90 : tamanhoPorComplexidade(funcao.complexidade);
  return {
    largura: tamanho,
    altura: ehInicial ? 80 : tamanho,
  };
}

function alturaDoNivel(funcoesDoNivel, funcaoPrincipal) {
  const alturas = funcoesDoNivel.map(funcao =>
    dimensoesDaFuncao(funcao, funcao === funcaoPrincipal).altura
  );
  return soma(alturas) + GAP_VERTICAL * Math.max(0, alturas.length - 1);
}

function soma(valores) {
  return valores.reduce((total, valor) => total + valor, 0);
}

export function tamanhoPorComplexidade(complexidade) {
  if (complexidade <= 2) return 60;
  if (complexidade <= 6) return 80;
  return 105;
}
