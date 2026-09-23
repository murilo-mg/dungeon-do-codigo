// DOM e ciclo de vida das animações do painel, independentes do ciclo do jogo.
import { obterCriatura, desenharCriatura } from './criaturas.js';

const TAMANHO_MAXIMO_TRECHO = 500;
const MILISSEGUNDOS_POR_LETRA = 18;
let idAnimacaoPainel = null;
let concluirAnimacao = null;
let preferenciaMovimento = null;

export function exibirTelaDeJogo() {
  document.getElementById('painel-configuracao').style.display = 'none';
  document.getElementById('area-jogo').style.display = 'flex';
}

export function exibirTelaDeConfiguracao() {
  cancelarAnimacaoPainel();
  document.getElementById('area-jogo').style.display = 'none';
  document.getElementById('painel-configuracao').style.display = 'block';
  document.getElementById('entrada-codigo').focus({ preventScroll: true });
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
  return `${sala.nome}() tem ${sala.linhas} linha(s) de corpo e ${sala.estruturasControle} estrutura(s) de controle. ${observacao}`;
}

export function atualizarPainelDeSala(sala) {
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
    criarEstatistica('Estruturas de controle', sala.estruturasControle), perigo, codigo);
  animarPainel(descricao, textoDescricao, preenchimento, criatura.preenchimento);
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
