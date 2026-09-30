import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCirculacaoDungeon } from '../js/circulacaoDungeon.js';
import { criarSegmentosDeCorredores, chaveDoPercurso, LARGURA_CORREDOR } from '../js/corredores.js';
import { criarAreaCaminhavel, localizarNaArea, moverNaArea } from '../js/areaCaminhavel.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';
import { criarGrafo, calcularContextoTopologico, obterEstruturaDaFuncao } from '../js/grafoC.js';
import { construirMasmorra } from '../js/masmorra.js';
import { RAIO_BASE_PERSONAGEM } from '../js/personagem.js';
import { criarAmbiente } from './ambiente.js';
import { atualizarPainelDeSala } from '../js/interface.js';

const centro = sala => ({ x: sala.x + sala.largura / 2, y: sala.y + sala.altura / 2 });
const funcao = (nome, chamadas = []) => ({ nome, chamadas, complexidade: 0, linhas: 1,
  estruturasControle: 0, textoCompleto: `void ${nome}(void) {}` });
const funcoes = [funcao('main', ['a', 'b']), funcao('a'), funcao('b'), funcao('isolada')];

function preparar() {
  const grafo = criarGrafo(funcoes);
  const mundo = construirMasmorra(funcoes, grafo, { layoutRegional: true });
  const semanticos = criarSegmentosDeCorredores(mundo.salas, grafo.arestas);
  const segmentos = [...semanticos, ...mundo.passagensExploracao];
  return { grafo, mundo, semanticos, segmentos, area: criarAreaCaminhavel(mundo.salas, segmentos, RAIO_BASE_PERSONAGEM) };
}

function percorrer(area, posicao, rota) {
  let estado = { ...posicao, local: localizarNaArea(area, posicao) };
  for (const ponto of rota) {
    estado = moverNaArea(area, estado.local, estado, { x: ponto.x - estado.x, y: ponto.y - estado.y });
    assert.ok(Math.hypot(estado.x - ponto.x, estado.y - ponto.y) < 0.01, 'rota inteira deve ser fisicamente percorrível');
  }
  return estado;
}

test('galerias ligam ramos sem passar por main e não alteram chamadas, regiões ou contexto', () => {
  const { grafo, mundo, semanticos, segmentos, area } = preparar();
  const antes = structuredClone(grafo);
  const contexto = calcularContextoTopologico(grafo, 'a');
  const salas = new Map(mundo.salas.map(sala => [sala.nome, sala]));
  const inicio = centro(salas.get('a'));
  const main = centro(salas.get('main'));
  const passaPorMain = rota => [inicio, ...rota].some((b, i, pontos) => {
    if (!i) return false;
    const a = pontos[i - 1];
    return Math.abs((b.x - a.x) * (main.y - a.y) - (b.y - a.y) * (main.x - a.x)) < 0.01 &&
      main.x >= Math.min(a.x, b.x) && main.x <= Math.max(a.x, b.x) &&
      main.y >= Math.min(a.y, b.y) && main.y <= Math.max(a.y, b.y);
  });
  const antiga = calcularRotaCaminhavel(mundo.salas, semanticos, inicio, 'b');
  assert.ok(passaPorMain(antiga));
  const nova = calcularRotaCaminhavel(mundo.salas, segmentos, inicio, 'b');
  assert.ok(nova && !passaPorMain(nova));
  assert.equal(percorrer(area, inicio, nova).local.sala, 'b');
  assert.deepEqual(grafo, antes);
  assert.deepEqual(calcularContextoTopologico(grafo, 'a'), contexto);
  assert.deepEqual([...new Set(semanticos.map(s => `${s.origem}->${s.destino}`))], ['main->a', 'main->b']);
});

