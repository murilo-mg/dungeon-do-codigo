// Responsável exclusivamente pela renderização em canvas e pela física do jogador.
// Não manipula DOM diretamente: notifica mudanças de sala por callback.

import { criarCenario, desenharFundo, desenharDecoracoes } from './cenario.js';
import { criarSegmentosDeCorredores } from './corredores.js';
import { calcularRotaCaminhavel } from './navegacaoMasmorra.js';
import { atualizarCamera, criarCamera, definirZoom, encaixarCamera,
  zoomParaEncaixar } from './camera.js';
import { proximoZoomDiscreto } from './zoomDiscreto.js';
import { GLIFOS_MARCADORES, PALETA, desenharPixels } from './pixelArt.js';
import { obterEstiloVisualDaSala, obterMarcadoresEstruturais,
  obterNivelDetalhe } from './semanticaVisual.js';
import { desenharCriatura } from './criaturas.js';
import { criarParticulasDeEntrada, atualizarParticulas, desenharParticulas } from './efeitos.js';
import { criarPersonagem, atualizarPersonagem, desenharPassos, desenharPersonagem,
  VELOCIDADE_PERSONAGEM } from './personagem.js';

const POSICAO_INICIAL_JOGADOR = { x: 280, y: 240 };
const CORES_MARCADORES = { 1: PALETA.pergaminho };
const CORES_MARCADORES_DESTACADOS = { 1: PALETA.pedraEscura };
const MARGEM_ETIQUETA = 8;
const ESPACAMENTO_ETIQUETA = 6;
const ALTURA_LINHA_ETIQUETA = 14;
const LARGURA_MAXIMA_ETIQUETA = 240;

let funcaoDeNotificacaoControles = null;
let contexto = null;
let canvas = null;
let salas = [];
let jogador = null;
let salaAtual = null;
let salaSelecionada = null;
let contextoTopologico = null;
let teclasPressionadas = {};
let idQuadroAnimacao = null;
let funcaoDeNotificacao = null;
let funcaoDeNotificacaoZoom = null;
let funcaoDeSelecao = null;
let instanteAnterior = null;
let preferenciaMovimento = null;
let tempoCena = 0;
let particulas = [];
let primeiraDeteccao = true;
let controlesAtivos = false;
let cenario = null;
let segmentosDeCorredores = [];
let rotaAutomatica = null;
let ultimoCliqueEmSala = null;
let posicaoPonteiro = null;
let camera = null;
let modoCamera = 'jogador';
let modoVisual = 'complexidade';
let larguraMundo = 560;
let alturaMundo = 480;
const TECLAS_MOVIMENTO = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']);

export function iniciarJogo(
  novaMasmorra,
  novasArestas,
  aoMudarDeSala,
  aoMudarControles,
  aoMudarZoom,
  aoSelecionarSala
) {
  pararJogo();

  salas = novaMasmorra.salas;
  larguraMundo = novaMasmorra.larguraMundo;
  alturaMundo = novaMasmorra.alturaMundo;
  segmentosDeCorredores = criarSegmentosDeCorredores(salas, novasArestas);

  funcaoDeNotificacao = aoMudarDeSala;
  funcaoDeNotificacaoControles = aoMudarControles;
  funcaoDeNotificacaoZoom = aoMudarZoom;
  funcaoDeSelecao = aoSelecionarSala;

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
  salaSelecionada = null;
  contextoTopologico = null;
  rotaAutomatica = null;
  ultimoCliqueEmSala = null;
  posicaoPonteiro = null;
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
  modoCamera = 'jogador';
  modoVisual = 'complexidade';

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
  rotaAutomatica = null;
  ultimoCliqueEmSala = null;
  posicaoPonteiro = null;
  camera = null;
  modoCamera = 'jogador';
  modoVisual = 'complexidade';
  salaSelecionada = null;
  contextoTopologico = null;
  salaAtual = null;
  jogador = null;
  larguraMundo = 560;
  alturaMundo = 480;
  alterarEstadoControles(false);
  funcaoDeNotificacaoControles = null;
  funcaoDeNotificacao = null;
  funcaoDeNotificacaoZoom = null;
  funcaoDeSelecao = null;
}

export function focarSala(nome, contexto = null) {
  if (!camera) return null;
  const sala = salas.find(candidata => candidata.nome === nome);
  if (!sala) return null;
  if (modoCamera === 'visao-geral') {
    camera = definirZoom(camera, 1);
    funcaoDeNotificacaoZoom?.(camera.zoom);
  }
  salaSelecionada = sala;
  contextoTopologico = contexto;
  rotaAutomatica = null;
  modoCamera = 'sala';
  camera = atualizarCamera(camera, {
    x: sala.x + sala.largura / 2,
    y: sala.y + sala.altura / 2,
  });
  return sala;
}

