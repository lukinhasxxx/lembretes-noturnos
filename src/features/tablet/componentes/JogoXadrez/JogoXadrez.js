import './JogoXadrez.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'
import { NIVEIS_XADREZ, jogarLance, sugerirLanceForte } from './motorXadrez'
import { CATEGORIAS } from './analiseXadrez'
import { baixarPgn, exportarParaLichess, montarPgn } from './exportarXadrez'
import { somDoLance, tocarSomXadrez } from './somXadrez'
import ModalAnalise from './ModalAnalise'
import { SISTEMA } from '../../tablet.config'
import { BotaoModoJogo, ControlesModoJogo, useModoJogo } from '../ModoJogo/ModoJogo'

const COLUNAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const CORES = [
    { id: 'w', nome: 'Brancas' },
    { id: 'b', nome: 'Pretas' },
    { id: 'sorteio', nome: 'Aleatória' },
]
const PROMOCOES = ['q', 'r', 'b', 'n']
// pausa antes do computador jogar (para o lance da pessoa assentar)
const PAUSA_COMPUTADOR_MS = 350
// cor sorteada: o aviso "Você joga de pretas" fica na tela esse tempo antes do computador abrir o jogo
const DURACAO_AVISO_SORTEIO_MS = 1600
// a lâmpada "acende" um pouquinho antes de mostrar a dica
const ESPERA_DICA_MS = 450
// quanto tempo o "Copiado!" fica no botão Compartilhar
const DURACAO_COPIADO_MS = 1500
// o acorde do fim espera o som do último lance (segundos)
const ATRASO_SOM_DO_FIM_S = 0.25
// quanto o ponteiro anda (px na tela) antes de virar arraste da peça; menos que isso é clique
const LIMIAR_ARRASTE_PX = 5

// 2 jogadores (no mesmo aparelho): nomes quando a pessoa não escreve nenhum, e o tamanho máximo do nome
const NOMES_PADRAO = { w: 'Brancas', b: 'Pretas' }
const TAMANHO_MAXIMO_NOME = 14
// como os 2 jogadores veem: um tabuleiro só (passando o aparelho) ou dois lado a lado (frente a frente)
const VISUALIZACOES = [
    { id: 'padrao', nome: 'Um tabuleiro' },
    { id: 'espelhado', nome: 'Lado a lado' },
]

// elo da pessoa (fórmula do Elo, a mesma da FIDE): começa em 200 "por baixo dos panos" e só aparece depois
// da primeira vitória (antes disso fica "??"). O computador conta com o elo do nível (300 a 2000).
// Partida de 2 jogadores não mexe no elo
const ELO_INICIAL = 200
const ELO_MINIMO = 100
// quanto o elo anda por partida (40 é o que a FIDE usa para quem está começando)
const FATOR_K = 40
const PONTOS_DO_RESULTADO = { vitoria: 1, empate: 0.5, derrota: 0 }
// cada dica tira 10% do resultado (vitória com 2 dicas vale 0,8; com 5, vale um empate). Na derrota o
// resultado fica abaixo de zero, então perder com dicas também custa mais (4 pontos por dica, com K = 40).
// Os sites grandes deixam a partida sem rating quando tem ajuda; aqui ela conta, mas pesa
const PENALIDADE_POR_DICA = 0.1
const calcularElo = (elo, eloAdversario, resultado, dicas = 0) => {
    const chanceEsperada = 1 / (1 + 10 ** ((eloAdversario - elo) / 400))
    const pontos = PONTOS_DO_RESULTADO[resultado] - dicas * PENALIDADE_POR_DICA
    return Math.max(ELO_MINIMO, Math.round(elo + FATOR_K * (pontos - chanceEsperada)))
}
// últimas partidas guardadas (a tela de início mostra as mais recentes)
const TAMANHO_HISTORICO = 20
// quantas partidas do histórico guardam a análise (precisão e quantos lances de cada categoria, para abrir de novo)
const ANALISES_NO_HISTORICO = 10

// notação em português: o chess.js escreve em inglês (N = knight...); aqui vira C = cavalo, T = torre,
// D = dama, R = rei (o B de bispo é igual). Roque (O-O) e casas não mudam
const LETRA_EM_PORTUGUES = { K: 'R', Q: 'D', R: 'T', N: 'C' }
const emPortugues = (san) => san.replace(/[KQRN]/g, (letra) => LETRA_EM_PORTUGUES[letra])

// revendo a partida analisada: lances tão bons que não precisam da seta do recomendado (o jogado já é ele ou
// quase isso)
const CATEGORIAS_SEM_RECOMENDADO = ['brilhante', 'otimo', 'melhor', 'excelente']

// lances de uma partida do histórico (SAN), ou null: as linhas mais antigas só têm se a partida foi analisada
const sansDaJogada = (jogada) => jogada.sans ?? jogada.analise?.sans ?? null

const imagemDaPeca = (cor, tipo) => `${process.env.PUBLIC_URL}/imagens/xadrez/${cor}${tipo}.svg`
const nomeDaCor = (cor) => (cor === 'w' ? 'brancas' : 'pretas')
const outraCor = (cor) => (cor === 'w' ? 'b' : 'w')
// "Ana venceu", mas "Pretas venceram": os nomes padrão (as cores) pedem o verbo no plural
const frase = (nome, singular, plural) => `${nome} ${nome === NOMES_PADRAO.w || nome === NOMES_PADRAO.b ? plural : singular}`
const nivelDe = (id) => NIVEIS_XADREZ.find((nivel) => nivel.id === id)

// refaz a partida a partir da lista de lances: a instância do chess.js precisa do histórico inteiro para
// saber de repetição de posição; as posições (FEN) servem para o modo leitura
const montarPartida = (lances) => {
    const xadrez = new Chess()
    const posicoes = [xadrez.fen()]
    for (const lance of lances) {
        xadrez.move(lance)
        posicoes.push(xadrez.fen())
    }
    return { xadrez, posicoes }
}

// fim de partida: { resultado: 'vitoria' | 'derrota' | 'empate', texto (curto, para o status), motivo } ou null.
// Com 2 jogadores, quem ganhou vem em "vencedor" (cor) e resultado é 'vitoria' (para o quadro de fim);
// lá o "abandonou" guarda a cor de quem desistiu (contra o computador é só true)
const descreverFim = (xadrez, partida) => {
    const nomes = partida.nomes ?? NOMES_PADRAO
    const dois = partida.modo === 'dois'
    if (partida.abandonou) {
        return dois
            ? { resultado: 'vitoria', vencedor: outraCor(partida.abandonou), texto: `${frase(nomes[partida.abandonou], 'abandonou', 'abandonaram')}.`, motivo: 'abandono' }
            : { resultado: 'derrota', texto: 'Você abandonou.', motivo: 'abandono' }
    }
    if (xadrez.isCheckmate()) {
        const vencedor = outraCor(xadrez.turn())
        if (dois) return { resultado: 'vitoria', vencedor, texto: `Xeque-mate! ${frase(nomes[vencedor], 'venceu', 'venceram')}!`, motivo: 'xeque-mate' }
        return vencedor === partida.corJogador
            ? { resultado: 'vitoria', texto: 'Xeque-mate! Você venceu!', motivo: 'xeque-mate' }
            : { resultado: 'derrota', texto: 'Xeque-mate. Você perdeu.', motivo: 'xeque-mate' }
    }
    if (xadrez.isStalemate()) return { resultado: 'empate', texto: 'Empate por afogamento.', motivo: 'afogamento' }
    if (xadrez.isThreefoldRepetition()) return { resultado: 'empate', texto: 'Empate por repetição.', motivo: 'repetição de posição' }
    if (xadrez.isInsufficientMaterial()) return { resultado: 'empate', texto: 'Empate: material insuficiente.', motivo: 'material insuficiente' }
    if (xadrez.isDraw()) return { resultado: 'empate', texto: 'Empate (regra dos 50 lances).', motivo: 'regra dos 50 lances' }
    return null
}


// partida salva que dá para continuar: tem lances e não acabou
const emAndamento = (partida) => Boolean(partida?.lances?.length) && !descreverFim(montarPartida(partida.lances).xadrez, partida)

// valor das peças em "peões" (o jeito comum de contar material no xadrez)
const VALOR_MATERIAL = { p: 1, n: 3, b: 3, r: 5, q: 9 }

