import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Worker as WorkerNode } from 'node:worker_threads';
import { criarProcessadorDungeon, PRAZO_PREPARACAO_MS } from '../js/processadorDungeon.js';
import { processarDungeon } from '../js/processamentoDungeon.js';
import { LIMITE_ARQUIVO_C, LIMITE_FUNCOES, LIMITE_CHAMADAS,
  validarArquivoC, validarCodigoC, validarFuncoes } from '../js/entradaCodigo.js';

test('limite de texto é em bytes UTF-8 e inclui caracteres multibyte', () => {
  assert.equal(validarCodigoC('a'.repeat(LIMITE_ARQUIVO_C)), null);
  assert.match(validarCodigoC('a'.repeat(LIMITE_ARQUIVO_C + 1)), /512 KiB/);
  assert.equal(validarCodigoC('é'.repeat(LIMITE_ARQUIVO_C / 2)), null);
  assert.match(validarCodigoC('é'.repeat(LIMITE_ARQUIVO_C / 2 + 1)), /512 KiB/);
  assert.match(validarCodigoC('😀'.repeat(LIMITE_ARQUIVO_C / 4 + 1)), /512 KiB/);
  assert.match(validarCodigoC(null), /texto em C/);
  for (const size of [NaN, Infinity, -1, undefined]) {
    assert.match(validarArquivoC({ name: 'a.c', size }), /tamanho/);
  }
});

test('limites de funções e relações são verificados antes da montagem do mapa', () => {
  const funcoes = Array.from({ length: LIMITE_FUNCOES }, (_, i) => ({ nome: `f${i}`, chamadas: [] }));
  assert.equal(validarFuncoes(funcoes), null);
  assert.match(validarFuncoes([...funcoes, { nome: 'extra', chamadas: [] }]), /64 funções/);
  assert.match(validarFuncoes([{ nome: 'a'.repeat(129), chamadas: [] }]), /128 caracteres/);
  assert.match(validarFuncoes([funcoes[0], funcoes[0]]), /repetidas/);
  const chamadas = [{ nome: 'main', chamadas: Array(LIMITE_CHAMADAS).fill('a') }];
  assert.equal(validarFuncoes(chamadas), null);
  chamadas[0].chamadas.push('b');
  assert.match(validarFuncoes(chamadas), /256 relações/);
  const codigo = Array.from({ length: 65 }, (_, i) => `void f${i}(){}`).join('\n');
  assert.throws(() => processarDungeon(codigo), /64 funções/);
  const nomes = Array.from({ length: 17 }, (_, i) => `f${i}`);
  const denso = nomes.map(nome => `void ${nome}(){${nomes.map(n => `${n}();`).join('')}}`).join('\n');
  assert.throws(() => processarDungeon(denso), /256 relações/);
  assert.throws(() => processarDungeon('void a(){}\nvoid a(){}'), /repetidas/);
});

function workerControlavel() {
  return { mensagens: [], postMessage(codigo) { this.mensagens.push(codigo); },
    terminate() { this.terminado = true; } };
}

test('cancelamento e troca de entrada encerram Workers e descartam respostas antigas', async () => {
  const workers = [];
  const processador = criarProcessadorDungeon({ criarWorker: () => {
    const worker = workerControlavel(); workers.push(worker); return worker;
  } });
  const primeira = processador.executar('int main(){}');
  const rejeitada = assert.rejects(primeira, erro => erro.tipo === 'cancelado');
  const respostaAntiga = workers[0].onmessage;
  const segunda = processador.executar('int main(){return 0;}');
  assert.equal(workers[0].terminado, true);
  respostaAntiga({ data: { resultado: 'antigo' } });
  workers[1].onmessage({ data: { resultado: 'novo' } });
  assert.equal(await segunda, 'novo');
  assert.equal(workers[1].terminado, true);
  await rejeitada;
  const terceira = processador.executar('int main(){}');
  const cancelada = assert.rejects(terceira, erro => erro.tipo === 'cancelado');
  processador.cancelar();
  await cancelada;
  assert.equal(workers[2].terminado, true);
});

test('prazo encerra um Worker que não responde, liberando uma nova tentativa', async ctx => {
  ctx.mock.timers.enable({ apis: ['setTimeout'] });
  const worker = workerControlavel();
  const processador = criarProcessadorDungeon({ criarWorker: () => worker });
  const resultado = processador.executar('int main(){}');
  const rejeicao = assert.rejects(resultado, erro => erro.tipo === 'prazo' && /8 segundos/.test(erro.message));
  ctx.mock.timers.tick(PRAZO_PREPARACAO_MS);
  await rejeicao;
  assert.equal(worker.terminado, true);
});

test('entrada grande não cria Worker; falhas de criação e transporte são controladas', async () => {
  let criacoes = 0;
  const semWorker = criarProcessadorDungeon({ criarWorker: () => { criacoes++; throw new Error('detalhe privado'); } });
  await assert.rejects(semWorker.executar('x'.repeat(LIMITE_ARQUIVO_C + 1)), /512 KiB/);
  assert.equal(criacoes, 0);
  await assert.rejects(semWorker.executar('int main(){}'), erro =>
    erro.tipo === 'interno' && !erro.message.includes('detalhe privado'));
  for (const tipo of ['onerror', 'onmessageerror']) {
    const worker = workerControlavel();
    const processador = criarProcessadorDungeon({ criarWorker: () => worker });
    const resultado = processador.executar('int main(){}');
    const rejeicao = assert.rejects(resultado, erro => erro.tipo === 'interno');
    worker[tipo]({ preventDefault() {} });
    await rejeicao;
    assert.equal(worker.terminado, true);
  }
});

function criarWorkerReal() {
  const worker = new WorkerNode(new URL('./workerNode.js', import.meta.url));
  const adaptador = {
    postMessage: data => worker.postMessage(data),
    terminate() { this.terminado = true; void worker.terminate(); },
  };
  worker.on('message', data => adaptador.onmessage?.({ data }));
  worker.on('error', erro => adaptador.onerror?.(erro));
  return adaptador;
}

test('Worker real transfere grafo, regiões, corredores e colisão sem perder Map e Set', async () => {
  const codigo = 'void a(){a();}\nint main(){a();return 0;}';
  const processador = criarProcessadorDungeon({ criarWorker: criarWorkerReal });
  const resultado = await processador.executar(codigo);
  assert.deepEqual(resultado, processarDungeon(codigo));
  assert.ok(resultado.grafo.nos instanceof Map);
  assert.ok(resultado.masmorra.preparacao.areaCaminhavel.salas instanceof Map);
  assert.ok(resultado.masmorra.preparacao.segmentosNavegaveis.length > 0);
});

test('Worker real contém erros léxicos e uma entrada adversa dentro do prazo', async () => {
  const processador = criarProcessadorDungeon({ criarWorker: criarWorkerReal });
  await assert.rejects(processador.executar('void f(){'), /Linha 1/);
  // Entrada extensa sem função válida: pode ser rejeitada ou exceder o prazo,
  // dependendo do motor de regex. Nos dois casos o Worker precisa ser encerrado.
  let workerAdverso;
  const adverso = criarProcessadorDungeon({ criarWorker: () => {
    workerAdverso = criarWorkerReal(); return workerAdverso;
  }, prazoMs: 100 });
  await assert.rejects(adverso.executar('a '.repeat(30000)), erro => ['prazo', 'entrada'].includes(erro.tipo));
  assert.equal(workerAdverso.terminado, true);
  assert.equal((await processador.executar('int main(){return 0;}')).masmorra.salas.length, 1);
});
