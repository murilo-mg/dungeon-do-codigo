// Ponto de entrada da aplicação.
// Orquestra o pipeline completo: entrada de código, análise, geração da
// masmorra, renderização do jogo e atualização da interface.

import { calcularContextoTopologico, obterEstruturaDaFuncao } from './grafoC.js';
import { validarArquivoC, validarCodigoC } from './entradaCodigo.js';
import { inicializarDecoracaoEntrada } from './entradaDungeon.js';
import { afastarCamera, aproximarCamera, encaixarMasmorra, focarSala,
  iniciarJogo, pararJogo, restaurarZoomCamera, selecionarModoVisual } from './jogo.js';
import {
  atualizarEstadoControles, exibirTelaDeJogo, exibirTelaDeConfiguracao,
  atualizarPainelDeSala, inicializarBuscaFuncoes, configurarBuscaFuncoes,
  limparBuscaFuncoes,
  configurarControlesCamera, atualizarZoomCamera,
  configurarModosVisuais, atualizarModoVisual,
  configurarImportacaoCodigo, limparErroEntrada, mostrarErroEntrada,
  mostrarArquivoImportado,
} from './interface.js';

import { criarProcessadorDungeon } from './processadorDungeon.js';

let sequenciaImportacao = 0;
let sequenciaGeracao = 0;
const processador = criarProcessadorDungeon();

function atualizarPreparacao(ativa) {
  const botao = document.getElementById('botao-gerar');
  botao.disabled = ativa;
  botao.textContent = ativa ? 'Preparando dungeon…' : 'Gerar dungeon';
  document.getElementById('botao-cancelar').hidden = !ativa;
  document.getElementById('status-geracao').textContent = ativa ? 'Analisando e preparando o mapa…' : '';
  document.getElementById('painel-configuracao').setAttribute('aria-busy', String(ativa));
}

function cancelarPreparacao() {
  sequenciaGeracao++;
  processador.cancelar();
  atualizarPreparacao(false);
}

const codigoPadrao = `#include <stdio.h>
#include <stdlib.h>

#define MAX_PRODUTOS 100

typedef struct {
    int codigo;
    char nome[50];
    int quantidade;
    float preco;
} Produto;

void exibir_menu() {
    printf("\\n====================================\\n");
    printf("    GERENCIADOR DE ESTOQUE (C)\\n");
    printf("====================================\\n");
    printf("1. Cadastrar Produto\\n");
    printf("2. Listar Produtos\\n");
    printf("3. Buscar Produto por Codigo\\n");
    printf("4. Sair\\n");
    printf("Opcao: ");
}

void cadastrar_produto(Produto lista[], int *total) {
    if (*total >= MAX_PRODUTOS) {
        printf("\\nErro: Estoque cheio!\\n");
        return;
    }
    Produto p;
    printf("Codigo: ");
    scanf("%d", &p.codigo);
    printf("Nome: ");
    scanf(" %[^\\n]", p.nome);
    printf("Quantidade: ");
    scanf("%d", &p.quantidade);
    printf("Preco: ");
    scanf("%f", &p.preco);
    lista[*total] = p;
    (*total)++;
    printf("\\nProduto cadastrado com sucesso!\\n");
}

void listar_produtos(Produto lista[], int total) {
    if (total == 0) {
        printf("\\nNenhum produto cadastrado no estoque.\\n");
        return;
    }
    for (int i = 0; i < total; i++) {
        printf("Codigo: %d | Nome: %s\\n", lista[i].codigo, lista[i].nome);
    }
}

void buscar_produto(Produto lista[], int total) {
    if (total == 0) {
        printf("\\nNenhum produto cadastrado no estoque para buscar.\\n");
        return;
    }
    int codigo_busca;
    printf("Digite o codigo do produto: ");
    scanf("%d", &codigo_busca);
    for (int i = 0; i < total; i++) {
        if (lista[i].codigo == codigo_busca) {
            printf("Produto Encontrado\\n");
            return;
        }
    }
    printf("Produto nao encontrado.\\n");
}

int main() {
    Produto estoque[MAX_PRODUTOS];
    int total_produtos = 0;
    int opcao;
    do {
        exibir_menu();
        scanf("%d", &opcao);
        switch (opcao) {
            case 1: cadastrar_produto(estoque, &total_produtos); break;
            case 2: listar_produtos(estoque, total_produtos); break;
            case 3: buscar_produto(estoque, total_produtos); break;
            case 4: printf("Saindo\\n"); break;
            default: printf("Opcao invalida\\n");
        }
    } while (opcao != 4);
    return 0;
}`;

