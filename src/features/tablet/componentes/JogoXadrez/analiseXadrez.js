// Análise da partida com o Stockfish. O Stockfish só dá a nota de cada posição e o melhor lance; o resto são
// regras em cima disso, no estilo dos apps de xadrez:
// - precisão de cada lado: método do Lichess (público, em lichess.org/page/accuracy). A nota vira "chance de
//   vencer" (0 a 100%); cada lance vale pela queda que causou nessa chance; a precisão junta a média simples
//   e a média harmônica dos lances (a harmônica pesa mais os lances ruins);
// - categoria de cada lance: faixas do Chess.com (pela queda na chance de vencer: até 2 excelente, até 5 bom,
//   até 10 imprecisão, até 20 erro, acima capivarada), mais "Melhor" (o lance do Stockfish), "Ótimo" (o único
//   lance bom: o 2º melhor era bem pior), "Brilhante" (sacrifício de peça que é o melhor lance, numa posição
//   que ainda não estava ganha) e "Perdeu a chance" (o adversário errou e o lance não aproveitou). A regra
//   exata do "Brilhante" do Chess.com não é pública; esta é a aproximação conhecida.
import { Chess } from 'chess.js'
import { avaliarPosicao } from './stockfishXadrez'

// quanto o Stockfish pensa em cada posição (olhando os 2 melhores lances): 40 lances = 81 posições ≈ 16 s
const TEMPO_POR_POSICAO_MS = 200

// categorias, da melhor para a pior. simbolo: o que aparece ao lado do lance; destaque: aparece na lista de
// lances (como na revisão do Chess.com, que marca todos; só o "Bom", o lance comum, fica de fora para a lista
// não virar um mar de símbolos — ele aparece no resumo e revendo o lance)
export const CATEGORIAS = [
    { id: 'brilhante', nome: 'Brilhante', simbolo: '!!', destaque: true },
    { id: 'otimo', nome: 'Ótimo', simbolo: '!', destaque: true },
    { id: 'melhor', nome: 'Melhor', simbolo: '★', destaque: true },
    { id: 'excelente', nome: 'Excelente', simbolo: '👍', destaque: true },
    { id: 'bom', nome: 'Bom', simbolo: '✓', destaque: false },
    { id: 'imprecisao', nome: 'Imprecisão', simbolo: '?!', destaque: true },
    { id: 'erro', nome: 'Erro', simbolo: '?', destaque: true },
    { id: 'perdeu', nome: 'Perdeu a chance', simbolo: '✗', destaque: true },
    { id: 'capivarada', nome: 'Capivarada', simbolo: '??', destaque: true },
]

// quedas na chance de vencer (pontos de %), as faixas do Chess.com
const ATE_EXCELENTE = 2
const ATE_BOM = 5
const ATE_IMPRECISAO = 10
const ATE_ERRO = 20
// "Ótimo": o 2º melhor lance deixaria a chance de vencer pelo menos isso mais baixa
const DIFERENCA_OTIMO = 10
// "Brilhante": a posição não podia já estar ganha (chance de vencer antes do lance abaixo disso) e o lance
// tem que manter a pessoa bem (chance depois pelo menos isso)
const BRILHANTE_ANTES_ATE = 85
const BRILHANTE_DEPOIS_PELO_MENOS = 50
// "Perdeu a chance": o lance anterior do adversário foi um erro (queda pelo menos isso) e este jogou fora
const ERRO_DO_ADVERSARIO = ATE_IMPRECISAO

const VALOR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

// centipeões → chance de vencer (%), a curva do Lichess
const chanceDeVencer = (centipeoes) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipeoes)) - 1)

// queda na chance de vencer → precisão do lance (0 a 100), a fórmula do Lichess
const precisaoDoLance = (queda) => Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * queda) - 3.1669))

const mediaHarmonica = (valores) => valores.length / valores.reduce((soma, valor) => soma + 1 / Math.max(valor, 1), 0)
const media = (valores) => valores.reduce((soma, valor) => soma + valor, 0) / valores.length
const precisaoDoLado = (precisoes) => (precisoes.length ? Math.round((media(precisoes) + mediaHarmonica(precisoes)) / 2) : null)

// avaliação da posição do ponto de vista das brancas (nota) e de quem joga (segunda: o 2º melhor lance).
// Posição final (mate/empate) não precisa do Stockfish
const avaliar = async (xadrez) => {
    if (xadrez.isCheckmate()) return { nota: xadrez.turn() === 'w' ? -10000 : 10000, melhor: null, segunda: null }
    if (xadrez.isDraw() || xadrez.isStalemate()) return { nota: 0, melhor: null, segunda: null }
    const { nota, melhor, segunda } = await avaliarPosicao(xadrez.fen(), TEMPO_POR_POSICAO_MS, { linhas: 2 })
    return { nota: xadrez.turn() === 'w' ? nota : -nota, melhor, segunda, notaDeQuemJoga: nota }
}

