import './JogoDoom.css'
import { useEffect, useRef } from 'react'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { ControlesModoJogo, useModoJogo } from '../ModoJogo/ModoJogo'

const ENDERECO_DOOM = `${process.env.PUBLIC_URL}/doom/index.html`
// de quanto em quanto tempo confere se o jogo está à vista (para pausar com o tablet guardado)
const VERIFICAR_VISIVEL_MS = 400

// DOOM.exe: o DOOM de verdade (Dwasm = PrBoom+ em WebAssembly, com o DOOM1.WAD shareware), num iframe com a
// página public/doom/index.html. O iframe isola o Emscripten do site (teclado, áudio, variáveis globais) e só é
// baixado quando a pessoa abre o jogo. Minimizar pausa o jogo (e o som); voltar continua. Sair pelo menu do
// próprio DOOM ("Quit Game") fecha o app. Os saves ficam no navegador (o Dwasm guarda sozinho).
const JogoDoom = ({ fecharApp, minimizarApp, classeAnimacao }) => {
    const { tema, telaAtiva } = useSistemaTablet()
    const [modoJogo, alternarModoJogo] = useModoJogo('doom')
    const iframeRef = useRef(null)
    const naFrente = telaAtiva === 'doom.exe'

    // mensagens da página do jogo: saiu pelo menu → fecha o app
    useEffect(() => {
        const aoReceber = (evento) => {
            if (evento.source !== iframeRef.current?.contentWindow || evento.data?.fonte !== 'doom') return
            if (evento.data.tipo === 'saiu') fecharApp('app_doom')
        }
        window.addEventListener('message', aoReceber)
        return () => window.removeEventListener('message', aoReceber)
    }, [fecharApp])

    // pausa quando não dá para jogar: janela atrás de outra ou minimizada, tablet guardado (o modal só fica
    // invisível, com visibility) ou a aba do navegador escondida. Voltando, continua e o teclado volta para o jogo.
    // O tablet guardado não avisa por evento: confere a cada VERIFICAR_VISIVEL_MS
    useEffect(() => {
        let jogando = null
        const conferir = () => {
            const iframe = iframeRef.current
            const visivel = naFrente && !document.hidden && iframe?.checkVisibility?.({ visibilityProperty: true }) !== false
            if (visivel === jogando) return
            jogando = visivel
            iframe?.contentWindow?.postMessage({ tipo: visivel ? 'continuar' : 'pausar' }, '*')
            if (visivel) iframe?.focus()
        }
        conferir()
        const timer = setInterval(conferir, VERIFICAR_VISIVEL_MS)
        document.addEventListener('visibilitychange', conferir)
        return () => {
            clearInterval(timer)
            document.removeEventListener('visibilitychange', conferir)
        }
    }, [naFrente])

    return (
        <div className={`janela-doom${modoJogo ? ' janela-modo-jogo' : ''} ${classeAnimacao}`}>
            {!modoJogo && (
                <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_doom' escura={tema === TEMAS.noturno} />
            )}

            <div className='doom-corpo'>
                <ControlesModoJogo
                    modoJogo={modoJogo}
                    alternar={alternarModoJogo}
                    idDoApp='app_doom'
                    minimizarApp={minimizarApp}
                    fecharApp={fecharApp}
                />
                <iframe
                    ref={iframeRef}
                    className='doom-tela'
                    src={ENDERECO_DOOM}
                    title='DOOM'
                    allow='autoplay; gamepad'
                    onLoad={() => iframeRef.current?.focus()}
                />
            </div>
        </div>
    )
}

export default JogoDoom
