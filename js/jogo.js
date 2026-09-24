// Responsável exclusivamente pela renderização em canvas e pela física do jogador.
// Não manipula DOM diretamente: notifica mudanças de sala por callback.

import { corPorSala } from './masmorra.js';
import { criarCenario, desenharFundo, desenharDecoracoes } from './cenario.js';
import { criarSegmentosDeCorredores } from './corredores.js';
import { atualizarCamera, criarCamera } from './camera.js';
import { PALETA } from './pixelArt.js';
import { desenharCriatura } from './criaturas.js';
import { criarParticulasDeEntrada, atualizarParticulas, desenharParticulas } from './efeitos.js';
import { criarPersonagem, atualizarPersonagem, desenharPassos, desenharPersonagem } from './personagem.js';

const POSICAO_INICIAL_JOGADOR = { x: 280, y: 240 };

let funcaoDeNotificacaoControles = null;
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
let tempoCena = 0;
let particulas = [];
let primeiraDeteccao = true;
let controlesAtivos = false;
let cenario = null;
let segmentosDeCorredores = [];
let camera = null;
let larguraMundo = 560;
let alturaMundo = 480;
const TECLAS_MOVIMENTO = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']);

export function iniciarJogo(
  novaMasmorra,
  novasArestas,
  aoMudarDeSala,
  aoMudarControles
) {
  pararJogo();

  salas = novaMasmorra.salas;
  larguraMundo = novaMasmorra.larguraMundo;
  alturaMundo = novaMasmorra.alturaMundo;
  segmentosDeCorredores = criarSegmentosDeCorredores(salas, novasArestas);

  funcaoDeNotificacao = aoMudarDeSala;
  funcaoDeNotificacaoControles = aoMudarControles;

  const salaInicial = salas.find(
    sala => sala.ehSalaInicial
  );

  jogador = criarPersonagem(
    salaInicial
      ? salaInicial.x + salaInicial.largura / 2
      : POSICAO_INICIAL_JOGADOR.x,
    salaInicial
      ? salaInicial.y + salaInicial.altura / 2
      : POSICAO_INICIAL_JOGADOR.y
  );

  salaAtual = null;
  tempoCena = 0;
  particulas = [];
  primeiraDeteccao = true;

  canvas = document.getElementById('canvas-jogo');
  contexto = canvas.getContext('2d');
  contexto.imageSmoothingEnabled = false;
  camera = criarCamera({
    larguraViewport: canvas.width,
    alturaViewport: canvas.height,
    larguraMundo,
    alturaMundo,
  });

  cenario = criarCenario(
    salas,
    larguraMundo,
    alturaMundo,
    segmentosDeCorredores
  );

  preferenciaMovimento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  alterarEstadoControles(false);

  registrarEventosDeTeclado();

  idQuadroAnimacao =
    requestAnimationFrame(executarCicloDeJogo);
}

export function pararJogo() {
  if (idQuadroAnimacao !== null) {
    cancelAnimationFrame(idQuadroAnimacao);
    idQuadroAnimacao = null;
  }
  removerEventosDeTeclado();
  limparTeclas();
  particulas = [];
  segmentosDeCorredores = [];
  camera = null;
  larguraMundo = 560;
  alturaMundo = 480;
  alterarEstadoControles(false);
  funcaoDeNotificacaoControles = null;
  funcaoDeNotificacao = null;
}

function registrarEventosDeTeclado() {
  window.addEventListener('keydown', marcarTeclaPressionada);
  window.addEventListener('keyup', marcarTeclaLiberada);
  window.addEventListener('blur', limparTeclas);
  document.addEventListener('pointerdown', atualizarFocoDoJogo, true);
  document.addEventListener('visibilitychange', limparTeclas);
}

function removerEventosDeTeclado() {
  window.removeEventListener('keydown', marcarTeclaPressionada);
  window.removeEventListener('keyup', marcarTeclaLiberada);
  window.removeEventListener('blur', limparTeclas);
  document.removeEventListener('visibilitychange', limparTeclas);
  document.removeEventListener('pointerdown', atualizarFocoDoJogo, true);
  controlesAtivos = false;
}

function alterarEstadoControles(ativos) {
  if (controlesAtivos === ativos) {
    funcaoDeNotificacaoControles?.(ativos);
    return;
  }

  controlesAtivos = ativos;
  limparTeclas();
  funcaoDeNotificacaoControles?.(ativos);
}

