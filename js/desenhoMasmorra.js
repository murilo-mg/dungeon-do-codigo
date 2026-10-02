// Materiais decorativos do Canvas. Não criam colisões nem relações entre salas.
import { chaveDoCorredor, chaveDoPercurso, LARGURA_CORREDOR } from './corredores.js';

const FOLGA_ABERTURA = LARGURA_CORREDOR / 2 + 2;
const LARGURA_MAXIMA_PLACA = 260;
const TONS_LAJES = ['#eee2c218', '#1a24232d', '#0a111c22', '#ead7ab0b', '#0b13141a'];

export function desenharGalerias(contexto, passagens, zoom) {
  desenharRedeCorredores(contexto, passagens.map(trecho => ({ ...trecho, tipo: 'exploracao' })), [], zoom);
}

export function desenharRedeCorredores(contexto, segmentos, cruzamentos, zoom, foco = null, tiposVisuais = new Map()) {
  const caminhos = new Map();
  // As chamadas ficam legíveis sobre as galerias, dentro de cada camada.
  const ordenados = [...segmentos].sort((a, b) =>
    Number(b.tipo === 'exploracao') - Number(a.tipo === 'exploracao'));
  for (const segmento of ordenados) {
    const chave = chaveDoPercurso(segmento);
    if (!caminhos.has(chave)) caminhos.set(chave, []);
    caminhos.get(chave).push(segmento);
  }
  const opacidade = trecho => trecho.tipo !== 'exploracao' && foco &&
    !foco.arestas.get(trecho.origem)?.has(trecho.destino) ? 0.25 : 1;
  const corPiso = trecho => trecho.tipo === 'exploracao' ? '#345455' :
    tiposVisuais.get(chaveDoCorredor(trecho.origem, trecho.destino)) === 'entre-regioes'
      ? '#535e60' : '#807963';
  const tracar = trechos => {
    contexto.beginPath();
    let ultimo = null;
    for (const { inicio, fim } of trechos) {
      if (!ultimo || ultimo.x !== inicio.x || ultimo.y !== inicio.y) contexto.moveTo(inicio.x, inicio.y);
      contexto.lineTo(fim.x, fim.y);
      ultimo = fim;
    }
    contexto.stroke();
  };
  contexto.save();
  contexto.lineCap = 'square';
  contexto.lineJoin = 'miter';
  // Paredes da rede inteira vêm antes de qualquer piso. A borda de uma galeria
  // nunca volta a cobrir o caminho de uma chamada nem uma união entre faixas.
  for (const [largura, cor] of [[LARGURA_CORREDOR + 16, '#080d10'], [LARGURA_CORREDOR + 10, '#354245']]) {
    contexto.lineWidth = largura;
    contexto.strokeStyle = cor;
    for (const trechos of caminhos.values()) {
      contexto.globalAlpha = opacidade(trechos[0]);
      tracar(trechos);
    }
  }
  const pisoVisual = unirPisosAlinhados(segmentos, opacidade);
  desenharAcabamentoCorredores(contexto, pisoVisual, [], zoom, foco, true);
  // A base opaca limpa pedras interiores mesmo quando o foco atenua a cor de
  // um percurso. Atenuação contextual não pode parecer uma parede atravessada.
  contexto.lineWidth = LARGURA_CORREDOR;
  contexto.globalAlpha = 1;
  contexto.strokeStyle = '#1c2425';
  for (const trechos of caminhos.values()) tracar(trechos);
  const pisosOrdenados = [...caminhos.values()].sort((a, b) => opacidade(a[0]) - opacidade(b[0]));
  for (const trechos of pisosOrdenados) {
    const primeiro = trechos[0];
    const entreRegioes = tiposVisuais.get(chaveDoCorredor(primeiro.origem, primeiro.destino)) === 'entre-regioes';
    contexto.globalAlpha = !foco && zoom < 0.55 && entreRegioes ? 0.65 : opacidade(primeiro);
    contexto.strokeStyle = corPiso(primeiro);
    tracar(trechos);
  }
  desenharAcabamentoCorredores(contexto, pisoVisual, [], zoom, foco);
  desenharMarcasGalerias(contexto, unirPisosAlinhados(
    segmentos.filter(trecho => trecho.tipo === 'exploracao'), opacidade), zoom);
  // Somente cruzamentos independentes recebem a ponte após todos os pisos.
  desenharAcabamentoCorredores(contexto, [], cruzamentos, zoom, foco);
  contexto.restore();
}

// Uma laje pertence ao piso, não à quantidade de chamadas sobre ele. A união
// evita texturas e paredes empilhadas sem modificar os percursos navegáveis.
function unirPisosAlinhados(segmentos, opacidade) {
  const linhas = new Map();
  for (const trecho of segmentos) {
    const eixo = trecho.inicio.y === trecho.fim.y ? 'x' : 'y';
    const perpendicular = eixo === 'x' ? 'y' : 'x';
    if (trecho.inicio[perpendicular] !== trecho.fim[perpendicular]) continue;
    const chave = JSON.stringify([eixo, trecho.inicio[perpendicular]]);
    if (!linhas.has(chave)) linhas.set(chave, []);
    linhas.get(chave).push({ ...trecho,
      inicio: { ...trecho.inicio, [eixo]: Math.min(trecho.inicio[eixo], trecho.fim[eixo]) },
      fim: { ...trecho.fim, [eixo]: Math.max(trecho.inicio[eixo], trecho.fim[eixo]) }, eixo });
  }
  const resultado = [];
  for (const trechos of linhas.values()) {
    trechos.sort((a, b) => a.inicio[a.eixo] - b.inicio[b.eixo]);
    let unido = null;
    for (const trecho of trechos) {
      const eixo = trecho.eixo;
      if (!unido || trecho.inicio[eixo] > unido.fim[eixo]) {
        unido = trecho;
        resultado.push(unido);
      } else {
        unido.fim[eixo] = Math.max(unido.fim[eixo], trecho.fim[eixo]);
        if (opacidade(trecho) > opacidade(unido)) {
          Object.assign(unido, { origem: trecho.origem, destino: trecho.destino, tipo: trecho.tipo });
        }
      }
    }
  }
  return resultado;
}