// o lance entregou uma peça? (peça de valor 3+ que fica numa casa atacada, sem defesa ou atacada por uma peça
// mais barata, e não foi para pegar algo do mesmo valor). "depois" é a posição já com o lance feito
const foiSacrificio = (depois, lance) => {
    const valorDaPeca = VALOR[lance.promotion ?? lance.piece]
    if (valorDaPeca < 3) return false
    const capturado = lance.captured ? VALOR[lance.captured] : 0
    if (capturado >= valorDaPeca - 1) return false
    const adversario = depois.turn()
    const atacantes = depois.attackers(lance.to, adversario)
    if (!atacantes.length) return false
    const defensores = depois.attackers(lance.to, lance.color)
    const menorAtacante = Math.min(...atacantes.map((casa) => VALOR[depois.get(casa).type] || 100))
    return !defensores.length || menorAtacante < valorDaPeca
}

const contagemVazia = () => Object.fromEntries(CATEGORIAS.map(({ id }) => [id, 0]))

// analisa a partida (lista de lances { from, to, promotion }). aoProgredir(0..1) a cada posição.
// Devolve { precisao: { w, b }, contagem: { w: { brilhante, otimo, ... }, b: {...} },
//           lances: [{ categoria, melhor (SAN em inglês, do chess.js, quando o jogado não foi ele) }] }
export const analisarPartida = async (lances, aoProgredir) => {
    const xadrez = new Chess()
    const avaliacoes = []
    for (let indice = 0; indice <= lances.length; indice += 1) {
        avaliacoes.push(await avaliar(xadrez))
        aoProgredir?.((indice + 1) / (lances.length + 1))
        if (indice < lances.length) xadrez.move(lances[indice])
    }

    const precisoes = { w: [], b: [] }
    const contagem = { w: contagemVazia(), b: contagemVazia() }
    const revisao = new Chess()
    let quedaAnterior = 0
    const porLance = lances.map((lance, indice) => {
        const cor = revisao.turn()
        const sinal = cor === 'w' ? 1 : -1
        const avaliacao = avaliacoes[indice]
        const antes = chanceDeVencer(sinal * avaliacao.nota)
        const depois = chanceDeVencer(sinal * avaliacoes[indice + 1].nota)
        const queda = Math.max(0, antes - depois)
        precisoes[cor].push(precisaoDoLance(queda))

        const melhor = avaliacao.melhor
        const jogado = revisao.move(lance)
        const foiOMelhor = Boolean(melhor) && melhor.from === jogado.from && melhor.to === jogado.to
            && (melhor.promotion ?? null) === (jogado.promotion ?? null)

        let categoria
        if (foiOMelhor || queda <= ATE_EXCELENTE) {
            const sacrificio = foiSacrificio(revisao, jogado)
            const segundaChance = avaliacao.segunda === null ? null : chanceDeVencer(avaliacao.segunda)
            const unicoBom = foiOMelhor && segundaChance !== null && chanceDeVencer(avaliacao.notaDeQuemJoga) - segundaChance >= DIFERENCA_OTIMO
            if (sacrificio && queda <= ATE_EXCELENTE && antes < BRILHANTE_ANTES_ATE && depois >= BRILHANTE_DEPOIS_PELO_MENOS) categoria = 'brilhante'
            // xeque-mate é sempre "Melhor" (como nos apps), mesmo sendo o único lance que ganha
            else if (unicoBom && !revisao.isCheckmate()) categoria = 'otimo'
            else if (foiOMelhor) categoria = 'melhor'
            else categoria = 'excelente'
        } else if (queda <= ATE_BOM) categoria = 'bom'
        else if (queda <= ATE_IMPRECISAO) categoria = 'imprecisao'
        else if (quedaAnterior >= ERRO_DO_ADVERSARIO) categoria = 'perdeu'
        else if (queda <= ATE_ERRO) categoria = 'erro'
        else categoria = 'capivarada'
        contagem[cor][categoria] += 1
        quedaAnterior = queda

        // melhor lance da posição de antes (em SAN), quando o jogado não foi ele
        let melhorSan = null
        if (melhor && !foiOMelhor) {
            revisao.undo()
            melhorSan = revisao.move(melhor)?.san ?? null
            revisao.undo()
            revisao.move(lance)
        }
        return { categoria, melhor: melhorSan }
    })

    return {
        precisao: { w: precisaoDoLado(precisoes.w), b: precisaoDoLado(precisoes.b) },
        contagem,
        lances: porLance,
    }
}
