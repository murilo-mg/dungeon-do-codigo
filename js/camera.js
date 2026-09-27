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
    zoom: 1,
  };
}

export function dimensoesVisiveis(camera) {
  return {
    largura: camera.larguraViewport / camera.zoom,
    altura: camera.alturaViewport / camera.zoom,
  };
}

export function zoomParaEncaixar(camera) {
  return Math.min(1,
    camera.larguraViewport / camera.larguraMundo,
    camera.alturaViewport / camera.alturaMundo);
}

export function definirZoom(camera, zoom) {
  if (!Number.isFinite(zoom) || zoom <= 0) return camera;
  const novoZoom = limitar(zoom, zoomParaEncaixar(camera), 2);
  const { largura, altura } = dimensoesVisiveis({ ...camera, zoom: novoZoom });
  return {
    ...camera,
    zoom: novoZoom,
    x: limitar(camera.x, 0, Math.max(0, camera.larguraMundo - largura)),
    y: limitar(camera.y, 0, Math.max(0, camera.alturaMundo - altura)),
  };
}

export function alterarZoom(camera, passo) {
  return definirZoom(camera, Math.max(zoomParaEncaixar(camera), camera.zoom + passo));
}

export function encaixarCamera(camera) {
  return { ...camera, zoom: zoomParaEncaixar(camera), x: 0, y: 0 };
}

export function atualizarCamera(camera, alvo) {
  const { largura, altura } = dimensoesVisiveis(camera);
  const maximoX = Math.max(0, camera.larguraMundo - largura);
  const maximoY = Math.max(0, camera.alturaMundo - altura);

  return {
    ...camera,
    x: limitar(alvo.x - largura / 2, 0, maximoX),
    y: limitar(alvo.y - altura / 2, 0, maximoY),
  };
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(valor, maximo));
}
