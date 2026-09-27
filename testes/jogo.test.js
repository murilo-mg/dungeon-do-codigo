import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';
import { afastarCamera, aproximarCamera, encaixarMasmorra, focarSala,
  iniciarJogo, pararJogo, restaurarZoomCamera, selecionarModoVisual } from '../js/jogo.js';
import { PALETA } from '../js/pixelArt.js';
import { corPorSala } from '../js/masmorra.js';

const salas = [
  { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { nome: 'outra', complexidade: 4, x: 250, y: 40, largura: 60, altura: 60 },
];
const arestas = [{ origem: 'main', destino: 'outra' }];
const masmorra = { salas, larguraMundo: 560, alturaMundo: 480 };

test('só captura movimento depois de clicar no mapa e libera ao clicar fora', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];

  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();

  assert.deepEqual(notificacoes, ['main']);

  // Sem clicar no mapa, o teclado deve continuar livre para a página.
  const antesDoFoco = ambiente.janela.emitir('keydown', { key: 'W' });
  assert.equal(antesDoFoco.prevenido, undefined);

  ambiente.avancar(10);
  assert.deepEqual(notificacoes, ['main']);

  const canvas = ambiente.elementos.get('canvas-jogo');

  // Clica no mapa: agora o jogo assume os controles.
  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  const comFoco = ambiente.janela.emitir('keydown', { key: 'W' });
  assert.equal(comFoco.prevenido, true);

  ambiente.avancar(65);

  assert.deepEqual(notificacoes, ['main', null, 'outra']);

  ambiente.janela.emitir('keyup', { key: 'W' });

  // Clica fora do mapa: devolve as setas para a página.
  ambiente.documento.emitir('pointerdown', {
    target: {},
    composedPath() {
      return [];
    }
  });

  const foraDoMapa = ambiente.janela.emitir('keydown', { key: 'ArrowDown' });
  assert.equal(foraDoMapa.prevenido, undefined);

  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
});

test('Esc libera os controles e o mapa pode ser ativado novamente', () => {
  const ambiente = criarAmbiente();
  const estados = [];
  iniciarJogo(masmorra, arestas, () => {}, estado => estados.push(estado));
  const canvas = ambiente.elementos.get('canvas-jogo');

  assert.deepEqual(estados, [false]);

  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  assert.deepEqual(estados, [false, true]);
  const duranteExploracao = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(duranteExploracao.prevenido, true);

  ambiente.janela.emitir('keydown', { key: 'Escape' });

  assert.deepEqual(estados, [false, true, false]);
  const depoisDoEscape = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(depoisDoEscape.prevenido, undefined);

  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  assert.deepEqual(estados, [false, true, false, true]);
  const depoisDaReativacao = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(depoisDaReativacao.prevenido, true);

  pararJogo();
});

test('reiniciar mantém apenas um ciclo e parar remove todos os eventos', () => {
  const ambiente = criarAmbiente();
  for (let indice = 0; indice < 5; indice++) iniciarJogo(masmorra, arestas, () => {});
  assert.equal(ambiente.pendentes.size, 1);
  assert.equal(ambiente.janela.ouvintes.get('keydown').size, 1);
  const atalho = ambiente.janela.emitir('keydown', { key: 'd', ctrlKey: true });
  assert.equal(atalho.prevenido, undefined);
  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
  for (const ouvintes of ambiente.janela.ouvintes.values()) assert.equal(ouvintes.size, 0);
  for (const ouvintes of ambiente.documento.ouvintes.values()) assert.equal(ouvintes.size, 0);
});

test('ignora digitação em campos e libera movimento quando a aba fica oculta', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const evento = ambiente.janela.emitir('keydown', { key: 'w', target: { closest() { return true; } } });
  assert.equal(evento.prevenido, undefined);
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main']);
  ambiente.janela.emitir('keydown', { key: 'ArrowUp' });
  ambiente.avancar(10);
  ambiente.documento.emitir('visibilitychange');
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main']);
  pararJogo();
});

test('buscar com WASD ou setas não move o personagem mesmo após ativar o mapa', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const campo = ambiente.elementos.get('busca-funcao');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  for (const key of ['w', 'ArrowUp', 'a', 'ArrowLeft']) {
    const evento = ambiente.janela.emitir('keydown', { key, target: campo });
    assert.equal(evento.prevenido, undefined);
  }
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main']);
  pararJogo();
});

