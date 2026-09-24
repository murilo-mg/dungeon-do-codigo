// DOM e ciclo de vida das animações do painel, independentes do ciclo do jogo.
import { obterCriatura, desenharCriatura } from './criaturas.js';

const TAMANHO_MAXIMO_TRECHO = 500;
const MILISSEGUNDOS_POR_LETRA = 18;
let idAnimacaoPainel = null;
let concluirAnimacao = null;
let preferenciaMovimento = null;

export function exibirTelaDeJogo() {
  document.getElementById('tela-entrada').style.display = 'none';
  document.getElementById('area-jogo').style.display = 'flex';
}

export function atualizarEstadoControles(ativos) {
  const indicador = document.getElementById('status-indicador');
  const texto = document.getElementById('status-controles-texto');

  indicador.className =
    ativos
      ? 'status-indicador ativo'
      : 'status-indicador';

  texto.textContent = ativos
    ? 'Exploração ativa · WASD / setas · Esc libera'
    : 'Clique no mapa para explorar · WASD / setas';
}

export function exibirTelaDeConfiguracao() {
  cancelarAnimacaoPainel();

  document.getElementById('area-jogo').style.display = 'none';
  document.getElementById('tela-entrada').style.display = 'flex';

  document.getElementById('entrada-codigo').focus({
    preventScroll: true,
  });
}

function cancelarAnimacaoPainel() {
  if (idAnimacaoPainel !== null) cancelAnimationFrame(idAnimacaoPainel);
  idAnimacaoPainel = null;
  preferenciaMovimento?.removeEventListener('change', aoMudarPreferencia);
  preferenciaMovimento = null;
  concluirAnimacao = null;
}

function aoMudarPreferencia(evento) {
  if (evento.matches) concluirAnimacao?.();
}

