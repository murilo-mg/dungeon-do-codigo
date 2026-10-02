import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente, opacidadesPisosChamadas } from './ambiente.js';
import { afastarCamera, aproximarCamera, encaixarMasmorra, focarSala,
  iniciarJogo, pararJogo, restaurarZoomCamera, selecionarModoVisual } from '../js/jogo.js';
import { PALETA } from '../js/pixelArt.js';
import { corPorSala } from '../js/masmorra.js';
import { calcularContextoTopologico, criarGrafo } from '../js/grafoC.js';

const salas = [
  { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { nome: 'outra', complexidade: 4, x: 250, y: 40, largura: 60, altura: 60 },
];
const arestas = [{ origem: 'main', destino: 'outra' }];
const masmorra = { salas, larguraMundo: 560, alturaMundo: 480 };

function clicarNoMapa(ambiente, x, y, detalhe = 1) {
  const canvas = ambiente.elementos.get('canvas-jogo');
  const dados = { clientX: x, clientY: y, button: 0, detail: detalhe };
  ambiente.documento.emitir('pointerdown', {
    ...dados, target: canvas, composedPath: () => [canvas],
  });
  canvas.emitir('click', dados);
  return canvas;
}

test('clique seleciona a sala, troca o foco topológico e ignora área vazia', () => {
  const ambiente = criarAmbiente();
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['A', 'extra'] },
    { nome: 'A', chamadas: ['B'] },
    { nome: 'B', chamadas: [] }, { nome: 'extra', chamadas: [] },
  ]);
  const salasDoClique = [
    { nome: 'main', x: 55, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
    { nome: 'A', x: 170, y: 210, largura: 60, altura: 60 },
    { nome: 'B', x: 300, y: 210, largura: 60, altura: 60 },
    { nome: 'extra', x: 170, y: 320, largura: 60, altura: 60 },
  ].map(sala => ({ complexidade: 0, ...sala }));
  const selecoes = [];
  iniciarJogo({ salas: salasDoClique, larguraMundo: 560, alturaMundo: 480 },
    grafo.arestas, () => {}, undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome, calcularContextoTopologico(grafo, nome));
    });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();

  clicarNoMapa(ambiente, 330, 240);
  ambiente.avancar();
  assert.deepEqual(selecoes, ['B']);
  assert.deepEqual(opacidadesPisosChamadas(canvas, 3), [0.25, 1, 1]);
  assert.deepEqual(canvas.contornos.filter(contorno => contorno.cor === PALETA.ouro)
    .slice(-1).map(contorno => [contorno.x, contorno.y]), [[295, 205]]);

  clicarNoMapa(ambiente, 200, 240);
  ambiente.avancar();
  assert.deepEqual(selecoes, ['B', 'A']);
  assert.deepEqual(opacidadesPisosChamadas(canvas, 3), [0.25, 0.25, 1]);
  assert.deepEqual(canvas.contornos.filter(contorno => contorno.cor === PALETA.ouro)
    .slice(-1).map(contorno => [contorno.x, contorno.y]), [[165, 205]]);

  clicarNoMapa(ambiente, 5, 5);
  ambiente.avancar();
  assert.deepEqual(selecoes, ['B', 'A']);
  assert.deepEqual(opacidadesPisosChamadas(canvas, 3), [1, 1, 1]);
  pararJogo();
});

test('clique converte borda, escala CSS, zoom e câmera em coordenadas da sala', () => {
  const ambiente = criarAmbiente();
  const salaDistante = { nome: 'distante', complexidade: 0, x: 900, y: 200,
    largura: 60, altura: 60 };
  const mundo = { salas: [{ ...salas[0], x: 700 }, salaDistante],
    larguraMundo: 1200, alturaMundo: 480 };
  const selecoes = [];
  iniciarJogo(mundo, [], () => {}, undefined, undefined, nome => {
    selecoes.push(nome);
    return focarSala(nome);
  });
  const canvas = ambiente.elementos.get('canvas-jogo');
  aproximarCamera();
  ambiente.avancar();
  canvas.retangulo = { left: 30, top: 40, width: 282, height: 242 };
  canvas.clientLeft = 1;
  canvas.clientTop = 1;
  canvas.clientWidth = 280;
  canvas.clientHeight = 240;
  const deslocamento = canvas.translacoes.at(-1);
  const escala = canvas.escalas.at(-1).x;
  const x = 31 + (930 + deslocamento.x) * escala / 2;
  const y = 41 + (230 + deslocamento.y) * escala / 2;
  clicarNoMapa(ambiente, x, y);
  assert.deepEqual(selecoes, ['distante']);
  clicarNoMapa(ambiente, 30.5, 40.5);
  assert.deepEqual(selecoes, ['distante']);
  pararJogo();
});