function desenharMarcasGalerias(contexto, passagens, zoom) {
  contexto.save();
  contexto.globalAlpha = 1;
  // Marcas quadradas distinguem circulação mesmo sem distinguir as cores.
  const raio = LARGURA_CORREDOR / 2;
  for (const { inicio, fim } of passagens) {
    const horizontal = inicio.y === fim.y;
    const comprimento = Math.abs(fim.x - inicio.x) + Math.abs(fim.y - inicio.y);
    for (let passo = 8; passo < comprimento; passo += zoom < 0.5 ? 24 : 16) {
      const x = inicio.x + (fim.x - inicio.x) * passo / comprimento;
      const y = inicio.y + (fim.y - inicio.y) * passo / comprimento;
      if (zoom >= 0.65) {
        // Juntas pertencem ao piso, sem pilastras sobre as uniões caminháveis.
        contexto.fillStyle = '#172f3266';
        contexto.fillRect(horizontal ? x : x - raio + 2, horizontal ? y - raio + 2 : y,
          horizontal ? 1 : LARGURA_CORREDOR - 4, horizontal ? LARGURA_CORREDOR - 4 : 1);
      }
      contexto.fillStyle = '#96b3a6';
      for (const lado of [-1, 1]) contexto.fillRect(
        x + (horizontal ? 0 : lado * (raio - 3)) - 1,
        y + (horizontal ? lado * (raio - 3) : 0) - 1, 2, 2);
    }
  }
  contexto.restore();
}

export function desenharAcabamentoCorredores(contexto, segmentos, cruzamentos, zoom, foco, bordas = false) {
  const raio = LARGURA_CORREDOR / 2;
  const opacidade = segmento => segmento.tipo !== 'exploracao' && foco &&
    !foco.arestas.get(segmento.origem)?.has(segmento.destino) ? 0.25 : 1;
  contexto.save();
  for (const segmento of segmentos) {
    const { inicio, fim } = segmento;
    const horizontal = inicio.y === fim.y;
    if (!horizontal && inicio.x !== fim.x) continue;
    contexto.globalAlpha = opacidade(segmento);
    const comprimento = Math.abs(fim.x - inicio.x) + Math.abs(fim.y - inicio.y);
    const inicioEixo = horizontal ? Math.min(inicio.x, fim.x) : Math.min(inicio.y, fim.y);
    // Dois cursos de lajes e pedras laterais dão escala humana à passagem.
    const passoPedra = zoom < 0.5 ? 24 : 12;
    for (let passo = 2, i = 0; passo < comprimento - 2; passo += passoPedra, i++) {
      const comprimentoPedra = Math.min(passoPedra - 1, comprimento - passo - 1);
      const eixo = inicioEixo + passo;
      for (const lado of bordas ? [-1, 1] : []) {
        const transversal = (horizontal ? inicio.y : inicio.x) + lado * (raio + 3);
        desenharPedra(contexto, horizontal ? eixo : transversal - 3,
          horizontal ? transversal - 3 : eixo,
          horizontal ? comprimentoPedra : 6, horizontal ? 6 : comprimentoPedra,
          i % 3 ? '#566061' : '#697273', i);
      }
      if (!bordas && zoom >= 0.4) {
        contexto.fillStyle = i % 3 ? '#ffffff0b' : '#0000001a';
        const deslocamento = i % 2 ? -raio + 2 : 1;
        contexto.fillRect(horizontal ? eixo : inicio.x + deslocamento,
          horizontal ? inicio.y + deslocamento : eixo,
          horizontal ? comprimentoPedra : raio - 3,
          horizontal ? raio - 3 : comprimentoPedra);
        contexto.fillStyle = '#363c3855';
        contexto.fillRect(horizontal ? eixo : inicio.x - raio + 2,
          horizontal ? inicio.y - raio + 2 : eixo,
          horizontal ? 1 : LARGURA_CORREDOR - 4,
          horizontal ? LARGURA_CORREDOR - 4 : 1);
      }
    }
  }
  // Uma ponte gráfica separa percursos; não acrescenta altura ou conexão à física.
  for (const cruzamento of bordas ? [] : cruzamentos) {
    const { x, y } = cruzamento;
    contexto.globalAlpha = opacidade(cruzamento);
    contexto.fillStyle = '#070c0f';
    contexto.fillRect(x - raio - 7, y - raio - 7, LARGURA_CORREDOR + 14, LARGURA_CORREDOR + 17);
    contexto.fillStyle = cruzamento.tipo === 'exploracao' ? '#345455' : '#8a806b';
    contexto.fillRect(x - raio - 7, y - raio, LARGURA_CORREDOR + 14, LARGURA_CORREDOR);
    for (let px = x - raio - 6; px < x + raio + 7; px += 8) {
      contexto.fillStyle = '#514d42';
      contexto.fillRect(px, y - raio + 1, 1, LARGURA_CORREDOR - 2);
      for (const py of [y - raio - 5, y + raio])
        desenharPedra(contexto, px, py, 8, 5, cruzamento.tipo === 'exploracao' ? '#96b3a6' : '#9a927c', px);
    }
  }
  contexto.restore();
}