document.addEventListener('DOMContentLoaded', inicializarAplicacao);

function inicializarAplicacao() {
  inicializarDecoracaoEntrada();
  inicializarBuscaFuncoes();
  configurarImportacaoCodigo(aoSelecionarArquivos, () => { sequenciaImportacao++; cancelarPreparacao(); });
  configurarControlesCamera({
    aoAfastar: afastarCamera,
    aoRestaurar: restaurarZoomCamera,
    aoAproximar: aproximarCamera,
    aoEncaixar: encaixarMasmorra,
  });
  configurarModosVisuais(selecionarModoVisual);
  atualizarModoVisual('complexidade');
  const entradaCodigo = document.getElementById('entrada-codigo');
  entradaCodigo.value = codigoPadrao;

  document.getElementById('botao-gerar').addEventListener('click', () => aoClicarEmGerar(entradaCodigo));
  document.getElementById('botao-cancelar').addEventListener('click', cancelarPreparacao);
  document.getElementById('botao-voltar').addEventListener('click', aoClicarEmVoltar);
}

async function aoSelecionarArquivos(arquivos) {
  cancelarPreparacao();
  const tentativa = ++sequenciaImportacao;
  if (arquivos.length !== 1) {
    mostrarErroEntrada('Selecione apenas um arquivo .c por vez.');
    return;
  }
  const arquivo = arquivos[0];
  const erro = validarArquivoC(arquivo);
  if (erro) {
    mostrarErroEntrada(erro);
    return;
  }
  try {
    const conteudo = await arquivo.text();
    if (tentativa !== sequenciaImportacao) return;
    const erroConteudo = validarCodigoC(conteudo);
    if (erroConteudo && conteudo.trim()) { mostrarErroEntrada(erroConteudo); return; }
    if (!conteudo.trim()) {
      mostrarErroEntrada('O arquivo está vazio.');
      return;
    }
    mostrarArquivoImportado(conteudo, arquivo.name);
  } catch {
    if (tentativa === sequenciaImportacao) {
      mostrarErroEntrada('Não foi possível ler o arquivo.');
    }
  }
}

async function aoClicarEmGerar(entradaCodigo) {
  sequenciaImportacao++;
  cancelarPreparacao();
  limparErroEntrada();
  const erroEntrada = validarCodigoC(entradaCodigo.value);
  if (erroEntrada) {
    mostrarErroEntrada(erroEntrada);
    entradaCodigo.focus({ preventScroll: true });
    return;
  }
  const tentativa = ++sequenciaGeracao;
  atualizarPreparacao(true);
  let grafo, masmorra;
  try {
    ({ grafo, masmorra } = await processador.executar(entradaCodigo.value));
  } catch (erro) {
    if (tentativa !== sequenciaGeracao || erro.tipo === 'cancelado') return;
    mostrarErroEntrada(erro.message);
    entradaCodigo.focus({ preventScroll: true });
    return;
  } finally {
    if (tentativa === sequenciaGeracao) atualizarPreparacao(false);
  }
  if (tentativa !== sequenciaGeracao) return;

  exibirTelaDeJogo();
  atualizarPainelDeSala(null);
  function mostrarSala(sala) {
    atualizarPainelDeSala(sala, sala ? obterEstruturaDaFuncao(grafo, sala.nome) : null,
      selecionarFuncao);
  }
  function selecionarFuncao(nome) {
    if (!grafo.nos.has(nome)) return;
    const sala = focarSala(nome, calcularContextoTopologico(grafo, nome));
    if (sala) mostrarSala(sala);
    return sala;
  }
  configurarBuscaFuncoes(grafo.nos.keys(), selecionarFuncao);
  iniciarJogo(masmorra, grafo.arestas, mostrarSala, atualizarEstadoControles,
    atualizarZoomCamera, selecionarFuncao);
  atualizarZoomCamera(1);
  atualizarModoVisual('complexidade');
}

function aoClicarEmVoltar() {
  cancelarPreparacao();
  pararJogo();
  atualizarModoVisual('complexidade');
  limparBuscaFuncoes();
  exibirTelaDeConfiguracao();
}