test('duplo clique percorre somente salas e corredores existentes com velocidade contínua', () => {
  const ambiente = criarAmbiente();
  const salasDaRota = [
    { nome: 'main', x: 60, y: 60, largura: 80, altura: 80, complexidade: 0,
      ehSalaInicial: true },
    { nome: 'A', x: 170, y: 70, largura: 60, altura: 60, complexidade: 0 },
    { nome: 'B', x: 170, y: 170, largura: 60, altura: 60, complexidade: 0 },
    { nome: 'isolada', x: 370, y: 70, largura: 60, altura: 60, complexidade: 0 },
  ];
  const mundo = { salas: salasDaRota, larguraMundo: 560, alturaMundo: 480 };
  const arestasDaRota = [{ origem: 'main', destino: 'A' }, { origem: 'A', destino: 'B' }];
  const antes = structuredClone({ mundo, arestasDaRota });
  const selecoes = [];
  iniciarJogo(mundo, arestasDaRota, () => {}, undefined, undefined, nome => {
    selecoes.push(nome);
    return focarSala(nome);
  });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  clicarNoMapa(ambiente, 200, 200, 1);
  clicarNoMapa(ambiente, 200, 200, 2);
  canvas.emitir('dblclick', { clientX: 200, clientY: 200, button: 0, detail: 2 });
  const inicio = canvas.posicoesPersonagem.length;
  ambiente.avancar(90);
  const posicoes = canvas.posicoesPersonagem.slice(inicio);
  assert.deepEqual(selecoes, ['B']);
  assert.ok(posicoes.some(ponto => ponto.x > 120 && ponto.x < 180));
  assert.ok(posicoes.some(ponto => ponto.y > 120 && ponto.y < 180));
  assert.ok(posicoes.every(ponto => Math.abs(ponto.y - 100) <= 1 ||
    Math.abs(ponto.x - 200) <= 1));
  assert.ok(posicoes.every((ponto, indice) => indice === 0 ||
    Math.hypot(ponto.x - posicoes[indice - 1].x,
      ponto.y - posicoes[indice - 1].y) <= 4));
  assert.deepEqual(posicoes.at(-1), { x: 200, y: 200 });
  assert.deepEqual({ mundo, arestasDaRota }, antes);
  pararJogo();
});

test('duplo clique conserva o alvo quando o primeiro clique desloca a câmera', () => {
  const ambiente = criarAmbiente();
  const mundo = { salas: [
    { nome: 'main', x: 60, y: 60, largura: 80, altura: 80, complexidade: 0,
      ehSalaInicial: true },
    { nome: 'longe', x: 400, y: 70, largura: 60, altura: 60, complexidade: 0 },
  ], larguraMundo: 900, alturaMundo: 480 };
  const selecoes = [];
  iniciarJogo(mundo, [{ origem: 'main', destino: 'longe' }], () => {},
    undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome);
    });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  // PointerEvent.detail é zero no navegador, inclusive no segundo pressionamento.
  const dados = { clientX: 430, clientY: 100, button: 0 };
  ambiente.documento.emitir('pointerdown', { ...dados, type: 'pointerdown', detail: 0,
    timeStamp: 100, composedPath: () => [canvas] });
  canvas.emitir('click', { ...dados, detail: 1, timeStamp: 110 });
  ambiente.avancar();
  assert.ok(canvas.translacoes.at(-1).x < 0);
  ambiente.documento.emitir('pointerdown', { ...dados, type: 'pointerdown', detail: 0,
    timeStamp: 200, composedPath: () => [canvas] });
  canvas.emitir('click', { ...dados, detail: 2, timeStamp: 210 });
  canvas.emitir('dblclick', { ...dados, detail: 2 });
  assert.deepEqual(selecoes, ['longe']);
  ambiente.avancar(140);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), { x: 430, y: 100 });
  pararJogo();
});