export function selecionarModoVisual(modo) {
  if (modo === 'complexidade' || modo === 'estrutura') modoVisual = modo;
  return modoVisual;
}

function mudarZoom(novaCamera) {
  if (!camera) return 1;
  camera = novaCamera;
  modoCamera = rotaAutomatica ? 'jogador' : salaSelecionada ? 'sala' : 'jogador';
  atualizarAlvoCamera();
  return camera.zoom;
}

export function aproximarCamera() {
  return mudarZoom(camera ? definirZoom(camera,
    proximoZoomDiscreto(camera.zoom, zoomParaEncaixar(camera), 1)) : null);
}

export function afastarCamera() {
  return mudarZoom(camera ? definirZoom(camera,
    proximoZoomDiscreto(camera.zoom, zoomParaEncaixar(camera), -1)) : null);
}

export function restaurarZoomCamera() {
  return mudarZoom(camera ? definirZoom(camera, 1) : null);
}

export function encaixarMasmorra() {
  if (!camera) return 1;
  camera = encaixarCamera(camera);
  modoCamera = 'visao-geral';
  return camera.zoom;
}

function atualizarAlvoCamera() {
  if (modoCamera === 'visao-geral') return;
  const alvo = modoCamera === 'sala' && salaSelecionada
    ? { x: salaSelecionada.x + salaSelecionada.largura / 2,
      y: salaSelecionada.y + salaSelecionada.altura / 2 }
    : jogador;
  camera = atualizarCamera(camera, alvo);
}

function registrarEventosDeTeclado() {
  window.addEventListener('keydown', marcarTeclaPressionada);
  window.addEventListener('keyup', marcarTeclaLiberada);
  window.addEventListener('blur', limparTeclas);
  document.addEventListener('pointerdown', atualizarFocoDoJogo, true);
  document.addEventListener('visibilitychange', limparTeclas);
  canvas.addEventListener('click', selecionarSalaClicada);
  canvas.addEventListener('dblclick', navegarParaSalaClicada);
  canvas.addEventListener('pointermove', atualizarPonteiroNoMapa);
  canvas.addEventListener('pointerleave', limparPonteiroNoMapa);
}

function removerEventosDeTeclado() {
  window.removeEventListener('keydown', marcarTeclaPressionada);
  window.removeEventListener('keyup', marcarTeclaLiberada);
  window.removeEventListener('blur', limparTeclas);
  document.removeEventListener('visibilitychange', limparTeclas);
  document.removeEventListener('pointerdown', atualizarFocoDoJogo, true);
  canvas?.removeEventListener('click', selecionarSalaClicada);
  canvas?.removeEventListener('dblclick', navegarParaSalaClicada);
  canvas?.removeEventListener('pointermove', atualizarPonteiroNoMapa);
  canvas?.removeEventListener('pointerleave', limparPonteiroNoMapa);
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
  const salaClicada = clicouNoMapa ? salaDoClique(evento) : null;
  if (!salaClicada) ultimoCliqueEmSala = null;

  alterarEstadoControles(clicouNoMapa);

  if (clicouNoMapa) {
    if (!salaClicada) {
      if (modoCamera === 'visao-geral') {
        camera = definirZoom(camera, 1);
        funcaoDeNotificacaoZoom?.(camera.zoom);
      }
      modoCamera = 'jogador';
      rotaAutomatica = null;
      if (salaSelecionada) {
        salaSelecionada = null;
        contextoTopologico = null;
        funcaoDeNotificacao?.(salaAtual);
      }
    }
    canvas.focus({ preventScroll: true });
  } else {
    canvas.blur();
  }
}

function salaDoClique(evento) {
  if (evento.detail >= 2 && ultimoCliqueEmSala &&
    Math.hypot(evento.clientX - ultimoCliqueEmSala.x,
      evento.clientY - ultimoCliqueEmSala.y) <= 5) return ultimoCliqueEmSala.sala;
  return detectarSalaClicada(evento);
}

function detectarSalaClicada(evento) {
  if (!camera) return null;
  const ponto = pontoInternoDoCanvas(evento);
  if (!ponto) return null;
  const x = camera.x + ponto.x / camera.zoom;
  const y = camera.y + ponto.y / camera.zoom;
  return salas.find(sala => x >= sala.x && x <= sala.x + sala.largura &&
    y >= sala.y && y <= sala.y + sala.altura) ?? null;
}