export function desenharPortalSala(contexto, ponto, vertical, tempo, iluminado, exploracao = false) {
  desenharMolduraPortal(contexto, ponto, vertical, tempo, iluminado, exploracao);
  desenharSoleira(contexto, ponto, vertical, exploracao);
}

export function desenharPortaisSalas(contexto, portas, tempo, iluminado, foco = null) {
  contexto.save();
  const opacidade = porta => porta.segmentos.some(t => t.tipo === 'exploracao' ||
    !foco || foco.arestas.get(t.origem)?.has(t.destino)) ? 1 : 0.25;
  for (const porta of portas) {
    contexto.globalAlpha = opacidade(porta);
    desenharMolduraPortal(contexto, porta.ponto, porta.vertical, tempo, iluminado,
      porta.segmentos.every(t => t.tipo === 'exploracao'));
  }
  // Portas próximas compartilham a abertura. Nenhuma ombreira pode reaparecer
  // dentro da soleira de outra porta depois que ela já foi desenhada.
  for (const porta of portas) {
    contexto.globalAlpha = opacidade(porta);
    desenharSoleira(contexto, porta.ponto, porta.vertical,
      porta.segmentos.every(t => t.tipo === 'exploracao'));
  }
  contexto.restore();
}

function desenharSoleira(contexto, ponto, vertical, exploracao) {
  const raio = LARGURA_CORREDOR / 2;
  // A soleira ocupa toda a abertura física. As ombreiras ficam fora dela.
  contexto.save();
  contexto.globalAlpha = 1;
  contexto.fillStyle = '#1c2425';
  contexto.fillRect(ponto.x - (vertical ? 8 : raio), ponto.y - (vertical ? raio : 8),
    vertical ? 16 : LARGURA_CORREDOR, vertical ? LARGURA_CORREDOR : 16);
  contexto.restore();
  contexto.fillStyle = exploracao ? '#345455' : '#807963';
  contexto.fillRect(ponto.x - (vertical ? 8 : raio), ponto.y - (vertical ? raio : 8),
    vertical ? 16 : LARGURA_CORREDOR, vertical ? LARGURA_CORREDOR : 16);
  for (let passo = -raio; passo < raio; passo += 8) {
    contexto.fillStyle = '#ffffff18';
    contexto.fillRect(ponto.x + (vertical ? -6 : passo + 1),
      ponto.y + (vertical ? passo + 1 : -6), vertical ? 12 : 6, vertical ? 6 : 12);
    contexto.fillStyle = '#252b2b55';
    contexto.fillRect(ponto.x + (vertical ? -8 : passo),
      ponto.y + (vertical ? passo : -8), vertical ? 16 : 1, vertical ? 1 : 16);
  }
}

function desenharMolduraPortal(contexto, ponto, vertical, tempo, iluminado, exploracao) {
  const raio = LARGURA_CORREDOR / 2;
  for (const lado of [-1, 1]) {
    const x = ponto.x + (vertical ? 0 : lado * (raio + 5));
    const y = ponto.y + (vertical ? lado * (raio + 5) : 0);
    desenharPedra(contexto, x - 5, y - 5, 10, 10, '#394144', lado);
    desenharPedra(contexto, x - 4, y - 5, 8, 8, exploracao ? '#96b3a6' : '#aa987b', lado);
    contexto.fillStyle = '#d5bd8555';
    contexto.fillRect(x - 2, y - 3, 2, 3);
    if (iluminado && lado === -1) desenharTocha(contexto, x, y - 1, tempo);
  }
}

export function desenharTocha(contexto, x, y, tempo = 0) {
  const chama = tempo ? Math.floor(tempo * 5 + x) % 2 : 0;
  contexto.save();
  const opacidade = contexto.globalAlpha;
  const luz = contexto.createRadialGradient(x, y - 6, 1, x, y - 6, 44);
  luz.addColorStop(0, '#ffb34d38');
  luz.addColorStop(0.3, '#e18c3522');
  luz.addColorStop(0.65, '#b6672010');
  luz.addColorStop(1, '#b6672000');
  contexto.fillStyle = luz;
  contexto.globalAlpha = opacidade;
  contexto.fillRect(x - 44, y - 35, 88, 58);
  contexto.restore();
  contexto.fillStyle = '#101316';
  contexto.fillRect(x - 4, y - 1, 8, 13);
  contexto.fillStyle = '#665a43';
  contexto.fillRect(x - 2, y, 4, 10);
  contexto.fillStyle = '#b19260';
  contexto.fillRect(x - 2, y + 2, 1, 6);
  contexto.fillStyle = '#9f5424';
  contexto.fillRect(x - 4, y - 9 - chama, 8, 9 + chama);
  contexto.fillStyle = '#ef852a';
  contexto.fillRect(x - 3, y - 12 - chama, 6, 10 + chama);
  contexto.fillRect(x - 1 + chama, y - 16 - chama, 2, 6);
  contexto.fillStyle = '#ffc568';
  contexto.fillRect(x - 2, y - 9 - chama, 4, 8 + chama);
  contexto.fillStyle = '#fff0b0';
  contexto.fillRect(x - 1, y - 5, 2, 4);
  contexto.fillStyle = '#242a2b';
  contexto.fillRect(x - 5, y - 1, 10, 3);
  contexto.fillStyle = '#a68a58';
  contexto.fillRect(x - 4, y - 1, 8, 1);
  if (tempo) {
    const subida = Math.floor((tempo * 8 + Math.abs(x)) % 16);
    contexto.fillStyle = '#efad5666';
    contexto.fillRect(x + (Math.floor(subida / 4) % 2 ? 2 : -2), y - 16 - subida, 1, 2);
  }
}