test('movimento manual já pressionado impede iniciar a rota automática', () => {
  const ambiente = criarAmbiente();
  const mundo = { salas: [
    { nome: 'main', x: 60, y: 60, largura: 80, altura: 80, complexidade: 0,
      ehSalaInicial: true },
    { nome: 'A', x: 170, y: 70, largura: 60, altura: 60, complexidade: 0 },
  ], larguraMundo: 560, alturaMundo: 480 };
  iniciarJogo(mundo, [{ origem: 'main', destino: 'A' }], () => {},
    undefined, undefined, nome => focarSala(nome));
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.janela.emitir('keydown', { key: 'ArrowLeft' });
  clicarNoMapa(ambiente, 200, 100, 1);
  clicarNoMapa(ambiente, 200, 100, 2);
  canvas.emitir('dblclick', { clientX: 200, clientY: 100, button: 0, detail: 2 });
  ambiente.avancar(2);
  assert.ok(canvas.posicoesPersonagem.at(-1).x < 100);
  ambiente.janela.emitir('keyup', { key: 'ArrowLeft' });
  const posicaoParada = canvas.posicoesPersonagem.at(-1);
  ambiente.avancar(20);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicaoParada);
  pararJogo();
});

test('teclado cancela navegação e sala desconectada só é selecionada', () => {
  const ambiente = criarAmbiente();
  const mundo = { salas: [
    { nome: 'main', x: 60, y: 60, largura: 80, altura: 80, complexidade: 0,
      ehSalaInicial: true },
    { nome: 'A', x: 170, y: 70, largura: 60, altura: 60, complexidade: 0 },
    { nome: 'isolada', x: 370, y: 70, largura: 60, altura: 60, complexidade: 0 },
  ], larguraMundo: 560, alturaMundo: 480 };
  const selecoes = [];
  iniciarJogo(mundo, [{ origem: 'main', destino: 'A' }], () => {},
    undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome);
    });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  clicarNoMapa(ambiente, 200, 100, 1);
  clicarNoMapa(ambiente, 200, 100, 2);
  canvas.emitir('dblclick', { clientX: 200, clientY: 100, button: 0, detail: 2 });
  ambiente.avancar(10);
  const antesDoTeclado = canvas.posicoesPersonagem.at(-1).x;
  ambiente.janela.emitir('keydown', { key: 'ArrowLeft' });
  ambiente.avancar();
  assert.ok(canvas.posicoesPersonagem.at(-1).x < antesDoTeclado);
  ambiente.janela.emitir('keyup', { key: 'ArrowLeft' });
  const posicaoParada = canvas.posicoesPersonagem.at(-1);
  ambiente.avancar(30);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicaoParada);

  clicarNoMapa(ambiente, 400, 100, 1);
  clicarNoMapa(ambiente, 400, 100, 2);
  canvas.emitir('dblclick', { clientX: 400, clientY: 100, button: 0, detail: 2 });
  const antesDaIsolada = canvas.posicoesPersonagem.at(-1);
  ambiente.avancar(30);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), antesDaIsolada);
  assert.equal(selecoes.at(-1), 'isolada');

  ambiente.janela.emitir('keydown', { key: 'ArrowDown' });
  ambiente.avancar(50);
  ambiente.janela.emitir('keyup', { key: 'ArrowDown' });
  assert.ok(canvas.posicoesPersonagem.at(-1).y <= 140);
  clicarNoMapa(ambiente, 200, 100, 1);
  clicarNoMapa(ambiente, 200, 100, 2);
  canvas.emitir('dblclick', { clientX: 200, clientY: 100, button: 0, detail: 2 });
  // A parede impede sair da rede; a sala conectada continua acessível.
  ambiente.avancar(120);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), { x: 200, y: 100 });
  assert.equal(selecoes.at(-1), 'A');
  pararJogo();
});

