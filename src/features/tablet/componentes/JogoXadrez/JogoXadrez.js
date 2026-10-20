import './JogoXadrez.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'
import { NIVEIS_XADREZ, jogarLance, sugerirLance } from './motorXadrez'
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

// elo da pessoa (fórmula do Elo, a mesma da FIDE): começa em 200 "por baixo dos panos" e só aparece depois
// da primeira vitória (antes disso fica "??"). O computador conta com o elo do nível (300 a 2000)
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

// notação em português: o chess.js escreve em inglês (N = knight...); aqui vira C = cavalo, T = torre,
// D = dama, R = rei (o B de bispo é igual). Roque (O-O) e casas não mudam
const LETRA_EM_PORTUGUES = { K: 'R', Q: 'D', R: 'T', N: 'C' }
const emPortugues = (san) => san.replace(/[KQRN]/g, (letra) => LETRA_EM_PORTUGUES[letra])

const imagemDaPeca = (cor, tipo) => `${process.env.PUBLIC_URL}/imagens/xadrez/${cor}${tipo}.svg`
const nomeDaCor = (cor) => (cor === 'w' ? 'brancas' : 'pretas')
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

// fim de partida: { resultado: 'vitoria' | 'derrota' | 'empate', texto (curto, para o status), motivo } ou null
const descreverFim = (xadrez, partida) => {
    if (partida.abandonou) return { resultado: 'derrota', texto: 'Você abandonou.', motivo: 'abandono' }
    if (xadrez.isCheckmate()) {
        return xadrez.turn() === partida.corJogador
            ? { resultado: 'derrota', texto: 'Xeque-mate. Você perdeu.', motivo: 'xeque-mate' }
            : { resultado: 'vitoria', texto: 'Xeque-mate! Você venceu!', motivo: 'xeque-mate' }
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

const RESULTADO_CURTO = { vitoria: 'Venceu', derrota: 'Perdeu', empate: 'Empate' }

// xadrez.exe: contra o computador (níveis 300/600/900 por enquanto).
// - Tela de início: só um cartão no meio da janela; escolhe o nível e a cor; "Continuar partida" se tiver uma
//   salva; "Histórico" mostra as últimas partidas.
// - Partida: clicar numa peça mostra os lances possíveis; clicar no destino joga. Do lado, os jogadores, os
//   lances, ◀ ▶ (rever lances sem mexer na partida) e a 💡; o resto (voltar ao início, abandonar) fica no menu ☰.
// - Fim: quadro com as estatísticas e o elo; aí libera rever a partida inteira (⏮ e clicar nos lances).
const JogoXadrez = ({ fecharApp, minimizarApp, classeAnimacao }) => {
    const { tema } = useSistemaTablet()
    // partida salva: { lances: [{ from, to, promotion }], nivel, corJogador, sorteada, inicio, fimEm, abandonou }
    const [salva, setSalva] = useEstadoPersistido('xadrez-partida', null)
    const [nivelEscolhido, setNivelEscolhido] = useEstadoPersistido('xadrez-nivel', NIVEIS_XADREZ[0].id)
    const [corEscolhida, setCorEscolhida] = useEstadoPersistido('xadrez-cor', 'w')
    // elo: { valor, revelado } (revelado = já venceu alguma vez; antes disso aparece "??")
    const [elo, setElo] = useEstadoPersistido('xadrez-elo', { valor: ELO_INICIAL, revelado: false })
    // últimas partidas, da mais nova para a mais velha: { data, nivel, cor, resultado, motivo, lances, eloAntes, eloDepois }
    const [partidasJogadas, setPartidasJogadas] = useEstadoPersistido('xadrez-historico', [])

    // abre sempre na tela de início
    const [naTelaDeInicio, setNaTelaDeInicio] = useState(true)
    const [partida, setPartida] = useState(() => salva ?? { lances: [], nivel: nivelEscolhido, corJogador: 'w', inicio: Date.now() })
    // quadro de fim de partida fechado ("Ver a partida"); uma partida salva que já tinha acabado abre sem ele
    const [fimFechado, setFimFechado] = useState(() => Boolean(salva?.fimEm))
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
    // última mudança de elo (para o quadro de fim): { antes, depois, revelado }
    const [ultimoElo, setUltimoElo] = useState(null)
    const listaRef = useRef(null)
    const timerDicaRef = useRef(null)

    const { xadrez, posicoes } = useMemo(() => montarPartida(partida.lances), [partida.lances])
    const fim = descreverFim(xadrez, partida)
    const vezDaPessoa = !fim && xadrez.turn() === partida.corJogador
    const lendo = posicaoVista !== null && posicaoVista < posicoes.length - 1
    const historico = xadrez.history()
    const partidaSalvaEmAndamento = emAndamento(partida)

    // salva a cada lance (e ao começar partida nova)
    useEffect(() => {
        setSalva(partida)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partida])

    // vez do computador: pensa um pouco e joga (na tela de início ele espera)
    useEffect(() => {
        if (naTelaDeInicio || fim || xadrez.turn() === partida.corJogador) return
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
    }, [xadrez, partida.corJogador, partida.nivel, partida.sorteada, partida.lances.length, fim, naTelaDeInicio])

    // aviso da cor sorteada: some sozinho
    useEffect(() => {
        if (!avisoSorteio) return
        const timer = setTimeout(() => setAvisoSorteio(false), DURACAO_AVISO_SORTEIO_MS)
        return () => clearTimeout(timer)
    }, [avisoSorteio])

    useEffect(() => () => clearTimeout(timerDicaRef.current), [])

    // guarda a partida que acabou: elo novo e uma linha no histórico
    const registrarFim = (partidaQueAcabou, fimDela) => {
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
                nivel: partidaQueAcabou.nivel,
                cor: partidaQueAcabou.corJogador,
                resultado: fimDela.resultado,
                motivo: fimDela.motivo,
                lances: Math.ceil(partidaQueAcabou.lances.length / 2),
                eloAntes: antes,
                eloDepois: depois,
                dicas,
            },
            ...atuais,
        ].slice(0, TAMANHO_HISTORICO))
    }

    // acabou agora (o fimEm marca que já foi registrada): guarda a hora, o elo e o histórico
    useEffect(() => {
        if (!fim || partida.fimEm) return
        registrarFim(partida, fim)
        setPartida((atual) => ({ ...atual, fimEm: Date.now() }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fim, partida.fimEm])

    // histórico sempre mostrando o último lance
    useEffect(() => {
        if (listaRef.current && !lendo) listaRef.current.scrollTop = listaRef.current.scrollHeight
    }, [historico.length, lendo])

    const jogar = (lance) => {
        setPartida((atual) => ({ ...atual, lances: [...atual.lances, lance] }))
        setSelecionada(null)
        setDica(null)
        setPosicaoVista(null)
    }

    const clicarNaCasa = (casa) => {
        if (!vezDaPessoa || lendo || promocaoPendente) return
        const peca = xadrez.get(casa)
        // clicou numa peça sua: seleciona (ou troca a seleção)
        if (peca && peca.color === partida.corJogador) {
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

    const limparTabuleiro = () => {
        clearTimeout(timerDicaRef.current)
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
    }

    const comecarNova = () => {
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

    const abandonarENova = () => {
        registrarFim(partida, descreverFim(xadrez, { ...partida, abandonou: true }))
        comecarNova()
    }

    const abandonar = () => {
        setPartida((atual) => ({ ...atual, abandonou: true }))
        setConfirmar(null)
        setMenuAberto(false)
    }

    const continuar = () => {
        limparTabuleiro()
        setNaTelaDeInicio(false)
    }

    const voltarAoInicio = () => {
        limparTabuleiro()
        setNaTelaDeInicio(true)
    }

    // cada dica conta (partida.dicas) e pesa no elo do fim; a mesma dica na tela não conta de novo
    const pedirDica = () => {
        if (!vezDaPessoa || lendo || acendendoDica || dica) return
        setAcendendoDica(true)
        const fen = xadrez.fen()
        timerDicaRef.current = setTimeout(() => {
            setAcendendoDica(false)
            setDica(sugerirLance(fen))
            setPartida((atual) => ({ ...atual, dicas: (atual.dicas ?? 0) + 1 }))
        }, ESPERA_DICA_MS)
    }

    // tabuleiro que aparece: a posição vista no modo leitura, ou a atual
    const xadrezNaTela = lendo ? new Chess(posicoes[posicaoVista]) : xadrez
    const ultimoLance = lendo
        ? (posicaoVista > 0 ? xadrez.history({ verbose: true })[posicaoVista - 1] : null)
        : xadrez.history({ verbose: true }).at(-1)
    const destinos = selecionada ? xadrez.moves({ square: selecionada, verbose: true }) : []
    const reiEmXeque = xadrezNaTela.inCheck()
        ? xadrezNaTela.findPiece({ type: 'k', color: xadrezNaTela.turn() })[0]
        : null

    // casas na ordem da tela: com as pretas, o tabuleiro vira
    const linhas = partida.corJogador === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
    const colunas = partida.corJogador === 'w' ? COLUNAS : [...COLUNAS].reverse()

    // deslize das peças do último lance (só ao vivo): cada peça que andou sai da casa de origem e escorrega
    // até a dela. --de-coluna/--de-linha = quantas casas atrás ela estava (o CSS anima até 0)
    const andaram = lendo ? {} : pecasQueAndaram(ultimoLance)
    const deslizeDa = (casa) => {
        const origem = andaram[casa]
        if (!origem) return undefined
        const de = posicaoNaTela(origem, colunas, linhas)
        const para = posicaoNaTela(casa, colunas, linhas)
        return { '--de-coluna': de.coluna - para.coluna, '--de-linha': de.linha - para.linha }
    }

    // material na posição que está na tela (no modo leitura, a da posição vista)
    const lancesAteAqui = xadrez.history({ verbose: true }).slice(0, lendo ? posicaoVista : undefined)
    const corComputador = partida.corJogador === 'w' ? 'b' : 'w'
    const materialPessoa = placarDeMaterial(xadrezNaTela, lancesAteAqui, partida.corJogador)
    const materialComputador = placarDeMaterial(xadrezNaTela, lancesAteAqui, corComputador)

    const nomeDoNivel = nivelDe(partida.nivel)?.nome
    const nomeComputador = `Computador (${nomeDoNivel})`
    const quemJoga = fim ? null : xadrez.turn()
    const estatisticas = fim ? estatisticasDaPartida(xadrez.history({ verbose: true }), partida.corJogador) : null
    const textoElo = elo.revelado ? elo.valor : '??'
    // depois do fim pode rever a partida inteira; no meio dela, só voltar lance por lance
    const podeReverTudo = Boolean(fim)

    const status = fim?.texto
        ?? (lendo ? `Revendo: lance ${posicaoVista} de ${posicoes.length - 1}`
            : pensando ? 'Pensando…'
                : vezDaPessoa ? (xadrez.inCheck() ? 'Xeque! Sua vez.' : 'Sua vez.') : '')

    // modo jogo: a janela cobre a tela inteira do tablet (sem a barra da janela nem a barra de tarefas)
    const classeJanela = `janela-xadrez${modoJogo ? ' janela-modo-jogo' : ''} ${classeAnimacao}`
    const barraDaJanela = !modoJogo && (
        <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_xadrez' escura={tema === TEMAS.noturno} />
    )

    // tela de início: só o cartão no meio da janela (sem tabuleiro atrás)
    if (naTelaDeInicio) {
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
                                            <li key={jogada.data} className={jogada.resultado}>
                                                <b>{RESULTADO_CURTO[jogada.resultado]}</b>
                                                <span>vs {nivelDe(jogada.nivel)?.nome} · de {nomeDaCor(jogada.cor)} · {jogada.lances} lances · {formatarDiaMes(jogada.data)}</span>
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
                                <p className='xadrez-salva'>Abandonar conta como derrota.</p>
                                <div className='xadrez-acoes'>
                                    <button type='button' className='config-botao config-botao-perigo' onClick={abandonarENova}>Abandonar e começar</button>
                                    <button type='button' className='config-botao' onClick={() => setConfirmar(null)}>Voltar</button>
                                </div>
                            </>
                        ) : (
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
                                        Partida salva: {historico.length} lances · nível {nomeDoNivel} · de {nomeDaCor(partida.corJogador)}
                                    </small>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        )
    }

    return (
        <div className={classeJanela}>
            {barraDaJanela}

            <div className='xadrez-corpo'>
                <div className={`xadrez-tabuleiro${lendo ? ' lendo' : ''}`}>
                    {linhas.map((linha, indiceLinha) => colunas.map((coluna, indiceColuna) => {
                        const casa = `${coluna}${linha}`
                        const peca = xadrezNaTela.get(casa)
                        const destino = destinos.find((item) => item.to === casa)
                        // a1 é escura (coluna 0 + linha 1 = ímpar), h1 é clara
                        const classes = ['xadrez-casa', (COLUNAS.indexOf(coluna) + linha) % 2 === 1 ? 'escura' : 'clara']
                        if (casa === selecionada) classes.push('selecionada')
                        if (ultimoLance && (casa === ultimoLance.from || casa === ultimoLance.to)) classes.push('ultimo-lance')
                        if (dica && (casa === dica.from || casa === dica.to)) classes.push('dica')
                        if (casa === reiEmXeque) classes.push('xeque')
                        if (destino) classes.push(destino.captured ? 'pode-capturar' : 'pode-ir')
                        return (
                            <button key={casa} type='button' className={classes.join(' ')} onClick={() => clicarNaCasa(casa)} aria-label={casa}>
                                {peca && (
                                    <img
                                        // key com o número do lance: a cada lance a peça que chegou "nasce" de novo
                                        // e a animação de deslize roda
                                        key={`${casa}-${historico.length}`}
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

                    {avisoSorteio && (
                        <div className='xadrez-sorteio' aria-live='polite'>
                            <img src={imagemDaPeca(partida.corJogador, 'k')} alt='' />
                            Você joga de {nomeDaCor(partida.corJogador)}
                        </div>
                    )}

                    {fim && !fimFechado && (
                        <div className={`xadrez-aviso xadrez-fim ${fim.resultado}`}>
                            <strong className='xadrez-fim-titulo'>
                                {fim.resultado === 'vitoria' ? '🏆 Você venceu!' : fim.resultado === 'derrota' ? 'Você perdeu' : 'Empate'}
                            </strong>
                            <p>
                                {fim.resultado === 'vitoria' && `Xeque-mate no ${nomeComputador} em ${estatisticas.lancesCompletos} lances.`}
                                {fim.resultado === 'derrota' && (fim.motivo === 'abandono'
                                    ? `Você abandonou no lance ${estatisticas.lancesCompletos}.`
                                    : `O ${nomeComputador} deu xeque-mate em ${estatisticas.lancesCompletos} lances.`)}
                                {fim.resultado === 'empate' && `Empate por ${fim.motivo}, em ${estatisticas.lancesCompletos} lances.`}
                            </p>
                            <dl className='xadrez-estatisticas'>
                                {partida.inicio && partida.fimEm && (
                                    <div><dt>Duração</dt><dd>{formatarDuracao(partida.fimEm - partida.inicio)}</dd></div>
                                )}
                                <div><dt>Peças tomadas</dt><dd>você {estatisticas.capturasVoce} · ele {estatisticas.capturasComputador}</dd></div>
                                <div><dt>Xeques</dt><dd>você {estatisticas.xequesVoce} · ele {estatisticas.xequesComputador}</dd></div>
                                <div>
                                    <dt>Maior vantagem</dt>
                                    <dd>{estatisticas.maiorVantagem > 0 ? `+${estatisticas.maiorVantagem} em material` : 'nenhuma'}</dd>
                                </div>
                                {ultimoElo && (
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
                            <div className='xadrez-aviso-botoes'>
                                <button type='button' className='config-botao' onClick={voltarAoInicio}>Nova partida</button>
                                <button type='button' className='config-botao' onClick={() => setFimFechado(true)}>Ver a partida</button>
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
                                        <img src={imagemDaPeca(partida.corJogador, tipo)} alt={tipo} />
                                    </button>
                                ))}
                            </div>
                            <button type='button' className='config-botao' onClick={() => setPromocaoPendente(null)}>Cancelar</button>
                        </div>
                    )}

                    {confirmar === 'abandonar' && (
                        <div className='xadrez-aviso'>
                            <strong>Abandonar a partida?</strong>
                            <p>Abandonar conta como derrota.</p>
                            <div className='xadrez-aviso-botoes'>
                                <button type='button' className='config-botao config-botao-perigo' onClick={abandonar}>Abandonar</button>
                                <button type='button' className='config-botao' onClick={() => setConfirmar(null)}>Voltar</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* lateral da altura do tabuleiro: o computador em cima, a pessoa embaixo (a bolinha acende em quem
                    tem a vez) e, no meio, o título, os lances e os controles */}
                <aside className='xadrez-lateral'>
                    <div className={`xadrez-jogador${quemJoga && quemJoga !== partida.corJogador ? ' na-vez' : ''}${pensando ? ' pensando' : ''}`}>
                        <span className='xadrez-jogador-vez' aria-hidden='true' />
                        <span className='xadrez-jogador-nome'>Computador</span>
                        <span className='xadrez-jogador-rating'>({nomeDoNivel})</span>
                        <Material placar={materialComputador} corDasCapturadas={partida.corJogador} />
                    </div>

                    <div className='xadrez-topo'>
                        <h2 className='xadrez-titulo'>Xadrez</h2>
                        <span className={`xadrez-status${fim ? ' fim' : ''}`}>{status}</span>
                        <button
                            type='button'
                            className={`config-botao xadrez-botao-menu${menuAberto ? ' ativo' : ''}`}
                            aria-label='Menu'
                            aria-expanded={menuAberto}
                            onClick={() => setMenuAberto((aberto) => !aberto)}
                        >
                            ☰
                        </button>
                        <BotaoModoJogo modoJogo={modoJogo} alternar={alternarModoJogo} />
                        {menuAberto && (
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
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* lances: depois do fim, clicar num lance mostra aquela posição */}
                    <ol className='xadrez-historico' ref={listaRef}>
                        {historico.map((san, indice) => (
                            <li key={indice} className={posicaoVista === indice + 1 ? 'visto' : ''}>
                                {indice % 2 === 0 && <span className='xadrez-numero'>{indice / 2 + 1}.</span>}
                                {podeReverTudo ? (
                                    <button type='button' onClick={() => setPosicaoVista(indice + 1 === posicoes.length - 1 ? null : indice + 1)}>{emPortugues(san)}</button>
                                ) : (
                                    <span className='xadrez-lance'>{emPortugues(san)}</span>
                                )}
                            </li>
                        ))}
                    </ol>

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
                        {!fim && (
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

                    <div className={`xadrez-jogador${quemJoga === partida.corJogador ? ' na-vez' : ''}`}>
                        <span className='xadrez-jogador-vez' aria-hidden='true' />
                        {/* nome do usuário do sistema (no futuro a pessoa vai poder trocar) */}
                        <span className='xadrez-jogador-nome'>{SISTEMA.usuario}</span>
                        <span className='xadrez-jogador-rating'>({textoElo})</span>
                        <Material placar={materialPessoa} corDasCapturadas={corComputador} />
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default JogoXadrez