export function desenharPedra(contexto, x, y, largura, altura, cor, indice = 0) {
  if (largura <= 0 || altura <= 0) return;
  contexto.fillStyle = '#101517';
  contexto.fillRect(x, y, largura, altura);
  if (largura < 3 || altura < 4) return;
  contexto.fillStyle = cor;
  contexto.fillRect(x + 1, y + 1, largura - 2, altura - 3);
  contexto.save();
  contexto.globalAlpha *= indice % 3 === 0 ? 0.22 : 0.1;
  contexto.fillStyle = '#ffffff';
  if (largura > 4) contexto.fillRect(x + 2, y + 1, largura - 4, Math.min(2, altura - 3));
  contexto.restore();
  contexto.fillStyle = '#00000026';
  contexto.fillRect(x + largura - 2, y + 2, 1, altura - 3);
  contexto.fillRect(x + 1, y + altura - 3, largura - 2, 1);
  if (largura >= 10 && altura >= 6 && Math.abs(indice) % 4 === 0) {
    contexto.fillStyle = '#151d2066';
    contexto.fillRect(x + largura - 5, y + 2, 2, 1);
    contexto.fillRect(x + largura - 4, y + 3, 1, 2);
  }
}

export function desenharRochaMusgosa(contexto, rocha, variacao = 0, detalhar = true) {
  const { x, y, largura: l, altura: a } = rocha;
  const recuo = variacao % 3, topo = 1 + recuo;
  const meio = Math.floor(l * 0.46), base = Math.floor(a * 0.62);
  contexto.fillStyle = '#060d10';
  contexto.fillRect(x + 3, y + a - 5, l - 6, 5);
  contexto.fillRect(x + 1, y + 7, l - 2, a - 11);
  contexto.fillRect(x + meio - 2, y + topo, l - meio - 3, a - topo - 3);
  contexto.fillStyle = variacao % 2 ? '#303c43' : '#29343c';
  contexto.fillRect(x + meio, y + topo + 2, l - meio - 5, base);
  contexto.fillRect(x + 3, y + 8, meio, a - 12);
  contexto.fillStyle = '#424e55';
  contexto.fillRect(x + meio + 2, y + topo + 1, l - meio - 9, 3);
  contexto.fillRect(x + 5, y + 6 + recuo, meio - 5, 3);
  contexto.fillStyle = '#1b272e';
  contexto.fillRect(x + meio - 1, y + 10, 2, a - 14);
  contexto.fillRect(x + l - 5, y + 9, 2, a - 15);
  contexto.fillStyle = '#2c4437';
  contexto.fillRect(x + 2, y + a - 8, meio - 2, 4);
  contexto.fillRect(x + 4, y + a - 11, 6, 4);
  contexto.fillStyle = '#446044';
  contexto.fillRect(x + 4, y + a - 9, 5, 2);
  if (variacao % 2 === 0) {
    contexto.fillStyle = '#314934';
    contexto.fillRect(x + meio, y + topo + 1, 7, 4);
    contexto.fillStyle = '#526447';
    contexto.fillRect(x + meio + 2, y + topo + 1, 3, 2);
  }
  if (!detalhar) return;
  contexto.fillStyle = '#131e25';
  contexto.fillRect(x + 11, y + 7, 1, 6);
  contexto.fillRect(x + 8, y + 11, 4, 1);
  contexto.fillStyle = '#5a63514d';
  contexto.fillRect(x + 15, y + 6, 4, 1);
  contexto.fillStyle = '#607751';
  contexto.fillRect(x + 5, y + a - 13, 2, 1);
  if (variacao % 3 === 0) {
    // Samambaia rente à rocha, contida no retângulo reservado à decoração.
    const cx = x + l - 6, cy = y + a - 4;
    contexto.fillStyle = '#567044';
    contexto.fillRect(cx, cy - 9, 1, 9);
    for (let i = 0; i < 3; i++) {
      contexto.fillStyle = i % 2 ? '#394e38' : '#49663f';
      contexto.fillRect(cx - 3, cy - 8 + i * 3, 3, 1);
      contexto.fillRect(cx + 1, cy - 7 + i * 3, 3, 1);
    }
  }
}

