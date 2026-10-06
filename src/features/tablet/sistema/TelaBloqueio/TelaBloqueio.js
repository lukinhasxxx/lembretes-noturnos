import './TelaBloqueio.css'
import { useRef, useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { useDataAtual } from '../../hooks/useDataAtual'

// quanto arrastar para cima (fração da altura da tela) para o progresso chegar a 100%
const DISTANCIA_PROGRESSO_COMPLETO = 0.5
// soltou com pelo menos este progresso: completa o desbloqueio; menos que isso, volta
const PROGRESSO_MINIMO_PARA_DESBLOQUEAR = 0.3
// abaixo disso (px da tela) o gesto conta como clique, não como arraste
const TOLERANCIA_CLIQUE_PX = 5

// Tela de bloqueio (inspirada na do Windows 10/11): wallpaper nítido, relógio grande e data embaixo à esquerda.
// Arrastar para cima não move a tela inteira (como no Windows 11): o fundo fica parado e vai desfocando até
// ficar igual ao fundo do login, enquanto relógio e dica sobem e apagam. Tudo sai de um número só,
// --progresso (0 = bloqueada, 1 = login), que o arraste controla. Clicar faz uma saída mais leve.
// Quando termina, chama aoDesbloquear (o sistema mostra a tela de login, que já está por baixo).
// wallpaper: url da imagem de fundo (a mesma da área de trabalho)
const TelaBloqueio = ({ wallpaper, aoDesbloquear }) => {
    const { idioma, t } = useIdioma()
    const dataAtual = useDataAtual()

    // parado → arrastando → (completando | voltando); ou parado → saindoClique
    const [fase, setFase] = useState('parado')
    const [progresso, setProgresso] = useState(0)
    // dados do arraste atual (não precisam de re-render)
    const arrasteRef = useRef(null)
    const conteudoRef = useRef(null)

    const aoPressionar = (evento) => {
        if (fase !== 'parado' && fase !== 'voltando') return

        const tela = evento.currentTarget
        tela.setPointerCapture(evento.pointerId)
        arrasteRef.current = {
            inicioY: evento.clientY,
            // o modal é escalado (transform: scale): converte px da tela do navegador para px do tablet
            escala: tela.getBoundingClientRect().height / tela.offsetHeight,
            altura: tela.offsetHeight,
            arrastou: false,
        }
        setFase('arrastando')
    }

    const aoMover = (evento) => {
        if (fase !== 'arrastando') return

        const arraste = arrasteRef.current
        const movimentoNaTela = evento.clientY - arraste.inicioY
        if (Math.abs(movimentoNaTela) > TOLERANCIA_CLIQUE_PX) arraste.arrastou = true

        // só para cima conta; arrastar para baixo deixa no 0
        const subidaNoTablet = -movimentoNaTela / arraste.escala
        const novoProgresso = subidaNoTablet / (arraste.altura * DISTANCIA_PROGRESSO_COMPLETO)
        setProgresso(Math.min(1, Math.max(0, novoProgresso)))
    }

    const aoSoltar = () => {
        if (fase !== 'arrastando') return

        if (!arrasteRef.current.arrastou) {
            setProgresso(0)
            setFase('saindoClique')
        } else if (progresso >= PROGRESSO_MINIMO_PARA_DESBLOQUEAR) {
            // já arrastou até o fim: não há transição para esperar
            if (progresso === 1) return aoDesbloquear()
            setProgresso(1)
            setFase('completando')
        } else if (progresso > 0) {
            setProgresso(0)
            setFase('voltando')
        } else {
            setFase('parado')
        }
    }

    // fim da transição (arraste solto): o relógio é o que sempre se move, então ele marca o fim
    const aoTerminarTransicao = (evento) => {
        if (evento.target !== conteudoRef.current || evento.propertyName !== 'transform') return

        if (fase === 'completando') aoDesbloquear()
        if (fase === 'voltando') setFase('parado')
    }

    // fim da saída por clique
    const aoTerminarAnimacao = (evento) => {
        if (evento.target === evento.currentTarget && evento.animationName === 'tela-bloqueio-saindo-clique') {
            aoDesbloquear()
        }
    }

    return (
        // moldura que recorta: nada da tela de bloqueio sai da tela do tablet
        <div className='tela-bloqueio-recorte'>
            <div
                className={`tela-bloqueio ${fase}`}
                style={{ '--progresso': progresso }}
                onPointerDown={aoPressionar}
                onPointerMove={aoMover}
                onPointerUp={aoSoltar}
                onPointerCancel={aoSoltar}
                onTransitionEnd={aoTerminarTransicao}
                onAnimationEnd={aoTerminarAnimacao}
            >
                <div className='tela-bloqueio-fundo' style={{ backgroundImage: `url(${wallpaper})` }} />

                <div ref={conteudoRef} className='tela-bloqueio-conteudo'>
                    <div className='tela-bloqueio-relogio'>
                        <span className='tela-bloqueio-hora'>
                            {dataAtual.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className='tela-bloqueio-data'>
                            {dataAtual.toLocaleDateString(idioma, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    <div className='tela-bloqueio-dica'>
                        {/* cadeado: arco + corpo */}
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                            <path d='M8 11V8a4 4 0 0 1 8 0v3' />
                            <rect x='6' y='11' width='12' height='9' rx='2' />
                        </svg>
                        <span>{t('bloqueio.desbloquear')}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TelaBloqueio
