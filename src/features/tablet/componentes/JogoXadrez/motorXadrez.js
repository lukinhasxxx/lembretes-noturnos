// Adversário do xadrez (o "cérebro" do computador), para os níveis fracos: 300, 400, 600 e 900 de Elo.
// As regras (lances válidos, xeque, mate, empate) vêm do chess.js; aqui só a escolha do lance.
//
// Como ele pensa: olha alguns lances à frente (busca "minimax" com poda alfa-beta) e dá uma nota para cada
// posição (material + onde cada peça está). A força é "pesada" por nível com três coisas:
// - profundidade: quantos lances ele olha à frente;
// - ruído: um erro sorteado somado à nota de cada lance (ele "acha" que um lance ruim é bom);
// - chance de lance aleatório: de vez em quando joga qualquer coisa (o "deixei a dama de graça" do iniciante).
// Os Elos são aproximados (calibrados a olho); de 1400 para cima joga o Stockfish (jogarLance).
import { Chess } from 'chess.js'

export const NIVEIS_XADREZ = [
    { id: 'elo300', nome: '300', profundidade: 1, ruido: 250, chanceAleatorio: 0.45 },
    { id: 'elo400', nome: '400', profundidade: 1, ruido: 170, chanceAleatorio: 0.3 },
    { id: 'elo600', nome: '600', profundidade: 1, ruido: 90, chanceAleatorio: 0.15 },
    { id: 'elo900', nome: '900', profundidade: 2, ruido: 35, chanceAleatorio: 0.04 },
    // do 1400 para cima quem joga é o Stockfish (ver stockfishXadrez.js), limitado ao elo do nível;
    // tempoMs = quanto ele pensa por lance
    { id: 'sf1400', nome: '1400', stockfish: true, elo: 1400, tempoMs: 500 },
    { id: 'sf1700', nome: '1700', stockfish: true, elo: 1700, tempoMs: 700 },
    { id: 'sf2000', nome: '2000', stockfish: true, elo: 2000, tempoMs: 900 },
]

// quanto o Stockfish pensa na dica
const TEMPO_DICA_STOCKFISH_MS = 300

// dica (Promise): o melhor lance pelo Stockfish com força total; sem ele (não carregou), a dica deste motor
export const sugerirLanceForte = async (fen) => {
    try {
        const { avaliarPosicao } = await import('./stockfishXadrez')
        const { melhor } = await avaliarPosicao(fen, TEMPO_DICA_STOCKFISH_MS)
        if (melhor) return melhor
    } catch (erro) {
        console.warn('Stockfish não carregou; dica com o motor simples.', erro)
    }
    return sugerirLance(fen)
}

// lance do computador para qualquer nível (Promise): os fracos usam este motor; os fortes, o Stockfish.
// Se o Stockfish não carregar (sem internet, navegador antigo...), joga este motor no nível mais forte dele
export const jogarLance = async (fen, idNivel) => {
    const nivel = NIVEIS_XADREZ.find((item) => item.id === idNivel)
    if (!nivel?.stockfish) return escolherLance(fen, idNivel)
    try {
        const { lanceDoStockfish } = await import('./stockfishXadrez')
        return await lanceDoStockfish(fen, nivel.elo, nivel.tempoMs)
    } catch (erro) {
        console.warn('Stockfish não carregou; jogando com o motor simples.', erro)
        return escolherLance(fen, 'elo900')
    }
}

// profundidade da "dica" (sem ruído): o melhor lance que esse motor consegue achar
const PROFUNDIDADE_DICA = 2

const VALOR_PECA = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATE = 100000

