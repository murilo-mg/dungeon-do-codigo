// Ponto de entrada da aplicação.
// Orquestra o pipeline completo: entrada de código, análise, geração da
// masmorra, renderização do jogo e atualização da interface.

import { analisarFuncoes, ErroAnaliseC } from './analisadorC.js';
import { criarGrafo, obterEstruturaDaFuncao } from './grafoC.js';
import { construirMasmorra } from './masmorra.js';
import { validarArquivoC } from './entradaCodigo.js';
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

let sequenciaImportacao = 0;

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
  inicializarBuscaFuncoes();
  configurarImportacaoCodigo(aoSelecionarArquivos, () => { sequenciaImportacao++; });
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
  document.getElementById('botao-voltar').addEventListener('click', aoClicarEmVoltar);
}

async function aoSelecionarArquivos(arquivos) {
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

function aoClicarEmGerar(entradaCodigo) {
  sequenciaImportacao++;
  limparErroEntrada();

  if (!entradaCodigo.value.trim()) {
    mostrarErroEntrada('Cole um código em C antes de gerar a dungeon.');
    entradaCodigo.focus({ preventScroll: true });
    return;
  }

  let funcoes;

  try {
    funcoes = analisarFuncoes(entradaCodigo.value);
  } catch (erro) {
    if (!(erro instanceof ErroAnaliseC)) throw erro;

    mostrarErroEntrada(`Não foi possível analisar o código. ${erro.message}`);

    entradaCodigo.focus({ preventScroll: true });
    return;
  }

  if (funcoes.length === 0) {
    mostrarErroEntrada(
      'Não consegui encontrar funções nesse código. Confira se está no formato padrão de C.'
    );
    return;
  }

  const grafo = criarGrafo(funcoes);
  const masmorra = construirMasmorra(funcoes, grafo);

  exibirTelaDeJogo();
  atualizarPainelDeSala(null);
  function mostrarSala(sala) {
    atualizarPainelDeSala(sala, sala ? obterEstruturaDaFuncao(grafo, sala.nome) : null,
      selecionarFuncao);
  }
  function selecionarFuncao(nome) {
    if (!grafo.nos.has(nome)) return;
    const sala = focarSala(nome);
    if (sala) mostrarSala(sala);
  }
  configurarBuscaFuncoes(grafo.nos.keys(), selecionarFuncao);
  iniciarJogo(masmorra, grafo.arestas, mostrarSala, atualizarEstadoControles,
    atualizarZoomCamera);
  atualizarZoomCamera(1);
  atualizarModoVisual('complexidade');
}

function aoClicarEmVoltar() {
  pararJogo();
  atualizarModoVisual('complexidade');
  limparBuscaFuncoes();
  exibirTelaDeConfiguracao();
}
