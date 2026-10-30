import './TelaFormatando.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { DURACAO_FORMATANDO_MS, NOME_SISTEMA_POR_TEMA, SISTEMA } from '../../tablet.config'
import { arquivosParaApagar, formatarDeVerdade } from '../../utils/formatacao'
import { pintarIconePixel, sorteioFixo, TAMANHO_DO_ICONE } from '../TelaBoot/TelaBootPixel'

// NightOS: quantos nomes de arquivo ficam voando para dentro do eclipse ao mesmo tempo
const NOMES_VOANDO = 7

// o que as telas têm em comum: os "arquivos" (as chaves salvas de verdade, ver formatacao.js) saem um por um ao
// longo do DURACAO_FORMATANDO_MS; no "Pronto" aparece o "Reiniciar agora", que apaga tudo de verdade e recarrega
const useFormatando = () => {
    const { formatacao } = useSistemaTablet()
    // lista fixa no começo (o que existia quando a pessoa confirmou)
    const arquivos = useMemo(() => arquivosParaApagar(formatacao?.apagarLembretes), [formatacao])
    const [apagados, setApagados] = useState(0)
    const total = Math.max(arquivos.length, 1)
    const terminou = apagados >= total

    useEffect(() => {
        if (terminou) return
        const timer = setTimeout(() => setApagados((quantos) => quantos + 1), DURACAO_FORMATANDO_MS / total)
        return () => clearTimeout(timer)
    }, [apagados, terminou, total])

    const reiniciar = () => formatarDeVerdade(formatacao ?? {})

    return { arquivos, apagados, progresso: Math.min(1, apagados / total), terminou, reiniciar }
}

// o botão do fim, igual em todos os temas (cada um pinta o seu no CSS)
const BotaoReiniciarAgora = ({ aoClicar }) => {
    const [clicou, setClicou] = useState(false)
    return (
        <button
            type='button'
            className='tela-formatando-reiniciar'
            disabled={clicou}
            onClick={() => {
                setClicou(true)
                aoClicar()
            }}
        >
            Reiniciar agora
        </button>
    )
}

// CyberOS: tela escura com scanlines (a do boot), porcentagem grande, barra e o log dos arquivos saindo
const FormatandoCyber = () => {
    const { arquivos, apagados, progresso, terminou, reiniciar } = useFormatando()
    // as últimas linhas do log (a mais nova embaixo)
    const ultimas = arquivos.slice(Math.max(0, apagados - 6), apagados)

    return (
        <div className='tela-boot tela-formatando tela-formatando-cyber' style={{ '--progresso': progresso }}>
            <p className='tela-formatando-titulo'>{terminou ? 'Pronto' : `Formatando o ${SISTEMA.nome}`}</p>
            <strong className='tela-formatando-porcentagem'>{Math.round(progresso * 100)}%</strong>
            <div className='tela-formatando-barra' />
            <ol className='tela-formatando-log' aria-live='polite'>
                {ultimas.map((arquivo, indice) => (
                    <li key={arquivo} style={{ '--idade': ultimas.length - 1 - indice }}>
                        <span>apagando</span> C:\{SISTEMA.nome}\{SISTEMA.usuario}\{arquivo}
                        <b>ok</b>
                    </li>
                ))}
                {terminou && <li className='tela-formatando-fim'>Tudo apagado: o tablet volta como saiu de fábrica</li>}
            </ol>
            {terminou && <BotaoReiniciarAgora aoClicar={reiniciar} />}
        </div>
    )
}

// NightOS: o eclipse no meio, com o anel de progresso em volta; cada arquivo aparece em volta e é "engolido"
// pela lua. No fim o anel acende inteiro e a tela apaga
const FormatandoNoturno = () => {
    const { arquivos, apagados, progresso, terminou, reiniciar } = useFormatando()
    // posição de cada nome em volta da lua: ângulo fixo por arquivo (espalha sem sortear a cada render)
    const voando = arquivos.slice(Math.max(0, apagados - NOMES_VOANDO), apagados)

    return (
        <div className={`tela-boot tela-boot-noturno tela-formatando tela-formatando-noturno${terminou ? ' terminou' : ''}`} style={{ '--progresso': progresso }}>
            <div className='tela-formatando-ceu'>
                {voando.map((arquivo) => {
                    const indice = arquivos.indexOf(arquivo)
                    return (
                        <span
                            key={arquivo}
                            className='tela-formatando-arquivo'
                            style={{ '--angulo': `${(indice * 137.5) % 360}deg`, '--distancia': `${150 + (indice % 3) * 28}px` }}
                        >
                            {arquivo}
                        </span>
                    )
                })}
                <div className='tela-formatando-eclipse'>
                    <svg className='tela-formatando-anel' viewBox='0 0 120 120' aria-hidden='true'>
                        <circle className='tela-formatando-anel-trilho' cx='60' cy='60' r='54' />
                        <circle className='tela-formatando-anel-arco' cx='60' cy='60' r='54' pathLength='100' />
                    </svg>
                </div>
            </div>
            <p className='tela-boot-texto tela-formatando-legenda'>
                {terminou ? 'Pronto' : `Apagando o ${NOME_SISTEMA_POR_TEMA.noturno}… ${Math.round(progresso * 100)}%`}
            </p>
            {terminou && <BotaoReiniciarAgora aoClicar={reiniciar} />}
        </div>
    )
}