test('usa os limites do mundo para alcançar salas além do viewport', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  const masmorraGrande = {
    salas: [
      { nome: 'main', complexidade: 0, x: 700, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
      { nome: 'longe', complexidade: 0, x: 900, y: 200, largura: 60, altura: 60 },
    ],
    larguraMundo: 1200,
    alturaMundo: 480,
  };

  iniciarJogo(
    masmorraGrande,
    [{ origem: 'main', destino: 'longe' }],
    sala => notificacoes.push(sala?.nome ?? null)
  );
  ambiente.avancar();

  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });
  ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  ambiente.avancar(80);
  ambiente.janela.emitir('keyup', { key: 'ArrowRight' });

  assert.deepEqual(notificacoes, ['main', null, 'longe']);
  pararJogo();
});

test('reiniciar com mundo pequeno redefine a transformação da câmera', () => {
  const ambiente = criarAmbiente();
  const mundoGrande = {
    salas: [
      { nome: 'main', complexidade: 0, x: 700, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
    ],
    larguraMundo: 1200,
    alturaMundo: 480,
  };
  const mundoPequeno = {
    salas: [
      { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
    ],
    larguraMundo: 560,
    alturaMundo: 480,
  };

  iniciarJogo(mundoGrande, [], () => {});
  ambiente.avancar();
  assert.notEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1).x, 0);

  iniciarJogo(mundoPequeno, [], () => {});
  ambiente.avancar();
  assert.deepEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1), { x: 0, y: 0 });
  pararJogo();
});

test('foco manual em sala distante preserva personagem, limites e destaque separado', () => {
  const ambiente = criarAmbiente();
  const distante = { nome: 'distante', complexidade: 0, x: 900, y: 200,
    largura: 60, altura: 60 };
  const mundo = { salas: [salas[0], distante], larguraMundo: 1200, alturaMundo: 480 };
  const notificacoes = [];
  iniciarJogo(mundo, [], sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  assert.deepEqual(notificacoes, ['main']);

  assert.equal(focarSala('inexistente'), null);
  assert.equal(focarSala('distante'), distante);
  ambiente.avancar(5);
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.deepEqual(canvas.translacoes.at(-1), { x: -640, y: 0 });
  assert.deepEqual(notificacoes, ['main']);
  assert.ok(canvas.contornos.some(contorno => contorno.x === distante.x - 5
    && contorno.y === distante.y - 5));
  assert.ok(canvas.contornos.some(contorno => contorno.x === salas[0].x - 2
    && contorno.y === salas[0].y - 2));

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.deepEqual(canvas.translacoes.at(-1), { x: 0, y: 0 });
  assert.deepEqual(notificacoes, ['main', 'main']);
  assert.equal(ambiente.janela.emitir('keydown', { key: 'ArrowRight' }).prevenido, true);
  ambiente.janela.emitir('keydown', { key: 'Escape' });
  assert.equal(ambiente.janela.emitir('keydown', { key: 'ArrowRight' }).prevenido,
    undefined);
  pararJogo();
});

test('função isolada pode receber foco e reinício limpa a seleção', () => {
  const ambiente = criarAmbiente();
  const isolada = { nome: 'isolada', complexidade: 0, x: 900, y: 200,
    largura: 60, altura: 60 };
  const mundo = { salas: [salas[0], isolada], larguraMundo: 1200, alturaMundo: 480 };
  iniciarJogo(mundo, [], () => {});
  ambiente.avancar();
  assert.equal(focarSala('isolada'), isolada);
  ambiente.avancar();
  assert.deepEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1),
    { x: -640, y: 0 });

  iniciarJogo(mundo, [], () => {});
  ambiente.avancar();
  assert.deepEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1),
    { x: 0, y: 0 });
  assert.equal(focarSala('inexistente'), null);
  pararJogo();
  assert.equal(focarSala('isolada'), null);
});

test('detecção física continua durante foco manual e reaparece ao retomar exploração', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  assert.equal(focarSala('outra')?.nome, 'outra');
  ambiente.janela.emitir('keydown', { key: 'ArrowUp' });
  ambiente.avancar(65);
  ambiente.janela.emitir('keyup', { key: 'ArrowUp' });
  assert.deepEqual(notificacoes, ['main']);

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  assert.deepEqual(notificacoes, ['main', 'outra']);
  pararJogo();
});

const mundoZoom = { salas: [
  { nome: 'main', complexidade: 0, x: 700, y: 200, largura: 90, altura: 80,
    ehSalaInicial: true },
  { nome: 'distante', complexidade: 0, x: 1900, y: 700, largura: 60, altura: 60 },
], larguraMundo: 2400, alturaMundo: 1000 };

