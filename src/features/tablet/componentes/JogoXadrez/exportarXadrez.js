import { Chess } from 'chess.js'

// Exportar a partida para o Lichess: monta o PGN (lances + nomes, resultado e data) e importa lá pela API
// pública (sem login; o Lichess limita a 100 partidas por hora). A partida vira uma página do Lichess, com o
// botão de análise deles. Se a importação falhar, abre o tabuleiro de análise do Lichess com o mesmo PGN
const URL_IMPORTAR = 'https://lichess.org/api/import'
const URL_TABULEIRO_DE_ANALISE = 'https://lichess.org/analysis/pgn/'

const doisDigitos = (numero) => String(numero).padStart(2, '0')
// data no formato do PGN: 2026.10.20
const dataDoPgn = (momento) => {
    const data = new Date(momento ?? Date.now())
    return `${data.getFullYear()}.${doisDigitos(data.getMonth() + 1)}.${doisDigitos(data.getDate())}`
}

// lances: os da partida (SAN, em inglês, como o chess.js guarda); brancas/pretas: { nome, elo? };
// vencedor: 'w', 'b' ou null (empate); inicio: quando a partida começou
export const montarPgn = ({ lances, brancas, pretas, vencedor, inicio }) => {
    const xadrez = new Chess()
    for (const lance of lances) xadrez.move(lance)
    xadrez.setHeader('Event', 'Partida casual')
    xadrez.setHeader('Site', 'Lembretes noturnos')
    xadrez.setHeader('Date', dataDoPgn(inicio))
    xadrez.setHeader('White', brancas.nome)
    xadrez.setHeader('Black', pretas.nome)
    if (brancas.elo) xadrez.setHeader('WhiteElo', String(brancas.elo))
    if (pretas.elo) xadrez.setHeader('BlackElo', String(pretas.elo))
    xadrez.setHeader('Result', vencedor === 'w' ? '1-0' : vencedor === 'b' ? '0-1' : '1/2-1/2')
    return xadrez.pgn()
}

// baixa o PGN como arquivo (partida-2026-10-20.pgn), para quando não dá para copiar
export const baixarPgn = (pgn) => {
    const endereco = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }))
    const link = document.createElement('a')
    link.href = endereco
    link.download = `partida-${new Date().toISOString().slice(0, 10)}.pgn`
    link.click()
    URL.revokeObjectURL(endereco)
}

// a aba abre já no clique (senão o navegador bloqueia o pop-up) e vai para a partida quando o Lichess responde
export const exportarParaLichess = async (pgn) => {
    const aba = window.open('', '_blank')
    if (aba) aba.opener = null
    let destino
    try {
        const resposta = await fetch(URL_IMPORTAR, {
            method: 'POST',
            // sem o Accept o Lichess responde com um redirecionamento para a página, em vez do JSON
            headers: { Accept: 'application/json' },
            body: new URLSearchParams({ pgn }),
        })
        if (!resposta.ok) throw new Error(`Lichess respondeu ${resposta.status}`)
        destino = (await resposta.json()).url
    } catch (erro) {
        console.warn('Não deu para importar no Lichess; abrindo o tabuleiro de análise.', erro)
        destino = URL_TABULEIRO_DE_ANALISE + encodeURIComponent(pgn)
    }
    if (aba) aba.location.href = destino
    else window.open(destino, '_blank', 'noopener')
}