test('foco contextual atenua apenas salas e corredores fora das rotas e restaura ao sair', () => {
  const ambiente = criarAmbiente();
  const funcoes = [
    { nome: 'main', chamadas: ['A', 'B', 'extra'] },
    { nome: 'A', chamadas: ['C'] }, { nome: 'B', chamadas: ['C'] },
    { nome: 'C', chamadas: [] }, { nome: 'extra', chamadas: [] },
    { nome: 'isolada', chamadas: [] },
  ];
  const grafo = criarGrafo(funcoes);
  const salasDoFoco = [
    { nome: 'main', x: 20, y: 100, largura: 90, altura: 80, ehSalaInicial: true },
    { nome: 'A', x: 150, y: 40, largura: 60, altura: 60 },
    { nome: 'B', x: 150, y: 160, largura: 60, altura: 60 },
    { nome: 'C', x: 300, y: 100, largura: 60, altura: 60 },
    { nome: 'extra', x: 300, y: 220, largura: 60, altura: 60 },
    { nome: 'isolada', x: 420, y: 220, largura: 60, altura: 60 },
  ].map(sala => ({ complexidade: 0, ...sala }));
  const mundo = { salas: salasDoFoco, larguraMundo: 560, alturaMundo: 480 };
  iniciarJogo(mundo, grafo.arestas, () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  const opacidadesSalas = () => canvas.preenchimentosSalas.slice(-6)
    .map(sala => sala.opacidade);
  const opacidadesCorredores = () => opacidadesPisosChamadas(canvas, 5);

  ambiente.avancar();
  const salasSemFoco = opacidadesSalas();
  assert.deepEqual(salasSemFoco, [1, 0.85, 0.85, 0.85, 0.85, 0.85]);
  assert.deepEqual(opacidadesCorredores(), [1, 1, 1, 1, 1]);

  focarSala('C', calcularContextoTopologico(grafo, 'C'));
  const contornosAntes = canvas.contornos.length;
  ambiente.avancar();
  assert.deepEqual(opacidadesSalas(), [1, 0.85, 0.85, 0.85, 0.2975, 0.2975]);
  assert.deepEqual(opacidadesCorredores(), [0.25, 1, 1, 1, 1]);
  assert.deepEqual(canvas.contornos.slice(contornosAntes)
    .filter(contorno => contorno.cor === PALETA.ouro)
    .map(({ x, y, opacidade }) => ({ x, y, opacidade })),
    [{ x: salasDoFoco[3].x - 5, y: salasDoFoco[3].y - 5, opacidade: 1 }]);

  selecionarModoVisual('estrutura');
  ambiente.avancar();
  assert.deepEqual(opacidadesSalas(), [1, 0.85, 0.85, 0.85, 0.2975, 0.2975]);
  focarSala('isolada', calcularContextoTopologico(grafo, 'isolada'));
  ambiente.avancar();
  assert.deepEqual(opacidadesSalas(), [0.35, 0.2975, 0.2975, 0.2975, 0.2975, 0.85]);
  assert.deepEqual(opacidadesCorredores(), [0.25, 0.25, 0.25, 0.25, 0.25]);

  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  ambiente.avancar();
  assert.deepEqual(opacidadesSalas(), salasSemFoco);
  assert.deepEqual(opacidadesCorredores(), [1, 1, 1, 1, 1]);

  focarSala('C', calcularContextoTopologico(grafo, 'C'));
  iniciarJogo(mundo, grafo.arestas, () => {});
  ambiente.avancar();
  assert.deepEqual(opacidadesSalas(), salasSemFoco);
  assert.deepEqual(opacidadesCorredores(), [1, 1, 1, 1, 1]);
  pararJogo();
});

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
  const canvas = ambiente.elementos.get('canvas-jogo');
  assert.equal(canvas.ouvintes.get('click').size, 1);
  assert.equal(canvas.ouvintes.get('dblclick').size, 1);
  const atalho = ambiente.janela.emitir('keydown', { key: 'd', ctrlKey: true });
  assert.equal(atalho.prevenido, undefined);
  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
  for (const ouvintes of ambiente.janela.ouvintes.values()) assert.equal(ouvintes.size, 0);
  for (const ouvintes of ambiente.documento.ouvintes.values()) assert.equal(ouvintes.size, 0);
  for (const ouvintes of canvas.ouvintes.values()) assert.equal(ouvintes.size, 0);
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
      { nome: 'longe', complexidade: 0, x: 900, y: 210, largura: 60, altura: 60 },
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

test('zoom inicial, degraus canônicos, limites e retorno a 100%', () => {
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

test('botões saem de Encaixar por degraus sem alterar seleção, personagem ou salas', () => {
  const ambiente = criarAmbiente();
  const mundoAntes = structuredClone(mundoZoom);
  iniciarJogo(mundoZoom, [], () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  const posicaoAntes = canvas.posicoesPersonagem.at(-1);
  focarSala('distante');
  const zoomEncaixe = encaixarMasmorra();
  assert.equal(aproximarCamera(), 0.5);
  assert.equal(aproximarCamera(), 0.75);
  assert.equal(aproximarCamera(), 1);
  assert.equal(afastarCamera(), 0.75);
  assert.equal(afastarCamera(), 0.5);
  assert.equal(afastarCamera(), zoomEncaixe);
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), posicaoAntes);
  assert.ok(canvas.contornos.some(contorno => contorno.x === 1895));
  assert.deepEqual(mundoZoom, mundoAntes);
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
  const translacao = canvas.translacoes.at(-1);
  const zoom = canvas.escalas.at(-1).x;
  assert.deepEqual(canvas.translacoes.slice(-4), Array(4).fill(translacao));
  assert.ok(Math.abs((2400 / 2 + translacao.x) * zoom - canvas.width / 2) < 1e-6);
  assert.ok(Math.abs((1000 / 2 + translacao.y) * zoom - canvas.height / 2) < 1e-6);
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

test('zoom próximo mantém marcadores e Encaixar os oculta até voltar a 100%', () => {
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
  canvas.posicoesCriaturas = [];
  ambiente.avancar();
  assert.deepEqual(canvas.marcadores, []);
  assert.deepEqual(canvas.posicoesCriaturas, []);
  assert.ok(canvas.escalas.at(-1).x < 1);
  restaurarZoomCamera();
  ambiente.avancar();
  assert.deepEqual(canvas.marcadores, desenhoInicial);
  assert.deepEqual(canvas.posicoesCriaturas.at(-1), posicaoCriatura);
  pararJogo();
});

test('níveis semânticos preservam salas, personagem, foco e nome selecionado no mapa', () => {
  const ambiente = criarAmbiente();
  const nomeLongo = 'funcao_com_identificador_extenso';
  const inicial = { ...criarSalaVisual('main', 700), ehSalaInicial: true };
  const destino = criarSalaVisual(nomeLongo, 900, { if: 1 });
  const extra = criarSalaVisual('extra', 1050, { for: 1 });
  const mundo = { salas: [inicial, destino, extra], larguraMundo: 1200, alturaMundo: 480 };
  const grafo = criarGrafo([
    { nome: 'main', chamadas: [nomeLongo, 'extra'] },
    { nome: nomeLongo, chamadas: [] }, { nome: 'extra', chamadas: [] },
  ]);
  const mundoAntes = structuredClone(mundo);
  const grafoAntes = structuredClone(grafo);
  const notificacoes = [];
  iniciarJogo(mundo, grafo.arestas, sala => notificacoes.push(sala?.nome ?? null));
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  const jogadorAntes = canvas.posicoesPersonagem.at(-1);
  assert.ok(canvas.textos.some(item => item.texto.endsWith('…')));

  afastarCamera();
  canvas.textos = [];
  canvas.marcadores = [];
  canvas.posicoesCriaturas = [];
  ambiente.avancar();
  assert.equal(canvas.escalas.at(-1).x, 0.75);
  assert.equal(canvas.textos.length, 3);
  assert.ok(canvas.textos.every(item => item.texto.length * 6 <= 46));
  assert.deepEqual(canvas.marcadores, []);
  assert.deepEqual(canvas.posicoesCriaturas, []);

  afastarCamera();
  canvas.textos = [];
  ambiente.avancar();
  assert.equal(canvas.escalas.at(-1).x, 0.5);
  assert.deepEqual(canvas.textos, []);
  assert.deepEqual(opacidadesPisosChamadas(canvas, 2), [1, 1]);

  focarSala(nomeLongo, calcularContextoTopologico(grafo, nomeLongo));
  canvas.textos = [];
  ambiente.avancar();
  assert.deepEqual(canvas.textos.map(item => item.texto), [`${nomeLongo}()`]);
  assert.deepEqual(opacidadesPisosChamadas(canvas, 2), [0.25, 1]);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), jogadorAntes);
  assert.deepEqual(notificacoes, ['main']);
  assert.deepEqual(mundo, mundoAntes);
  assert.deepEqual(grafo, grafoAntes);
  pararJogo();
});

test('hover usa o hit testing do clique e mostra nome completo sem selecionar ou mover', () => {
  const ambiente = criarAmbiente();
  const inicial = { ...criarSalaVisual('main', 700), ehSalaInicial: true };
  const nomeLongo = 'uma_funcao_com_nome_muito_extenso_mais_um_trecho_para_testar_quebra';
  const destino = criarSalaVisual(nomeLongo, 900);
  const mundo = { salas: [inicial, destino], larguraMundo: 1200, alturaMundo: 480 };
  const selecoes = [];
  iniciarJogo(mundo, [{ origem: 'main', destino: nomeLongo }], () => {},
    undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome);
    });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  afastarCamera();
  afastarCamera();
  ambiente.avancar();
  const jogadorAntes = canvas.posicoesPersonagem.at(-1);
  canvas.retangulo = { left: 30, top: 40, width: 282, height: 242 };
  canvas.clientLeft = 1;
  canvas.clientTop = 1;
  canvas.clientWidth = 280;
  canvas.clientHeight = 240;
  const deslocamento = canvas.translacoes.at(-1);
  const escala = canvas.escalas.at(-1).x;
  const x = 31 + (destino.x + destino.largura / 2 + deslocamento.x) * escala / 2;
  const y = 41 + (destino.y + destino.altura / 2 + deslocamento.y) * escala / 2;
  canvas.emitir('pointermove', { clientX: x, clientY: y, pointerType: 'mouse' });
  canvas.textos = [];
  ambiente.avancar(30);
  const linhas = canvas.textos.slice(-2);
  assert.equal(linhas.map(linha => linha.texto).join(''), `${nomeLongo}()`);
  assert.ok(linhas.every(linha => linha.texto.length * 6 <= 240));
  assert.deepEqual(selecoes, []);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), jogadorAntes);

  canvas.emitir('pointerleave');
  canvas.textos = [];
  ambiente.avancar();
  assert.deepEqual(canvas.textos, []);
  canvas.emitir('pointermove', { clientX: 30.5, clientY: 40.5, pointerType: 'mouse' });
  canvas.textos = [];
  ambiente.avancar();
  assert.deepEqual(canvas.textos, []);
  canvas.emitir('pointerleave');
  assert.equal(canvas.ouvintes.get('pointermove').size, 1);
  pararJogo();
  assert.equal(canvas.ouvintes.get('pointermove').size, 0);
  assert.equal(canvas.ouvintes.get('pointerleave').size, 0);
});

