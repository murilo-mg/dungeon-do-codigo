// Partículas transitórias de entrada. O limite evita acúmulo nas bordas das salas.
import { PALETA } from './pixelArt.js';

export function criarParticulasDeEntrada(particulas, x, y) {
  for (let indice = 0; indice < 10; indice++) {
    const angulo = indice / 10 * Math.PI * 2;
    particulas.push({ x, y, velocidadeX: Math.cos(angulo) * 25,
      velocidadeY: Math.sin(angulo) * 20 - 8, vida: 0.55 });
  }
  return particulas.slice(-60);
}

export function atualizarParticulas(particulas, segundos) {
  return particulas.map(particula => ({ ...particula, vida: particula.vida - segundos,
    x: particula.x + particula.velocidadeX * segundos,
    y: particula.y + particula.velocidadeY * segundos })).filter(particula => particula.vida > 0);
}

export function desenharParticulas(contexto, particulas) {
  contexto.save();
  contexto.fillStyle = PALETA.pergaminho;
  particulas.forEach(particula => {
    contexto.globalAlpha = particula.vida / 0.55 * 0.7;
    contexto.fillRect(Math.round(particula.x), Math.round(particula.y), 2, 2);
  });
  contexto.restore();
}
