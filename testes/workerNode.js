// Adapta apenas o transporte: executa o mesmo módulo Worker usado no navegador.
import { parentPort } from 'node:worker_threads';
globalThis.self = { postMessage: data => parentPort.postMessage(data) };
await import('../js/dungeonWorker.js');
parentPort.on('message', data => self.onmessage({ data }));