test('função isolada fica visitável sem virar alcançável no código ou aparecer como chamada no inspector', () => {
  const { grafo, mundo, segmentos, area } = preparar();
  const isolada = mundo.salas.find(s => s.nome === 'isolada');
  const inicio = centro(mundo.salas[0]);
  const rota = calcularRotaCaminhavel(mundo.salas, segmentos, inicio, isolada.nome);
  assert.equal(percorrer(area, inicio, rota).local.sala, 'isolada');
  assert.equal(grafo.nos.get('isolada').alcancavel, false);
  assert.ok(mundo.regioes.find(r => r.tipo === 'isoladas').funcoes.includes('isolada'));
  const ambiente = criarAmbiente();
  const texto = elemento => [elemento.textContent, ...elemento.filhos.map(texto)].join(' ');
  atualizarPainelDeSala(isolada, obterEstruturaDaFuncao(grafo, 'isolada'));
  const antes = texto(ambiente.elementos.get('info-sala'));
  criarCirculacaoDungeon(mundo.salas, mundo.regioes, grafo.arestas);
  atualizarPainelDeSala(isolada, obterEstruturaDaFuncao(grafo, 'isolada'));
  assert.equal(texto(ambiente.elementos.get('info-sala')), antes);
  assert.doesNotMatch(antes, /main\(\)|exploracao|galeria/i);
});

test('identidade de galeria não colide com chamada entre os mesmos extremos', () => {
  const chamada = { origem: 'a', destino: 'b', inicio: { x: 0, y: 0 }, fim: { x: 100, y: 0 } };
  const galeria = { ...chamada, tipo: 'exploracao', id: JSON.stringify(['exploracao', 'a', 'b']) };
  assert.notEqual(chaveDoPercurso(chamada), chaveDoPercurso(galeria));
});