// tabelas de posição (do ponto de vista das brancas, linha 8 primeiro): bônus por casa.
// "Simplified Evaluation Function", de Tomasz Michniewski (Chess Programming Wiki)
const TABELA = {
    p: [
        0, 0, 0, 0, 0, 0, 0, 0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5, 5, 10, 25, 25, 10, 5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, -5, -10, 0, 0, -10, -5, 5,
        5, 10, 10, -20, -20, 10, 10, 5,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    n: [
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50,
    ],
    b: [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20,
    ],
    r: [
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, 10, 10, 10, 10, 5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        0, 0, 0, 5, 5, 0, 0, 0,
    ],
    q: [
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5,
        -10, 5, 5, 5, 5, 5, 0, -10,
        -10, 0, 5, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20,
    ],
    k: [
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20, 20, 0, 0, 0, 0, 20, 20,
        20, 30, 10, 0, 0, 10, 30, 20,
    ],
}

// nota da posição para as brancas (positivo = brancas melhor)
const avaliar = (xadrez) => {
    let nota = 0
    const tabuleiro = xadrez.board()
    for (let linha = 0; linha < 8; linha += 1) {
        for (let coluna = 0; coluna < 8; coluna += 1) {
            const peca = tabuleiro[linha][coluna]
            if (!peca) continue
            // as pretas leem a tabela espelhada (a "linha 8" delas é a linha 1)
            const casa = peca.color === 'w' ? linha * 8 + coluna : (7 - linha) * 8 + coluna
            const valor = VALOR_PECA[peca.type] + TABELA[peca.type][casa]
            nota += peca.color === 'w' ? valor : -valor
        }
    }
    return nota
}

// capturas primeiro (a peça mais valiosa capturada pela mais barata): a poda corta muito mais cedo
const ordenar = (lances) => lances.sort((a, b) =>
    (b.captured ? VALOR_PECA[b.captured] * 10 - VALOR_PECA[b.piece] : 0) -
    (a.captured ? VALOR_PECA[a.captured] * 10 - VALOR_PECA[a.piece] : 0)
)

// negamax com poda alfa-beta: nota da posição para QUEM JOGA agora
const buscar = (xadrez, profundidade, alfa, beta) => {
    if (xadrez.isCheckmate()) return -MATE - profundidade // mate mais rápido vale mais
    if (xadrez.isDraw()) return 0
    if (profundidade === 0) return xadrez.turn() === 'w' ? avaliar(xadrez) : -avaliar(xadrez)

    let melhor = -Infinity
    for (const lance of ordenar(xadrez.moves({ verbose: true }))) {
        xadrez.move(lance)
        const nota = -buscar(xadrez, profundidade - 1, -beta, -alfa)
        xadrez.undo()
        if (nota > melhor) melhor = nota
        if (nota > alfa) alfa = nota
        if (alfa >= beta) break
    }
    return melhor
}

const notasDosLances = (xadrez, profundidade) => ordenar(xadrez.moves({ verbose: true })).map((lance) => {
    xadrez.move(lance)
    const nota = -buscar(xadrez, profundidade - 1, -Infinity, Infinity)
    xadrez.undo()
    return { lance, nota }
})

// lance do computador na posição (FEN) para o nível pedido. Devolve { from, to, promotion } ou null (sem lances)
export const escolherLance = (fen, idNivel) => {
    const nivel = NIVEIS_XADREZ.find((item) => item.id === idNivel) ?? NIVEIS_XADREZ[0]
    const xadrez = new Chess(fen)
    const lances = xadrez.moves({ verbose: true })
    if (!lances.length) return null

    if (Math.random() < nivel.chanceAleatorio) {
        const { from, to, promotion } = lances[Math.floor(Math.random() * lances.length)]
        return { from, to, promotion }
    }

    const comRuido = notasDosLances(xadrez, nivel.profundidade)
        .map(({ lance, nota }) => ({ lance, nota: nota + (Math.random() * 2 - 1) * nivel.ruido }))
    const { from, to, promotion } = comRuido.reduce((melhor, atual) => (atual.nota > melhor.nota ? atual : melhor)).lance
    return { from, to, promotion }
}

// dica para quem está jogando: o melhor lance que o motor acha (sem ruído)
export const sugerirLance = (fen) => {
    const xadrez = new Chess(fen)
    if (!xadrez.moves().length) return null
    const notas = notasDosLances(xadrez, PROFUNDIDADE_DICA)
    const { from, to, promotion } = notas.reduce((melhor, atual) => (atual.nota > melhor.nota ? atual : melhor)).lance
    return { from, to, promotion }
}
