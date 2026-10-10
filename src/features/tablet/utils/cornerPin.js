// "Corner pin": entorta um retângulo para os 4 cantos dele caírem em 4 pontos quaisquer
// (como encaixar uma imagem numa tela vista em perspectiva). É a transformação projetiva (homografia)
// do quadrado unitário para o quadrilátero, em CSS: matrix3d. Função pura, sem React.
//
// largura, altura: tamanho do elemento (px) — ele precisa de transform-origin: 0 0
// cantos: { cimaEsquerda, cimaDireita, baixoDireita, baixoEsquerda }, cada um [x, y] em px,
//         no mesmo sistema de coordenadas do pai do elemento
// devolve a string 'matrix3d(...)' para usar em style.transform
export const matrizCornerPin = (largura, altura, cantos) => {
    const [x0, y0] = cantos.cimaEsquerda
    const [x1, y1] = cantos.cimaDireita
    const [x2, y2] = cantos.baixoDireita
    const [x3, y3] = cantos.baixoEsquerda

    // quadrado unitário (u, v de 0 a 1) → quadrilátero:
    //   x = (a·u + b·v + c) / (g·u + h·v + 1)
    //   y = (d·u + e·v + f) / (g·u + h·v + 1)
    const dx1 = x1 - x2
    const dx2 = x3 - x2
    const dx3 = x0 - x1 + x2 - x3
    const dy1 = y1 - y2
    const dy2 = y3 - y2
    const dy3 = y0 - y1 + y2 - y3

    const denominador = dx1 * dy2 - dx2 * dy1
    const g = (dx3 * dy2 - dx2 * dy3) / denominador
    const h = (dx1 * dy3 - dx3 * dy1) / denominador

    const a = x1 - x0 + g * x1
    const b = x3 - x0 + h * x3
    const c = x0
    const d = y1 - y0 + g * y1
    const e = y3 - y0 + h * y3
    const f = y0

    // o elemento tem largura × altura em px, não 1 × 1: divide o que multiplica u por largura e o que multiplica v por altura
    const A = a / largura, B = b / altura
    const D = d / largura, E = e / altura
    const G = g / largura, H = h / altura

    // matrix3d lista a matriz 4×4 por colunas; z fica intacto (3ª linha/coluna da identidade)
    const valores = [
        A, D, 0, G,
        B, E, 0, H,
        0, 0, 1, 0,
        c, f, 0, 1,
    ]
    return `matrix3d(${valores.join(', ')})`
}