test('cruzar galeria independente não permite trocar de percurso', () => {
  const salas = [{ nome: 'a', x: 0, y: 100, largura: 60, altura: 60 },
    { nome: 'b', x: 300, y: 100, largura: 60, altura: 60 },
    { nome: 'c', x: 130, y: 0, largura: 60, altura: 60 },
    { nome: 'd', x: 130, y: 300, largura: 60, altura: 60 }];
  const segmentos = criarSegmentosDeCorredores(salas, [{ origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' }])
    .map(s => s.origem === 'c' ? { ...s, tipo: 'exploracao', id: 'galeria-c-d' } : s);
  const area = criarAreaCaminhavel(salas, segmentos, 10);
  let estado = { ...centro(salas[0]), local: localizarNaArea(area, centro(salas[0])) };
  estado = moverNaArea(area, estado.local, estado, { x: 130, y: 0 });
  estado = moverNaArea(area, estado.local, estado, { x: 0, y: 200 });
  assert.ok(estado.y <= 130 + LARGURA_CORREDOR / 2 - 10);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, estado, 'd', estado.local), null);
});

test('piso completo de cada galeria evita terceiras salas; geração é determinística e não muta dados', () => {
  const { grafo, mundo } = preparar();
  const antes = structuredClone({ salas: mundo.salas, regioes: mundo.regioes, grafo });
  const passagens = criarCirculacaoDungeon(mundo.salas, mundo.regioes, grafo.arestas);
  assert.deepEqual(passagens, mundo.passagensExploracao);
  assert.deepEqual({ salas: mundo.salas, regioes: mundo.regioes, grafo }, antes);
  const r = LARGURA_CORREDOR / 2;
  for (const t of passagens) for (const sala of mundo.salas) {
    if ([t.origem, t.destino].includes(sala.nome)) continue;
    assert.ok(Math.max(t.inicio.x, t.fim.x) + r <= sala.x || Math.min(t.inicio.x, t.fim.x) - r >= sala.x + sala.largura ||
      Math.max(t.inicio.y, t.fim.y) + r <= sala.y || Math.min(t.inicio.y, t.fim.y) - r >= sala.y + sala.altura);
  }
});

test('base do personagem para antes da parede, atravessa portas e não corta quinas', () => {
  const { mundo, area, segmentos } = preparar();
  const inicio = centro(mundo.salas[0]);
  let estado = { ...inicio, local: localizarNaArea(area, inicio) };
  estado = moverNaArea(area, estado.local, estado, { x: 0, y: 1000 });
  assert.ok(estado.y <= mundo.salas[0].y + mundo.salas[0].altura - RAIO_BASE_PERSONAGEM);
  for (const sala of mundo.salas) {
    const rota = calcularRotaCaminhavel(mundo.salas, segmentos, inicio, sala.nome);
    assert.equal(percorrer(area, inicio, rota).local.sala, sala.nome);
  }
});

test('vazio e sala única não recebem galeria; entrada sem chamadas recebe acesso físico às Criptas', () => {
  assert.deepEqual(criarCirculacaoDungeon([], [], []), []);
  for (const fs of [[funcao('main')], [funcao('primeira'), funcao('solta')]]) {
    const grafo = criarGrafo(fs), mundo = construirMasmorra(fs, grafo, { layoutRegional: true });
    assert.equal(mundo.passagensExploracao.length > 0, fs.length > 1);
    assert.equal(grafo.arestas.length, 0);
  }
});

test('navegação automática pode começar no interior de uma galeria e voltar pelo mesmo percurso', () => {
  const { mundo, area, segmentos } = preparar();
  const trecho = mundo.passagensExploracao[0];
  const sala = mundo.salas.find(s => s.nome === trecho.origem);
  const inicio = centro(sala);
  const meio = { x: (trecho.inicio.x + trecho.fim.x) / 2, y: (trecho.inicio.y + trecho.fim.y) / 2 };
  let estado = percorrer(area, inicio, [trecho.inicio, meio]);
  assert.equal(estado.local.sala, null);
  assert.ok(estado.local.corredores.includes(trecho.id));
  const rota = calcularRotaCaminhavel(mundo.salas, segmentos, estado, trecho.destino, estado.local);
  assert.ok(rota);
  for (const ponto of rota) {
    estado = moverNaArea(area, estado.local, estado, { x: ponto.x - estado.x, y: ponto.y - estado.y });
    assert.ok(Math.hypot(estado.x - ponto.x, estado.y - ponto.y) < 0.01);
  }
  assert.equal(estado.local.sala, trecho.destino);
  const volta = calcularRotaCaminhavel(mundo.salas, segmentos, estado, trecho.origem, estado.local);
  assert.equal(percorrer(area, estado, volta).local.sala, trecho.origem);
});

test('muitas funções isoladas, ciclos e recursão preservam semântica e permitem circulação com margem corporal', () => {
  const fs = [funcao('main', ['ciclo_a']), funcao('ciclo_a', ['ciclo_b']),
    funcao('ciclo_b', ['ciclo_a']), funcao('recursiva', ['recursiva']),
    ...Array.from({ length: 20 }, (_, i) => funcao(`isolada_${i}`))];
  const grafo = criarGrafo(fs);
  const antes = structuredClone(grafo);
  const mundo = construirMasmorra(fs, grafo, { layoutRegional: true });
  const segmentos = [...criarSegmentosDeCorredores(mundo.salas, grafo.arestas), ...mundo.passagensExploracao];
  const area = criarAreaCaminhavel(mundo.salas, segmentos, RAIO_BASE_PERSONAGEM);
  const inicio = centro(mundo.salas[0]);
  for (const sala of mundo.salas) {
    const rota = calcularRotaCaminhavel(mundo.salas, segmentos, inicio, sala.nome);
    assert.ok(rota, sala.nome);
    assert.equal(percorrer(area, inicio, rota).local.sala, sala.nome);
  }
  assert.deepEqual(grafo, antes);
  assert.equal(grafo.nos.get('isolada_19').alcancavel, false);
  assert.equal(grafo.nos.get('recursiva').recursivaDireta, true);
  assert.equal(grafo.nos.get('ciclo_a').participaDeCiclo, true);
});

test('porta que ficaria a três unidades da quina é reposicionada para caber o personagem', () => {
  const salas = [{ nome: 'main', x: 107, y: 364, largura: 90, altura: 80 },
    { nome: 'alvo', x: 68, y: 120, largura: 60, altura: 60 }];
  const segmentos = criarSegmentosDeCorredores(salas, [{ origem: 'main', destino: 'alvo' }]);
  assert.ok(segmentos.every(s => !s.fallbackDireto));
  for (const [sala, porta] of [[salas[0], segmentos[0].inicio], [salas[1], segmentos.at(-1).fim]]) {
    const lateral = porta.x === sala.x || porta.x === sala.x + sala.largura;
    const distancia = lateral ? Math.min(porta.y - sala.y, sala.y + sala.altura - porta.y)
      : Math.min(porta.x - sala.x, sala.x + sala.largura - porta.x);
    assert.ok(distancia >= LARGURA_CORREDOR / 2);
  }
  const area = criarAreaCaminhavel(salas, segmentos, RAIO_BASE_PERSONAGEM);
  for (const [origem, destino] of [[salas[0], salas[1]], [salas[1], salas[0]]]) {
    const inicio = centro(origem);
    const rota = calcularRotaCaminhavel(salas, segmentos, inicio, destino.nome);
    assert.equal(percorrer(area, inicio, rota).local.sala, destino.nome);
  }
});