function pontoInternoDoCanvas(evento) {
  if (!Number.isFinite(evento.clientX) || !Number.isFinite(evento.clientY)) return null;
  const retangulo = canvas.getBoundingClientRect();
  const bordaX = canvas.clientLeft ?? 0;
  const bordaY = canvas.clientTop ?? 0;
  const largura = canvas.clientWidth || retangulo.width - bordaX * 2;
  const altura = canvas.clientHeight || retangulo.height - bordaY * 2;
  if (largura <= 0 || altura <= 0) return null;
  const x = evento.clientX - retangulo.left - bordaX;
  const y = evento.clientY - retangulo.top - bordaY;
  if (x < 0 || y < 0 || x > largura || y > altura) return null;
  return { x: x * canvas.width / largura, y: y * canvas.height / altura };
}

function atualizarPonteiroNoMapa(evento) {
  if (evento.pointerType === 'touch') return;
  posicaoPonteiro = { clientX: evento.clientX, clientY: evento.clientY };
}

function limparPonteiroNoMapa() {
  posicaoPonteiro = null;
}

function selecionarSalaClicada(evento) {
  if (evento.button !== undefined && evento.button !== 0) return;
  const sala = salaDoClique(evento);
  if (evento.detail !== 2) ultimoCliqueEmSala = sala
    ? { sala, x: evento.clientX, y: evento.clientY } : null;
  if (sala && (evento.detail !== 2 || sala !== salaSelecionada))
    funcaoDeSelecao?.(sala.nome);
}

function navegarParaSalaClicada(evento) {
  if (evento.button !== undefined && evento.button !== 0) return;
  const sala = salaDoClique(evento);
  ultimoCliqueEmSala = null;
  if (!sala || (sala !== salaSelecionada && !funcaoDeSelecao?.(sala.nome))) return;
  rotaAutomatica = calcularRotaCaminhavel(salas, segmentosDeCorredores, jogador, sala.nome);
  if (!rotaAutomatica) return;
  const direcaoManual = calcularDirecaoDoMovimento();
  if (direcaoManual.x || direcaoManual.y) {
    rotaAutomatica = null;
    return;
  }
  modoCamera = 'jogador';
  atualizarAlvoCamera();
}

function limparTeclas() {
  teclasPressionadas = {};
  instanteAnterior = null;
  rotaAutomatica = null;
}

function marcarTeclaPressionada(evento) {
  const tecla = evento.key.toLowerCase();

  if (tecla === 'escape' && controlesAtivos) {
    alterarEstadoControles(false);
    canvas.blur();
    return;
  }

  if (evento.target?.closest?.('input, textarea, [contenteditable="true"]')) return;
  if (!TECLAS_MOVIMENTO.has(tecla) || evento.ctrlKey || evento.metaKey || evento.altKey) return;
  if (!controlesAtivos) return;

  evento.preventDefault();
  rotaAutomatica = null;
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
  if (rotaAutomatica) atualizarNavegacaoAutomatica(segundos);
  else atualizarPersonagem(jogador, calcularDirecaoDoMovimento(), segundos,
    { largura: larguraMundo, altura: alturaMundo }, preferenciaMovimento.matches);
  atualizarAlvoCamera();
  atualizarSalaAtualSeNecessario();
  primeiraDeteccao = false;
  desenharCena();
  idQuadroAnimacao = requestAnimationFrame(executarCicloDeJogo);
}

function atualizarNavegacaoAutomatica(segundos) {
  let restante = segundos;
  const limites = { largura: larguraMundo, altura: alturaMundo };
  while (rotaAutomatica?.length && restante > 0) {
    const alvo = rotaAutomatica[0];
    const direcao = { x: alvo.x - jogador.x, y: alvo.y - jogador.y };
    const distancia = Math.hypot(direcao.x, direcao.y);
    if (distancia < 1e-6) {
      rotaAutomatica.shift();
      continue;
    }
    const duracao = Math.min(restante, distancia / VELOCIDADE_PERSONAGEM);
    const anterior = { x: jogador.x, y: jogador.y };
    atualizarPersonagem(jogador, direcao, duracao, limites, preferenciaMovimento.matches);
    if (Math.hypot(alvo.x - jogador.x, alvo.y - jogador.y) < 1e-6) rotaAutomatica.shift();
    if (jogador.x === anterior.x && jogador.y === anterior.y) {
      rotaAutomatica = null;
      break;
    }
    restante -= duracao;
  }
  if (!rotaAutomatica?.length) {
    rotaAutomatica = null;
    if (restante > 0) atualizarPersonagem(jogador, { x: 0, y: 0 }, restante,
      limites, preferenciaMovimento.matches);
  }
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
  if (!salaSelecionada) funcaoDeNotificacao?.(salaAtual);
}

