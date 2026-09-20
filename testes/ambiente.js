// Dublês de DOM e relógio para verificar cancelamento e entrada sem dependências.
export class Emissor {
  ouvintes = new Map();
  addEventListener(tipo, funcao) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, new Set());
    this.ouvintes.get(tipo).add(funcao);
  }
  removeEventListener(tipo, funcao) { this.ouvintes.get(tipo)?.delete(funcao); }
  emitir(tipo, dados = {}) {
    const evento = { target: null, preventDefault() { this.prevenido = true; }, ...dados };
    this.ouvintes.get(tipo)?.forEach(funcao => funcao(evento));
    return evento;
  }
}

class Elemento extends Emissor {
  filhos = [];
  style = {};
  atributos = {};
  className = '';
  textContent = '';
  classList = { add() {}, remove() {} };
  constructor(tipo) { super(); this.tipo = tipo; }
  append(...filhos) { this.filhos.push(...filhos); }
  replaceChildren(...filhos) { this.filhos = filhos; }
  setAttribute(nome, valor) { this.atributos[nome] = valor; }
  focus() { this.focado = true; }
  getContext() {
    return { save() {}, restore() {}, fillRect() {}, clearRect() {}, strokeRect() {},
      beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {},
      measureText(texto) { return { width: texto.length * 6 }; } };
  }
}

export function criarAmbiente() {
  const janela = new Emissor();
  const documento = new Emissor();
  const preferencia = new Emissor();
  preferencia.matches = false;
  const elementos = new Map(['canvas-jogo', 'info-sala', 'painel-configuracao', 'area-jogo', 'entrada-codigo', 'botao-gerar', 'botao-voltar']
    .map(id => [id, new Elemento(id === 'canvas-jogo' ? 'canvas' : 'div')]));
  elementos.get('canvas-jogo').width = 560;
  elementos.get('canvas-jogo').height = 480;
  documento.getElementById = id => elementos.get(id);
  documento.createElement = tipo => new Elemento(tipo);
  janela.matchMedia = () => preferencia;
  const pendentes = new Map();
  let proximo = 1;
  let tempo = 0;
  globalThis.window = janela;
  globalThis.document = documento;
  globalThis.requestAnimationFrame = funcao => { pendentes.set(proximo, funcao); return proximo++; };
  globalThis.cancelAnimationFrame = id => pendentes.delete(id);
  return { janela, documento, preferencia, elementos, pendentes,
    avancar(quantidade = 1, intervalo = 1000 / 60) {
      for (let indice = 0; indice < quantidade; indice++) {
        tempo += intervalo;
        const atuais = [...pendentes.values()];
        pendentes.clear();
        atuais.forEach(funcao => funcao(tempo));
      }
    } };
}

export function encontrar(elemento, classe) {
  if (elemento.className === classe) return elemento;
  for (const filho of elemento.filhos) {
    const encontrado = encontrar(filho, classe);
    if (encontrado) return encontrado;
  }
}
