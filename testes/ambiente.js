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
  translacoes = [];
  escalas = [];
  limpezas = [];
  posicoesPersonagem = [];
  posicoesCriaturas = [];
  marcadores = [];
  preenchimentosSalas = [];
  marcadoresDestacados = [];
  salvamentos = 0;
  restauracoes = 0;
  contornos = [];
  style = {};
  atributos = {};
  className = '';
  textContent = '';
  classList = { add() {}, remove() {} };
  constructor(tipo) { super(); this.tipo = tipo; }
  append(...filhos) { this.filhos.push(...filhos); }
  replaceChildren(...filhos) { this.filhos = filhos; }
  setAttribute(nome, valor) { this.atributos[nome] = valor; }
  closest() { return this.tipo === 'input' ? this : null; }
  focus() { this.focado = true; }
  blur() { this.focado = false; }
  getContext() {
    return { save: () => { this.salvamentos++; }, restore: () => { this.restauracoes++; },
      fillRect: function(x, y, largura, altura) {
        if (largura >= 60 && altura >= 60 && largura !== 560) {
          this.canvas.preenchimentosSalas.push({ x, y, largura, altura, cor: this.fillStyle });
        }
        if (largura === 20 && altura === 5 && this.fillStyle === '#00000055') {
          this.canvas.posicoesPersonagem.push({ x: x + 10, y: y - 10 });
        }
        if (largura === 20 && altura === 4 && this.fillStyle === '#00000044') {
          this.canvas.posicoesCriaturas.push({ x: x + 10, y: y - 10 });
        }
        if (largura === 9 && altura === 8 && this.fillStyle === '#181410') {
          this.canvas.marcadores.push({ x, y });
        }
        if (largura === 9 && altura === 8 && this.fillStyle === '#e8dcc0') {
          this.canvas.marcadoresDestacados.push({ x, y });
        }
      },
      canvas: this,
      clearRect: (x, y, largura, altura) => this.limpezas.push({ x, y, largura, altura }),
      strokeRect: (x, y, largura, altura) => this.contornos.push({ x, y, largura, altura }),
      beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      scale: (x, y) => this.escalas.push({ x, y }),
      translate: (x, y) => this.translacoes.push({ x, y }), fillText() {},
      measureText(texto) { return { width: texto.length * 6 }; } };
  }
}

export function criarAmbiente() {
  const janela = new Emissor();
  const documento = new Emissor();
  const preferencia = new Emissor();
  preferencia.matches = false;
  const elementos = new Map([ 'status-indicador', 'status-controles-texto','canvas-jogo','mensagem-erro', 'tela-entrada', 'info-sala', 'painel-configuracao', 'area-jogo', 'entrada-codigo', 'botao-gerar', 'botao-voltar', 'busca-funcao', 'resultados-busca', 'camera-afastar', 'camera-zoom', 'camera-aproximar', 'camera-encaixar', 'modo-complexidade', 'modo-estrutura']
    .map(id => [id, new Elemento(id === 'canvas-jogo' ? 'canvas'
      : id === 'busca-funcao' ? 'input' : id.startsWith('camera-') || id.startsWith('modo-') ? 'button' : 'div')]));
  elementos.get('busca-funcao').value = '';
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
