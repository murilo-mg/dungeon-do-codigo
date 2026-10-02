// Preparação pura, compartilhada pelo Worker e pelos testes do jogo.
import { calcularFormaTerritorio } from './layoutRegioes.js';
import { calcularLimitesVisuaisRegioes, atribuirCoresRegioes,
  classificarVisualmenteCorredores } from './semanticaVisual.js';
import { criarSegmentosDeCorredores, calcularCruzamentosCorredores } from './corredores.js';
import { criarAreaCaminhavel } from './areaCaminhavel.js';
import { RAIO_BASE_PERSONAGEM } from './personagem.js';
import { criarCenario } from './cenario.js';

const MARGEM_REGIAO = 20;

export function prepararCenaDungeon(masmorra, arestas) {
  const salas = masmorra.salas;
  const regioes = masmorra.regioes ?? [];
  const territoriosRegioes = masmorra.territoriosRegioes;

  const limitesRegioes =
    territoriosRegioes instanceof Map &&
    territoriosRegioes.size
      ? regioes
        .map(regiao => {
          const territorio = territoriosRegioes.get(regiao.id);

          if (!territorio) return null;

          return {
            ...regiao,
            ...territorio,
          };
        })
        .filter(Boolean)
      : calcularLimitesVisuaisRegioes(
        regioes,
        salas,
        MARGEM_REGIAO
      );

  const coresRegioes = atribuirCoresRegioes(regioes);
  const funcoesPorRegiao = new Map(
    regioes.map(regiao => [regiao.id, regiao.funcoes]));

  const regioesVisuais = limitesRegioes.map(regiao => {
    const membros = (funcoesPorRegiao.get(regiao.id) ?? [])
      .map(nome => salas.find(sala => sala.nome === nome))
      .filter(Boolean);

    const ancora = membros.reduce((melhor, sala) => {
      if (!melhor || sala.y < melhor.y ||
        (sala.y === melhor.y && sala.x < melhor.x)) {
        return sala;
      }
      return melhor;
    }, null);

    return {
      ...regiao,
      membros,
      ancora,
      forma: calcularFormaTerritorio(regiao, membros),
      cor: coresRegioes.get(regiao.id),
    };
  });

  const segmentosDeCorredores = criarSegmentosDeCorredores(salas, arestas);
  const passagensExploracao = masmorra.passagensExploracao ?? [];
  const segmentosNavegaveis = [...segmentosDeCorredores, ...passagensExploracao];
  const tiposVisuaisCorredores = classificarVisualmenteCorredores(regioes, arestas);
  const cruzamentosCorredores = calcularCruzamentosCorredores(segmentosNavegaveis);
  const areaCaminhavel = criarAreaCaminhavel(salas, segmentosNavegaveis, RAIO_BASE_PERSONAGEM);
  const cenario = criarCenario(salas, masmorra.larguraMundo, masmorra.alturaMundo, segmentosNavegaveis);
  return { regioesVisuais, segmentosDeCorredores, passagensExploracao,
    segmentosNavegaveis, tiposVisuaisCorredores, cruzamentosCorredores, areaCaminhavel, cenario };
}
