// Responsável exclusivamente pela renderização em canvas e pela física do jogador.
// Não manipula DOM diretamente: notifica mudanças de sala por callback.

import { corPorSala } from './masmorra.js';
import { criarPersonagem, atualizarPersonagem, desenharPassos, desenharPersonagem } from './personagem.js';

const POSICAO_INICIAL_JOGADOR = { x: 280, y: 240 };

let contexto = null;
let canvas = null;
let salas = [];
let jogador = null;
let salaAtual = null;
let teclasPressionadas = {};
let idQuadroAnimacao = null;
let funcaoDeNotificacao = null;
let instanteAnterior = null;
let preferenciaMovimento = null;
const TECLAS_MOVIMENTO = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']);

export function iniciarJogo(novasSalas, aoMudarDeSala) {
  pararJogo();
  salas = novasSalas;
  const salaInicial = salas.find(sala => sala.ehSalaInicial);
  jogador = criarPersonagem(
    salaInicial ? salaInicial.x + salaInicial.largura / 2 : POSICAO_INICIAL_JOGADOR.x,
    salaInicial ? salaInicial.y + salaInicial.altura / 2 : POSICAO_INICIAL_JOGADOR.y);
  salaAtual = null;
  funcaoDeNotificacao = aoMudarDeSala;
  canvas = document.getElementById('canvas-jogo');
  contexto = canvas.getContext('2d');
  contexto.imageSmoothingEnabled = false;
  preferenciaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  registrarEventosDeTeclado();
  idQuadroAnimacao = requestAnimationFrame(executarCicloDeJogo);
}

export function pararJogo() {
  if (idQuadroAnimacao !== null) {
    cancelAnimationFrame(idQuadroAnimacao);
    idQuadroAnimacao = null;
  }
  removerEventosDeTeclado();
  limparTeclas();
  funcaoDeNotificacao = null;
}

function registrarEventosDeTeclado() {
  window.addEventListener('keydown', marcarTeclaPressionada);
  window.addEventListener('keyup', marcarTeclaLiberada);
  window.addEventListener('blur', limparTeclas);
  document.addEventListener('visibilitychange', limparTeclas);
}

function removerEventosDeTeclado() {
  window.removeEventListener('keydown', marcarTeclaPressionada);
  window.removeEventListener('keyup', marcarTeclaLiberada);
  window.removeEventListener('blur', limparTeclas);
  document.removeEventListener('visibilitychange', limparTeclas);
}

function limparTeclas() {
  teclasPressionadas = {};
  instanteAnterior = null;
}

function marcarTeclaPressionada(evento) {
  const tecla = evento.key.toLowerCase();
  if (!TECLAS_MOVIMENTO.has(tecla) || evento.ctrlKey || evento.metaKey || evento.altKey) return;
  if (evento.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  evento.preventDefault();
  teclasPressionadas[tecla] = true;
}

function marcarTeclaLiberada(evento) {
  delete teclasPressionadas[evento.key.toLowerCase()];
}

function executarCicloDeJogo(instante) {
  // Limita saltos ao retomar uma aba ou após um quadro lento.
  const segundos = instanteAnterior === null ? 0 : Math.min((instante - instanteAnterior) / 1000, 0.05);
  instanteAnterior = instante;
  atualizarPersonagem(jogador, calcularDirecaoDoMovimento(), segundos,
    { largura: canvas.width, altura: canvas.height }, preferenciaMovimento.matches);
  atualizarSalaAtualSeNecessario();
  desenharCena();
  idQuadroAnimacao = requestAnimationFrame(executarCicloDeJogo);
}

function calcularDirecaoDoMovimento() {
  let x = 0;
  let y = 0;
  if (teclasPressionadas['arrowup'] || teclasPressionadas['w']) y -= 1;
  if (teclasPressionadas['arrowdown'] || teclasPressionadas['s']) y += 1;
  if (teclasPressionadas['arrowleft'] || teclasPressionadas['a']) x -= 1;
  if (teclasPressionadas['arrowright'] || teclasPressionadas['d']) x += 1;
  return { x, y };
}

function atualizarSalaAtualSeNecessario() {
  const salaEncontrada = detectarSalaSobJogador();
  if (salaEncontrada === salaAtual) return;

  salaAtual = salaEncontrada;
  if (funcaoDeNotificacao) funcaoDeNotificacao(salaAtual);
}

function detectarSalaSobJogador() {
  return salas.find(sala =>
    jogador.x >= sala.x && jogador.x <= sala.x + sala.largura &&
    jogador.y >= sala.y && jogador.y <= sala.y + sala.altura
  ) || null;
}

function desenharCena() {
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.fillStyle = '#181410';
  contexto.fillRect(0, 0, canvas.width, canvas.height);

  desenharCorredores();
  salas.forEach(desenharSala);
  desenharPassos(contexto, jogador);
  desenharPersonagem(contexto, jogador, preferenciaMovimento.matches);
}

function desenharCorredores() {
  const salaInicial = salas.find(sala => sala.ehSalaInicial);
  if (!salaInicial) return;

  contexto.strokeStyle = '#332a1f';
  contexto.lineWidth = 10;
  salas.forEach(sala => {
    if (sala.ehSalaInicial) return;
    contexto.beginPath();
    contexto.moveTo(salaInicial.x + salaInicial.largura / 2, salaInicial.y + salaInicial.altura / 2);
    contexto.lineTo(sala.x + sala.largura / 2, sala.y + sala.altura / 2);
    contexto.stroke();
  });
}

function desenharSala(sala) {
  contexto.fillStyle = corPorSala(sala);
  contexto.globalAlpha = sala === salaAtual ? 1 : 0.85;
  contexto.fillRect(sala.x, sala.y, sala.largura, sala.altura);
  contexto.globalAlpha = 1;

  contexto.strokeStyle = sala === salaAtual ? '#fff5e8' : '#00000055';
  contexto.lineWidth = sala === salaAtual ? 2 : 1;
  contexto.strokeRect(sala.x, sala.y, sala.largura, sala.altura);

  contexto.fillStyle = '#181410';
  contexto.font = '10px JetBrains Mono';
  contexto.textAlign = 'center';
  contexto.fillText(`${sala.nome}()`, sala.x + sala.largura / 2, sala.y + sala.altura / 2 + 3);
}
