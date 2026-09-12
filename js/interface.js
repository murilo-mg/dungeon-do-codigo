// Responsável por toda a manipulação de DOM relacionada à interface
// (alternância de telas e painel de informações da sala atual).

const TAMANHO_MAXIMO_TRECHO = 500;

export function exibirTelaDeJogo() {
  document.getElementById('painel-configuracao').style.display = 'none';
  document.getElementById('area-jogo').style.display = 'flex';
}

export function exibirTelaDeConfiguracao() {
  document.getElementById('area-jogo').style.display = 'none';
  document.getElementById('painel-configuracao').style.display = 'block';
}

export function atualizarPainelDeSala(sala) {
  const painelInfo = document.getElementById('info-sala');

  if (!sala) {
    painelInfo.innerHTML = '<p class="vazio">Ande até uma sala para inspecionar a função.</p>';
    return;
  }

  const nivelDePerigo = obterNivelDePerigo(sala.complexidade);
  const trechoDeCodigo = prepararTrechoParaExibicao(sala.textoCompleto);

  painelInfo.innerHTML = `
    <div class="linha-estatistica"><b>${sala.nome}()</b></div>
    <div class="linha-estatistica">Linhas de corpo: <b>${sala.linhas}</b></div>
    <div class="linha-estatistica">Estruturas de controle: <b>${sala.estruturasControle}</b></div>
    <div class="linha-estatistica">Nível de perigo: <b>${nivelDePerigo}</b></div>
    <pre>${trechoDeCodigo}</pre>
  `;
}

function obterNivelDePerigo(complexidade) {
  if (complexidade <= 2) return 'baixo';
  if (complexidade <= 6) return 'médio';
  return 'alto';
}

function prepararTrechoParaExibicao(textoCompleto) {
  const textoEscapado = escaparHtml(textoCompleto.slice(0, TAMANHO_MAXIMO_TRECHO));
  const foiCortado = textoCompleto.length > TAMANHO_MAXIMO_TRECHO;
  return foiCortado ? `${textoEscapado}\n...` : textoEscapado;
}

function escaparHtml(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}