test('zoom inicial, passos de 25%, limites e retorno a 100%', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), { x: 1, y: 1 });
  assert.equal(aproximarCamera(), 1.25);
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), { x: 1.25, y: 1.25 });
  for (let indice = 0; indice < 8; indice++) aproximarCamera();
  assert.equal(aproximarCamera(), 2);
  for (let indice = 0; indice < 12; indice++) afastarCamera();
  assert.equal(afastarCamera(), 560 / 2400);
  assert.equal(restaurarZoomCamera(), 1);
  pararJogo();
});

test('zoom, visão geral e foco de sala não mudam posição física ou sala detectada', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(mundoZoom, [], sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const posicao = canvas.posicoesPersonagem.at(-1);
  aproximarCamera();
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicao);
  encaixarMasmorra();
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicao);
  focarSala('distante');
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicao);
  assert.deepEqual(notificacoes, ['main']);
  pararJogo();
});

test('zoom acompanha jogador ou sala selecionada sem mover o personagem', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const posicao = canvas.posicoesPersonagem.at(-1);
  aproximarCamera();
  ambiente.avancar();
  assert.deepEqual(canvas.translacoes.at(-1), { x: -521, y: -48 });
  focarSala('distante');
  aproximarCamera();
  ambiente.avancar();
  assert.ok(canvas.translacoes.at(-1).x < -1500);
  assert.ok(canvas.translacoes.at(-1).y < -500);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicao);
  pararJogo();
});

test('Encaixar mostra o mundo inteiro e permanece ativo entre quadros', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.equal(encaixarMasmorra(), 560 / 2400);
  ambiente.avancar(4);
  assert.deepEqual(canvas.translacoes.slice(-4), Array(4).fill({ x: 0, y: 0 }));
  assert.deepEqual(canvas.escalas.at(-1), { x: 560 / 2400, y: 560 / 2400 });
  assert.ok(2400 * canvas.escalas.at(-1).x <= canvas.width);
  assert.ok(1000 * canvas.escalas.at(-1).y <= canvas.height);
  assert.deepEqual(canvas.limpezas.at(-1), { x: 0, y: 0, largura: 560, altura: 480 });
  assert.equal(canvas.salvamentos, canvas.restauracoes);
  pararJogo();
});

test('seleção após Encaixar foca sala e preserva destaque e posição do jogador', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const posicao = canvas.posicoesPersonagem.at(-1);
  focarSala('distante');
  encaixarMasmorra();
  ambiente.avancar();
  assert.ok(canvas.contornos.some(contorno => contorno.x === 1895));
  assert.equal(focarSala('distante')?.nome, 'distante');
  ambiente.avancar();
  assert.ok(canvas.translacoes.at(-1).x < 0);
  assert.ok(canvas.contornos.some(contorno => contorno.x === 1895));
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicao);
  pararJogo();
});

test('clique no Canvas sai da visão geral ou do foco e retoma sala física', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(mundoZoom, [], sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  encaixarMasmorra();
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.ok(canvas.translacoes.at(-1).x < 0);
  focarSala('distante');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.equal(notificacoes.at(-1), 'main');
  assert.ok(canvas.translacoes.at(-1).x > -1000);
  pararJogo();
});

test('zoom manual após visão geral volta ao alvo selecionado ou jogador', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  encaixarMasmorra();
  restaurarZoomCamera();
  ambiente.avancar();
  const jogadorX = canvas.translacoes.at(-1).x;
  focarSala('distante');
  encaixarMasmorra();
  restaurarZoomCamera();
  ambiente.avancar();
  assert.ok(canvas.translacoes.at(-1).x < jogadorX);
  pararJogo();
});

test('nova dungeon restaura zoom, seguimento e transforma sem acúmulo', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(mundoZoom, [], () => {});
  focarSala('distante');
  encaixarMasmorra();
  iniciarJogo(mundoZoom, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.deepEqual(canvas.escalas.at(-1), { x: 1, y: 1 });
  assert.ok(canvas.translacoes.at(-1).x > -1000);
  assert.equal(canvas.salvamentos, canvas.restauracoes);
  assert.equal(ambiente.pendentes.size, 1);
  pararJogo();
});