function detectarSalaSobJogador() {
  return salas.find(sala =>
    jogador.x >= sala.x && jogador.x <= sala.x + sala.largura &&
    jogador.y >= sala.y && jogador.y <= sala.y + sala.altura
  ) || null;
}

function desenharCena() {
  const nivelDetalhe = obterNivelDetalhe(camera.zoom);
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.fillStyle = '#181410';
  contexto.fillRect(0, 0, canvas.width, canvas.height);

  contexto.save();
  contexto.scale(camera.zoom, camera.zoom);
  contexto.translate(camera.x ? -camera.x : 0, camera.y ? -camera.y : 0);
  const tempoAmbiente = preferenciaMovimento.matches ? 0 : tempoCena;
  desenharFundo(contexto, cenario, tempoAmbiente);
  desenharCorredores();
  desenharDecoracoes(contexto, cenario, tempoAmbiente);
  salas.forEach(sala => desenharSala(sala, nivelDetalhe));
  desenharPassos(contexto, jogador);
  desenharParticulas(contexto, particulas);
  desenharPersonagem(contexto, jogador, preferenciaMovimento.matches);
  contexto.restore();
  desenharEtiquetas(nivelDetalhe);
}

function desenharCorredores() {
  contexto.save();
  contexto.strokeStyle = '#332a1f';
  contexto.lineWidth = 10;
  segmentosDeCorredores.forEach(segmento => {
    if (contextoTopologico) {
      contexto.globalAlpha = contextoTopologico.arestas.get(segmento.origem)?.has(segmento.destino)
        ? 1 : 0.25;
    }
    contexto.beginPath();
    contexto.moveTo(segmento.inicio.x, segmento.inicio.y);
    contexto.lineTo(segmento.fim.x, segmento.fim.y);
    contexto.stroke();
  });
  contexto.restore();
}

function desenharSala(sala, nivelDetalhe) {
  const ativa = sala === salaAtual;
  const atenuacao = contextoTopologico && !contextoTopologico.funcoes.has(sala.nome) ? 0.35 : 1;
  const estilo = obterEstiloVisualDaSala(sala, modoVisual);
  const x = Math.round(sala.x);
  const y = Math.round(sala.y);
  contexto.save();
  contexto.fillStyle = estilo.corBase;
  contexto.globalAlpha = (ativa ? 1 : 0.85) * atenuacao;
  contexto.fillRect(x, y, sala.largura, sala.altura);
  if (nivelDetalhe === 'proxima') {
    contexto.globalAlpha = 0.13 * atenuacao;
    contexto.fillStyle = PALETA.pedraEscura;
    for (let linha = 4; linha < sala.altura - 4; linha += 12) {
      contexto.fillRect(x + 4, y + linha, sala.largura - 8, 1);
    }
  }
  contexto.globalAlpha = atenuacao;
  contexto.strokeStyle = '#00000055';
  contexto.lineWidth = 2;
  contexto.strokeRect(x + 1, y + 1, sala.largura - 2, sala.altura - 2);
  if (ativa) {
    contexto.globalAlpha = (preferenciaMovimento.matches ? 0.9
      : 0.7 + Math.sin(tempoCena * 3) * 0.2) * atenuacao;
    contexto.strokeStyle = PALETA.pergaminho;
    contexto.strokeRect(x - 2, y - 2, sala.largura + 4, sala.altura + 4);
    contexto.globalAlpha = atenuacao;
  }
  if (sala === salaSelecionada) {
    contexto.strokeStyle = PALETA.ouro;
    contexto.lineWidth = 2;
    contexto.strokeRect(x - 5, y - 5, sala.largura + 10, sala.altura + 10);
  }
  if (nivelDetalhe !== 'distante') {
    // Faixa separada mantém o nome legível acima da criatura.
    contexto.fillStyle = PALETA.pedraEscura;
    contexto.globalAlpha = 0.85 * atenuacao;
    contexto.fillRect(x + 4, y + 4, sala.largura - 8, 15);
    contexto.globalAlpha = atenuacao;
    contexto.fillStyle = PALETA.pergaminho;
    contexto.font = '10px "JetBrains Mono", monospace';
    contexto.textAlign = 'center';
    let nome = `${sala.nome}()`;
    while (nome.length > 1 && contexto.measureText(nome).width > sala.largura - 14) {
      nome = nome.replace(/…$/, '').slice(0, -1) + '…';
    }
    contexto.fillText(nome, x + sala.largura / 2, y + 15);
  }
  if (nivelDetalhe === 'proxima' && estilo.exibirCriatura) {
    desenharCriatura(contexto, sala.complexidade, x + sala.largura / 2,
      y + sala.altura - 20, 2, preferenciaMovimento.matches ? 0 : tempoCena + sala.x / 100);
  }
  if (nivelDetalhe === 'proxima')
    desenharMarcadoresDaSala(sala, x, y, estilo.destacarMarcadores);
  contexto.restore();
}

