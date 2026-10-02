import { processarDungeon, ErroPreparacaoDungeon } from './processamentoDungeon.js';

self.onmessage = evento => {
  try {
    self.postMessage({ resultado: processarDungeon(evento.data) });
  } catch (erro) {
    // Defeitos internos não expõem texto de entrada, stack ou caminhos na interface.
    self.postMessage({ erro: {
      tipo: erro instanceof ErroPreparacaoDungeon ? erro.tipo : 'interno',
      mensagem: erro instanceof ErroPreparacaoDungeon ? erro.message
        : 'Não foi possível preparar a dungeon. Tente um exemplo menor.',
    } });
  }
};