test('clique e duplo clique continuam usando salas reais no zoom distante', () => {
  const ambiente = criarAmbiente();
  const inicial = { ...criarSalaVisual('main', 60), ehSalaInicial: true };
  const destino = criarSalaVisual('destino', 400);
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['destino'] }, { nome: 'destino', chamadas: [] },
  ]);
  const selecoes = [];
  iniciarJogo({ salas: [inicial, destino], larguraMundo: 1200, alturaMundo: 480 },
    grafo.arestas, () => {}, undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome, calcularContextoTopologico(grafo, nome));
    });
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  encaixarMasmorra();
  ambiente.avancar();
  const escala = canvas.escalas.at(-1).x;
  const projecao = canvas.translacoes.at(-1);
  const dados = { clientX: (430 + projecao.x) * escala,
    clientY: (130 + projecao.y) * escala, button: 0, detail: 1 };
  ambiente.documento.emitir('pointerdown', { ...dados, composedPath: () => [canvas] });
  canvas.emitir('click', dados);
  assert.deepEqual(selecoes, ['destino']);
  assert.ok(canvas.posicoesPersonagem.at(-1).x < destino.x);

  // Focar a sala sai da visão geral; reduzir o zoom novamente mantém o alvo clicável.
  afastarCamera();
  afastarCamera();
  ambiente.avancar();
  const deslocamento = canvas.translacoes.at(-1);
  const zoom = canvas.escalas.at(-1).x;
  const x = (430 + deslocamento.x) * zoom;
  const y = (130 + deslocamento.y) * zoom;
  clicarNoMapa(ambiente, x, y, 1);
  clicarNoMapa(ambiente, x, y, 2);
  canvas.emitir('dblclick', { clientX: x, clientY: y, button: 0, detail: 2 });
  ambiente.avancar(150);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), { x: 430, y: 130 });
  assert.deepEqual(selecoes, ['destino', 'destino']);
  pararJogo();
});