function atualizarFocoDoJogo(evento) {
  const clicouNoMapa = evento.composedPath().includes(canvas);

  alterarEstadoControles(clicouNoMapa);

  if (clicouNoMapa) {
    canvas.focus({ preventScroll: true });
  } else {
    canvas.blur();
  }
}

function limparTeclas() {
  teclasPressionadas = {};
  instanteAnterior = null;
}

function marcarTeclaPressionada(evento) {
  const tecla = evento.key.toLowerCase();

  if (tecla === 'escape' && controlesAtivos) {
    alterarEstadoControles(false);
    canvas.blur();
    return;
  }

  if (!TECLAS_MOVIMENTO.has(tecla) || evento.ctrlKey || evento.metaKey || evento.altKey) return;
  if (!controlesAtivos) return;

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
  tempoCena += segundos;
  particulas = preferenciaMovimento.matches ? [] : atualizarParticulas(particulas, segundos);
  atualizarPersonagem(jogador, calcularDirecaoDoMovimento(), segundos,
    { largura: larguraMundo, altura: alturaMundo }, preferenciaMovimento.matches);
  camera = atualizarCamera(camera, jogador);
  atualizarSalaAtualSeNecessario();
  primeiraDeteccao = false;
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
  if (salaAtual && !primeiraDeteccao && !preferenciaMovimento.matches) {
    particulas = criarParticulasDeEntrada(particulas, jogador.x, jogador.y);
  }
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

  contexto.save();
  contexto.translate(camera.x ? -camera.x : 0, camera.y ? -camera.y : 0);
  const tempoAmbiente = preferenciaMovimento.matches ? 0 : tempoCena;
  desenharFundo(contexto, cenario, tempoAmbiente);
  desenharCorredores();
  desenharDecoracoes(contexto, cenario, tempoAmbiente);
  salas.forEach(desenharSala);
  desenharPassos(contexto, jogador);
  desenharParticulas(contexto, particulas);
  desenharPersonagem(contexto, jogador, preferenciaMovimento.matches);
  contexto.restore();
}

function desenharCorredores() {
  contexto.strokeStyle = '#332a1f';
  contexto.lineWidth = 10;
  segmentosDeCorredores.forEach(segmento => {
    contexto.beginPath();
    contexto.moveTo(segmento.inicio.x, segmento.inicio.y);
    contexto.lineTo(segmento.fim.x, segmento.fim.y);
    contexto.stroke();
  });
}

function desenharSala(sala) {
  const ativa = sala === salaAtual;
  const x = Math.round(sala.x);
  const y = Math.round(sala.y);
  contexto.save();
  contexto.fillStyle = corPorSala(sala);
  contexto.globalAlpha = ativa ? 1 : 0.85;
  contexto.fillRect(x, y, sala.largura, sala.altura);
  contexto.globalAlpha = 0.13;
  contexto.fillStyle = PALETA.pedraEscura;
  for (let linha = 4; linha < sala.altura - 4; linha += 12) {
    contexto.fillRect(x + 4, y + linha, sala.largura - 8, 1);
  }
  contexto.globalAlpha = 1;
  contexto.strokeStyle = '#00000055';
  contexto.lineWidth = 2;
  contexto.strokeRect(x + 1, y + 1, sala.largura - 2, sala.altura - 2);
  if (ativa) {
    contexto.globalAlpha = preferenciaMovimento.matches ? 0.9 : 0.7 + Math.sin(tempoCena * 3) * 0.2;
    contexto.strokeStyle = PALETA.pergaminho;
    contexto.strokeRect(x - 2, y - 2, sala.largura + 4, sala.altura + 4);
    contexto.globalAlpha = 1;
  }
  // Faixa separada mantém o nome legível acima da criatura.
  contexto.fillStyle = PALETA.pedraEscura;
  contexto.globalAlpha = 0.85;
  contexto.fillRect(x + 4, y + 4, sala.largura - 8, 15);
  contexto.globalAlpha = 1;
  contexto.fillStyle = PALETA.pergaminho;
  contexto.font = '10px "JetBrains Mono", monospace';
  contexto.textAlign = 'center';
  let nome = `${sala.nome}()`;
  while (nome.length > 1 && contexto.measureText(nome).width > sala.largura - 14) {
    nome = nome.replace(/…$/, '').slice(0, -1) + '…';
  }
  contexto.fillText(nome, x + sala.largura / 2, y + 15);
  desenharCriatura(contexto, sala.complexidade, x + sala.largura / 2,
    y + sala.altura - 20, 2, preferenciaMovimento.matches ? 0 : tempoCena + sala.x / 100);
  contexto.restore();
}
