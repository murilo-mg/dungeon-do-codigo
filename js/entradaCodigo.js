export const LIMITE_ARQUIVO_C = 512 * 1024;

export function validarArquivoC(arquivo) {
  if (!arquivo || !/^.+\.c$/i.test(arquivo.name)) {
    return 'Selecione um arquivo com extensão .c.';
  }
  if (arquivo.size > LIMITE_ARQUIVO_C) {
    return 'Arquivo muito grande. O limite é 512 KiB.';
  }
  return null;
}
