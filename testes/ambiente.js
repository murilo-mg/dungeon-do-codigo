// Dublês de DOM e relógio para verificar cancelamento e entrada sem dependências.
import { processarDungeon } from '../js/processamentoDungeon.js';
import { LARGURA_CORREDOR } from '../js/corredores.js';

export function opacidadesPisosChamadas(canvas, quantidade) {
  // Galerias, paredes e base opaca não são o destaque contextual das chamadas.
  return canvas.tracos.filter(traco => traco.largura === LARGURA_CORREDOR &&
    ['#807963', '#535e60'].includes(traco.cor)).slice(-quantidade).map(traco => traco.opacidade);
}
export class Emissor {
  ouvintes = new Map();
  addEventListener(tipo, funcao) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, new Set());
    this.ouvintes.get(tipo).add(funcao);
  }
  removeEventListener(tipo, funcao) { this.ouvintes.get(tipo)?.delete(funcao); }
  emitir(tipo, dados = {}) {
    const evento = { target: null, preventDefault() { this.prevenido = true; }, ...dados };
    const resultados = [...(this.ouvintes.get(tipo) ?? [])].map(funcao => funcao(evento));
    evento.conclusao = Promise.all(resultados);
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
  tracos = [];
  textos = [];
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
  click() { this.cliques = (this.cliques ?? 0) + 1; this.emitir('click'); }
  focus() { this.focado = true; }
  blur() { this.focado = false; }
  getBoundingClientRect() {
    return this.retangulo ?? { left: 0, top: 0, width: this.width, height: this.height };
  }
  getContext() {
    const opacidades = [];
    let inicio = null;
    let fim = null;
    return { globalAlpha: 1,
      createRadialGradient(...parametros) {
        return { parametros, cores: [], addColorStop(posicao, cor) { this.cores.push({ posicao, cor }); } };
      },
      save() { this.canvas.salvamentos++; opacidades.push(this.globalAlpha); },
      restore() { this.canvas.restauracoes++; this.globalAlpha = opacidades.pop(); },
      fillRect: function(x, y, largura, altura) {
        if (largura >= 60 && altura >= 60 && largura !== 560) {
          this.canvas.preenchimentosSalas.push({ x, y, largura, altura,
            cor: this.fillStyle, opacidade: this.globalAlpha });
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
      strokeRect: function(x, y, largura, altura) {
        this.canvas.contornos.push({ x, y, largura, altura,
          cor: this.strokeStyle, opacidade: this.globalAlpha });
      },
      beginPath() { inicio = null; fim = null; },
      moveTo(x, y) { inicio = { x, y }; },
      lineTo(x, y) { fim = { x, y }; },
      stroke() { this.canvas.tracos.push({ inicio, fim, opacidade: this.globalAlpha,
        cor: this.strokeStyle, largura: this.lineWidth }); },
      scale: (x, y) => this.escalas.push({ x, y }),
      translate: (x, y) => this.translacoes.push({ x, y }),
      fillText: function(texto, x, y) {
        this.canvas.textos.push({ texto, x, y, fonte: this.font,
          alinhamento: this.textAlign, opacidade: this.globalAlpha });
      },
      measureText(texto) { return { width: texto.length * 6 }; } };
  }
}

export function criarAmbiente() {
  const workers = [];
  globalThis.Worker = class {
    constructor() { workers.push(this); }
    postMessage(codigo) {
      queueMicrotask(() => {
        if (this.terminado) return;
        try { this.onmessage?.({ data: { resultado: structuredClone(processarDungeon(codigo)) } }); }
        catch (erro) { this.onmessage?.({ data: { erro: { mensagem: erro.message, tipo: 'entrada' } } }); }
      });
    }
    terminate() { this.terminado = true; }
  };
  const janela = new Emissor();
  const documento = new Emissor();
  const preferencia = new Emissor();
  preferencia.matches = false;
  const elementos = new Map([ 'status-indicador', 'status-controles-texto','canvas-jogo','mensagem-erro', 'tela-entrada', 'info-sala', 'painel-configuracao', 'area-jogo', 'entrada-codigo', 'botao-gerar', 'botao-voltar', 'busca-funcao', 'resultados-busca', 'camera-afastar', 'camera-zoom', 'camera-aproximar', 'camera-encaixar', 'modo-complexidade', 'modo-estrutura', 'botao-abrir-c', 'arquivo-c', 'arquivo-atual']
    .map(id => [id, new Elemento(id === 'canvas-jogo' ? 'canvas'
      : id === 'busca-funcao' || id === 'arquivo-c' ? 'input'
        : id.startsWith('camera-') || id.startsWith('modo-') || id === 'botao-abrir-c' ? 'button' : 'div')]));
  elementos.get('busca-funcao').value = '';
  for (const id of ['botao-cancelar', 'status-geracao']) elementos.set(id, new Elemento('div'));
  elementos.get('arquivo-c').value = '';
  elementos.get('arquivo-c').files = [];
  elementos.get('canvas-jogo').width = 560;
  elementos.get('canvas-jogo').height = 480;
  elementos.get('canvas-jogo').clientWidth = 560;
  elementos.get('canvas-jogo').clientHeight = 480;
  elementos.get('canvas-jogo').clientLeft = 0;
  elementos.get('canvas-jogo').clientTop = 0;
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
  return { janela, documento, preferencia, elementos, pendentes, workers,
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
