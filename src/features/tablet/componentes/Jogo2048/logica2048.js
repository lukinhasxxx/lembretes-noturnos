// Regras do 2048, sem nada de tela: o componente só chama estas funções e desenha o resultado.
// Peça: { id, valor, linha, coluna, nova, juntou, removida }
// - nova: acabou de nascer (animação de surgir)
// - juntou: recebeu outra peça nesta jogada (animação de "pulsar")
// - removida: foi engolida numa junção; ainda desliza até o lugar e some depois da animação

export const TAMANHO_GRADE = 4
export const VALOR_VITORIA = 2048
// chance de nascer um 4 em vez de um 2 (a mesma do jogo original)
const CHANCE_DE_NASCER_4 = 0.1

let proximoId = 1

// células de uma linha/coluna na ordem em que as peças "caem": a primeira é a borda para onde elas vão
const celulasDaLinha = (direcao, indice) => {
    const ordem = Array.from({ length: TAMANHO_GRADE }, (_, posicao) => posicao)
    switch (direcao) {
        case 'esquerda': return ordem.map((coluna) => [indice, coluna])
        case 'direita': return ordem.reverse().map((coluna) => [indice, coluna])
        case 'cima': return ordem.map((linha) => [linha, indice])
        case 'baixo': return ordem.reverse().map((linha) => [linha, indice])
        default: return []
    }
}

const chave = (linha, coluna) => `${linha},${coluna}`

// faz a jogada: cada peça desliza até a borda; duas iguais que se encostam viram uma (só uma junção por peça
// em cada jogada, como no original). Devolve as peças novas, os pontos ganhos (soma das junções) e se algo mudou
export const mover = (pecas, direcao) => {
    const porCelula = new Map(pecas.map((peca) => [chave(peca.linha, peca.coluna), peca]))
    const resultado = []
    let pontos = 0
    let mudou = false

    for (let indice = 0; indice < TAMANHO_GRADE; indice += 1) {
        const celulas = celulasDaLinha(direcao, indice)
        const ocupadas = celulas.map(([linha, coluna]) => porCelula.get(chave(linha, coluna))).filter(Boolean)
        let destino = 0
        let anterior = null

        for (const peca of ocupadas) {
            if (anterior && !anterior.juntou && anterior.valor === peca.valor) {
                // junta com a anterior: ela dobra, e esta desliza até lá e some
                anterior.valor *= 2
                anterior.juntou = true
                pontos += anterior.valor
                resultado.push({ ...peca, linha: anterior.linha, coluna: anterior.coluna, removida: true, nova: false })
                mudou = true
                continue
            }
            const [linha, coluna] = celulas[destino]
            destino += 1
            if (linha !== peca.linha || coluna !== peca.coluna) mudou = true
            anterior = { ...peca, linha, coluna, nova: false, juntou: false }
            resultado.push(anterior)
        }
    }

    return { pecas: resultado, pontos, mudou }
}

// tira as peças engolidas (depois da animação de deslizar)
export const limparRemovidas = (pecas) => pecas.filter((peca) => !peca.removida)

// nasce um 2 (ou, às vezes, um 4) numa célula vazia sorteada
export const nascerPeca = (pecas) => {
    const ocupadas = new Set(pecas.map((peca) => chave(peca.linha, peca.coluna)))
    const vazias = []
    for (let linha = 0; linha < TAMANHO_GRADE; linha += 1) {
        for (let coluna = 0; coluna < TAMANHO_GRADE; coluna += 1) {
            if (!ocupadas.has(chave(linha, coluna))) vazias.push([linha, coluna])
        }
    }
    if (!vazias.length) return pecas
    const [linha, coluna] = vazias[Math.floor(Math.random() * vazias.length)]
    const valor = Math.random() < CHANCE_DE_NASCER_4 ? 4 : 2
    return [...pecas, { id: proximoId++, valor, linha, coluna, nova: true, juntou: false, removida: false }]
}

// começo de jogo: duas peças
export const novoJogo = () => nascerPeca(nascerPeca([]))

// ainda dá para jogar? (alguma célula vazia ou duas iguais encostadas)
export const temJogada = (pecas) => {
    if (pecas.length < TAMANHO_GRADE * TAMANHO_GRADE) return true
    const porCelula = new Map(pecas.map((peca) => [chave(peca.linha, peca.coluna), peca.valor]))
    return pecas.some(({ linha, coluna, valor }) =>
        porCelula.get(chave(linha, coluna + 1)) === valor || porCelula.get(chave(linha + 1, coluna)) === valor
    )
}

export const venceu = (pecas) => pecas.some((peca) => peca.valor >= VALOR_VITORIA)
