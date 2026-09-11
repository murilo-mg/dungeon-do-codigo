// Responsável pela renderização em canvas e pela física de movimento do jogador.

const VELOCIDADE_JOGADOR = 2.6;
const TAMANHO_JOGADOR = 14;
const POSICAO_INICIAL_JOGADOR = { x: 280, y: 240 };

let contexto = null;
let canvas = null;
let salas = [];
let jogador = { ...POSICAO_INICIAL_JOGADOR };
let salaAtual = null;
let teclasPressionadas = {};
let idQuadroAnimacao = null;

export function iniciarJogo(novasSalas) {
  salas = novasSalas;
  jogador = { ...POSICAO_INICIAL_JOGADOR };
  salaAtual = null;
  canvas = document.getElementById('canvas-jogo');
  contexto = canvas.getContext('2d');

  registrarEventosDeTeclado();
  executarCicloDeJogo();
}

function registrarEventosDeTeclado() {
  window.addEventListener('keydown', marcarTeclaPressionada);
  window.addEventListener('keyup', marcarTeclaLiberada);
}

function marcarTeclaPressionada(evento) {
  teclasPressionadas[evento.key] = true;
}

function marcarTeclaLiberada(evento) {
  teclasPressionadas[evento.key] = false;
}

function executarCicloDeJogo() {
  moverJogador();
  atualizarSalaAtualSeNecessario();
  desenharCena();
  idQuadroAnimacao = requestAnimationFrame(executarCicloDeJogo);
}

function moverJogador() {
  const deslocamento = calcularDirecaoDoMovimento();
  if (deslocamento.x === 0 && deslocamento.y === 0) return;

  const comprimento = Math.hypot(deslocamento.x, deslocamento.y);
  jogador.x += (deslocamento.x / comprimento) * VELOCIDADE_JOGADOR;
  jogador.y += (deslocamento.y / comprimento) * VELOCIDADE_JOGADOR;
  jogador.x = Math.max(6, Math.min(canvas.width - 6, jogador.x));
  jogador.y = Math.max(6, Math.min(canvas.height - 6, jogador.y));
}

function calcularDirecaoDoMovimento() {
  let x = 0;
  let y = 0;
  if (teclasPressionadas['ArrowUp'] || teclasPressionadas['w']) y -= 1;
  if (teclasPressionadas['ArrowDown'] || teclasPressionadas['s']) y += 1;
  if (teclasPressionadas['ArrowLeft'] || teclasPressionadas['a']) x -= 1;
  if (teclasPressionadas['ArrowRight'] || teclasPressionadas['d']) x += 1;
  return { x, y };
}

function atualizarSalaAtualSeNecessario() {
  const salaEncontrada = detectarSalaSobJogador();
  if (salaEncontrada === salaAtual) return;

  salaAtual = salaEncontrada;
  atualizarInformacaoDaSalaAtual(salaAtual);
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
  desenharJogador();
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

function desenharJogador() {
  contexto.fillStyle = '#e9822f';
  contexto.beginPath();
  contexto.arc(jogador.x, jogador.y, TAMANHO_JOGADOR / 2, 0, Math.PI * 2);
  contexto.fill();
  contexto.strokeStyle = '#fff5e8';
  contexto.lineWidth = 1.5;
  contexto.stroke();
}

function corPorSala(sala) {
  if (sala.ehSalaInicial) return '#c9a227';
  if (sala.complexidade <= 2) return '#5a7d3a';
  if (sala.complexidade <= 6) return '#c2601a';
  return '#8f2323';
}

function atualizarInformacaoDaSalaAtual(sala) {
  const painelInfo = document.getElementById('info-sala');
  if (!sala) {
    painelInfo.innerHTML = '<p class="vazio">Ande até uma sala para inspecionar a função.</p>';
    return;
  }
  painelInfo.innerHTML = `<div class="linha-estatistica"><b>${sala.nome}()</b></div>`;
}