function criarElemento(tipo, classe, texto) {
  const elemento = document.createElement(tipo);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function criarEstatistica(rotulo, valor) {
  const linha = criarElemento('div', 'linha-estatistica', `${rotulo}: `);
  linha.append(criarElemento('b', '', String(valor)));
  return linha;
}

export function descreverSala(sala) {
  const observacao = sala.complexidade <= 2 ? 'Uma sala tranquila para começar a exploração.'
    : sala.complexidade <= 6 ? 'Há mais caminhos de decisão para investigar aqui.'
      : 'Esta sala merece atenção: o índice indica mais complexidade para explorar.';
  const estruturas = sala.estruturasControle == null
    ? 'total de estruturas de controle indisponível'
    : `${sala.estruturasControle} estrutura(s) de controle`;
  return `${sala.nome}() tem ${sala.linhas} linha(s) de corpo e ${estruturas}. ${observacao}`;
}

export function atualizarPainelDeSala(sala, estrutura = null) {
  cancelarAnimacaoPainel();
  const painelInfo = document.getElementById('info-sala');
  painelInfo.replaceChildren();
  if (!sala) {
    painelInfo.append(criarElemento('p', 'vazio', 'Ande até uma sala para inspecionar a função.'));
    return;
  }

  const criatura = obterCriatura(sala.complexidade);
  const cabecalho = criarElemento('div', 'cabecalho-criatura');
  const retrato = criarElemento('canvas', 'retrato-criatura');
  retrato.width = 80;
  retrato.height = 80;
  retrato.setAttribute('role', 'img');
  retrato.setAttribute('aria-label', criatura.nome);
  const contexto = retrato.getContext('2d');
  contexto.imageSmoothingEnabled = false;
  desenharCriatura(contexto, sala.complexidade, 40, 40, 4);
  const identidade = criarElemento('div', 'identidade-criatura');
  identidade.append(criarElemento('h4', 'nome-funcao', `${sala.nome}()`),
    criarElemento('p', 'nome-criatura', criatura.nome));
  cabecalho.append(retrato, identidade);

  const textoDescricao = descreverSala(sala);
  const descricao = criarElemento('p', 'descricao-sala');
  // O leitor de tela recebe a frase inteira, sem anúncios a cada letra.
  descricao.setAttribute('aria-hidden', 'true');
  const descricaoAcessivel = criarElemento('p', 'somente-leitor', textoDescricao);
  const perigo = criarElemento('div', 'perigo-sala');
  const rotuloPerigo = criarEstatistica('Nível de perigo', criatura.nivel);
  const barra = criarElemento('div', 'barra-perigo');
  barra.setAttribute('role', 'meter');
  barra.setAttribute('aria-label', 'Nível de perigo');
  barra.setAttribute('aria-valuemin', '0');
  barra.setAttribute('aria-valuemax', '2');
  barra.setAttribute('aria-valuenow', String(sala.complexidade <= 2 ? 0 : sala.complexidade <= 6 ? 1 : 2));
  barra.setAttribute('aria-valuetext', `${criatura.nivel}; índice de complexidade ${sala.complexidade}`);
  const preenchimento = criarElemento('span', 'preenchimento-perigo');
  preenchimento.style.backgroundColor = criatura.cor;
  preenchimento.style.transform = 'scaleX(0)';
  barra.append(preenchimento);
  perigo.append(rotuloPerigo, barra, criarElemento('p', 'nota-perigo', `Índice de complexidade: ${sala.complexidade}`));

  const codigo = criarElemento('pre', 'codigo-funcao', sala.textoCompleto.slice(0, TAMANHO_MAXIMO_TRECHO)
    + (sala.textoCompleto.length > TAMANHO_MAXIMO_TRECHO ? '\n...' : ''));
  painelInfo.append(cabecalho, descricao, descricaoAcessivel,
    criarEstatistica('Linhas de corpo', sala.linhas),
    criarEstatistica('Complexidade', sala.complexidade));
  if (estrutura) {
    painelInfo.append(criarEstatistica('Profundidade',
      estrutura.profundidade ?? 'Não alcançável a partir da entrada'));
  }
  painelInfo.append(criarSecao('Estruturas', 'estruturas-funcao',
    sala.estruturasControle == null ? 'Informação não disponível'
      : sala.estruturasControle === 0 ? 'Nenhuma estrutura de controle'
        : `${sala.estruturasControle} estrutura(s) de controle (total)`));
  if (estrutura) {
    painelInfo.append(
      criarListaDeFuncoes('Chamada por', 'callers-funcao', estrutura.callers,
        estrutura.ehEntrada ? 'Entrada do programa' : 'Nenhuma chamada conhecida'),
      criarListaDeFuncoes('Chama', 'callees-funcao', estrutura.callees,
        'Nenhuma função conhecida'),
      criarSecao('Caminho desde a entrada', 'caminho-funcao',
        estrutura.caminho ? estrutura.caminho.map(nome => `${nome}()`).join(' → ')
          : 'Não alcançável a partir da entrada'));
  }
  const secaoCodigo = criarSecao('Código', 'trecho-funcao');
  secaoCodigo.append(codigo);
  painelInfo.append(perigo, secaoCodigo);
  animarPainel(descricao, textoDescricao, preenchimento, criatura.preenchimento);
}

function criarSecao(titulo, classe, texto) {
  const secao = criarElemento('section', `secao-inspector ${classe}`);
  secao.append(criarElemento('h4', 'titulo-inspector', titulo));
  if (texto !== undefined) secao.append(criarElemento('p', classe, texto));
  return secao;
}

function criarListaDeFuncoes(titulo, classe, nomes, mensagemVazia) {
  const secao = criarSecao(titulo, classe);
  if (nomes.length === 0) {
    secao.append(criarElemento('p', classe, mensagemVazia));
  } else {
    const lista = criarElemento('ul', classe);
    for (const nome of nomes) lista.append(criarElemento('li', '', `${nome}()`));
    secao.append(lista);
  }
  return secao;
}

function animarPainel(descricao, texto, preenchimento, valor) {
  preferenciaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  concluirAnimacao = () => {
    descricao.textContent = texto;
    descricao.classList.remove('digitando');
    preenchimento.style.transform = `scaleX(${valor / 100})`;
    cancelarAnimacaoPainel();
  };
  if (preferenciaMovimento.matches) {
    concluirAnimacao();
    return;
  }
  preferenciaMovimento.addEventListener('change', aoMudarPreferencia);
  descricao.classList.add('digitando');
  let inicio = null;
  function escrever(instante) {
    if (inicio === null) inicio = instante;
    else preenchimento.style.transform = `scaleX(${valor / 100})`;
    const quantidade = Math.floor((instante - inicio) / MILISSEGUNDOS_POR_LETRA);
    descricao.textContent = texto.slice(0, quantidade);
    if (quantidade >= texto.length) {
      concluirAnimacao();
      return;
    }
    idAnimacaoPainel = requestAnimationFrame(escrever);
  }
  idAnimacaoPainel = requestAnimationFrame(escrever);
}