export function desenharVegetacao(contexto, area, variacao = 0, detalhar = true) {
  const { x, y, largura: l, altura: a } = area;
  const meio = Math.floor(l / 2);
  contexto.fillStyle = '#07130f';
  contexto.fillRect(x + 4, y + a - 7, l - 8, 7);
  contexto.fillRect(x + 1, y + 7, l - 2, a - 11);
  contexto.fillRect(x + 6, y + 2, l - 12, a - 5);
  contexto.fillStyle = '#1b352b';
  contexto.fillRect(x + 3, y + 8, meio, a - 13);
  contexto.fillRect(x + meio - 2, y + 5, meio - 1, a - 10);
  contexto.fillStyle = variacao % 2 ? '#2d4b35' : '#294535';
  contexto.fillRect(x + 5, y + 6, meio - 3, 7);
  contexto.fillRect(x + meio, y + 3, meio - 6, 8);
  contexto.fillRect(x + 7, y + a - 10, l - 13, 5);
  contexto.fillStyle = '#48683f';
  contexto.fillRect(x + 7, y + 5, 6, 3);
  contexto.fillRect(x + meio + 2, y + 2, 5, 2);
  if (!detalhar) return;
  for (let i = 0; i < 8; i++) {
    const px = x + 4 + (variacao * 3 + i * 7) % (l - 8);
    const py = y + 5 + (variacao + i * 5) % (a - 10);
    contexto.fillStyle = i % 3 ? '#607d48' : '#112d24';
    contexto.fillRect(px, py, 2, 1);
    contexto.fillRect(px + 1, py - 1, 1, 1);
  }
}

// Aberturas só existem onde um trecho físico atravessa a alvenaria.
export function pedraSobreCorredor(pedra, segmentos) {
  return segmentos.some(({ inicio, fim }) => {
    const esquerda = pedra.x - FOLGA_ABERTURA;
    const direita = pedra.x + pedra.largura + FOLGA_ABERTURA;
    const topo = pedra.y - FOLGA_ABERTURA;
    const base = pedra.y + pedra.altura + FOLGA_ABERTURA;
    if (inicio.x === fim.x) return inicio.x >= esquerda && inicio.x <= direita &&
      Math.max(inicio.y, fim.y) >= topo && Math.min(inicio.y, fim.y) <= base;
    if (inicio.y === fim.y) return inicio.y >= topo && inicio.y <= base &&
      Math.max(inicio.x, fim.x) >= esquerda && Math.min(inicio.x, fim.x) <= direita;
    return false;
  });
}