test('zoom durante navegação mantém destino, foco e caminhada por corredores', () => {
  const ambiente = criarAmbiente();
  const inicial = { ...criarSalaVisual('main', 60), ehSalaInicial: true };
  const destino = criarSalaVisual('destino', 400);
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['destino'] }, { nome: 'destino', chamadas: [] },
  ]);
  iniciarJogo({ salas: [inicial, destino], larguraMundo: 900, alturaMundo: 480 },
    grafo.arestas, () => {}, undefined, undefined, nome =>
      focarSala(nome, calcularContextoTopologico(grafo, nome)));
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  clicarNoMapa(ambiente, 430, 130, 1);
  clicarNoMapa(ambiente, 430, 130, 2);
  canvas.emitir('dblclick', { clientX: 430, clientY: 130, button: 0, detail: 2 });
  ambiente.avancar(10);
  const antesDoZoom = canvas.posicoesPersonagem.at(-1).x;
  afastarCamera();
  encaixarMasmorra();
  ambiente.avancar(40);
  assert.ok(canvas.posicoesPersonagem.at(-1).x > antesDoZoom);
  assert.ok(canvas.contornos.some(contorno => contorno.cor === PALETA.ouro &&
    contorno.x === destino.x - 5));
  ambiente.avancar(140);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), { x: 430, y: 130 });
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

