// Ponto de entrada da aplicação.
// Orquestra o pipeline completo: entrada de código, análise, geração da
// masmorra, renderização do jogo e atualização da interface.

import { analisarFuncoes } from './analisadorC.js';
import { construirMasmorra } from './masmorra.js';
import { iniciarJogo, pararJogo } from './jogo.js';
import { exibirTelaDeJogo, exibirTelaDeConfiguracao, atualizarPainelDeSala } from './interface.js';

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
  const entradaCodigo = document.getElementById('entrada-codigo');
  entradaCodigo.value = codigoPadrao;

  document.getElementById('botao-gerar').addEventListener('click', () => aoClicarEmGerar(entradaCodigo));
  document.getElementById('botao-voltar').addEventListener('click', aoClicarEmVoltar);
}

function aoClicarEmGerar(entradaCodigo) {
  const funcoes = analisarFuncoes(entradaCodigo.value);

  if (funcoes.length === 0) {
    alert('Não consegui encontrar funções nesse código. Confira se está no formato padrão de C.');
    return;
  }

  const salas = construirMasmorra(funcoes);
  exibirTelaDeJogo();
  atualizarPainelDeSala(null);
  iniciarJogo(salas, atualizarPainelDeSala);
}

function aoClicarEmVoltar() {
  pararJogo();
  exibirTelaDeConfiguracao();
}