export function desenharTerritorio(contexto, regiao, cor, zoom, tempo, segmentos = []) {
  const { x, y, largura, forma } = regiao;
  if (!forma) return;
  contexto.save();
  // Rocha e musgo fazem a transição entre a construção e o vazio. Não desenhamos
  // esses fragmentos sobre pisos de região nem sobre percursos reais.
  for (const parede of forma.paredes) {
    const horizontal = parede.largura > parede.altura;
    const comprimento = horizontal ? parede.largura : parede.altura;
    for (let passo = 0; passo < comprimento; passo += zoom < 0.4 ? 40 : 26) {
      for (const lado of [-1, 1]) {
        const variacao = Math.abs(Math.floor(parede.x * 3 + parede.y * 7 + passo)) % 9;
        const afastamento = 22 + variacao;
        const px = parede.x + (horizontal ? passo + variacao : lado * afastamento);
        const py = parede.y + (horizontal ? lado * afastamento : passo + variacao);
        const rocha = { x: px - 12, y: py - 10,
          largura: 25 + variacao % 3 * 3, altura: 21 + variacao % 4 * 2 };
        if (forma.faixas.some(faixa => rocha.x < faixa.x + faixa.largura &&
          rocha.x + rocha.largura > faixa.x && rocha.y < faixa.y + faixa.altura &&
          rocha.y + rocha.altura > faixa.y) || pedraSobreCorredor(rocha, segmentos)) continue;
        if (variacao % 3 === 0) desenharVegetacao(contexto, rocha, variacao, zoom >= 0.5);
        else desenharRochaMusgosa(contexto, rocha, variacao, zoom >= 0.5);
      }
    }
  }
  // A fundação é rocha bruta, não um piso pavimentado: somente salas e percursos
  // recebem lajes claras. Assim o espaço entre eles não sugere passagem livre.
  for (const faixa of forma.faixas) {
    contexto.fillStyle = '#080d10';
    contexto.fillRect(faixa.x - 9, faixa.y + 4, faixa.largura + 18, faixa.altura + 8);
    contexto.fillStyle = '#111b1e';
    contexto.fillRect(faixa.x, faixa.y, faixa.largura, faixa.altura);
    contexto.fillStyle = cor;
    contexto.globalAlpha = regiao.tipo === 'isoladas' ? 0.04 : 0.09;
    contexto.fillRect(faixa.x, faixa.y, faixa.largura, faixa.altura);
    contexto.globalAlpha = 1;
    const passo = zoom < 0.4 ? 40 : 24;
    for (let py = faixa.y + 3, linha = 0; py < faixa.y + faixa.altura - 8; py += passo, linha++) {
      for (let px = faixa.x + 3; px < faixa.x + faixa.largura - 15; px += passo) {
        const variacao = Math.abs(Math.floor(px * 3 + py * 7 + linha)) % 5;
        const rocha = { x: px + variacao, y: py + variacao,
          largura: 10, altura: 7 };
        if (pedraSobreCorredor(rocha, segmentos)) continue;
        contexto.fillStyle = '#080e12';
        contexto.fillRect(rocha.x, rocha.y + 2, 10, 5);
        contexto.fillStyle = variacao % 2 ? '#253033' : '#202b30';
        contexto.fillRect(rocha.x + 1, rocha.y, 7, 4);
        if (zoom >= 0.4) {
          contexto.fillStyle = '#39444266';
          contexto.fillRect(rocha.x + 2, rocha.y, 4, 1);
          contexto.fillStyle = regiao.tipo === 'isoladas' ? '#353b3e' : '#2c3c31';
          contexto.fillRect(rocha.x - 1, rocha.y + 5, 4, 2);
        }
      }
    }
  }
  for (const parede of forma.paredes) {
    const horizontal = parede.largura > parede.altura;
    const comprimento = horizontal ? parede.largura : parede.altura;
    const passoPedra = zoom < 0.5 ? 24 : 12;
    for (let passo = 0; passo < comprimento; passo += passoPedra) {
      const pedra = { x: parede.x + (horizontal ? passo : 0),
        y: parede.y + (horizontal ? 0 : passo),
        largura: horizontal ? Math.min(passoPedra, comprimento - passo) : parede.largura,
        altura: horizontal ? parede.altura : Math.min(passoPedra, comprimento - passo) };
      if (pedraSobreCorredor(pedra, segmentos)) continue;
      const indice = Math.floor(pedra.x + pedra.y);
      // Pedra neutra com pigmento regional, sem uma borda neon contínua.
      desenharPedra(contexto, pedra.x, pedra.y + 3, pedra.largura, pedra.altura + 3, '#252d30', indice);
      desenharPedra(contexto, pedra.x, pedra.y, pedra.largura, pedra.altura,
        regiao.tipo === 'isoladas' ? '#596068' : '#566064', indice);
      contexto.globalAlpha = 0.28;
      contexto.fillStyle = cor;
      contexto.fillRect(pedra.x + 1, pedra.y + 1,
        Math.max(1, pedra.largura - 2), Math.max(1, pedra.altura - 3));
      contexto.globalAlpha = 1;
      if (indice % 5 === 0) {
        const musgo = { x: pedra.x - 6, y: pedra.y + 9, largura: 5, altura: 4 };
        if (!pedraSobreCorredor(musgo, segmentos)) {
          contexto.fillStyle = regiao.tipo === 'isoladas' ? '#363b40' : '#2a4035';
          contexto.fillRect(musgo.x, musgo.y, musgo.largura, musgo.altura);
          contexto.fillStyle = '#333c40';
          contexto.fillRect(pedra.x + 3, pedra.y + 11, 7, 4);
        }
      }
    }
    if (zoom >= 0.45) for (let passo = 8; passo < comprimento - 12; passo += 64) {
      const pilar = { x: parede.x + (horizontal ? passo : -3),
        y: parede.y + (horizontal ? -3 : passo), largura: 13, altura: 15 };
      if (pedraSobreCorredor(pilar, segmentos)) continue;
      desenharPedra(contexto, pilar.x, pilar.y + 5, 13, 10, '#343f41', passo);
      desenharPedra(contexto, pilar.x + 1, pilar.y + 2, 11, 9, '#66716e', passo);
      contexto.fillStyle = '#929783';
      contexto.fillRect(pilar.x + 2, pilar.y, 9, 3);
      contexto.fillStyle = '#40513b';
      contexto.fillRect(pilar.x, pilar.y + 11, 4, 3);
    }
  }
  // Pilastras prendem a placa à arquitetura e distinguem o portal de entrada.
  const alturaPilar = regiao.tipo === 'entrada' ? 28 : 18;
  const larguraPlaca = Math.min(largura - 36, LARGURA_MAXIMA_PLACA);
  const inicioPlaca = x + (largura - larguraPlaca) / 2;
  for (const px of [inicioPlaca - 6, inicioPlaca + larguraPlaca - 2]) {
    desenharPedra(contexto, px, y - 4, 8, alturaPilar, '#687071', 0);
    if (zoom >= 0.55 && regiao.tipo !== 'isoladas') {
      contexto.fillStyle = '#080d10';
      contexto.fillRect(px - 2, y + alturaPilar + 8, 12, 26);
      contexto.fillStyle = cor;
      contexto.fillRect(px, y + alturaPilar + 9, 8, 21);
      contexto.fillStyle = '#ffffff35';
      contexto.fillRect(px + 2, y + alturaPilar + 11, 1, 15);
      contexto.fillStyle = '#ac9462';
      contexto.fillRect(px - 2, y + alturaPilar + 8, 12, 2);
    }
    if (zoom >= 0.35) desenharTocha(contexto, px + 4, y + alturaPilar + 6, tempo);
  }
  contexto.restore();
}