// números de verdade da partida, tirados dos lances: capturas, xeques, material e a maior vantagem que a
// pessoa teve (em peões) ao longo do jogo
const estatisticasDaPartida = (lances, corJogador) => {
    const conta = { capturasVoce: 0, capturasComputador: 0, xequesVoce: 0, xequesComputador: 0, maiorVantagem: 0 }
    let saldo = 0
    for (const lance of lances) {
        const daPessoa = lance.color === corJogador
        let ganho = 0
        if (lance.captured) {
            ganho += VALOR_MATERIAL[lance.captured]
            conta[daPessoa ? 'capturasVoce' : 'capturasComputador'] += 1
        }
        // promoção: o peão vira outra peça (a dama vale 9, o peão 1 → ganho de 8)
        if (lance.promotion) ganho += VALOR_MATERIAL[lance.promotion] - 1
        saldo += daPessoa ? ganho : -ganho
        if (/[+#]/.test(lance.san)) conta[daPessoa ? 'xequesVoce' : 'xequesComputador'] += 1
        conta.maiorVantagem = Math.max(conta.maiorVantagem, saldo)
    }
    return { ...conta, saldoFinal: saldo, lancesCompletos: Math.ceil(lances.length / 2) }
}

// placar de material de um lado: as peças que ele já capturou (do adversário, da mais valiosa para a menos)
// e quantos pontos ele está à frente (peão 1, cavalo 3, bispo 3, torre 5, dama 9), contando pelo tabuleiro
// (assim a promoção também entra na conta)
const ORDEM_CAPTURADAS = ['q', 'r', 'b', 'n', 'p']
const placarDeMaterial = (xadrez, lancesAteAqui, cor) => {
    let meu = 0
    let dele = 0
    for (const fileira of xadrez.board()) {
        for (const peca of fileira) {
            if (!peca || peca.type === 'k') continue
            if (peca.color === cor) meu += VALOR_MATERIAL[peca.type]
            else dele += VALOR_MATERIAL[peca.type]
        }
    }
    const capturadas = lancesAteAqui
        .filter((lance) => lance.color === cor && lance.captured)
        .map((lance) => lance.captured)
        .sort((a, b) => ORDEM_CAPTURADAS.indexOf(a) - ORDEM_CAPTURADAS.indexOf(b))
    return { capturadas, vantagem: meu - dele }
}

// ao lado do nome: as peças que o jogador já tomou (miniaturas) e o "+N" de quem está à frente
const Material = ({ placar, corDasCapturadas }) => (
    <span className='xadrez-material'>
        {placar.capturadas.map((tipo, indice) => (
            <img key={indice} src={imagemDaPeca(corDasCapturadas, tipo)} alt='' draggable={false} />
        ))}
        {placar.vantagem > 0 && <b>+{placar.vantagem}</b>}
    </span>
)

const formatarDuracao = (ms) => {
    const segundos = Math.round(ms / 1000)
    const minutos = Math.floor(segundos / 60)
    return minutos ? `${minutos} min ${String(segundos % 60).padStart(2, '0')} s` : `${segundos} s`
}

const formatarDiaMes = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

// casa → posição na tela (coluna e linha de 0 a 7), já com o tabuleiro virado se a pessoa joga de pretas
const posicaoNaTela = (casa, colunas, linhas) => ({
    coluna: colunas.indexOf(casa[0]),
    linha: linhas.indexOf(Number(casa[1])),
})

// peças que andaram no último lance (no roque, o rei e a torre): { destino: origem }
const pecasQueAndaram = (lance) => {
    if (!lance) return {}
    const andaram = { [lance.to]: lance.from }
    const fila = lance.color === 'w' ? '1' : '8'
    if (lance.flags.includes('k')) andaram[`f${fila}`] = `h${fila}`
    if (lance.flags.includes('q')) andaram[`d${fila}`] = `a${fila}`
    return andaram
}

// o contrário (voltando um lance revendo a partida): as peças saem do destino e voltam para a origem
const pecasQueVoltaram = (lance) => Object.fromEntries(
    Object.entries(pecasQueAndaram(lance)).map(([destino, origem]) => [origem, destino]),
)


const RESULTADO_CURTO = { vitoria: 'Venceu', derrota: 'Perdeu', empate: 'Empate' }
// categorias da análise (Brilhante, Ótimo, Melhor...) pelo id
const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((categoria) => [categoria.id, categoria]))

// xadrez.exe: contra o computador (níveis 300 a 2000) ou 2 jogadores no mesmo aparelho.
// - Tela de início: só um cartão no meio da janela. Contra o computador: nível e cor. 2 jogadores: os nomes e
//   como jogar (um tabuleiro, com as brancas embaixo, ou dois lado a lado). Cada modo tem a sua partida salva
//   ("Continuar partida"); "Histórico" mostra as últimas partidas.
// - Partida: clicar numa peça mostra os lances possíveis; clicar no destino joga. Do lado, os jogadores, os
//   lances, ◀ ▶ (rever lances sem mexer na partida) e a 💡 (só contra o computador); o resto (voltar ao
//   início, abandonar) fica no menu ☰. Lado a lado não tem lateral: o ☰ fica em cima, entre os tabuleiros,
//   e o menu abre no meio da tela.
// - Fim: quadro com as estatísticas e o elo (só contra o computador); aí libera rever a partida inteira.
const JogoXadrez = ({ fecharApp, minimizarApp, classeAnimacao }) => {
    const { tema, telaAtiva } = useSistemaTablet()
    // partidas salvas, uma por modo (assim "Continuar" de 2 jogadores nunca abre uma contra o computador e
    // trocar de modo não perde a outra): { lances: [{ from, to, promotion }], inicio, fimEm, abandonou, e
    //   contra o computador: nivel, corJogador, sorteada, dicas
    //   2 jogadores: modo: 'dois', nomes: { w, b }, visualizacao: 'padrao' | 'espelhado' }
    const [salvaComputador, setSalvaComputador] = useEstadoPersistido('xadrez-partida', null)
    const [salvaDois, setSalvaDois] = useEstadoPersistido('xadrez-partida-dois', null)
    // escolhas da tela de início (lembradas para a próxima vez)
    const [oponenteEscolhido, setOponenteEscolhido] = useEstadoPersistido('xadrez-oponente', 'computador')
    const [nivelEscolhido, setNivelEscolhido] = useEstadoPersistido('xadrez-nivel', NIVEIS_XADREZ[0].id)
    const [corEscolhida, setCorEscolhida] = useEstadoPersistido('xadrez-cor', 'w')
    const [nomesEscolhidos, setNomesEscolhidos] = useEstadoPersistido('xadrez-nomes', { w: '', b: '' })
    const [visualizacaoEscolhida, setVisualizacaoEscolhida] = useEstadoPersistido('xadrez-visualizacao', 'padrao')
    // partida do modo escolhido: a salva dele ou uma vazia (que ainda não começou). Uma de 2 jogadores que
    // tenha ficado no lugar antigo (antes de cada modo ter o seu) conta como de 2 jogadores
    const antigaDeDois = salvaComputador?.modo === 'dois' ? salvaComputador : null
    const partidaDoModo = (oponente) => (oponente === 'dois'
        ? salvaDois ?? antigaDeDois ?? { modo: 'dois', lances: [], corJogador: 'w', nomes: NOMES_PADRAO, visualizacao: visualizacaoEscolhida, inicio: Date.now() }
        : (antigaDeDois ? null : salvaComputador) ?? { lances: [], nivel: nivelEscolhido, corJogador: 'w', inicio: Date.now() })
    // elo: { valor, revelado } (revelado = já venceu alguma vez; antes disso aparece "??")
    const [elo, setElo] = useEstadoPersistido('xadrez-elo', { valor: ELO_INICIAL, revelado: false })
    // últimas partidas, da mais nova para a mais velha. Contra o computador: { data, nivel, cor, resultado,
    // motivo, lances, eloAntes, eloDepois, dicas }; 2 jogadores: { data, modo: 'dois', nomes, vencedor, resultado, motivo, lances }
    const [partidasJogadas, setPartidasJogadas] = useEstadoPersistido('xadrez-historico', [])
    // sons dos lances e do fim (somXadrez.js); liga/desliga no menu ☰
    const [somLigado, setSomLigado] = useEstadoPersistido('xadrez-som', true)
    // lista de lances: numa linha só, que anda junto com a partida (padrão), ou expandida (todos os lances)
    const [listaExpandida, setListaExpandida] = useEstadoPersistido('xadrez-lista-expandida', false)

    // abre sempre na tela de início
    const [naTelaDeInicio, setNaTelaDeInicio] = useState(true)
    const [partida, setPartida] = useState(() => partidaDoModo(oponenteEscolhido))
    // quadro de fim de partida fechado ("Ver a partida"); uma partida salva que já tinha acabado abre sem ele
    const [fimFechado, setFimFechado] = useState(() => Boolean(partidaDoModo(oponenteEscolhido).fimEm))
    const [selecionada, setSelecionada] = useState(null)
    const [promocaoPendente, setPromocaoPendente] = useState(null)
    const [dica, setDica] = useState(null)
    const [acendendoDica, setAcendendoDica] = useState(false)
    const [pensando, setPensando] = useState(false)
    // modo leitura: índice da posição sendo vista (null = ao vivo)
    const [posicaoVista, setPosicaoVista] = useState(null)
    const [menuAberto, setMenuAberto] = useState(false)
    // confirmação: 'abandonar' (menu, no meio da partida) ou 'nova' (tela de início, com partida salva)
    const [confirmar, setConfirmar] = useState(null)
    const [avisoSorteio, setAvisoSorteio] = useState(false)
    // tela de início: lista das últimas partidas aberta (botão "Histórico")
    const [verHistorico, setVerHistorico] = useState(false)
    // tela de início: lista suspensa dos níveis aberta
    const [listaNiveisAberta, setListaNiveisAberta] = useState(false)
    // modo jogo (tela cheia dentro do tablet), lembrado para a próxima vez; Esc sai
    const [modoJogo, alternarModoJogo] = useModoJogo('xadrez')
    // última mudança de elo (para o quadro de fim): { antes, depois, revelado, dicas, custoDasDicas }
    const [ultimoElo, setUltimoElo] = useState(null)
    // análise rodando: progresso de 0 a 1 (null = parada)
    const [analisando, setAnalisando] = useState(null)
    // quadro da análise aberto: 'partida' (a que está na tela) ou a linha do histórico; null = fechado
    const [analiseAberta, setAnaliseAberta] = useState(null)
    // a partida que está na tela agora (null na tela de início): a análise que termina depois só abre se for ela
    const partidaNaTelaRef = useRef(null)
    // enviando a partida para o Lichess (o botão espera a resposta)
    const [exportando, setExportando] = useState(false)
    // "Compartilhar": avisa por um instante que o PGN foi copiado ('copiado') ou baixado ('baixado')
    const [copiado, setCopiado] = useState(null)
    const timerCopiadoRef = useRef(null)
    // peça sendo arrastada (ver comecarArraste); depois de soltar, o clique que vem junto é ignorado;
    // e o lance feito arrastando não tem o deslize (guarda o número dele)
    const arrasteRef = useRef(null)
    const ignorarCliqueRef = useRef(false)
    const semDeslizeRef = useRef(null)
    // posição que estava na tela no último desenho e o passo até a atual (+1 avançou, -1 voltou): o deslize das
    // peças só roda num passo de um lance (ver tabuleiro)
    const passoNaTelaRef = useRef({ numero: null, passo: 0 })
    // número do último pedido de dica: muda ao jogar/sair, e aí uma resposta atrasada é ignorada
    const pedidoDicaRef = useRef(0)
    const listaRef = useRef(null)
    // quantos lances a partida tinha (e qual partida era) no último som: só um lance a mais faz barulho
    const lancesDoSomRef = useRef({ inicio: null, quantos: 0 })

    const dois = partida.modo === 'dois'
    const nomes = partida.nomes ?? NOMES_PADRAO
    const espelhado = dois && partida.visualizacao === 'espelhado'
    const { xadrez, posicoes } = useMemo(() => montarPartida(partida.lances), [partida.lances])
    const fim = descreverFim(xadrez, partida)
    // com 2 jogadores, quem tem a vez é sempre uma pessoa
    const vezDaPessoa = !fim && (dois || xadrez.turn() === partida.corJogador)
    const lendo = posicaoVista !== null && posicaoVista < posicoes.length - 1
    const historico = xadrez.history()
    const partidaSalvaEmAndamento = emAndamento(partida)
    partidaNaTelaRef.current = naTelaDeInicio ? null : partida.inicio
    // som só com o xadrez na frente (minimizado, o computador joga em silêncio)
    const podeTocar = somLigado && !naTelaDeInicio && telaAtiva === 'xadrez.exe'

    // som de cada lance novo (da pessoa, do computador ou do outro jogador). Voltar um lance, trocar de partida
    // ou abrir uma salva não toca nada: só quando a mesma partida ganha exatamente um lance
    useEffect(() => {
        const antes = lancesDoSomRef.current
        lancesDoSomRef.current = { inicio: partida.inicio, quantos: partida.lances.length }
        if (!podeTocar || antes.inicio !== partida.inicio || partida.lances.length !== antes.quantos + 1) return
        const ultimo = xadrez.history({ verbose: true }).at(-1)
        if (ultimo) tocarSomXadrez(somDoLance(ultimo))
        // só quando muda o número de lances
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partida.lances.length, partida.inicio])

    // salva a cada lance (e ao começar partida nova), no lugar do modo dela. Partida aberta do histórico (só
    // para rever) não é salva: a salva de verdade continua lá
    useEffect(() => {
        if (partida.doHistorico) return
        if (partida.modo === 'dois') setSalvaDois(partida)
        else setSalvaComputador(partida)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partida])

    // tela de início: trocar entre "contra o computador" e "2 jogadores" traz a partida salva daquele modo
    const escolherOponente = (oponente) => {
        if (oponente === oponenteEscolhido) return
        const daquele = partidaDoModo(oponente)
        setOponenteEscolhido(oponente)
        setPartida(daquele)
        setFimFechado(Boolean(daquele.fimEm))
        setConfirmar(null)
        setListaNiveisAberta(false)
    }

    // vez do computador: pensa um pouco e joga (na tela de início ele espera; com 2 jogadores não tem computador)
    useEffect(() => {
        if (dois || naTelaDeInicio || fim || xadrez.turn() === partida.corJogador) return
        const pausa = partida.sorteada && !partida.lances.length ? DURACAO_AVISO_SORTEIO_MS : PAUSA_COMPUTADOR_MS
        setPensando(true)
        // o Stockfish responde depois (Promise): se nesse meio-tempo a partida mudou (voltou ao início,
        // abandonou, partida nova), a resposta é ignorada
        let cancelado = false
        const timer = setTimeout(async () => {
            const lance = await jogarLance(xadrez.fen(), partida.nivel)
            if (cancelado) return
            setPensando(false)
            if (lance) setPartida((atual) => ({ ...atual, lances: [...atual.lances, lance] }))
        }, pausa)
        return () => {
            cancelado = true
            clearTimeout(timer)
            setPensando(false)
        }
    }, [dois, xadrez, partida.corJogador, partida.nivel, partida.sorteada, partida.lances.length, fim, naTelaDeInicio])

    // aviso da cor sorteada: some sozinho
    useEffect(() => {
        if (!avisoSorteio) return
        const timer = setTimeout(() => setAvisoSorteio(false), DURACAO_AVISO_SORTEIO_MS)
        return () => clearTimeout(timer)
    }, [avisoSorteio])

    // guarda a partida que acabou: uma linha no histórico e, contra o computador, o elo novo
    const registrarFim = (partidaQueAcabou, fimDela) => {
        const lances = Math.ceil(partidaQueAcabou.lances.length / 2)
        // os lances (SAN do chess.js, ~5 bytes cada): dá para rever a partida pelo histórico
        const sans = montarPartida(partidaQueAcabou.lances).xadrez.history()
        if (partidaQueAcabou.modo === 'dois') {
            const nomesDela = partidaQueAcabou.nomes ?? NOMES_PADRAO
            setUltimoElo(null)
            setPartidasJogadas((atuais) => [
                {
                    data: Date.now(),
                    inicio: partidaQueAcabou.inicio,
                    modo: 'dois',
                    nomes: nomesDela,
                    vencedor: fimDela.vencedor ? nomesDela[fimDela.vencedor] : null,
                    resultado: fimDela.resultado,
                    motivo: fimDela.motivo,
                    lances,
                    sans,
                },
                ...atuais,
            ].slice(0, TAMANHO_HISTORICO))
            return
        }
        const eloAdversario = Number(nivelDe(partidaQueAcabou.nivel)?.nome) || ELO_INICIAL
        const antes = elo.valor
        const dicas = partidaQueAcabou.dicas ?? 0
        const depois = calcularElo(antes, eloAdversario, fimDela.resultado, dicas)
        // quanto as dicas custaram (para mostrar no quadro de fim)
        const custoDasDicas = calcularElo(antes, eloAdversario, fimDela.resultado) - depois
        const revelado = elo.revelado || fimDela.resultado === 'vitoria'
        setElo({ valor: depois, revelado })
        setUltimoElo({ antes, depois, revelado, dicas, custoDasDicas })
        setPartidasJogadas((atuais) => [
            {
                data: Date.now(),
                inicio: partidaQueAcabou.inicio,
                nivel: partidaQueAcabou.nivel,
                cor: partidaQueAcabou.corJogador,
                resultado: fimDela.resultado,
                motivo: fimDela.motivo,
                lances,
                eloAntes: antes,
                eloDepois: depois,
                dicas,
                sans,
            },
            ...atuais,
        ].slice(0, TAMANHO_HISTORICO))
    }

    // acabou agora (o fimEm marca que já foi registrada): guarda a hora, o elo e o histórico
    useEffect(() => {
        if (!fim || partida.fimEm) return
        registrarFim(partida, fim)
        // acorde do fim, logo depois do som do último lance (com 2 jogadores alguém sempre "venceu")
        if (podeTocar) {
            const somDoFim = fim.resultado === 'empate' ? 'empate' : fim.resultado === 'derrota' ? 'derrota' : 'vitoria'
            tocarSomXadrez(somDoFim, ATRASO_SOM_DO_FIM_S)
        }
        setPartida((atual) => ({ ...atual, fimEm: Date.now() }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fim, partida.fimEm])

    // lista de lances sempre mostrando o lance da vez: o que está sendo revisto ou, ao vivo, o último (no começo
    // da partida revista, o início). Em linha, ele fica no meio (rola de lado, deslizando); expandida, rola na
    // vertical até ele
    useEffect(() => {
        const lista = listaRef.current
        if (!lista) return
        const alvo = lendo ? lista.querySelector('li.visto') : lista.lastElementChild
        const centro = (inicio, tamanhoDoAlvo, tamanhoDaLista) => Math.max(0, inicio - tamanhoDaLista / 2 + tamanhoDoAlvo / 2)
        if (listaExpandida) {
            lista.scrollTo({ top: alvo ? centro(alvo.offsetTop, alvo.offsetHeight, lista.clientHeight) : 0, behavior: 'smooth' })
        } else {
            lista.scrollTo({ left: alvo ? centro(alvo.offsetLeft, alvo.offsetWidth, lista.clientWidth) : 0, behavior: 'smooth' })
        }
    }, [historico.length, lendo, posicaoVista, listaExpandida, naTelaDeInicio])

    const jogar = (lance) => {
        setPartida((atual) => ({ ...atual, lances: [...atual.lances, lance] }))
        setSelecionada(null)
        setDica(null)
        pedidoDicaRef.current += 1
        setAcendendoDica(false)
        setPosicaoVista(null)
    }

    // quem pode mexer agora: contra o computador, só a cor da pessoa; com 2 jogadores, a cor da vez
    const corQueMexe = dois ? xadrez.turn() : partida.corJogador

    const clicarNaCasa = (casa) => {
        if (!vezDaPessoa || lendo || promocaoPendente) return
        const peca = xadrez.get(casa)
        // clicou numa peça sua: seleciona (ou troca a seleção)
        if (peca && peca.color === corQueMexe) {
            setSelecionada(casa === selecionada ? null : casa)
            return
        }
        if (!selecionada) return
        const lance = xadrez.moves({ square: selecionada, verbose: true }).find((item) => item.to === casa)
        if (!lance) {
            setSelecionada(null)
            return
        }
        // peão chegando no fim: escolhe a peça antes de jogar
        if (lance.promotion) setPromocaoPendente({ from: selecionada, to: casa })
        else jogar({ from: selecionada, to: casa })
    }

    // arrastar a peça (mouse ou dedo), além de clicar. O arraste só começa depois de LIMIAR_ARRASTE_PX (antes
    // disso é um clique normal). A peça segue o ponteiro mexendo direto no estilo dela (sem re-renderizar a
    // cada movimento); ao soltar numa casa válida, joga. Soltar fora (ou na própria casa) deixa só selecionada
    const comecarArraste = (evento, casa) => {
        ignorarCliqueRef.current = false
        if (evento.button !== 0 || !vezDaPessoa || lendo || promocaoPendente) return
        const peca = xadrez.get(casa)
        if (!peca || peca.color !== corQueMexe) return
        const botao = evento.currentTarget
        arrasteRef.current = {
            casa,
            id: evento.pointerId,
            x: evento.clientX,
            y: evento.clientY,
            botao,
            imagem: botao.querySelector('img'),
            // o tablet é escalado: o deslocamento na tela vira deslocamento "dentro" dele
            escala: botao.getBoundingClientRect().width / botao.offsetWidth || 1,
            arrastando: false,
        }
        botao.setPointerCapture(evento.pointerId)
    }

    const moverArraste = (evento) => {
        const arraste = arrasteRef.current
        if (!arraste || evento.pointerId !== arraste.id) return
        const dx = evento.clientX - arraste.x
        const dy = evento.clientY - arraste.y
        if (!arraste.arrastando) {
            if (Math.hypot(dx, dy) < LIMIAR_ARRASTE_PX) return
            arraste.arrastando = true
            // a casa de origem fica por cima das outras, para a peça não passar por baixo delas
            arraste.botao.style.zIndex = 5
            arraste.imagem.classList.add('arrastando')
            setSelecionada(arraste.casa)
        }
        arraste.imagem.style.transform = `translate(${dx / arraste.escala}px, ${dy / arraste.escala}px)`
    }

    const terminarArraste = (arraste) => {
        arrasteRef.current = null
        arraste.botao.style.zIndex = ''
        arraste.imagem.classList.remove('arrastando')
        arraste.imagem.style.transform = ''
    }

    const soltarArraste = (evento) => {
        const arraste = arrasteRef.current
        if (!arraste || evento.pointerId !== arraste.id) return
        if (!arraste.arrastando) {
            arrasteRef.current = null
            return
        }
        terminarArraste(arraste)
        // o clique que o navegador manda depois de soltar não conta
        ignorarCliqueRef.current = true
        const alvo = document.elementFromPoint(evento.clientX, evento.clientY)?.closest('.xadrez-casa')
        if (!alvo || !arraste.botao.parentElement.contains(alvo)) return
        const casa = alvo.getAttribute('aria-label')
        const lance = xadrez.moves({ square: arraste.casa, verbose: true }).find((item) => item.to === casa)
        if (!lance) return
        // a peça já está no lugar: sem o deslize do último lance
        semDeslizeRef.current = historico.length + 1
        if (lance.promotion) setPromocaoPendente({ from: arraste.casa, to: casa })
        else jogar({ from: arraste.casa, to: casa })
    }

    const cancelarArraste = (evento) => {
        const arraste = arrasteRef.current
        if (arraste && evento.pointerId === arraste.id) terminarArraste(arraste)
    }

    const limparTabuleiro = () => {
        pedidoDicaRef.current += 1
        setAcendendoDica(false)
        setFimFechado(false)
        setSelecionada(null)
        setDica(null)
        setPosicaoVista(null)
        setPromocaoPendente(null)
        setConfirmar(null)
        setMenuAberto(false)
        setVerHistorico(false)
        setListaNiveisAberta(false)
        setAnaliseAberta(null)
    }

    const comecarNova = () => {
        if (oponenteEscolhido === 'dois') {
            setPartida({
                modo: 'dois',
                lances: [],
                corJogador: 'w',
                nomes: {
                    w: nomesEscolhidos.w.trim() || NOMES_PADRAO.w,
                    b: nomesEscolhidos.b.trim() || NOMES_PADRAO.b,
                },
                visualizacao: visualizacaoEscolhida,
                inicio: Date.now(),
            })
            limparTabuleiro()
            setAvisoSorteio(false)
            setNaTelaDeInicio(false)
            return
        }
        const sorteada = corEscolhida === 'sorteio'
        const cor = sorteada ? (Math.random() < 0.5 ? 'w' : 'b') : corEscolhida
        setPartida({ lances: [], nivel: nivelEscolhido, corJogador: cor, sorteada, inicio: Date.now() })
        limparTabuleiro()
        setAvisoSorteio(sorteada)
        setNaTelaDeInicio(false)
    }

    // "Nova partida" com uma salva no meio: confirma (abandonar conta como derrota)
    const pedirNova = () => {
        if (partidaSalvaEmAndamento) setConfirmar('nova')
        else comecarNova()
    }

    // quem abandona: contra o computador, a pessoa (true); com 2 jogadores, quem tem a vez
    const quemAbandona = dois ? xadrez.turn() : true

    const abandonarENova = () => {
        registrarFim(partida, descreverFim(xadrez, { ...partida, abandonou: quemAbandona }))
        comecarNova()
    }

    const abandonar = () => {
        setPartida((atual) => ({ ...atual, abandonou: quemAbandona }))
        setConfirmar(null)
        setMenuAberto(false)
    }

    // continuar: com 2 jogadores, vale o "como vocês vão jogar" escolhido agora (dá para trocar no meio)
    const continuar = () => {
        if (dois) setPartida((atual) => ({ ...atual, visualizacao: visualizacaoEscolhida }))
        limparTabuleiro()
        setNaTelaDeInicio(false)
    }

    const voltarAoInicio = () => {
        limparTabuleiro()
        setNaTelaDeInicio(true)
        // saindo de uma partida do histórico: volta a salva do modo escolhido
        if (partida.doHistorico) {
            const salva = partidaDoModo(oponenteEscolhido)
            setPartida(salva)
            setFimFechado(Boolean(salva.fimEm))
        }
    }

    // rever uma partida do histórico: monta de novo a partida (pelos lances guardados), já acabada, e abre o
    // tabuleiro na posição pedida (0 = começo) para ir passando com ◀ ▶. Analisada, vem com a análise
    const abrirDoHistorico = (jogada, posicao = 0) => {
        const montada = new Chess()
        const lances = sansDaJogada(jogada).map((san) => {
            const { from, to, promotion } = montada.move(san)
            return promotion ? { from, to, promotion } : { from, to }
        })
        const dela = jogada.modo === 'dois'
        const resumo = jogada.analise
        limparTabuleiro()
        setPartida({
            doHistorico: true,
            ...(dela
                ? { modo: 'dois', nomes: jogada.nomes ?? NOMES_PADRAO, visualizacao: 'padrao', corJogador: 'w' }
                : { nivel: jogada.nivel, corJogador: jogada.cor, dicas: jogada.dicas }),
            lances,
            inicio: jogada.inicio,
            fimEm: jogada.data,
            // abandono não aparece no tabuleiro: com 2 jogadores, quem abandonou é quem tinha a vez
            abandonou: jogada.motivo === 'abandono' ? (dela ? montada.turn() : true) : undefined,
            analise: resumo?.categorias
                ? {
                    precisao: resumo.precisao,
                    contagem: resumo.contagem,
                    lances: resumo.categorias.map((categoria, indice) => ({ categoria, melhor: resumo.melhores?.[indice] ?? null })),
                }
                : undefined,
        })
        setFimFechado(true)
        setPosicaoVista(posicao >= lances.length ? null : posicao)
        setNaTelaDeInicio(false)
    }

    // dica pelo Stockfish (com força total). Cada dica conta (partida.dicas) e pesa no elo do fim; a mesma
    // dica na tela não conta de novo. A lâmpada brilha pelo menos ESPERA_DICA_MS (e enquanto o Stockfish
    // pensa ou baixa). Se a pessoa sair da partida nesse meio-tempo, a resposta é ignorada
    const pedirDica = () => {
        if (dois || !vezDaPessoa || lendo || acendendoDica || dica) return
        setAcendendoDica(true)
        const pedido = ++pedidoDicaRef.current
        const espera = new Promise((resolver) => setTimeout(resolver, ESPERA_DICA_MS))
        Promise.all([sugerirLanceForte(xadrez.fen()), espera]).then(([lance]) => {
            if (pedido !== pedidoDicaRef.current) return
            setAcendendoDica(false)
            setDica(lance)
            setPartida((atual) => ({ ...atual, dicas: (atual.dicas ?? 0) + 1 }))
        })
    }

    // análise da partida que acabou (Stockfish, método do Lichess): roda em segundo plano mostrando o
    // progresso; o resultado fica na partida e abre no quadro da análise. No histórico vão a precisão e o
    // resumo (só nas ANALISES_NO_HISTORICO partidas mais novas). O progresso aparece na lateral (um
    // tabuleiro) ou no quadro de fim (lado a lado, que não tem lateral)
    const analisar = async () => {
        if (analisando !== null || partida.analise) return
        if (!espelhado) setFimFechado(true)
        setAnalisando(0)
        const daPartida = partida.inicio
        try {
            const { analisarPartida } = await import('./analiseXadrez')
            const analise = await analisarPartida(partida.lances, setAnalisando)
            setPartida((atual) => (atual.inicio === daPartida ? { ...atual, analise } : atual))
            // no histórico: a precisão, a contagem e, de cada lance, a categoria e o melhor (SAN), para o painel
            // "Lances" do quadro e para rever a partida analisada (uns 1–2 KB por partida)
            const resumo = {
                precisao: analise.precisao,
                contagem: analise.contagem,
                sans: montarPartida(partida.lances).xadrez.history(),
                categorias: analise.lances.map((lance) => lance.categoria),
                melhores: analise.lances.map((lance) => lance.melhor),
            }
            setPartidasJogadas((atuais) => {
                let guardadas = 0
                return atuais.map((jogada) => {
                    const comAnalise = jogada.inicio === daPartida
                        ? { ...jogada, precisao: analise.precisao, analise: resumo }
                        : jogada
                    if (!comAnalise.analise) return comAnalise
                    guardadas += 1
                    if (guardadas <= ANALISES_NO_HISTORICO) return comAnalise
                    const { analise: _antiga, ...semAnalise } = comAnalise
                    return semAnalise
                })
            })
            // abre o quadro se a pessoa continua vendo esta partida
            if (partidaNaTelaRef.current === daPartida) setAnaliseAberta((aberta) => aberta ?? 'partida')
        } catch (erro) {
            console.warn('Não deu para analisar a partida.', erro)
        } finally {
            setAnalisando(null)
        }
    }

    // PGN da partida que acabou, com o nome de cada lado (o computador vai com o elo do nível)
    const pgnDaPartida = () => {
        const vencedor = dois
            ? fim.vencedor ?? null
            : fim.resultado === 'vitoria' ? partida.corJogador : fim.resultado === 'derrota' ? outraCor(partida.corJogador) : null
        const lado = (cor) => (dois
            ? { nome: nomes[cor] }
            : cor === partida.corJogador
                ? { nome: SISTEMA.usuario }
                : { nome: 'Computador', elo: Number(nivelDe(partida.nivel)?.nome) || null })
        return montarPgn({ lances: partida.lances, brancas: lado('w'), pretas: lado('b'), vencedor, inicio: partida.inicio })
    }

    // manda a partida para o Lichess e abre lá
    const exportar = async () => {
        if (exportando || !fim) return
        setExportando(true)
        try {
            await exportarParaLichess(pgnDaPartida())
        } finally {
            setExportando(false)
        }
    }

    // só o dado: copia o PGN (ou baixa o .pgn, se não der para copiar) para a pessoa usar onde quiser
    const compartilhar = async () => {
        if (!fim) return
        const pgn = pgnDaPartida()
        try {
            await navigator.clipboard.writeText(pgn)
            setCopiado('copiado')
        } catch {
            baixarPgn(pgn)
            setCopiado('baixado')
        }
        clearTimeout(timerCopiadoRef.current)
        timerCopiadoRef.current = setTimeout(() => setCopiado(null), DURACAO_COPIADO_MS)
    }

    // tabuleiro que aparece: a posição vista no modo leitura, ou a atual
    const xadrezNaTela = lendo ? new Chess(posicoes[posicaoVista]) : xadrez
    const ultimoLance = lendo
        ? (posicaoVista > 0 ? xadrez.history({ verbose: true })[posicaoVista - 1] : null)
        : xadrez.history({ verbose: true }).at(-1)
    // número da posição na tela (quantos lances já foram feitos nela) e o passo desde o último desenho. Guardado
    // no ref só quando o número muda: desenhar de novo a mesma posição não reinicia nem corta o deslize
    const numeroNaTela = lendo ? posicaoVista : posicoes.length - 1
    if (passoNaTelaRef.current.numero !== numeroNaTela) {
        const anterior = passoNaTelaRef.current.numero
        passoNaTelaRef.current = { numero: numeroNaTela, passo: anterior === null ? 0 : numeroNaTela - anterior }
    }
    const passoNaTela = passoNaTelaRef.current.passo
    // partida que acabou, revendo: setas do próximo lance (a gente já sabe qual é). A do lance jogado é cheia, na
    // cor da categoria dele (sem análise, na cor do sistema). Se ele foi "Bom" ou pior, aparece também a do lance
    // recomendado pelo Stockfish: clara e tracejada (como a seta de sugestão do Chess.com). Uma linha na lateral
    // diz qual é qual
    const proximoLance = fim && numeroNaTela < historico.length
        ? xadrez.history({ verbose: true })[numeroNaTela]
        : null
    const analiseDoProximo = proximoLance && partida.analise?.lances[numeroNaTela]
    let recomendado = null
    if (analiseDoProximo?.melhor && !CATEGORIAS_SEM_RECOMENDADO.includes(analiseDoProximo.categoria)) {
        try {
            recomendado = new Chess(posicoes[numeroNaTela]).move(analiseDoProximo.melhor)
        } catch {
            // lance guardado que não serve nesta posição: fica só a seta do jogado
        }
    }
    const setasDoProximo = []
    if (proximoLance) {
        if (recomendado) setasDoProximo.push({ id: 'recomendado', de: recomendado.from, para: recomendado.to, classe: 'seta-recomendado' })
        setasDoProximo.push({ id: 'jogado', de: proximoLance.from, para: proximoLance.to, classe: analiseDoProximo?.categoria ?? 'sem-analise' })
    }
    const setaDoProximo = (colunas, linhas) => {
        if (!setasDoProximo.length) return null
        const centro = (casa) => {
            const { coluna, linha } = posicaoNaTela(casa, colunas, linhas)
            return { x: coluna + 0.5, y: linha + 0.5 }
        }
        return (
            // key: a cada passo as setas aparecem de novo (fade depois do deslize)
            <svg key={numeroNaTela} className='xadrez-seta-proximo' viewBox='0 0 8 8' aria-hidden='true'>
                {setasDoProximo.map((seta) => {
                    const de = centro(seta.de)
                    const para = centro(seta.para)
                    // a ponta para um pouco antes do centro da casa de destino (não cobre a peça que está lá)
                    const tamanho = Math.hypot(para.x - de.x, para.y - de.y)
                    const ponta = { x: para.x - ((para.x - de.x) / tamanho) * 0.32, y: para.y - ((para.y - de.y) / tamanho) * 0.32 }
                    const idDaPonta = `xadrez-ponta-${seta.id}`
                    // a ponta fica dentro do grupo para herdar a cor dele (--cor-categoria)
                    return (
                        <g key={seta.id} className={`xadrez-seta ${seta.classe}`}>
                            <defs>
                                <marker id={idDaPonta} viewBox='0 0 4 4' refX='1.2' refY='2' markerWidth='3.2' markerHeight='3.2' orient='auto'>
                                    <path d='M0,0 L4,2 L0,4 Z' />
                                </marker>
                            </defs>
                            <line x1={de.x} y1={de.y} x2={ponta.x} y2={ponta.y} markerEnd={`url(#${idDaPonta})`} />
                        </g>
                    )
                })}
            </svg>
        )
    }
    const destinos = selecionada ? xadrez.moves({ square: selecionada, verbose: true }) : []
    const reiEmXeque = xadrezNaTela.inCheck()
        ? xadrezNaTela.findPiece({ type: 'k', color: xadrezNaTela.turn() })[0]
        : null

    // de que lado o tabuleiro é visto (a cor que fica embaixo): contra o computador, a da pessoa; 2 jogadores
    // num tabuleiro só, sempre as brancas (quem quiser cada um do seu lado usa o "lado a lado")
    const orientacaoPadrao = dois ? 'w' : partida.corJogador

    // material na posição que está na tela (no modo leitura, a da posição vista)
    const lancesAteAqui = xadrez.history({ verbose: true }).slice(0, lendo ? posicaoVista : undefined)
    const materialDa = (cor) => placarDeMaterial(xadrezNaTela, lancesAteAqui, cor)

    const nomeDoNivel = nivelDe(partida.nivel)?.nome
    const nomeComputador = `Computador (${nomeDoNivel})`
    const quemJoga = fim ? null : xadrez.turn()
    // estatísticas: "você/ele" contra o computador; com 2 jogadores, contadas pelas brancas (e mostradas pelos nomes)
    const estatisticas = fim ? estatisticasDaPartida(xadrez.history({ verbose: true }), dois ? 'w' : partida.corJogador) : null
    const textoElo = elo.revelado ? elo.valor : '??'
    // depois do fim pode rever a partida inteira; no meio dela, só voltar lance por lance
    const podeReverTudo = Boolean(fim)

    const textoDaVez = dois
        ? `${xadrez.inCheck() ? 'Xeque! ' : ''}Vez de ${nomes[xadrez.turn()]}.`
        : (xadrez.inCheck() ? 'Xeque! Sua vez.' : 'Sua vez.')
    const status = fim?.texto
        ?? (lendo ? `Revendo: lance ${posicaoVista} de ${posicoes.length - 1}`
            : pensando ? 'Pensando…'
                : vezDaPessoa ? textoDaVez : '')

    // modo jogo: a janela cobre a tela inteira do tablet (sem a barra da janela nem a barra de tarefas)
    const classeJanela = `janela-xadrez${modoJogo ? ' janela-modo-jogo' : ''} ${classeAnimacao}`
    const barraDaJanela = !modoJogo && (
        <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_xadrez' escura={tema === TEMAS.noturno} />
    )

    // quadro da análise de uma partida do histórico: a pessoa (ou as brancas, com 2 jogadores) na esquerda
    const modalDaJogada = (jogada) => {
        const cores = jogada.modo === 'dois' ? ['w', 'b'] : [jogada.cor, outraCor(jogada.cor)]
        const nomeDaJogada = (cor) => (jogada.modo === 'dois'
            ? (jogada.nomes ?? NOMES_PADRAO)[cor]
            : cor === jogada.cor ? 'Você' : `Computador (${nivelDe(jogada.nivel)?.nome})`)
        const resultado = jogada.modo === 'dois'
            ? (jogada.vencedor ? frase(jogada.vencedor, 'venceu', 'venceram') : 'Empate')
            : RESULTADO_CURTO[jogada.resultado]
        return (
            <ModalAnalise
                lados={cores.map((cor) => ({ cor, nome: nomeDaJogada(cor), precisao: jogada.analise.precisao[cor], contagem: jogada.analise.contagem[cor] }))}
                jogadas={jogada.analise.sans?.map((san, indice) => ({ san: emPortugues(san), categoria: jogada.analise.categorias[indice] }))}
                subtitulo={`${resultado} · ${jogada.lances} lances · ${formatarDiaMes(jogada.data)}`}
                aoFechar={() => setAnaliseAberta(null)}
                // clicar num lance abre a partida para rever, já naquela posição
                aoEscolherLance={sansDaJogada(jogada) ? (indice) => abrirDoHistorico(jogada, indice + 1) : undefined}
            />
        )
    }

    // tela de início: só o cartão no meio da janela (sem tabuleiro atrás)
    if (naTelaDeInicio) {
        const contraComputador = oponenteEscolhido !== 'dois'
        return (
            <div className={classeJanela}>
                {barraDaJanela}

                <div className='xadrez-corpo xadrez-corpo-inicio'>
                    <ControlesModoJogo
                        modoJogo={modoJogo}
                        alternar={alternarModoJogo}
                        idDoApp='app_xadrez'
                        minimizarApp={minimizarApp}
                        fecharApp={fecharApp}
                    />
                    <section className='xadrez-inicio'>
                        <h2 className='xadrez-titulo'>
                            <img src={imagemDaPeca('w', 'n')} alt='' />
                            Xadrez
                        </h2>

                        {verHistorico ? (
                            <div className='xadrez-ultimas'>
                                <p className='xadrez-passo'>Suas últimas partidas</p>
                                {partidasJogadas.length ? (
                                    <ul>
                                        {partidasJogadas.map((jogada) => (
                                            <li key={jogada.data} className={jogada.modo === 'dois' ? 'dois' : jogada.resultado}>
                                                {jogada.modo === 'dois' ? (
                                                    <>
                                                        <b>{jogada.vencedor ? frase(jogada.vencedor, 'venceu', 'venceram') : 'Empate'}</b>
                                                        <span>2 jogadores · {jogada.lances} lances · {formatarDiaMes(jogada.data)}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <b>{RESULTADO_CURTO[jogada.resultado]}</b>
                                                        <span>vs {nivelDe(jogada.nivel)?.nome} · de {nomeDaCor(jogada.cor)} · {jogada.lances} lances · {formatarDiaMes(jogada.data)}</span>
                                                    </>
                                                )}
                                                <span className='xadrez-ultimas-botoes'>
                                                    {jogada.analise && (
                                                        <button type='button' className='xadrez-ultimas-analise' onClick={() => setAnaliseAberta(jogada)}>
                                                            Análise
                                                        </button>
                                                    )}
                                                    {sansDaJogada(jogada) && (
                                                        <button type='button' className='xadrez-ultimas-analise' onClick={() => abrirDoHistorico(jogada)}>
                                                            Rever
                                                        </button>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className='xadrez-salva'>Nenhuma partida terminada ainda.</p>
                                )}
                                <div className='xadrez-acoes'>
                                    <button type='button' className='config-botao' onClick={() => setVerHistorico(false)}>Voltar</button>
                                </div>
                            </div>
                        ) : confirmar === 'nova' ? (
                            <>
                                <p className='xadrez-passo'>Abandonar a partida salva?</p>
                                <p className='xadrez-salva'>
                                    {dois ? `Ela termina como derrota de ${nomes[xadrez.turn()]}.` : 'Abandonar conta como derrota.'}
                                </p>
                                <div className='xadrez-acoes'>
                                    <button type='button' className='config-botao config-botao-perigo' onClick={abandonarENova}>Abandonar e começar</button>
                                    <button type='button' className='config-botao' onClick={() => setConfirmar(null)}>Voltar</button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* contra quem: o computador ou outra pessoa no mesmo aparelho */}
                                <div className='xadrez-opcoes xadrez-oponente' role='group' aria-label='Oponente'>
                                    <button
                                        type='button'
                                        className={`config-botao${contraComputador ? ' ativo' : ''}`}
                                        onClick={() => escolherOponente('computador')}
                                    >
                                        Contra o computador
                                    </button>
                                    <button
                                        type='button'
                                        className={`config-botao${!contraComputador ? ' ativo' : ''}`}
                                        onClick={() => escolherOponente('dois')}
                                    >
                                        2 jogadores
                                    </button>
                                </div>

                                {contraComputador ? (
                                    <>
                                        <p className='xadrez-passo'>Escolha o nível do seu oponente</p>
                                        {/* lista suspensa: clica e abre os níveis embaixo; clicar fora fecha */}
                                        <div
                                            className='xadrez-lista-niveis'
                                            onBlur={(evento) => {
                                                if (!evento.currentTarget.contains(evento.relatedTarget)) setListaNiveisAberta(false)
                                            }}
                                        >
                                            <button
                                                type='button'
                                                className={`config-botao xadrez-lista-botao${listaNiveisAberta ? ' ativo' : ''}`}
                                                aria-haspopup='listbox'
                                                aria-expanded={listaNiveisAberta}
                                                onClick={() => setListaNiveisAberta((aberta) => !aberta)}
                                            >
                                                Elo {nivelDe(nivelEscolhido)?.nome}
                                                <span className='xadrez-lista-seta' aria-hidden='true'>▾</span>
                                            </button>
                                            {listaNiveisAberta && (
                                                <ul className='xadrez-lista-opcoes' role='listbox'>
                                                    {NIVEIS_XADREZ.map((nivel) => (
                                                        <li key={nivel.id} role='option' aria-selected={nivel.id === nivelEscolhido}>
                                                            <button
                                                                type='button'
                                                                className={nivel.id === nivelEscolhido ? 'ativo' : ''}
                                                                onClick={() => {
                                                                    setNivelEscolhido(nivel.id)
                                                                    setListaNiveisAberta(false)
                                                                }}
                                                            >
                                                                Elo {nivel.nome}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <p className='xadrez-passo'>Escolha sua cor</p>
                                        <div className='xadrez-opcoes'>
                                            {CORES.map((cor) => (
                                                <button
                                                    key={cor.id}
                                                    type='button'
                                                    className={`config-botao${cor.id === corEscolhida ? ' ativo' : ''}`}
                                                    onClick={() => setCorEscolhida(cor.id)}
                                                >
                                                    {cor.nome}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* nomes (vazio = "Brancas"/"Pretas"), com o rei de cada cor do lado */}
                                        <div className='xadrez-nomes'>
                                            {['w', 'b'].map((cor) => (
                                                <label key={cor}>
                                                    <img src={imagemDaPeca(cor, 'k')} alt='' />
                                                    <input
                                                        type='text'
                                                        value={nomesEscolhidos[cor]}
                                                        placeholder={NOMES_PADRAO[cor]}
                                                        maxLength={TAMANHO_MAXIMO_NOME}
                                                        aria-label={`Nome de quem joga de ${nomeDaCor(cor)}`}
                                                        onChange={(evento) => {
                                                            const nome = evento.target.value
                                                            setNomesEscolhidos((atuais) => ({ ...atuais, [cor]: nome }))
                                                        }}
                                                    />
                                                </label>
                                            ))}
                                        </div>

                                        <p className='xadrez-passo'>Como vocês vão jogar</p>
                                        <div className='xadrez-opcoes'>
                                            {VISUALIZACOES.map((visualizacao) => (
                                                <button
                                                    key={visualizacao.id}
                                                    type='button'
                                                    className={`config-botao${visualizacao.id === visualizacaoEscolhida ? ' ativo' : ''}`}
                                                    onClick={() => setVisualizacaoEscolhida(visualizacao.id)}
                                                >
                                                    {visualizacao.nome}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className='xadrez-acoes'>
                                    {partidaSalvaEmAndamento ? (
                                        <>
                                            <button type='button' className='config-botao xadrez-botao-principal' onClick={continuar}>Continuar partida</button>
                                            <button type='button' className='config-botao' onClick={pedirNova}>Nova partida</button>
                                        </>
                                    ) : (
                                        <button type='button' className='config-botao xadrez-botao-principal' onClick={comecarNova}>Começar partida</button>
                                    )}
                                    <button type='button' className='config-botao' onClick={() => setVerHistorico(true)}>Histórico</button>
                                </div>
                                {partidaSalvaEmAndamento && (
                                    <small className='xadrez-salva'>
                                        {dois
                                            ? `Partida salva: ${nomes.w} × ${nomes.b} · ${historico.length} lances`
                                            : `Partida salva: ${historico.length} lances · nível ${nomeDoNivel} · de ${nomeDaCor(partida.corJogador)}`}
                                    </small>
                                )}
                            </>
                        )}
                    </section>
                    {verHistorico && analiseAberta?.analise && modalDaJogada(analiseAberta)}
                </div>
            </div>
        )
    }

    // um tabuleiro visto de um lado (orientacao = cor que fica embaixo). Lado a lado tem dois; cada um só
    // aceita clique na vez da cor dele
    const tabuleiro = (orientacao, { aceitaClique = true, avisos = null } = {}) => {
        const linhas = orientacao === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
        const colunas = orientacao === 'w' ? COLUNAS : [...COLUNAS].reverse()
        // deslize: cada peça que andou sai da casa de onde estava e escorrega até a dela. --de-coluna/--de-linha =
        // quantas casas atrás ela estava (o CSS anima até 0). Só quando a posição na tela anda um lance: para a
        // frente (lance novo, ou ▶ revendo) ou para trás (◀ revendo: a peça volta). Pular vários lances, não.
        // O lance feito arrastando não desliza (a peça já está lá)
        const lancesFeitos = xadrez.history({ verbose: true })
        const andaram = passoNaTela === 1 && !(!lendo && semDeslizeRef.current === historico.length)
            ? pecasQueAndaram(lancesFeitos[numeroNaTela - 1])
            : passoNaTela === -1 ? pecasQueVoltaram(lancesFeitos[numeroNaTela]) : {}
        const deslizeDa = (casa) => {
            const origem = andaram[casa]
            if (!origem) return undefined
            const de = posicaoNaTela(origem, colunas, linhas)
            const para = posicaoNaTela(casa, colunas, linhas)
            return { '--de-coluna': de.coluna - para.coluna, '--de-linha': de.linha - para.linha }
        }
        return (
            <div className={`xadrez-tabuleiro${lendo ? ' lendo' : ''}`}>
                {linhas.map((linha, indiceLinha) => colunas.map((coluna, indiceColuna) => {
                    const casa = `${coluna}${linha}`
                    const peca = xadrezNaTela.get(casa)
                    const destino = aceitaClique && destinos.find((item) => item.to === casa)
                    // a1 é escura (coluna 0 + linha 1 = ímpar), h1 é clara
                    const classes = ['xadrez-casa', (COLUNAS.indexOf(coluna) + linha) % 2 === 1 ? 'escura' : 'clara']
                    if (aceitaClique && casa === selecionada) classes.push('selecionada')
                    if (ultimoLance && (casa === ultimoLance.from || casa === ultimoLance.to)) classes.push('ultimo-lance')
                    if (dica && (casa === dica.from || casa === dica.to)) classes.push('dica')
                    if (casa === reiEmXeque) classes.push('xeque')
                    if (destino) classes.push(destino.captured ? 'pode-capturar' : 'pode-ir')
                    if (aceitaClique && vezDaPessoa && !lendo && peca?.color === corQueMexe) classes.push('pode-arrastar')
                    return (
                        <button
                            key={casa}
                            type='button'
                            className={classes.join(' ')}
                            onClick={() => {
                                if (ignorarCliqueRef.current) {
                                    ignorarCliqueRef.current = false
                                    return
                                }
                                if (aceitaClique) clicarNaCasa(casa)
                            }}
                            onPointerDown={(evento) => aceitaClique && comecarArraste(evento, casa)}
                            onPointerMove={moverArraste}
                            onPointerUp={soltarArraste}
                            onPointerCancel={cancelarArraste}
                            aria-label={casa}
                        >
                            {peca && (
                                <img
                                    // key com o número da posição na tela: a cada lance (ou passo revendo) a peça
                                    // que chegou "nasce" de novo e a animação de deslize roda
                                    key={`${casa}-${numeroNaTela}`}
                                    className={deslizeDa(casa) ? 'deslizando' : ''}
                                    style={deslizeDa(casa)}
                                    src={imagemDaPeca(peca.color, peca.type)}
                                    alt=''
                                    draggable={false}
                                />
                            )}
                            {/* coordenadas na borda, como num tabuleiro de verdade */}
                            {indiceColuna === 0 && <span className='xadrez-coordenada linha'>{linha}</span>}
                            {indiceLinha === 7 && <span className='xadrez-coordenada coluna'>{coluna}</span>}
                        </button>
                    )
                }))}
                {setaDoProximo(colunas, linhas)}
                {avisos}
            </div>
        )
    }

    // linha de um jogador: bolinha da vez, nome (com o nível ou o elo, contra o computador) e o material
    const linhaDoJogador = (cor) => {
        const ehComputador = !dois && cor !== partida.corJogador
        return (
            <div className={`xadrez-jogador${quemJoga === cor ? ' na-vez' : ''}${ehComputador && pensando ? ' pensando' : ''}`}>
                <span className='xadrez-jogador-vez' aria-hidden='true' />
                {dois ? (
                    <span className='xadrez-jogador-nome'>{nomes[cor]}</span>
                ) : ehComputador ? (
                    <>
                        <span className='xadrez-jogador-nome'>Computador</span>
                        <span className='xadrez-jogador-rating'>({nomeDoNivel})</span>
                    </>
                ) : (
                    <>
                        {/* nome do usuário do sistema (no futuro a pessoa vai poder trocar) */}
                        <span className='xadrez-jogador-nome'>{SISTEMA.usuario}</span>
                        <span className='xadrez-jogador-rating'>({textoElo})</span>
                    </>
                )}
                <Material placar={materialDa(cor)} corDasCapturadas={outraCor(cor)} />
            </div>
        )
    }

    // análise (só depois do fim): o botão, o progresso ou, pronta, o "Abrir análise" com a precisão de cada
    // lado numa linha (o resto fica no quadro, ModalAnalise) e, revendo a partida, a categoria do lance e qual
    // era o melhor
    const analise = partida.analise
    const nomeDoLado = (cor) => (dois ? nomes[cor] : cor === partida.corJogador ? 'Você' : 'Computador')
    const ladosDaAnalise = dois ? ['w', 'b'] : [partida.corJogador, outraCor(partida.corJogador)]
    const lanceVisto = lendo && analise && posicaoVista > 0 ? analise.lances[posicaoVista - 1] : null
    const categoriaVista = CATEGORIA_POR_ID[lanceVisto?.categoria]
    const blocoAnalise = fim && (
        <div className='xadrez-analise'>
            {analisando !== null ? (
                <div className='xadrez-analise-progresso' role='status'>
                    <span>Analisando com o Stockfish… {Math.round(analisando * 100)}%</span>
                    <div className='xadrez-analise-barra' style={{ '--progresso': analisando }} />
                </div>
            ) : analise ? (
                <>
                    <div className='xadrez-analise-pronta'>
                        <button type='button' className='config-botao xadrez-botao-principal' onClick={() => setAnaliseAberta('partida')}>
                            Abrir análise
                        </button>
                        <span className='xadrez-analise-resumo' title='Precisão'>
                            {ladosDaAnalise.map((cor) => `${nomeDoLado(cor)} ${analise.precisao[cor] ?? '—'}%`).join(' · ')}
                        </span>
                    </div>
                    {categoriaVista && (
                        <p className='xadrez-analise-melhor'>
                            Lance {posicaoVista}:{' '}
                            <span className={`xadrez-chip xadrez-chip-lance ${categoriaVista.id}`}>{categoriaVista.simbolo}</span>{' '}
                            <b className={`xadrez-simbolo ${categoriaVista.id}`}>{categoriaVista.nome}</b>
                            {lanceVisto.melhor && <> · o melhor era <b>{emPortugues(lanceVisto.melhor)}</b></>}
                        </p>
                    )}
                    {/* o que as setas do tabuleiro mostram: o próximo lance (cheia) e o recomendado (tracejada) */}
                    {proximoLance && (
                        <p className='xadrez-analise-melhor xadrez-legenda-setas'>
                            <span className={`xadrez-legenda-seta ${analiseDoProximo?.categoria ?? 'sem-analise'}`} aria-hidden='true' />
                            Próximo: <b>{emPortugues(proximoLance.san)}</b>
                            {recomendado && (
                                <>
                                    {' · '}
                                    <span className='xadrez-legenda-seta seta-recomendado' aria-hidden='true' />
                                    recomendado: <b>{emPortugues(recomendado.san)}</b>
                                </>
                            )}
                        </p>
                    )}
                </>
            ) : (
                <button type='button' className='config-botao xadrez-botao-analisar' onClick={analisar}>Analisar a partida</button>
            )}
            <div className='xadrez-exportar'>
                <button type='button' className='config-botao' onClick={exportar} disabled={exportando}>
                    {exportando ? 'Enviando…' : 'Exportar para o Lichess'}
                </button>
                <button type='button' className='config-botao' onClick={compartilhar} title='Copia a partida (PGN) para colar onde quiser'>
                    {copiado === 'copiado' ? 'Copiado!' : copiado === 'baixado' ? 'Baixado!' : 'Compartilhar'}
                </button>
            </div>
        </div>
    )

    // quadro da análise da partida na tela: a pessoa (ou as brancas, com 2 jogadores) na esquerda. Clicar num
    // lance do painel fecha o quadro e mostra aquela posição (rever lance a lance, com a categoria de cada um);
    // lado a lado não tem como rever, então lá o painel só lista
    const irParaOLance = (indice) => {
        setAnaliseAberta(null)
        setFimFechado(true)
        setPosicaoVista(indice + 1 === posicoes.length - 1 ? null : indice + 1)
    }
    const modalDaPartida = analiseAberta === 'partida' && analise && (
        <ModalAnalise
            lados={ladosDaAnalise.map((cor) => ({ cor, nome: nomeDoLado(cor), precisao: analise.precisao[cor], contagem: analise.contagem[cor] }))}
            jogadas={historico.map((san, indice) => ({ san: emPortugues(san), categoria: analise.lances[indice]?.categoria }))}
            subtitulo={fim?.texto}
            aoFechar={() => setAnaliseAberta(null)}
            aoEscolherLance={espelhado ? undefined : irParaOLance}
        />
    )

    // quadros por cima do tabuleiro (cor sorteada, fim, promoção, abandonar). Lado a lado, cobrem os dois
    const avisos = (
        <>
            {avisoSorteio && (
                <div className='xadrez-sorteio' aria-live='polite'>
                    <img src={imagemDaPeca(partida.corJogador, 'k')} alt='' />
                    Você joga de {nomeDaCor(partida.corJogador)}
                </div>
            )}

            {fim && !fimFechado && (
                <div className={`xadrez-aviso xadrez-fim ${fim.resultado}`}>
                    <strong className='xadrez-fim-titulo'>
                        {dois
                            ? (fim.vencedor ? `🏆 ${frase(nomes[fim.vencedor], 'venceu', 'venceram')}!` : 'Empate')
                            : fim.resultado === 'vitoria' ? '🏆 Você venceu!' : fim.resultado === 'derrota' ? 'Você perdeu' : 'Empate'}
                    </strong>
                    <p>
                        {dois && fim.motivo === 'xeque-mate' && `Xeque-mate em ${estatisticas.lancesCompletos} lances.`}
                        {dois && fim.motivo === 'abandono' && `${frase(nomes[partida.abandonou], 'abandonou', 'abandonaram')} no lance ${estatisticas.lancesCompletos}.`}
                        {!dois && fim.resultado === 'vitoria' && `Xeque-mate no ${nomeComputador} em ${estatisticas.lancesCompletos} lances.`}
                        {!dois && fim.resultado === 'derrota' && (fim.motivo === 'abandono'
                            ? `Você abandonou no lance ${estatisticas.lancesCompletos}.`
                            : `O ${nomeComputador} deu xeque-mate em ${estatisticas.lancesCompletos} lances.`)}
                        {fim.resultado === 'empate' && `Empate por ${fim.motivo}, em ${estatisticas.lancesCompletos} lances.`}
                    </p>
                    <dl className='xadrez-estatisticas'>
                        {partida.inicio && partida.fimEm && (
                            <div><dt>Duração</dt><dd>{formatarDuracao(partida.fimEm - partida.inicio)}</dd></div>
                        )}
                        {dois ? (
                            <>
                                <div><dt>Peças tomadas</dt><dd>{nomes.w} {estatisticas.capturasVoce} · {nomes.b} {estatisticas.capturasComputador}</dd></div>
                                <div><dt>Xeques</dt><dd>{nomes.w} {estatisticas.xequesVoce} · {nomes.b} {estatisticas.xequesComputador}</dd></div>
                            </>
                        ) : (
                            <>
                                <div><dt>Peças tomadas</dt><dd>você {estatisticas.capturasVoce} · ele {estatisticas.capturasComputador}</dd></div>
                                <div><dt>Xeques</dt><dd>você {estatisticas.xequesVoce} · ele {estatisticas.xequesComputador}</dd></div>
                                <div>
                                    <dt>Maior vantagem</dt>
                                    <dd>{estatisticas.maiorVantagem > 0 ? `+${estatisticas.maiorVantagem} em material` : 'nenhuma'}</dd>
                                </div>
                            </>
                        )}
                        {!dois && ultimoElo && (
                            <div className='xadrez-estatistica-elo'>
                                <dt>Seu elo</dt>
                                <dd>
                                    {ultimoElo.revelado
                                        ? `${ultimoElo.antes} → ${ultimoElo.depois} (${ultimoElo.depois >= ultimoElo.antes ? '+' : ''}${ultimoElo.depois - ultimoElo.antes})`
                                        : '?? (aparece na sua primeira vitória)'}
                                    {ultimoElo.dicas > 0 && (
                                        <small className='xadrez-custo-dicas'>
                                            {ultimoElo.dicas} {ultimoElo.dicas === 1 ? 'dica' : 'dicas'}
                                            {ultimoElo.revelado && ultimoElo.custoDasDicas > 0 ? `: −${ultimoElo.custoDasDicas}` : ''}
                                        </small>
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>
                    {/* lado a lado não tem lateral: a análise aparece aqui mesmo */}
                    {espelhado && blocoAnalise}
                    <div className='xadrez-aviso-botoes'>
                        <button type='button' className='config-botao' onClick={voltarAoInicio}>Nova partida</button>
                        <button type='button' className='config-botao' onClick={() => setFimFechado(true)}>Ver a partida</button>
                        {!espelhado && (partida.analise ? (
                            <button type='button' className='config-botao xadrez-botao-principal' onClick={() => setAnaliseAberta('partida')}>Análise</button>
                        ) : (
                            <button type='button' className='config-botao xadrez-botao-principal' onClick={analisar}>Analisar</button>
                        ))}
                    </div>
                </div>
            )}

            {promocaoPendente && (
                <div className='xadrez-aviso'>
                    <strong>Promover para:</strong>
                    <div className='xadrez-promocao'>
                        {PROMOCOES.map((tipo) => (
                            <button
                                key={tipo}
                                type='button'
                                onClick={() => {
                                    jogar({ ...promocaoPendente, promotion: tipo })
                                    setPromocaoPendente(null)
                                }}
                            >
                                <img src={imagemDaPeca(corQueMexe, tipo)} alt={tipo} />
                            </button>
                        ))}
                    </div>
                    <button type='button' className='config-botao' onClick={() => setPromocaoPendente(null)}>Cancelar</button>
                </div>
            )}

            {confirmar === 'abandonar' && (
                <div className='xadrez-aviso'>
                    <strong>{dois ? `${frase(nomes[xadrez.turn()], 'vai', 'vão')} abandonar?` : 'Abandonar a partida?'}</strong>
                    <p>{dois ? `${frase(nomes[outraCor(xadrez.turn())], 'ganha', 'ganham')} a partida.` : 'Abandonar conta como derrota.'}</p>
                    <div className='xadrez-aviso-botoes'>
                        <button type='button' className='config-botao config-botao-perigo' onClick={abandonar}>Abandonar</button>
                        <button type='button' className='config-botao' onClick={() => setConfirmar(null)}>Voltar</button>
                    </div>
                </div>
            )}
        </>
    )

    // menu ☰: voltar ao início, (no modo jogo) minimizar e fechar, som, abandonar
    const menu = menuAberto && (
        <div className='xadrez-menu' role='menu'>
            <button type='button' role='menuitem' onClick={voltarAoInicio}>
                {fim ? 'Nova partida' : 'Voltar ao início'}
                {!fim && <small>a partida fica salva</small>}
            </button>
            {/* no modo jogo não tem a barra da janela: minimizar e fechar ficam aqui */}
            {modoJogo && (
                <>
                    <button type='button' role='menuitem' onClick={() => minimizarApp('app_xadrez')}>
                        Minimizar
                        <small>a partida continua de onde parou</small>
                    </button>
                    <button type='button' role='menuitem' onClick={() => fecharApp('app_xadrez')}>
                        Fechar o xadrez
                        <small>a partida fica salva</small>
                    </button>
                </>
            )}
            <button type='button' role='menuitemcheckbox' aria-checked={somLigado} onClick={() => setSomLigado((ligado) => !ligado)}>
                {somLigado ? '🔊 Som ligado' : '🔇 Som desligado'}
                <small>{somLigado ? 'clique para silenciar' : 'clique para ouvir os lances'}</small>
            </button>
            {!fim && (
                <button
                    type='button'
                    role='menuitem'
                    className='perigo'
                    disabled={!historico.length}
                    onClick={() => {
                        setMenuAberto(false)
                        setConfirmar('abandonar')
                    }}
                >
                    Abandonar partida
                    {dois && <small>{frase(nomes[xadrez.turn()], 'perde', 'perdem')} a partida</small>}
                </button>
            )}
        </div>
    )
    const botaoMenu = (
        <button
            type='button'
            className={`config-botao xadrez-botao-menu${menuAberto ? ' ativo' : ''}`}
            aria-label='Menu'
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
        >
            ☰
        </button>
    )

    // 2 jogadores lado a lado: um tabuleiro para cada um (brancas na esquerda, pretas na direita), cada um com
    // o seu nome em cima; o de quem não tem a vez fica apagado. O ☰ fica no meio
    if (espelhado) {
        return (
            <div className={classeJanela}>
                {barraDaJanela}

                <div className='xadrez-corpo xadrez-corpo-espelhado'>
                    {['w', 'b'].map((cor) => (
                        <div key={cor} className={`xadrez-lado${!fim && xadrez.turn() !== cor ? ' apagado' : ''}`}>
                            {linhaDoJogador(cor)}
                            {tabuleiro(cor, { aceitaClique: !fim && xadrez.turn() === cor })}
                        </div>
                    ))}
                    <div className='xadrez-centro'>
                        {botaoMenu}
                        <BotaoModoJogo modoJogo={modoJogo} alternar={alternarModoJogo} />
                        {menu}
                    </div>
                    {/* quadros (fim, promoção, abandonar) por cima dos dois tabuleiros */}
                    <div className='xadrez-camada-avisos'>{avisos}</div>
                    {modalDaPartida}
                </div>
            </div>
        )
    }

    return (
        <div className={classeJanela}>
            {barraDaJanela}

            <div className='xadrez-corpo'>
                {tabuleiro(orientacaoPadrao, { avisos })}

                {/* lateral da altura do tabuleiro: quem está do outro lado em cima, quem está embaixo no pé
                    (a bolinha acende em quem tem a vez) e, no meio, o título, os lances e os controles */}
                <aside className='xadrez-lateral'>
                    {linhaDoJogador(outraCor(orientacaoPadrao))}

                    <div className='xadrez-topo'>
                        <h2 className='xadrez-titulo'>Xadrez</h2>
                        <span className={`xadrez-status${fim ? ' fim' : ''}`}>{status}</span>
                        {botaoMenu}
                        <BotaoModoJogo modoJogo={modoJogo} alternar={alternarModoJogo} />
                        {menu}
                    </div>

                    {blocoAnalise}

                    {/* lances: depois do fim, clicar num lance mostra aquela posição (e, analisada, o selo de
                        cada lance). Numa linha só que acompanha a partida ou, pelo botão do lado, expandida */}
                    <div className={`xadrez-lances${listaExpandida ? ' expandida' : ''}`}>
                        <ol className='xadrez-historico' ref={listaRef}>
                            {historico.map((san, indice) => {
                                const categoria = CATEGORIA_POR_ID[partida.analise?.lances[indice]?.categoria]
                                const simbolo = categoria?.destaque ? categoria : null
                                return (
                                    <li key={indice} className={posicaoVista === indice + 1 ? 'visto' : ''}>
                                        {indice % 2 === 0 && <span className='xadrez-numero'>{indice / 2 + 1}.</span>}
                                        {podeReverTudo ? (
                                            <button type='button' onClick={() => setPosicaoVista(indice + 1 === posicoes.length - 1 ? null : indice + 1)}>
                                                {emPortugues(san)}
                                                {simbolo && <span className={`xadrez-chip xadrez-chip-lance ${simbolo.id}`} title={simbolo.nome}>{simbolo.simbolo}</span>}
                                            </button>
                                        ) : (
                                            <span className='xadrez-lance'>{emPortugues(san)}</span>
                                        )}
                                    </li>
                                )
                            })}
                        </ol>
                        <button
                            type='button'
                            className='xadrez-lances-expandir'
                            aria-label={listaExpandida ? 'Mostrar os lances numa linha' : 'Mostrar todos os lances'}
                            title={listaExpandida ? 'Recolher' : 'Expandir'}
                            aria-expanded={listaExpandida}
                            onClick={() => setListaExpandida((expandida) => !expandida)}
                        >
                            {listaExpandida ? '▴' : '▾'}
                        </button>
                    </div>

                    <div className='xadrez-navegacao'>
                        {podeReverTudo && (
                            <button type='button' className='config-botao' aria-label='Início da partida' onClick={() => setPosicaoVista(0)} disabled={!historico.length}>⏮</button>
                        )}
                        <button
                            type='button'
                            className='config-botao'
                            aria-label='Lance anterior'
                            onClick={() => setPosicaoVista((atual) => Math.max(0, (atual ?? posicoes.length - 1) - 1))}
                            disabled={!historico.length || posicaoVista === 0}
                        >
                            ◀
                        </button>
                        <button
                            type='button'
                            className='config-botao'
                            aria-label='Próximo lance'
                            onClick={() => setPosicaoVista((atual) => (atual === null || atual + 1 >= posicoes.length - 1 ? null : atual + 1))}
                            disabled={!lendo}
                        >
                            ▶
                        </button>
                        {lendo && (
                            <button type='button' className='config-botao' onClick={() => setPosicaoVista(null)}>Voltar ao jogo</button>
                        )}
                        {/* dica: só contra o computador (com 2 jogadores seria ajudar um dos dois) */}
                        {!fim && !dois && (
                            <button
                                type='button'
                                className={`config-botao xadrez-botao-dica${acendendoDica ? ' acendendo' : ''}`}
                                aria-label='Dica'
                                title={`Dica (cada uma tira 10% do resultado)${partida.dicas ? ` · usadas: ${partida.dicas}` : ''}`}
                                onClick={pedirDica}
                                disabled={!vezDaPessoa || lendo}
                            >
                                💡
                            </button>
                        )}
                    </div>

                    {linhaDoJogador(orientacaoPadrao)}
                </aside>
                {modalDaPartida}
            </div>
        </div>
    )
}

export default JogoXadrez