test('regiões existentes aparecem atrás das conexões e salas em todos os níveis de zoom', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  const contexto = canvas.getContext();
  const ordem = [];
  canvas.getContext = () => contexto;
  for (const [metodo, tipo] of [['fillText', 'titulo'], ['stroke', 'corredor'],
    ['fillRect', 'sala']]) {
    const original = contexto[metodo];
    contexto[metodo] = function(...argumentos) {
      if (tipo !== 'sala' || (argumentos[0] === 40 && argumentos[1] === 160 &&
        argumentos[2] === 80 && argumentos[3] === 80)) ordem.push({ tipo, valor: argumentos[0] });
      return original.apply(this, argumentos);
    };
  }
  const salasComRegioes = [
    { nome: 'main', x: 40, y: 160, largura: 80, altura: 80, ehSalaInicial: true },
    { nome: 'hub', x: 180, y: 160, largura: 80, altura: 80 },
    { nome: 'ala', x: 320, y: 160, largura: 80, altura: 80 },
    { nome: 'isolada', x: 460, y: 160, largura: 80, altura: 80 },
  ].map(sala => ({ complexidade: 0, ...sala }));
  const regioes = [
    { id: 'entrada', tipo: 'entrada', titulo: 'Entrada da Dungeon', funcoes: ['main'] },
    { id: 'hub', tipo: 'hub', titulo: 'Salão Central', funcoes: ['hub'] },
    { id: 'ala:1', tipo: 'ala', titulo: 'Ala 1', funcoes: ['ala'] },
    { id: 'isoladas', tipo: 'isoladas', titulo: 'Criptas Isoladas', funcoes: ['isolada'] },
  ];
  const territoriosRegioes = new Map(regioes.map((regiao, indice) => [regiao.id, {
    x: salasComRegioes[indice].x - 25, y: 80, largura: 130, altura: 190,
  }]));
  const mundo = { salas: salasComRegioes, regioes, territoriosRegioes,
    larguraMundo: 1000, alturaMundo: 480 };
  const titulos = () => regioes.map(regiao => {
    const territorio = territoriosRegioes.get(regiao.id);
    return canvas.textos.filter(item => item.x === territorio.x + territorio.largura / 2 &&
      item.y < 130 && !/^\d+ salas?$/.test(item.texto)).map(item => item.texto).join(' ');
  });
  const antes = structuredClone(mundo);
  const grafo = criarGrafo([
    { nome: 'main', chamadas: ['hub'] }, { nome: 'hub', chamadas: [] },
    { nome: 'ala', chamadas: [] }, { nome: 'isolada', chamadas: [] },
  ]);
  const selecoes = [];
  iniciarJogo(mundo, grafo.arestas, () => {},
    undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome, calcularContextoTopologico(grafo, nome));
    });
  ambiente.avancar();
  assert.deepEqual(titulos(), regioes.map(regiao => regiao.titulo));
  assert.ok(ordem.findIndex(item => item.tipo === 'corredor') <
    ordem.findIndex(item => item.tipo === 'sala'));
  assert.ok(ordem.findIndex(item => item.tipo === 'sala') <
    ordem.findIndex(item => item.tipo === 'titulo'));
  const placaProxima = canvas.textos.find(item => item.texto === 'Salão Central');
  const pisosEntrada = canvas.preenchimentosSalas.filter(item =>
    item.cor === PALETA.ouro &&
    item.x < salasComRegioes[0].x &&
    item.y < salasComRegioes[0].y &&
    item.largura > salasComRegioes[0].largura &&
    item.altura > salasComRegioes[0].altura
  );
  assert.equal(pisosEntrada.length, 1);
  assert.ok(
    pisosEntrada[0].x + pisosEntrada[0].largura >
    salasComRegioes[0].x + salasComRegioes[0].largura
  );

  afastarCamera();
  canvas.textos = [];
  ambiente.avancar();
  assert.deepEqual(titulos(), regioes.map(regiao => regiao.titulo));
  encaixarMasmorra();
  canvas.textos = [];
  ambiente.avancar();
  const tituloDistante = canvas.textos.find(
    item => item.texto === 'Salão Central');
  assert.deepEqual(titulos(), regioes.map(regiao => regiao.titulo));
  assert.equal(tituloDistante.x, placaProxima.x);
  assert.equal(tituloDistante.opacidade, 1);
  assert.ok(tituloDistante.y < salasComRegioes[1].y);
  const projecao = canvas.translacoes.at(-1);
  clicarNoMapa(ambiente, (80 + projecao.x) * canvas.escalas.at(-1).x,
    (200 + projecao.y) * canvas.escalas.at(-1).x);
  canvas.textos = [];
  ambiente.avancar();
  assert.deepEqual(selecoes, ['main']);
  assert.ok(canvas.contornos.some(item => item.cor === PALETA.ouro && item.x === 35));
  assert.deepEqual(titulos(), regioes.map(regiao => regiao.titulo));
  assert.deepEqual(mundo, antes);
  iniciarJogo({ salas: [salasComRegioes[0]], larguraMundo: 560, alturaMundo: 480 },
    [], () => {});
  canvas.textos = [];
  ambiente.avancar();
  assert.equal(canvas.textos.some(item => regioes.some(regiao =>
    regiao.titulo === item.texto)), false);
  pararJogo();
});

test('título de região fora da câmera não aparece até Encaixar mostrar a região', () => {
  const ambiente = criarAmbiente();
  const distante = { nome: 'distante', x: 800, y: 160,
    largura: 80, altura: 80, complexidade: 0 };
  iniciarJogo({ salas: [salas[0], distante], larguraMundo: 1000, alturaMundo: 480,
    regioes: [{ id: 'isoladas', tipo: 'isoladas', titulo: 'Criptas Isoladas',
      funcoes: ['distante'] }] }, [], () => {});
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.avancar();
  assert.equal(canvas.textos.some(item => item.texto.startsWith('Criptas')), false);
  encaixarMasmorra();
  canvas.textos = [];
  ambiente.avancar();
  const titulo = canvas.textos.find(item => item.texto.startsWith('Criptas'));
  assert.ok(titulo);
  assert.ok(titulo.texto.endsWith('…')); // O fallback tem espaço menor que um território regional.
  assert.ok(titulo.x >= distante.x && titulo.x <= distante.x + distante.largura);
  pararJogo();
});