// ---------- PixelOS: a janelinha do sistema se desmonta em blocos que caem ----------
// o desenho tem a janela (o ícone do PixelOS) em cima e espaço embaixo para os blocos caírem
const LADO_DO_BLOCO = 4
const LARGURA_DA_QUEDA = TAMANHO_DO_ICONE + 24
const ALTURA_DA_QUEDA = TAMANHO_DO_ICONE + 64
const TOPO_DA_JANELA = 4
// quanto um bloco leva para cair até o fim e sumir
const DURACAO_DA_QUEDA_MS = 1100

// os blocos da janela que têm alguma cor, cada um com a sua vez de cair (sorteada, mas sempre a mesma) e um
// empurrãozinho para o lado
const recortarBlocos = (imagem) => {
    const blocos = []
    for (let by = 0; by < TAMANHO_DO_ICONE; by += LADO_DO_BLOCO) {
        for (let bx = 0; bx < TAMANHO_DO_ICONE; bx += LADO_DO_BLOCO) {
            let temCor = false
            for (let y = by; y < by + LADO_DO_BLOCO && !temCor; y += 1) {
                for (let x = bx; x < bx + LADO_DO_BLOCO; x += 1) {
                    if (imagem.data[(y * TAMANHO_DO_ICONE + x) * 4 + 3] > 0) {
                        temCor = true
                        break
                    }
                }
            }
            if (temCor) blocos.push({ bx, by })
        }
    }
    blocos.forEach((bloco, indice) => {
        // os de cima tendem a cair antes (desmonta de cima para baixo), com bastante sorteio no meio
        bloco.vez = bloco.by / TAMANHO_DO_ICONE * 0.5 + sorteioFixo(indice + 7) * 0.5
        bloco.empurrao = (sorteioFixo(indice + 31) - 0.5) * 10
    })
    blocos.sort((a, b) => a.vez - b.vez)
    return blocos
}

const FormatandoPixel = () => {
    const { arquivos, apagados, progresso, terminou, reiniciar } = useFormatando()
    const canvasRef = useRef(null)
    const progressoRef = useRef(progresso)
    progressoRef.current = progresso

    useEffect(() => {
        const canvas = canvasRef.current
        canvas.width = LARGURA_DA_QUEDA
        canvas.height = ALTURA_DA_QUEDA
        const contexto = canvas.getContext('2d')
        // a janela é desenhada uma vez (de dia, anel cheio) e daí recortada em blocos
        const janela = document.createElement('canvas')
        pintarIconePixel(janela, { dia: 1, bloco: 1, anel: 1, quadro: 0 })
        const blocos = recortarBlocos(janela.getContext('2d').getImageData(0, 0, TAMANHO_DO_ICONE, TAMANHO_DO_ICONE))
        const esquerda = (LARGURA_DA_QUEDA - TAMANHO_DO_ICONE) / 2
        let pedido = null

        const quadro = (agora) => {
            contexto.clearRect(0, 0, LARGURA_DA_QUEDA, ALTURA_DA_QUEDA)
            // quantos blocos já deviam ter se soltado; cada um guarda quando se soltou
            const soltos = Math.floor(progressoRef.current * blocos.length)
            blocos.forEach((bloco, indice) => {
                if (indice < soltos && bloco.soltouEm === undefined) bloco.soltouEm = agora
                const tempo = bloco.soltouEm === undefined ? 0 : (agora - bloco.soltouEm) / DURACAO_DA_QUEDA_MS
                if (tempo >= 1) return
                // cai acelerando, em passos de pixel inteiro, e apaga no fim
                const queda = Math.round(tempo * tempo * (ALTURA_DA_QUEDA - bloco.by))
                const lado = Math.round(bloco.empurrao * tempo)
                contexto.globalAlpha = tempo > 0.6 ? 1 - (tempo - 0.6) / 0.4 : 1
                contexto.drawImage(
                    janela,
                    bloco.bx, bloco.by, LADO_DO_BLOCO, LADO_DO_BLOCO,
                    esquerda + bloco.bx + lado, TOPO_DA_JANELA + bloco.by + queda, LADO_DO_BLOCO, LADO_DO_BLOCO,
                )
            })
            contexto.globalAlpha = 1
            pedido = requestAnimationFrame(quadro)
        }
        pedido = requestAnimationFrame(quadro)
        return () => cancelAnimationFrame(pedido)
    }, [])

    return (
        <div className={`tela-boot tela-formatando tela-formatando-pixel${terminou ? ' terminou' : ''}`}>
            <canvas ref={canvasRef} className='tela-formatando-queda' aria-hidden='true' />
            <p className='tela-formatando-pixel-titulo'>
                {terminou ? 'PRONTO!' : `APAGANDO... ${Math.round(progresso * 100)}%`}
            </p>
            <p className='tela-formatando-pixel-arquivo'>
                {terminou ? `O ${NOME_SISTEMA_POR_TEMA.pixel} volta como saiu de fábrica` : arquivos[Math.max(0, apagados - 1)]}
            </p>
            {terminou && <BotaoReiniciarAgora aoClicar={reiniciar} />}
        </div>
    )
}

// Tela de formatação (Config → Sistema → Formatar): cada tema formata do seu jeito
const FORMATANDO_POR_TEMA = {
    [TEMAS.padrao]: FormatandoCyber,
    [TEMAS.noturno]: FormatandoNoturno,
    [TEMAS.pixel]: FormatandoPixel,
}

const TelaFormatando = () => {
    const { tema } = useSistemaTablet()
    const Formatando = FORMATANDO_POR_TEMA[tema] ?? FormatandoCyber
    return <Formatando />
}

export default TelaFormatando
