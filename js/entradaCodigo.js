export const LIMITE_ARQUIVO_C = 512 * 1024;
export const LIMITE_FUNCOES = 64;
export const LIMITE_CHAMADAS = 256;
export const LIMITE_NOME_FUNCAO = 128;

export function validarCodigoC(codigo) {
  if (typeof codigo !== 'string') return 'A entrada deve ser texto em C.';
  // O corte por comprimento evita alocar um segundo texto desnecessariamente.
  if (codigo.length > LIMITE_ARQUIVO_C ||
      new TextEncoder().encode(codigo).byteLength > LIMITE_ARQUIVO_C) {
    return 'Código muito grande. O limite é 512 KiB, inclusive para texto colado.';
  }
  if (!codigo.trim()) return 'Cole um código em C antes de gerar a dungeon.';
  return null;
}

export function validarFuncoes(funcoes) {
  if (funcoes.length > LIMITE_FUNCOES) {
    return `O limite desta versão é ${LIMITE_FUNCOES} funções. Experimente um trecho menor.`;
  }
  const nomes = new Set();
  let chamadas = 0;
  for (const funcao of funcoes) {
    if (funcao.nome.length > LIMITE_NOME_FUNCAO) {
      return `Nomes de função devem ter até ${LIMITE_NOME_FUNCAO} caracteres.`;
    }
    if (nomes.has(funcao.nome)) return 'Há definições repetidas de uma função. Use nomes únicos.';
    nomes.add(funcao.nome);
    chamadas += funcao.chamadas.length;
  }
  if (chamadas > LIMITE_CHAMADAS) {
    return `O limite desta versão é ${LIMITE_CHAMADAS} relações de chamada. Experimente um trecho menor.`;
  }
  return null;
}

export function validarArquivoC(arquivo) {
  if (!arquivo || !/^.+\.c$/i.test(arquivo.name)) {
    return 'Selecione um arquivo com extensão .c.';
  }
  if (!Number.isSafeInteger(arquivo.size) || arquivo.size < 0) {
    return 'Não foi possível verificar o tamanho do arquivo.';
  }
  if (arquivo.size > LIMITE_ARQUIVO_C) {
    return 'Arquivo muito grande. O limite é 512 KiB.';
  }
  return null;
}
