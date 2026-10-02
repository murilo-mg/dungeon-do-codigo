import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desenharRedeCorredores, desenharPortaisSalas, desenharAlvenariaSala,
  desenharRochaMusgosa, desenharVegetacao } from '../js/desenhoMasmorra.js';
import { extrairPortasDosCorredores, LARGURA_CORREDOR } from '../js/corredores.js';
import { criarCenario, desenharDecoracoes, desenharFundo } from '../js/cenario.js';

function contextoRegistrado() {
  const operacoes = [], estados = [];
  let pontos = [];
  const ctx = {
    globalAlpha: 1,
    createRadialGradient(...parametros) {
      return { parametros, cores: [], addColorStop(posicao, cor) { this.cores.push({ posicao, cor }); } };
    },
    save() { estados.push({ globalAlpha: this.globalAlpha, fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle, lineWidth: this.lineWidth }); },
    restore() { Object.assign(this, estados.pop()); },
    fillRect(x, y, largura, altura) {
      operacoes.push({ tipo: 'retangulo', x, y, largura, altura,
        cor: this.fillStyle?.cores ? { parametros: this.fillStyle.parametros,
          cores: [...this.fillStyle.cores] } : this.fillStyle, alpha: this.globalAlpha });
    },
    beginPath() { pontos = []; },
    moveTo(x, y) { pontos.push({ x, y, inicio: true }); },
    lineTo(x, y) { pontos.push({ x, y }); },
    stroke() { operacoes.push({ tipo: 'traco', pontos: [...pontos],
      largura: this.lineWidth, cor: this.strokeStyle, alpha: this.globalAlpha }); },
  };
  return { ctx, operacoes };
}

function cobre(op, x, y) {
  if (op.tipo === 'retangulo') return x >= op.x && x < op.x + op.largura &&
    y >= op.y && y < op.y + op.altura;
  return op.pontos.some((b, i) => {
    if (!i || b.inicio) return false;
    const a = op.pontos[i - 1], r = op.largura / 2;
    return x >= Math.min(a.x, b.x) - r && x < Math.max(a.x, b.x) + r &&
      y >= Math.min(a.y, b.y) - r && y < Math.max(a.y, b.y) + r;
  });
}

const opaca = op => op.alpha === 1 && /^#[0-9a-f]{6}$/i.test(op.cor);

test('chamadas no mesmo piso desenham uma única textura e preservam o foco', () => {
  const principal = { origem: 'a', destino: 'b', inicio: { x: 40, y: 100 }, fim: { x: 300, y: 100 } };
  const duplicados = [principal, { ...principal, origem: 'c', destino: 'd',
    inicio: { x: 60, y: 100 }, fim: { x: 220, y: 100 } }];
  const antes = structuredClone(duplicados);
  const desenhar = (segmentos, foco = null) => {
    const { ctx, operacoes } = contextoRegistrado();
    desenharRedeCorredores(ctx, segmentos, [], 1, foco);
    return operacoes;
  };
  const textura = operacoes => operacoes.filter(op => op.tipo === 'retangulo');
  assert.deepEqual(textura(desenhar(duplicados)), textura(desenhar([principal])));
  const foco = { arestas: new Map([['a', new Set(['b'])]]) };
  const pisos = desenhar(duplicados, foco).filter(op => op.tipo === 'traco' && op.cor === '#807963');
  assert.equal(pisos.at(-1).alpha, 1, 'chamada atenuada não cobre a chamada em foco');
  assert.deepEqual(duplicados, antes);
});

test('toda a largura do piso compartilhado cobre pedras internas em ambos os tipos de caminho e zooms', () => {
  const segmentos = [
    { origem: 'a', destino: 'b', inicio: { x: 40, y: 100 }, fim: { x: 300, y: 100 } },
    { id: 'galeria', tipo: 'exploracao', origem: 'c', destino: 'd',
      inicio: { x: 40, y: 106 }, fim: { x: 300, y: 106 } },
  ];
  const antes = structuredClone(segmentos);
  for (const zoom of [0.25, 0.5, 1]) for (const foco of [null, { arestas: new Map() }]) {
    const { ctx, operacoes } = contextoRegistrado();
    desenharRedeCorredores(ctx, segmentos, [], zoom, foco);
    const raio = LARGURA_CORREDOR / 2;
    for (const y of [100 - raio + 1, 100, 100 + raio - 1, 106 + raio - 1]) {
      const ultimo = operacoes.filter(op => opaca(op) && cobre(op, 150, y)).at(-1);
      assert.ok(['#807963', '#345455', '#1c2425'].includes(ultimo.cor),
        `parede decorativa em piso y=${y}, zoom=${zoom}`);
    }
    assert.ok(operacoes.some(op => op.tipo === 'traco' && op.largura === LARGURA_CORREDOR));
    assert.ok(operacoes.some(op => op.cor === '#96b3a6'), 'galeria preserva marcas próprias');
    assert.equal(ctx.globalAlpha, 1);
  }
  assert.deepEqual(segmentos, antes);
});