test('mesmo movimento percorre a mesma distância lógica em 100% e 200%', () => {
  const finais = [];
  for (const zoom of [1, 2]) {
    const ambiente = criarAmbiente();
    iniciarJogo(mundoZoom, [], () => {});
    ambiente.avancar();
    const canvas = ambiente.elementos.get('canvas-jogo');
    ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
    if (zoom === 2) for (let indice = 0; indice < 4; indice++) aproximarCamera();
    ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
    ambiente.avancar(30);
    ambiente.janela.emitir('keyup', { key: 'ArrowRight' });
    finais.push(canvas.posicoesPersonagem.at(-1));
    pararJogo();
  }
  assert.deepEqual(finais[0], finais[1]);
});

function criarSalaVisual(nome, x, estruturasPorTipo = {}, ciclo = {}) {
  return { nome, complexidade: 0, x, y: 100, largura: 60, altura: 60,
    estruturasPorTipo, recursivaDireta: false, participaDeCiclo: false, ...ciclo };
}

test('marcadores de todos os tipos e R cabem nas laterais da sala 60x60', () => {
  const ambiente = criarAmbiente();
  const sala = { ...criarSalaVisual('main', 100,
    { if: 2, for: 1, while: 1, switch: 1, case: 3 },
    { recursivaDireta: true, participaDeCiclo: true }), ehSalaInicial: true };
  iniciarJogo({ salas: [sala], larguraMundo: 560, alturaMundo: 480 }, [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.deepEqual(canvas.marcadores, [
    { x: 104, y: 121 }, { x: 104, y: 130 }, { x: 104, y: 139 },
    { x: 104, y: 148 }, { x: 147, y: 121 },
  ]);
  assert.ok(canvas.marcadores.every(({ x, y }) =>
    x >= sala.x && x + 9 <= sala.x + sala.largura &&
    y >= sala.y + 20 && y + 8 <= sala.y + sala.altura));
  assert.deepEqual(canvas.posicoesCriaturas.at(-1), { x: 130, y: 140 });
  assert.ok(canvas.contornos.some(contorno => contorno.x === 98 && contorno.y === 98));
  pararJogo();
});

test('sala sem perfil e case isolado não desenham marcadores', () => {
  const ambiente = criarAmbiente();
  const simples = { ...criarSalaVisual('main', 100), ehSalaInicial: true };
  const somenteCase = criarSalaVisual('caseIsolado', 300, { case: 2 });
  iniciarJogo({ salas: [simples, somenteCase], larguraMundo: 560, alturaMundo: 480 },
    [], () => {});
  ambiente.avancar();
  assert.deepEqual(ambiente.elementos.get('canvas-jogo').marcadores, []);
  pararJogo();
});

test('sala física e sala selecionada mantêm contornos e marcadores próprios', () => {
  const ambiente = criarAmbiente();
  const inicial = { ...criarSalaVisual('main', 100, { if: 1 }), ehSalaInicial: true };
  const distante = criarSalaVisual('distante', 300, { switch: 1 },
    { participaDeCiclo: true });
  iniciarJogo({ salas: [inicial, distante], larguraMundo: 560, alturaMundo: 480 },
    [], () => {});
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.equal(focarSala('distante'), distante);
  canvas.marcadores = [];
  ambiente.avancar();
  assert.deepEqual(canvas.marcadores,
    [{ x: 104, y: 121 }, { x: 304, y: 121 }, { x: 347, y: 121 }]);
  assert.ok(canvas.contornos.some(contorno => contorno.x === 98 && contorno.y === 98));
  assert.ok(canvas.contornos.some(contorno => contorno.x === 295 && contorno.y === 95));
  pararJogo();
});

test('zoom e Encaixar mantêm os marcadores em coordenadas do mundo', () => {
  const ambiente = criarAmbiente();
  const sala = { ...criarSalaVisual('main', 700, { for: 1 },
    { participaDeCiclo: true }), ehSalaInicial: true };
  iniciarJogo({ salas: [sala], larguraMundo: 1200, alturaMundo: 480 }, [], () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  const desenhoInicial = [...canvas.marcadores];
  const posicaoCriatura = canvas.posicoesCriaturas.at(-1);
  aproximarCamera();
  canvas.marcadores = [];
  ambiente.avancar();
  assert.deepEqual(canvas.marcadores, desenhoInicial);
  assert.deepEqual(canvas.posicoesCriaturas.at(-1), posicaoCriatura);
  encaixarMasmorra();
  canvas.marcadores = [];
  ambiente.avancar();
  assert.deepEqual(canvas.marcadores, desenhoInicial);
  assert.deepEqual(canvas.posicoesCriaturas.at(-1), posicaoCriatura);
  assert.ok(canvas.escalas.at(-1).x < 1);
  pararJogo();
});

test('alternância visual preserva geometria, personagem, sala física e marcadores', () => {
  const ambiente = criarAmbiente();
  const inicial = { ...criarSalaVisual('main', 100, { if: 2 },
    { recursivaDireta: true, participaDeCiclo: true }), ehSalaInicial: true };
  const comum = { ...criarSalaVisual('comum', 300, { for: 1, while: 1, switch: 1 }),
    complexidade: 8, participaDeCiclo: true };
  const simples = criarSalaVisual('simples', 450);
  const notificacoes = [];
  iniciarJogo({ salas: [inicial, comum, simples], larguraMundo: 560, alturaMundo: 480 },
    [], sala => notificacoes.push(sala?.nome ?? null));
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  const bases = canvas.preenchimentosSalas.slice(-3);
  assert.deepEqual(bases.map(item => item.cor),
    [corPorSala(inicial), corPorSala(comum), corPorSala(simples)]);
  assert.equal(canvas.posicoesCriaturas.length, 3);
  assert.equal(canvas.marcadores.length, 6);
  const personagem = canvas.posicoesPersonagem.at(-1);
  const contornos = canvas.contornos.length;
  assert.equal(selecionarModoVisual('estrutura'), 'estrutura');
  canvas.marcadoresDestacados = [];
  ambiente.avancar();
  const neutras = canvas.preenchimentosSalas.slice(-3);
  assert.deepEqual(neutras.map(item => item.cor),
    [PALETA.pedraClara, PALETA.pedra, PALETA.pedra]);
  assert.deepEqual(neutras.map(({ x, y, largura, altura }) => ({ x, y, largura, altura })),
    bases.map(({ x, y, largura, altura }) => ({ x, y, largura, altura })));
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), personagem);
  assert.equal(canvas.posicoesCriaturas.length, 3);
  assert.equal(canvas.marcadoresDestacados.length, 6);
  assert.ok(canvas.marcadoresDestacados.every(({ x }) => x < simples.x));
  assert.ok(canvas.contornos.length > contornos);
  assert.deepEqual(notificacoes, ['main']);
  canvas.marcadores = [];
  selecionarModoVisual('complexidade');
  ambiente.avancar();
  assert.equal(canvas.marcadores.length, 6);
  assert.equal(canvas.posicoesCriaturas.length, 6);
  assert.deepEqual(canvas.preenchimentosSalas.slice(-3).map(item => item.cor),
    bases.map(item => item.cor));
  pararJogo();
});

test('troca visual mantém zoom, Encaixar, foco manual e seleção física separados', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(mundoZoom, [], sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const personagem = canvas.posicoesPersonagem.at(-1);
  focarSala('distante');
  encaixarMasmorra();
  ambiente.avancar();
  const escala = canvas.escalas.at(-1);
  const translacao = canvas.translacoes.at(-1);
  selecionarModoVisual('estrutura');
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), escala);
  assert.deepEqual(canvas.translacoes.at(-1), translacao);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), personagem);
  assert.deepEqual(notificacoes, ['main']);
  assert.ok(canvas.contornos.some(contorno => contorno.x === 1895));
  selecionarModoVisual('complexidade');
  ambiente.avancar();
  assert.deepEqual(canvas.escalas.at(-1), escala);
  assert.deepEqual(canvas.translacoes.at(-1), translacao);
  pararJogo();
});

test('nova dungeon e retorno ao editor reiniciam o modo visual', () => {
  const ambiente = criarAmbiente();
  iniciarJogo(masmorra, [], () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.equal(selecionarModoVisual('estrutura'), 'estrutura');
  ambiente.avancar();
  assert.equal(canvas.preenchimentosSalas.at(-1).cor, PALETA.pedra);
  const novaSala = { ...salas[0], nome: 'nova' };
  iniciarJogo({ salas: [novaSala], larguraMundo: 560, alturaMundo: 480 }, [], () => {});
  ambiente.avancar();
  assert.equal(canvas.preenchimentosSalas.at(-1).cor, corPorSala(novaSala));
  selecionarModoVisual('estrutura');
  pararJogo();
  assert.equal(selecionarModoVisual('inválido'), 'complexidade');
  assert.equal(ambiente.pendentes.size, 0);
});
