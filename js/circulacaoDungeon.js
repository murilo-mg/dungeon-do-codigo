// Arquitetura de circulação, sem arestas de C. Seus dados nunca voltam ao grafo.
import { calcularCaminhoEntreSalas } from './corredores.js';

export function criarCirculacaoDungeon(salas, regioes, conexoesSemanticas = []) {
  const entrada = new Set(regioes.filter(r => r.tipo === 'entrada').flatMap(r => r.funcoes));
  const nomes = new Set(regioes.flatMap(r => r.funcoes));
  const membros = salas.filter(sala => nomes.has(sala.nome) && !entrada.has(sala.nome));
  const pais = new Map(membros.map(sala => [sala.nome, sala.nome]));
  const raiz = nome => {
    while (pais.get(nome) !== nome) nome = pais.get(nome);
    return nome;
  };
  // Usa a conectividade física existente, retirando somente a entrada como desvio
  // obrigatório. Isso limita as galerias aos componentes que ainda não se comunicam.
  for (const conexao of conexoesSemanticas) {
    if (pais.has(conexao.origem) && pais.has(conexao.destino))
      pais.set(raiz(conexao.origem), raiz(conexao.destino));
  }
  const distancia = (a, b) => Math.abs(a.x + a.largura / 2 - b.x - b.largura / 2) +
    Math.abs(a.y + a.altura / 2 - b.y - b.altura / 2);
  const candidatos = [];
  for (let i = 0; i < membros.length; i++) {
    for (let j = i + 1; j < membros.length; j++) {
      candidatos.push({ a: membros[i], b: membros[j], distancia: distancia(membros[i], membros[j]) });
    }
  }
  candidatos.sort((a, b) => a.distancia - b.distancia);
  const passagens = [];
  const adicionar = (a, b) => {
    const pontos = calcularCaminhoEntreSalas(salas, a, b);
    if (!pontos) return false; // Não atravessa obstáculos para forçar uma galeria.
    const id = JSON.stringify(['exploracao', a.nome, b.nome]);
    for (let i = 1; i < pontos.length; i++) {
      if (pontos[i].x === pontos[i - 1].x && pontos[i].y === pontos[i - 1].y) continue;
      passagens.push({ id, tipo: 'exploracao', origem: a.nome, destino: b.nome,
        inicio: pontos[i - 1], fim: pontos[i] });
    }
    return true;
  };
  for (const { a, b } of candidatos) {
    if (raiz(a.nome) !== raiz(b.nome) && adicionar(a, b)) pais.set(raiz(a.nome), raiz(b.nome));
  }
  const entradaConectada = conexoesSemanticas.some(c =>
    entrada.has(c.origem) && pais.has(c.destino) || entrada.has(c.destino) && pais.has(c.origem));
  if (!entradaConectada && membros.length) {
    const acessos = salas.filter(s => entrada.has(s.nome)).flatMap(a =>
      membros.map(b => ({ a, b, distancia: distancia(a, b) })));
    acessos.sort((a, b) => a.distancia - b.distancia);
    for (const { a, b } of acessos) if (adicionar(a, b)) break;
  }
  return passagens;
}
