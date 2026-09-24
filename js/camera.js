// Calcula a janela visível do mundo sem conhecer DOM, Canvas ou eventos.

export function criarCamera({
  larguraViewport,
  alturaViewport,
  larguraMundo,
  alturaMundo,
}) {
  return {
    larguraViewport,
    alturaViewport,
    larguraMundo,
    alturaMundo,
    x: 0,
    y: 0,
  };
}

export function atualizarCamera(camera, alvo) {
  const maximoX = Math.max(0, camera.larguraMundo - camera.larguraViewport);
  const maximoY = Math.max(0, camera.alturaMundo - camera.alturaViewport);

  return {
    ...camera,
    x: limitar(alvo.x - camera.larguraViewport / 2, 0, maximoX),
    y: limitar(alvo.y - camera.alturaViewport / 2, 0, maximoY),
  };
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(valor, maximo));
}