export function desenharAlvenariaSala(contexto, sala, cor, detalhar) {
  const { x, y, largura, altura } = sala;
  contexto.save();
  contexto.fillStyle = '#080e11';
  contexto.fillRect(x - 6, y - 6, largura + 12, 6);
  contexto.fillRect(x - 4, y + altura, largura + 8, 6);
  contexto.fillRect(x - 6, y, 6, altura);
  contexto.fillRect(x + largura, y, 6, altura);
  const passoParede = detalhar ? 16 : 24;
  for (let px = x - 4; px < x + largura + 4; px += passoParede) {
    const tamanho = Math.min(passoParede, x + largura + 4 - px);
    desenharPedra(contexto, px, y - 6, tamanho, 6, '#65706b', px);
    desenharPedra(contexto, px, y + altura, tamanho, 6, '#46504f', px + 1);
  }
  for (let py = y; py < y + altura; py += passoParede) {
    const tamanho = Math.min(passoParede, y + altura - py);
    desenharPedra(contexto, x - 6, py, 6, tamanho, '#64706c', py);
    desenharPedra(contexto, x + largura, py, 6, tamanho, '#424d4c', py + 1);
  }
  // A cor original continua sinalizando a sala; pedra neutra e a sombra interna
  // dão volume à parede sem engrossá-la sobre o espaço caminhável.
  contexto.fillStyle = cor;
  contexto.fillRect(x - 3, y - 2, largura + 6, 1);
  contexto.fillRect(x - 2, y, 1, altura);
  contexto.fillStyle = '#050b1138';
  contexto.fillRect(x, y, largura, 4);
  contexto.fillRect(x, y + 4, 4, altura - 4);
  contexto.fillStyle = '#ffffff18';
  contexto.fillRect(x + 4, y + altura - 2, largura - 8, 1);
  contexto.fillRect(x + largura - 2, y + 4, 1, altura - 8);
  // Pedra sombreada mantém as cores de complexidade, com menos aspecto de tinta plana.
  contexto.fillStyle = '#0b162026';
  for (let py = y + 20; py < y + altura - 4; py += 32) {
    contexto.fillRect(x + 4, py, largura - 8, Math.min(32, y + altura - 4 - py));
  }
  if (detalhar) {
    for (let py = y + 21, linha = 0; py < y + altura - 4; py += 16, linha++) {
      for (let px = x + 4 - linha % 2 * 14, coluna = 0; px < x + largura - 4; px += 28, coluna++) {
        const esquerda = Math.max(x + 4, px);
        const larguraLaje = Math.min(px + 27, x + largura - 4) - esquerda;
        const alturaLaje = Math.min(15, y + altura - 4 - py);
        if (larguraLaje <= 0 || alturaLaje <= 0) continue;
        const variante = (linha * 7 + coluna * 3 + Math.floor(x + y)) % 5;
        contexto.fillStyle = TONS_LAJES[variante];
        contexto.fillRect(esquerda, py, larguraLaje, alturaLaje);
        contexto.fillStyle = '#070e144a';
        contexto.fillRect(esquerda, py + alturaLaje - 1, larguraLaje, 1);
        contexto.fillRect(esquerda, py, 1, alturaLaje);
        contexto.fillStyle = '#fff1c823';
        contexto.fillRect(esquerda + 1, py, Math.max(0, larguraLaje - 2), 1);
        if (variante < 2 && larguraLaje >= 14 && alturaLaje >= 9) {
          contexto.fillStyle = '#10182040';
          contexto.fillRect(esquerda + 5, py + 4, 6, 1);
          contexto.fillRect(esquerda + 10, py + 5, 1, 3);
          contexto.fillRect(esquerda + 11, py + 7, 3, 1);
          contexto.fillStyle = '#f9e9bd16';
          contexto.fillRect(esquerda + 6, py + 5, 3, 1);
        }
      }
    }
    // Pequenas imperfeições deixam o piso menos uniforme sem cobrir o nome ou
    // o centro reservado à criatura, ao personagem e aos marcadores.
    for (const [px, py] of [[x + 8, y + altura - 19], [x + largura - 17, y + 26]]) {
      contexto.fillStyle = '#00000028';
      contexto.fillRect(px, py, 8, 1);
      contexto.fillRect(px + 5, py + 1, 1, 4);
      contexto.fillRect(px + 5, py + 5, 4, 1);
      contexto.fillStyle = '#ffffff14';
      contexto.fillRect(px, py + 1, 4, 1);
    }
    contexto.fillStyle = '#050c1026';
    contexto.fillRect(x + 4, y + altura - 4, largura - 8, 3);
    contexto.fillRect(x + largura - 4, y + 19, 3, altura - 23);
    // Rebaixos na pedra ficam junto à margem; o centro continua reservado à
    // criatura, ao personagem e aos sinais estruturais.
    for (const px of [x + 6, x + largura - 10]) {
      contexto.fillStyle = '#00000033';
      contexto.fillRect(px, y + 22, 4, 5);
      contexto.fillStyle = '#ffffff22';
      contexto.fillRect(px + 1, y + 23, 2, 1);
    }
    // Friso gravado no piso, sem representar um novo objeto ou obstáculo.
    contexto.fillStyle = '#f5dfad16';
    for (let px = x + 14; px < x + largura - 14; px += 8) {
      contexto.fillRect(px, y + altura - 9, 3, 1);
    }
    for (const px of [x - 2, x + largura + 1]) {
      contexto.fillStyle = '#b4ada0';
      contexto.fillRect(px, y - 3, 2, 2);
      contexto.fillStyle = '#202b2d';
      contexto.fillRect(px, y + altura + 2, 2, 2);
    }
    if (Math.floor(x / 10 + y / 10) % 3 === 0) {
      // Teia discreta no canto, longe da inscrição e da área central da sala.
      const tx = x + 4, ty = y + altura - 5;
      contexto.fillStyle = '#c8d0bf38';
      for (let i = 0; i < 12; i++) {
        contexto.fillRect(tx + i, ty - i, 1, 1);
        if (i < 9) contexto.fillRect(tx + i, ty - Math.floor(i / 3), 1, 1);
        if (i < 9) contexto.fillRect(tx + Math.floor(i / 3), ty - i, 1, 1);
      }
      contexto.fillStyle = '#c8d0bf26';
      for (const tamanho of [5, 9]) for (let i = 0; i <= tamanho; i++) {
        contexto.fillRect(tx + i, ty - tamanho + i, 1, 1);
      }
    }
  }
  if (sala.ehSalaInicial) {
    const tapete = { x: x + largura / 2 - 16, y: y + 23, largura: 32, altura: Math.max(0, altura - 29) };
    contexto.fillStyle = '#271d1c66';
    contexto.fillRect(tapete.x - 2, tapete.y + 2, 36, tapete.altura);
    contexto.fillStyle = '#672d29';
    contexto.fillRect(tapete.x, tapete.y, tapete.largura, tapete.altura);
    contexto.fillStyle = '#903b30';
    contexto.fillRect(tapete.x + 5, tapete.y, 22, tapete.altura);
    contexto.fillStyle = '#b79353';
    for (const px of [tapete.x + 2, tapete.x + 29]) contexto.fillRect(px, tapete.y, 1, tapete.altura);
    if (detalhar) {
      for (let py = tapete.y + 5; py < tapete.y + tapete.altura - 3; py += 10) {
        contexto.fillStyle = '#d4ae6044';
        contexto.fillRect(tapete.x + 14, py, 4, 1);
        contexto.fillRect(tapete.x + 15, py - 1, 2, 3);
      }
      contexto.fillStyle = '#b09c6a';
      for (let px = tapete.x + 2; px < tapete.x + 32; px += 4)
        contexto.fillRect(px, tapete.y + tapete.altura, 1, 2);
    }
  }
  contexto.restore();
}

