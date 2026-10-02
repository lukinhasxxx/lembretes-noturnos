// Resolução nativa da arte (vídeo de fundo). O palco usa essa proporção.
export const CENA = {
    largura: 1920,
    altura: 1080,
}

// Pontos da cena em pixels da arte original (frame 1920x1080).
// x/y = canto superior esquerdo do elemento.
// Para adicionar um elemento novo: meça no frame do vídeo e use <Ancora ponto="nome">.
export const PONTOS = {
    radio: { x: 310, y: 804, largura: 170, altura: 130 },
    tablet: { x: 1174, y: 875, largura: 110, altura: 50 },
    mural: { x: 1139, y: 234, largura: 522, altura: 510 },
}
