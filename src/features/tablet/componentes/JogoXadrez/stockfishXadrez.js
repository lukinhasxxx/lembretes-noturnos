// Stockfish (versão "lite", de um núcleo só) para os níveis fortes do xadrez.
// Os arquivos ficam em public/stockfish (o .js, o .wasm e a licença GPL-3). Ele roda num Web Worker:
// um programa à parte, que conversa com o site por mensagens no protocolo UCI (o padrão dos motores de
// xadrez), então pensar não trava a tela. Só é baixado (~1,9 MB) na primeira vez que um nível dele joga.
//
// A força vem do próprio Stockfish: "UCI_LimitStrength" + "UCI_Elo" (aceita de 1320 para cima).

const ARQUIVO_MOTOR = `${process.env.PUBLIC_URL}/stockfish/stockfish-19-lite-single.js`

let motor = null
// fila de pedidos: o UCI responde uma coisa de cada vez, então um pedido só começa quando o anterior acaba
let fila = Promise.resolve()

// manda comandos e espera a linha que começa com "esperar" (ex.: "readyok", "bestmove")
const conversar = (comandos, esperar) => new Promise((resolver, rejeitar) => {
    const aoReceber = (evento) => {
        const linha = String(evento.data)
        if (!linha.startsWith(esperar)) return
        motor.removeEventListener('message', aoReceber)
        motor.removeEventListener('error', aoFalhar)
        resolver(linha)
    }
    const aoFalhar = (erro) => {
        motor.removeEventListener('message', aoReceber)
        motor.removeEventListener('error', aoFalhar)
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
        await conversar(['setoption name UCI_LimitStrength value true', 'isready'], 'readyok')
    } catch (erro) {
        motor.terminate()
        motor = null
        throw erro
    }
}

// "e7e8q" (notação UCI) → { from: 'e7', to: 'e8', promotion: 'q' }
const lanceDoUci = (uci) => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })

// melhor lance do Stockfish jogando como "elo", pensando "tempoMs" milissegundos.
// Devolve { from, to, promotion } ou null (sem lances: mate ou afogamento)
export const lanceDoStockfish = (fen, elo, tempoMs) => {
    const pedido = fila.then(async () => {
        await ligarMotor()
        await conversar([`setoption name UCI_Elo value ${elo}`, 'isready'], 'readyok')
        const resposta = await conversar([`position fen ${fen}`, `go movetime ${tempoMs}`], 'bestmove')
        const uci = resposta.split(' ')[1]
        return !uci || uci === '(none)' ? null : lanceDoUci(uci)
    })
    // um pedido que falhou não trava os próximos
    fila = pedido.catch(() => {})
    return pedido
}
