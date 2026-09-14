// Responsável por transformar a lista de funções analisadas
// em salas posicionadas geometricamente ao redor da sala inicial (main).

const RAIO_DISTRIBUICAO = 170;
const CENTRO_X = 280;
const CENTRO_Y = 240;

export function construirMasmorra(funcoes) {
  if (funcoes.length === 0) return [];

  const funcaoPrincipal = encontrarFuncaoPrincipal(funcoes);
  const outrasFuncoes = funcoes.filter(funcao => funcao !== funcaoPrincipal);
  const quantidade = outrasFuncoes.length || 1;

  const salas = [criarSalaInicial(funcaoPrincipal)];

  outrasFuncoes.forEach((funcao, indice) => {
    salas.push(criarSalaSecundaria(funcao, indice, quantidade, funcaoPrincipal));
  });

  return salas;
}

function encontrarFuncaoPrincipal(funcoes) {
  const indiceMain = funcoes.findIndex(funcao => funcao.nome === 'main');
  return indiceMain >= 0 ? funcoes[indiceMain] : funcoes[0];
}

function criarSalaInicial(funcaoPrincipal) {
  return {
    ...funcaoPrincipal,
    ehSalaInicial: true,
    x: CENTRO_X - 45,
    y: CENTRO_Y - 40,
    largura: 90,
    altura: 80,
  };
}

function criarSalaSecundaria(funcao, indice, quantidade, funcaoPrincipal) {
  const angulo = (indice / quantidade) * Math.PI * 2 - Math.PI / 2;
  const tamanho = tamanhoPorComplexidade(funcao.complexidade);
  const posicaoX = CENTRO_X + Math.cos(angulo) * RAIO_DISTRIBUICAO - tamanho / 2;
  const posicaoY = CENTRO_Y + Math.sin(angulo) * RAIO_DISTRIBUICAO - tamanho / 2;

  return {
    ...funcao,
    ehSalaInicial: false,
    x: posicaoX,
    y: posicaoY,
    largura: tamanho,
    altura: tamanho,
    ehChamadaPelaPrincipal: funcaoPrincipal.corpo.includes(funcao.nome + '('),
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
