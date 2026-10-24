// Stockfish (versão "lite", de um núcleo só): joga os níveis fortes do xadrez, dá a dica e analisa as partidas.
// Os arquivos ficam em public/stockfish (o .js, o .wasm e a licença GPL-3). Ele roda num Web Worker:
// um programa à parte, que conversa com o site por mensagens no protocolo UCI (o padrão dos motores de
// xadrez), então pensar não trava a tela. Só é baixado (~1,9 MB) na primeira vez que alguém precisa dele.
//
// Jogando, a força vem do próprio Stockfish: "UCI_LimitStrength" + "UCI_Elo" (aceita de 1320 para cima).
// Na dica e na análise ele joga com tudo (sem o limite).

const ARQUIVO_MOTOR = `${process.env.PUBLIC_URL}/stockfish/stockfish-19-lite-single.js`

let motor = null
// fila de pedidos: o UCI responde uma coisa de cada vez, então um pedido só começa quando o anterior acaba
let fila = Promise.resolve()

// manda comandos e espera a linha que começa com "esperar" (ex.: "readyok", "bestmove").
// aoLer recebe as outras linhas no caminho (as "info", com a nota da posição)
const conversar = (comandos, esperar, aoLer) => new Promise((resolver, rejeitar) => {
    const parar = () => {
        motor.removeEventListener('message', aoReceber)
        motor.removeEventListener('error', aoFalhar)
    }
    const aoReceber = (evento) => {
        const linha = String(evento.data)
        if (!linha.startsWith(esperar)) {
            aoLer?.(linha)
            return
        }
        parar()
        resolver(linha)
    }
    const aoFalhar = (erro) => {
        parar()
        rejeitar(erro)
    }
    motor.addEventListener('message', aoReceber)
    motor.addEventListener('error', aoFalhar)
    for (const comando of comandos) motor.postMessage(comando)
})

const ligarMotor = async () => {
    if (motor) return
    motor = new Worker(ARQUIVO_MOTOR)
    try {
        await conversar(['uci'], 'uciok')
        await conversar(['isready'], 'readyok')
    } catch (erro) {
        motor.terminate()
        motor = null
        throw erro
    }
}

// põe o pedido na fila (um pedido que falhou não trava os próximos)
const naFila = (pedir) => {
    const pedido = fila.then(async () => {
        await ligarMotor()
        return pedir()
    })
    fila = pedido.catch(() => {})
    return pedido
}

// "e7e8q" (notação UCI) → { from: 'e7', to: 'e8', promotion: 'q' }
const lanceDoUci = (uci) => (!uci || uci === '(none)' ? null : { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })

// nota de uma linha "info ... score cp 35 ..." ou "score mate -3": em centipeões, do ponto de vista de quem
// joga. Mate vira ±10000 (menos quanto mais longe, para "mate em 1" valer mais que "mate em 5")
const NOTA_DE_MATE = 10000
const notaDaLinha = (linha) => {
    const cp = linha.match(/ score cp (-?\d+)/)
    if (cp) return Number(cp[1])
    const mate = linha.match(/ score mate (-?\d+)/)
    if (!mate) return null
    const lances = Number(mate[1])
    // "mate 0": quem joga já levou mate
    if (lances === 0) return -NOTA_DE_MATE
    return Math.sign(lances) * (NOTA_DE_MATE - Math.abs(lances) * 10)
}

// melhor lance do Stockfish jogando como "elo", pensando "tempoMs" milissegundos.
// Devolve { from, to, promotion } ou null (sem lances: mate ou afogamento)
export const lanceDoStockfish = (fen, elo, tempoMs) => naFila(async () => {
    await conversar([
        'setoption name MultiPV value 1',
        'setoption name UCI_LimitStrength value true',
        `setoption name UCI_Elo value ${elo}`,
        'isready',
    ], 'readyok')
    const resposta = await conversar([`position fen ${fen}`, `go movetime ${tempoMs}`], 'bestmove')
    return lanceDoUci(resposta.split(' ')[1])
})

// avaliação com força total: { melhor: { from, to, promotion } | null, nota, segunda } — notas em centipeões
// do ponto de vista de quem joga na posição (positivo = está melhor). "linhas: 2" pede também a nota do 2º
// melhor lance (segunda; null se só tinha um lance), que a análise usa para achar o lance "Ótimo".
// Usada na dica e na análise da partida
export const avaliarPosicao = (fen, tempoMs, { linhas = 1 } = {}) => naFila(async () => {
    await conversar([`setoption name MultiPV value ${linhas}`, 'setoption name UCI_LimitStrength value false', 'isready'], 'readyok')
    // a última nota de cada linha ("multipv 1", "multipv 2"): as primeiras são de buscas mais rasas
    const notas = {}
    const resposta = await conversar([`position fen ${fen}`, `go movetime ${tempoMs}`], 'bestmove', (linha) => {
        const lida = notaDaLinha(linha)
        if (lida === null) return
        const numero = Number(linha.match(/ multipv (\d+)/)?.[1] ?? 1)
        notas[numero] = lida
    })
    return { melhor: lanceDoUci(resposta.split(' ')[1]), nota: notas[1] ?? 0, segunda: notas[2] ?? null }
})