test('soleiras próximas apagam alvenaria e ombreiras sobre a abertura, inclusive sob foco', () => {
  const salas = [{ nome: 'a', x: 20, y: 20, largura: 60, altura: 60 },
    { nome: 'b', x: 200, y: 20, largura: 60, altura: 60 }];
  const segmentos = [44, 52].map((y, i) => ({ id: String(i), origem: 'a', destino: 'b',
    inicio: { x: 80, y }, fim: { x: 200, y } }));
  const portas = extrairPortasDosCorredores(salas, segmentos);
  for (const foco of [null, { arestas: new Map() }]) {
    const { ctx, operacoes } = contextoRegistrado();
    desenharAlvenariaSala(ctx, salas[0], '#123456', true);
    desenharPortaisSalas(ctx, portas, 0, false, foco);
    for (const x of [77, 80, 83]) for (let y = 44 - LARGURA_CORREDOR / 2 + 1;
      y < 52 + LARGURA_CORREDOR / 2; y++) {
      const ultimo = operacoes.filter(op => opaca(op) && cobre(op, x, y)).at(-1);
      assert.ok(['#807963', '#1c2425'].includes(ultimo.cor), `ombreira em abertura ${x},${y}`);
    }
  }
});

test('acabamento de sala é determinístico, simplifica ao afastar e não muda geometria', () => {
  const sala = { nome: 'a', x: 40, y: 40, largura: 100, altura: 90 };
  const antes = structuredClone(sala);
  const desenhar = detalhar => {
    const { ctx, operacoes } = contextoRegistrado();
    desenharAlvenariaSala(ctx, sala, '#5a7d3a', detalhar);
    return operacoes;
  };
  const proximo = desenhar(true);
  assert.deepEqual(desenhar(true), proximo);
  assert.ok(desenhar(false).length < proximo.length);
  assert.deepEqual(sala, antes);
});

test('rochas e vegetação ficam inteiramente no espaço reservado à decoração', () => {
  for (const detalhar of [false, true]) for (let variacao = 0; variacao < 9; variacao++) {
    for (const [largura, altura] of [[25, 21], [28, 27], [31, 25], [32, 26]]) {
      const rocha = { x: 57, y: 93, largura, altura };
      const { ctx, operacoes } = contextoRegistrado();
      for (const desenhar of [desenharRochaMusgosa, desenharVegetacao])
        desenhar(ctx, rocha, variacao, detalhar);
      for (const op of operacoes) {
        assert.ok(op.largura > 0 && op.altura > 0);
        assert.ok(op.x >= rocha.x && op.x + op.largura <= rocha.x + largura);
        assert.ok(op.y >= rocha.y && op.y + op.altura <= rocha.y + altura);
      }
    }
  }
});

test('ornamentos desenhados deixam livres as salas e os pisos dos corredores', () => {
  const salas = [{ x: 235, y: 200, largura: 90, altura: 80 },
    { x: 250, y: 40, largura: 60, altura: 60 }];
  const segmentos = [
    { inicio: { x: 280, y: 240 }, fim: { x: 280, y: 70 } },
    { inicio: { x: 280, y: 240 }, fim: { x: 470, y: 240 } },
  ];
  const cenario = criarCenario(salas, 560, 480, segmentos);
  const antes = structuredClone(cenario);
  const raio = LARGURA_CORREDOR / 2;
  const pisos = segmentos.map(({ inicio, fim }) => ({
    x: Math.min(inicio.x, fim.x) - raio, y: Math.min(inicio.y, fim.y) - raio,
    largura: Math.abs(inicio.x - fim.x) + raio * 2,
    altura: Math.abs(inicio.y - fim.y) + raio * 2,
  }));
  const desenhar = (zoom, tempo = 0) => {
    const { ctx, operacoes } = contextoRegistrado();
    desenharFundo(ctx, cenario, tempo, zoom);
    desenharDecoracoes(ctx, cenario, tempo, zoom);
    assert.equal(ctx.globalAlpha, 1);
    return operacoes;
  };
  for (const zoom of [0.25, 0.5, 1]) for (const tempo of [0, 1.4]) {
    const operacoes = desenhar(zoom, tempo);
    for (const op of operacoes.filter(opaca)) for (const piso of [...salas, ...pisos]) {
      assert.ok(op.x + op.largura <= piso.x || op.x >= piso.x + piso.largura ||
        op.y + op.altura <= piso.y || op.y >= piso.y + piso.altura,
      'ornamento sólido cobre área caminhável');
    }
  }
  // Tempo zero é a entrada usada pelo jogo com reduced motion.
  assert.deepEqual(desenhar(1), desenhar(1));
  assert.ok(desenhar(0.25).length < desenhar(1).length);
  assert.notDeepEqual(desenhar(1, 1.4), desenhar(1));
  assert.deepEqual(cenario, antes);
});
