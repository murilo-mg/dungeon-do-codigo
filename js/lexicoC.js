// Mascara comentários e literais sem alterar posições ou quebras de linha.
// Não expande macros nem substitui a validação sintática de um compilador C.
export class ErroAnaliseC extends SyntaxError {
  constructor(mensagem, codigo, posicao) {
    const linha = codigo.slice(0, posicao).split('\n').length;
    super(`${mensagem} Linha ${linha}.`);
    this.name = 'ErroAnaliseC';
    this.linha = linha;
  }
}

export function prepararCodigoParaAnalise(codigo) {
  // split preserva os índices UTF-16 usados por slice e pelas expressões regulares.
  const estrutura = codigo.split('');
  const semComentarios = codigo.split('');
  const chavesAbertas = [];
  let indice = 0;

  function ocultarTrecho(inicio, fim, comentario) {
    for (let posicao = inicio; posicao < fim; posicao++) {
      if (codigo[posicao] === '\n' || codigo[posicao] === '\r') continue;
      estrutura[posicao] = ' ';
      if (comentario) semComentarios[posicao] = ' ';
    }
  }

  while (indice < codigo.length) {
    const inicio = indice;
    const caractere = codigo[indice];
    const seguinte = codigo[indice + 1];
    if (caractere === '/' && seguinte === '/') {
      indice += 2;
      while (indice < codigo.length && codigo[indice] !== '\n' && codigo[indice] !== '\r') {
        // Uma barra invertida no fim da linha prolonga o comentário em C.
        if (codigo[indice] === '\\' && codigo[indice + 1] === '\n') indice += 2;
        else if (codigo[indice] === '\\' && codigo[indice + 1] === '\r' && codigo[indice + 2] === '\n') indice += 3;
        else indice++;
      }
      ocultarTrecho(inicio, indice, true);
      continue;
    }
    if (caractere === '/' && seguinte === '*') {
      const fechamento = codigo.indexOf('*/', indice + 2);
      if (fechamento < 0) throw new ErroAnaliseC('Comentário de bloco sem fechamento.', codigo, inicio);
      indice = fechamento + 2;
      ocultarTrecho(inicio, indice, true);
      continue;
    }
    if (caractere === '"' || caractere === "'") {
      indice = encontrarFimDoLiteral(codigo, inicio);
      ocultarTrecho(inicio, indice, false);
      continue;
    }
    if (caractere === '{') chavesAbertas.push(indice);
    if (caractere === '}') {
      if (chavesAbertas.length === 0) throw new ErroAnaliseC('Chave de fechamento sem abertura.', codigo, indice);
      chavesAbertas.pop();
    }
    indice++;
  }

  if (chavesAbertas.length > 0) {
    throw new ErroAnaliseC('Bloco com chave de abertura sem fechamento.', codigo, chavesAbertas.at(-1));
  }
  return { estrutura: estrutura.join(''), semComentarios: semComentarios.join('') };
}

function encontrarFimDoLiteral(codigo, inicio) {
  const delimitador = codigo[inicio];
  let indice = inicio + 1;
  while (indice < codigo.length) {
    if (codigo[indice] === delimitador) return indice + 1;
    if (codigo[indice] === '\n' || codigo[indice] === '\r') break;
    if (codigo[indice] === '\\') {
      indice += codigo[indice + 1] === '\r' && codigo[indice + 2] === '\n' ? 3 : 2;
    } else indice++;
  }
  const tipo = delimitador === '"' ? 'Texto entre aspas duplas' : 'Literal de caractere';
  throw new ErroAnaliseC(`${tipo} sem fechamento.`, codigo, inicio);
}
