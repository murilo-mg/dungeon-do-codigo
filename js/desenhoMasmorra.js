// Materiais decorativos do Canvas. Não criam colisões nem relações entre salas.
import { PALETA } from './pixelArt.js';
import { LARGURA_CORREDOR } from './corredores.js';

const FOLGA_ABERTURA = LARGURA_CORREDOR / 2 + 2;
const LARGURA_MAXIMA_PLACA = 260;

export function desenharGalerias(contexto, passagens, zoom) {
  contexto.save();
  contexto.lineCap = 'square';
  contexto.lineJoin = 'miter';
  for (const [largura, cor] of [[LARGURA_CORREDOR + 8, '#102c30'], [LARGURA_CORREDOR, '#345455']]) {
    contexto.lineWidth = largura;
    contexto.strokeStyle = cor;
    for (const trecho of passagens) {
      contexto.beginPath();
      contexto.moveTo(trecho.inicio.x, trecho.inicio.y);
      contexto.lineTo(trecho.fim.x, trecho.fim.y);
      contexto.stroke();
    }
  }
  // Marcas quadradas distinguem circulação mesmo sem distinguir as cores.
  const raio = LARGURA_CORREDOR / 2;
  for (const { inicio, fim } of passagens) {
    const horizontal = inicio.y === fim.y;
    const comprimento = Math.abs(fim.x - inicio.x) + Math.abs(fim.y - inicio.y);
    for (let passo = 8; passo < comprimento; passo += zoom < 0.5 ? 24 : 16) {
      const x = inicio.x + (fim.x - inicio.x) * passo / comprimento;
      const y = inicio.y + (fim.y - inicio.y) * passo / comprimento;
      if (zoom >= 0.65) {
        // Juntas e pedras laterais mantêm a galeria na escala da alvenaria.
        contexto.fillStyle = '#172f3266';
        contexto.fillRect(horizontal ? x : x - raio + 2, horizontal ? y - raio + 2 : y,
          horizontal ? 1 : LARGURA_CORREDOR - 4, horizontal ? LARGURA_CORREDOR - 4 : 1);
        contexto.fillStyle = '#547073';
        for (const lado of [-1, 1]) contexto.fillRect(
          horizontal ? x - 4 : x + lado * (raio + 2) - 1,
          horizontal ? y + lado * (raio + 2) - 1 : y - 4,
          horizontal ? 8 : 2, horizontal ? 2 : 8);
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
  const raio = LARGURA_CORREDOR / 2;
  contexto.fillStyle = exploracao ? '#345455' : '#807963';
  contexto.fillRect(ponto.x - (vertical ? 5 : raio), ponto.y - (vertical ? raio : 5),
    vertical ? 10 : LARGURA_CORREDOR, vertical ? LARGURA_CORREDOR : 10);
  contexto.fillStyle = '#332c25';
  contexto.fillRect(ponto.x - (vertical ? 1 : raio), ponto.y - (vertical ? raio : 1),
    vertical ? 2 : LARGURA_CORREDOR, vertical ? LARGURA_CORREDOR : 2);
  for (const lado of [-1, 1]) {
    const x = ponto.x + (vertical ? 0 : lado * (raio + 5));
    const y = ponto.y + (vertical ? lado * (raio + 5) : 0);
    desenharPedra(contexto, x - 4, y - 4, 8, 8, exploracao ? '#96b3a6' : '#91826a', lado);
    if (iluminado && lado === -1) desenharTocha(contexto, x, y - 1, tempo);
  }
}

export function desenharTocha(contexto, x, y, tempo = 0) {
  const chama = tempo ? Math.floor(tempo * 5 + x) % 2 : 0;
  contexto.save();
  contexto.fillStyle = '#e9822f';
  const opacidade = contexto.globalAlpha;
  contexto.globalAlpha = opacidade * 0.025;
  contexto.fillRect(x - 32, y - 29, 64, 56);
  contexto.globalAlpha = opacidade * 0.045;
  contexto.fillRect(x - 22, y - 23, 44, 42);
  contexto.globalAlpha = opacidade * 0.08;
  contexto.fillRect(x - 12, y - 15, 24, 28);
  contexto.restore();
  contexto.fillStyle = '#101416';
  contexto.fillRect(x - 4, y - 2, 8, 12);
  contexto.fillStyle = '#887253';
  contexto.fillRect(x - 2, y, 4, 9);
  contexto.fillStyle = PALETA.brasa;
  contexto.fillRect(x - 4, y - 9 - chama, 8, 10 + chama);
  contexto.fillStyle = '#ffc568';
  contexto.fillRect(x - 2, y - 7 - chama, 4, 7 + chama);
  contexto.fillStyle = '#fff0b0';
  contexto.fillRect(x - 1, y - 4, 2, 4);
}

function desenharPedra(contexto, x, y, largura, altura, cor, indice) {
  contexto.fillStyle = '#101517';
  contexto.fillRect(x, y, largura, altura);
  contexto.fillStyle = cor;
  contexto.fillRect(x + 1, y + 1, largura - 2, altura - 3);
  contexto.save();
  contexto.globalAlpha *= indice % 3 === 0 ? 0.22 : 0.1;
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(x + 2, y + 1, largura - 4, 2);
  contexto.restore();
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
    for (let passo = 0; passo < comprimento; passo += zoom < 0.4 ? 40 : 24) {
      for (const lado of [-1, 1]) {
        const px = parede.x + (horizontal ? passo : lado * 13);
        const py = parede.y + (horizontal ? lado * 13 : passo);
        const rocha = { x: px - 6, y: py - 5, largura: 16, altura: 13 };
        if (forma.faixas.some(faixa => rocha.x < faixa.x + faixa.largura &&
          rocha.x + rocha.largura > faixa.x && rocha.y < faixa.y + faixa.altura &&
          rocha.y + rocha.altura > faixa.y) || pedraSobreCorredor(rocha, segmentos)) continue;
        const variacao = Math.abs(Math.floor(px * 3 + py * 7)) % 4;
        contexto.fillStyle = '#080e11';
        contexto.fillRect(px - 8, py + 1, 20, 11);
        contexto.fillStyle = variacao % 2 ? '#273339' : '#202c32';
        contexto.fillRect(px - 6, py - 4, 15, 12);
        contexto.fillStyle = '#3a484d';
        contexto.fillRect(px - 4, py - 5, 10, 3);
        contexto.fillStyle = regiao.tipo === 'isoladas' ? '#434748' : '#344b38';
        contexto.fillRect(px - 8, py + 4, 7 + variacao, 5);
        contexto.fillStyle = '#101b20';
        contexto.fillRect(px + 3, py - 1, 2, 7);
      }
    }
  }
  // A fundação irregular segue as fileiras de salas. Não amplia a área caminhável.
  for (const faixa of forma.faixas) {
    contexto.fillStyle = '#080d10';
    contexto.fillRect(faixa.x - 9, faixa.y + 4, faixa.largura + 18, faixa.altura + 8);
    contexto.fillStyle = '#192023';
    contexto.fillRect(faixa.x, faixa.y, faixa.largura, faixa.altura);
    contexto.fillStyle = cor;
    contexto.globalAlpha = regiao.tipo === 'isoladas' ? 0.09 : 0.23;
    contexto.fillRect(faixa.x, faixa.y, faixa.largura, faixa.altura);
    contexto.globalAlpha = 1;
    const passo = zoom < 0.4 ? 32 : 16;
    for (let py = faixa.y + 2, linha = 0; py < faixa.y + faixa.altura; py += passo, linha++) {
      for (let px = faixa.x + 2; px < faixa.x + faixa.largura - 2; px += passo) {
        contexto.fillStyle = (linha + Math.floor(px / passo)) % 3 ? '#00000018' : '#ffffff05';
        contexto.fillRect(px, py, Math.min(passo - 2, faixa.x + faixa.largura - px),
          Math.min(passo - 2, faixa.y + faixa.altura - py));
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
      contexto.globalAlpha = 0.38;
      contexto.fillStyle = cor;
      contexto.fillRect(pedra.x + 1, pedra.y + 2, Math.max(1, pedra.largura - 2), 3);
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
  contexto.fillStyle = '#111719';
  contexto.fillRect(x - 4, y - 4, largura + 8, 4);
  contexto.fillRect(x - 4, y + altura, largura + 8, 6);
  contexto.fillRect(x - 4, y, 4, altura);
  contexto.fillRect(x + largura, y, 4, altura);
  contexto.fillStyle = '#ffffff24';
  contexto.fillRect(x + 2, y + 1, largura - 4, 2);
  contexto.fillRect(x + 1, y + 2, 2, altura - 4);
  if (detalhar) {
    for (let py = y + 21, linha = 0; py < y + altura - 4; py += 12, linha++) {
      contexto.fillStyle = '#00000025';
      contexto.fillRect(x + 4, py, largura - 8, 1);
      for (let px = x + 8 + linha % 2 * 12; px < x + largura - 4; px += 24) {
        contexto.fillRect(px, py, 1, Math.min(12, y + altura - 4 - py));
      }
    }
    for (let px = x; px < x + largura; px += 16) {
      desenharPedra(contexto, px, y - 4, Math.min(16, x + largura - px), 5, cor, px);
      desenharPedra(contexto, px, y + altura, Math.min(16, x + largura - px), 5, cor, px + 1);
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
  }
  if (sala.ehSalaInicial) {
    contexto.fillStyle = '#762e26';
    contexto.fillRect(x + largura / 2 - 13, y + altura - 17, 26, 13);
    contexto.fillStyle = '#c99b46';
    contexto.fillRect(x + largura / 2 - 13, y + altura - 17, 2, 13);
    contexto.fillRect(x + largura / 2 + 11, y + altura - 17, 2, 13);
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
  contexto.fillStyle = cor;
  contexto.fillRect(x + 3, y + 3, 2, 2);
  contexto.fillRect(x + largura - 5, y + 3, 2, 2);
  contexto.restore();
}
