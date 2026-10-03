// Caixa que contém todos os pontos de interesse (em px da arte), com uma margem de respiro.
// Pontos com focal: false ficam de fora.
export const calcularAreaFocal = (pontos, margem) => {
    const lista = Object.values(pontos).filter((ponto) => ponto.focal !== false)

    return {
        x0: Math.min(...lista.map((p) => p.x)) - margem,
        x1: Math.max(...lista.map((p) => p.x + p.largura)) + margem,
        y0: Math.min(...lista.map((p) => p.y)) - margem,
        y1: Math.max(...lista.map((p) => p.y + p.altura)) + margem,
    }
}

// Em um eixo: quanto deslocar a arte (em px da arte) a partir do centro
// para que o trecho [inicio, fim] fique dentro da parte visível.
// total = tamanho da arte no eixo; visivel = quanto da arte cabe na tela nesse eixo.
export const deslocamentoNoEixo = (total, visivel, inicio, fim) => {
    if (visivel >= total) return 0

    const centralizado = (total - visivel) / 2
    const cabe = fim - inicio <= visivel

    // se a área cabe: o mínimo de movimento para mostrá-la; se não cabe: centraliza nela
    const desejado = cabe
        ? Math.min(Math.max(centralizado, fim - visivel), inicio)
        : (inicio + fim) / 2 - visivel / 2

    const limitado = Math.min(Math.max(desejado, 0), total - visivel)
    return centralizado - limitado
}