function desenharEtiquetas(nivelDetalhe) {
  const salaSobPonteiro = posicaoPonteiro ? detectarSalaClicada(posicaoPonteiro) : null;
  if (nivelDetalhe === 'distante' && salaSelecionada && salaSelecionada !== salaSobPonteiro) {
    const x = (salaSelecionada.x + salaSelecionada.largura / 2 - camera.x) * camera.zoom;
    const y = (salaSelecionada.y - camera.y) * camera.zoom - MARGEM_ETIQUETA;
    if (x >= 0 && x <= canvas.width && y >= -MARGEM_ETIQUETA && y <= canvas.height)
      desenharEtiqueta(salaSelecionada, x, y, true);
  }
  if (salaSobPonteiro) {
    const ponto = pontoInternoDoCanvas(posicaoPonteiro);
    if (ponto) desenharEtiqueta(salaSobPonteiro, ponto.x + MARGEM_ETIQUETA,
      ponto.y + MARGEM_ETIQUETA, salaSobPonteiro === salaSelecionada);
  }
}

function desenharEtiqueta(sala, ancoraX, ancoraY, selecionada) {
  contexto.save();
  contexto.font = '11px "JetBrains Mono", monospace';
  contexto.textAlign = 'left';
  const larguraTexto = Math.min(LARGURA_MAXIMA_ETIQUETA,
    canvas.width - MARGEM_ETIQUETA * 2 - ESPACAMENTO_ETIQUETA * 2);
  const linhas = [];
  let linha = '';
  for (const caractere of `${sala.nome}()`) {
    if (linha && contexto.measureText(linha + caractere).width > larguraTexto) {
      linhas.push(linha);
      linha = caractere;
    } else {
      linha += caractere;
    }
  }
  if (linha) linhas.push(linha);
  const largura = Math.max(...linhas.map(parte => contexto.measureText(parte).width)) +
    ESPACAMENTO_ETIQUETA * 2;
  const altura = linhas.length * ALTURA_LINHA_ETIQUETA + ESPACAMENTO_ETIQUETA * 2;
  const x = Math.max(MARGEM_ETIQUETA,
    Math.min(ancoraX, canvas.width - MARGEM_ETIQUETA - largura));
  const y = Math.max(MARGEM_ETIQUETA,
    Math.min(ancoraY - altura, canvas.height - MARGEM_ETIQUETA - altura));
  contexto.fillStyle = PALETA.pedraEscura;
  contexto.fillRect(x, y, largura, altura);
  contexto.strokeStyle = selecionada ? PALETA.ouro : PALETA.pergaminho;
  contexto.lineWidth = 1;
  contexto.strokeRect(x, y, largura, altura);
  contexto.fillStyle = PALETA.pergaminho;
  linhas.forEach((parte, indice) => contexto.fillText(parte,
    x + ESPACAMENTO_ETIQUETA, y + ESPACAMENTO_ETIQUETA + 10 +
    indice * ALTURA_LINHA_ETIQUETA));
  contexto.restore();
}

function desenharMarcadoresDaSala(sala, x, y, destacar) {
  const { estruturas, chamada } = obterMarcadoresEstruturais(sala);
  estruturas.forEach((marcador, indice) => {
    desenharMarcador(marcador, x + 4, y + 21 + indice * 9, destacar);
  });
  if (chamada) desenharMarcador(chamada, x + sala.largura - 13, y + 21, destacar);
}

function desenharMarcador(marcador, x, y, destacar) {
  contexto.fillStyle = destacar ? PALETA.pergaminho : PALETA.pedraEscura;
  contexto.fillRect(x, y, 9, 8);
  desenharPixels(contexto, GLIFOS_MARCADORES[marcador],
    destacar ? CORES_MARCADORES_DESTACADOS : CORES_MARCADORES, x + 2, y + 1, 1);
}