export function desenharPlacaRegiao(contexto, regiao, cor, zoom) {
  const largura = Math.min(regiao.largura - 36, LARGURA_MAXIMA_PLACA);
  const x = regiao.x + (regiao.largura - largura) / 2;
  const y = regiao.y + 9;
  const altura = Math.min(44, Math.max(20, regiao.ancora.y - y - 8));
  const fonte = Math.min(26, 11 / zoom);
  contexto.save();
  contexto.fillStyle = '#060b0e';
  contexto.fillRect(x + 2, y + 3, largura, altura);
  contexto.fillStyle = '#11191d';
  contexto.fillRect(x, y, largura, altura);
  // Tábuas escurecidas e ferragens ficam sob a inscrição, sem novos símbolos.
  contexto.fillStyle = '#362d2366';
  for (let py = y + 3; py < y + altura - 3; py += 8) {
    contexto.fillRect(x + 4, py, largura - 8, Math.min(6, y + altura - 3 - py));
    contexto.fillStyle = '#78654816';
    contexto.fillRect(x + 8, py, largura - 16, 1);
    contexto.fillStyle = '#362d2366';
  }
  contexto.fillStyle = '#635942';
  contexto.fillRect(x + 2, y + 1, largura - 4, 2);
  contexto.fillStyle = '#080d10';
  contexto.fillRect(x + 2, y + altura - 3, largura - 4, 2);
  contexto.strokeStyle = cor;
  contexto.lineWidth = 2;
  contexto.strokeRect(x, y, largura, altura);
  contexto.font = `bold ${fonte}px "JetBrains Mono", monospace`;
  contexto.textAlign = 'center';
  contexto.fillStyle = '#f3e6cb';
  const linhas = [''];
  for (const palavra of regiao.titulo.split(' ')) {
    const indice = linhas.length - 1;
    const tentativa = `${linhas[indice]} ${palavra}`.trim();
    if (linhas[indice] && contexto.measureText(tentativa).width > largura - 12 &&
        linhas.length < 2 && altura >= 36) linhas.push(palavra);
    else linhas[indice] = tentativa;
  }
  const fonteFinal = Math.min(fonte, (altura - 10) / linhas.length - 1);
  contexto.font = `bold ${fonteFinal}px "JetBrains Mono", monospace`;
  // A placa cabe no próprio setor, inclusive ao afastar. Nunca segue a câmera.
  for (let indice = 0; indice < linhas.length; indice++) {
    let titulo = linhas[indice];
    while (titulo.length > 1 && contexto.measureText(titulo).width > largura - 12) {
      titulo = titulo.replace(/…$/, '').slice(0, -1) + '…';
    }
    contexto.fillText(titulo, x + largura / 2,
      y + fonteFinal + 5 + indice * (fonteFinal + 1));
  }
  if (linhas.length === 1 && altura >= 36 && zoom >= 0.55) {
    contexto.font = `${Math.min(11, 9 / zoom)}px "JetBrains Mono", monospace`;
    contexto.fillStyle = cor;
    const quantidade = regiao.membros.length;
    contexto.fillText(`${quantidade} ${quantidade === 1 ? 'sala' : 'salas'}`,
      x + largura / 2, y + altura - 6);
  }
  for (const px of [x + 3, x + largura - 8]) for (const py of [y + 3, y + altura - 8]) {
    contexto.fillStyle = '#0a1013';
    contexto.fillRect(px, py, 5, 5);
    contexto.fillStyle = '#7e8174';
    contexto.fillRect(px + 1, py + 1, 3, 3);
    contexto.fillStyle = '#cfbf99';
    contexto.fillRect(px + 1, py + 1, 1, 1);
  }
  contexto.restore();
}
