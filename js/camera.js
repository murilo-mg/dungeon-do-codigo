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
    x: limitarEixo(0, larguraMundo, larguraViewport),
    y: limitarEixo(0, alturaMundo, alturaViewport),
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
    x: limitarEixo(camera.x, camera.larguraMundo, largura),
    y: limitarEixo(camera.y, camera.alturaMundo, altura),
  };
}

export function alterarZoom(camera, passo) {
  return definirZoom(camera, Math.max(zoomParaEncaixar(camera), camera.zoom + passo));
}

export function encaixarCamera(camera) {
  return atualizarCamera({ ...camera, zoom: zoomParaEncaixar(camera) }, {
    x: camera.larguraMundo / 2,
    y: camera.alturaMundo / 2,
  });
}

export function atualizarCamera(camera, alvo) {
  const { largura, altura } = dimensoesVisiveis(camera);
  return {
    ...camera,
    x: limitarEixo(alvo.x - largura / 2, camera.larguraMundo, largura),
    y: limitarEixo(alvo.y - altura / 2, camera.alturaMundo, altura),
  };
}

export function deslocarCamera(camera, deslocamento = {}) {
  const { largura, altura } = dimensoesVisiveis(camera);
  const x = Number.isFinite(deslocamento.x) ? deslocamento.x : 0;
  const y = Number.isFinite(deslocamento.y) ? deslocamento.y : 0;

  return {
    ...camera,
    x: limitarEixo(camera.x + x, camera.larguraMundo, largura),
    y: limitarEixo(camera.y + y, camera.alturaMundo, altura),
  };
}

function limitarEixo(posicao, tamanhoMundo, tamanhoVisivel) {
  // A margem existe apenas na projeção; o mundo mantém suas coordenadas.
  if (tamanhoMundo <= tamanhoVisivel) return (tamanhoMundo - tamanhoVisivel) / 2;
  return limitar(posicao, 0, tamanhoMundo - tamanhoVisivel);
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(valor, maximo));
}
