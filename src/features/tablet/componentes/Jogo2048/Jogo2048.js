import './Jogo2048.css'
import { useEffect, useRef, useState } from 'react'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'
import { TAMANHO_GRADE, limparRemovidas, mover, nascerPeca, novoJogo, temJogada, venceu } from './logica2048'

// tempo da peça deslizando (igual à transição do .jogo2048-peca no CSS): só depois dele a peça nova nasce
const DURACAO_DESLIZE_MS = 110
// arraste mínimo (px) para o dedo/mouse contar como jogada
const ARRASTE_MINIMO_PX = 24

const TECLAS = {
    ArrowLeft: 'esquerda', ArrowRight: 'direita', ArrowUp: 'cima', ArrowDown: 'baixo',
    a: 'esquerda', d: 'direita', w: 'cima', s: 'baixo',
}

// 2048.exe: setas/WASD no teclado ou arrastar o dedo no tabuleiro. Recorde salvo no navegador.
// As regras ficam no logica2048.js; aqui só a tela, a entrada e a animação.
const Jogo2048 = ({ fecharApp, minimizarApp, classeAnimacao }) => {
    const { tema, telaAtiva } = useSistemaTablet()
    const [pecas, setPecas] = useState(novoJogo)
    const [pontos, setPontos] = useState(0)
    const [recorde, setRecorde] = useEstadoPersistido('recorde-2048', 0)
    // 'jogando' | 'venceu' | 'continuando' (passou do 2048) | 'perdeu'
    const [situacao, setSituacao] = useState('jogando')
    // conta as jogadas: o pulso de "juntou" alterna entre duas animações iguais (par/ímpar), senão uma peça que
    // junta duas jogadas seguidas não pulsaria de novo (a classe continuaria a mesma)
    const [jogadas, setJogadas] = useState(0)
    const animandoRef = useRef(false)
    const toqueRef = useRef(null)
    const timerRef = useRef(null)

    useEffect(() => () => clearTimeout(timerRef.current), [])

    const jogar = (direcao) => {
        if (animandoRef.current || situacao === 'venceu' || situacao === 'perdeu') return
        const jogada = mover(pecas, direcao)
        if (!jogada.mudou) return

        animandoRef.current = true
        setPecas(jogada.pecas)
        setJogadas((total) => total + 1)
        const novosPontos = pontos + jogada.pontos
        setPontos(novosPontos)
        if (novosPontos > recorde) setRecorde(novosPontos)

        // depois de deslizar: some com as engolidas, nasce a peça nova e vê se acabou
        timerRef.current = setTimeout(() => {
            const depois = nascerPeca(limparRemovidas(jogada.pecas))
            setPecas(depois)
            if (situacao === 'jogando' && venceu(depois)) setSituacao('venceu')
            else if (!temJogada(depois)) setSituacao('perdeu')
            animandoRef.current = false
        }, DURACAO_DESLIZE_MS)
    }

    // teclado: só quando o 2048 é a janela da frente (e ninguém está digitando num campo)
    const jogarRef = useRef(jogar)
    jogarRef.current = jogar
    useEffect(() => {
        if (telaAtiva !== '2048.exe') return
        const aoTeclar = (evento) => {
            if (evento.target.closest?.('input, textarea')) return
            const direcao = TECLAS[evento.key] ?? TECLAS[evento.key.toLowerCase()]
            if (!direcao) return
            evento.preventDefault()
            jogarRef.current(direcao)
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [telaAtiva])

    // arrastar no tabuleiro (dedo ou mouse): a direção é a do maior deslocamento
    const aoTocar = (evento) => { toqueRef.current = { x: evento.clientX, y: evento.clientY } }
    const aoSoltar = (evento) => {
        if (!toqueRef.current) return
        const dx = evento.clientX - toqueRef.current.x
        const dy = evento.clientY - toqueRef.current.y
        toqueRef.current = null
        if (Math.max(Math.abs(dx), Math.abs(dy)) < ARRASTE_MINIMO_PX) return
        if (Math.abs(dx) > Math.abs(dy)) jogar(dx > 0 ? 'direita' : 'esquerda')
        else jogar(dy > 0 ? 'baixo' : 'cima')
    }

    const recomecar = () => {
        clearTimeout(timerRef.current)
        animandoRef.current = false
        setPecas(novoJogo())
        setPontos(0)
        setJogadas(0)
        setSituacao('jogando')
    }

    return (
        <div className={`janela-jogo2048 ${classeAnimacao}`}>
            <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_2048' escura={tema === TEMAS.noturno} />

            <div className='jogo2048-corpo'>
                <div
                    className='jogo2048-tabuleiro'
                    onPointerDown={aoTocar}
                    onPointerUp={aoSoltar}
                    onPointerCancel={() => { toqueRef.current = null }}
                >
                    {/* as 16 casinhas do fundo */}
                    {Array.from({ length: TAMANHO_GRADE * TAMANHO_GRADE }, (_, indice) => (
                        <span key={indice} className='jogo2048-casa' />
                    ))}

                    {/* as peças: posição pela linha/coluna (o CSS faz o deslize) */}
                    {pecas.map((peca) => (
                        <div
                            key={peca.id}
                            className={`jogo2048-peca${peca.nova ? ' nova' : ''}${peca.juntou ? ' juntou' : ''}${peca.removida ? ' removida' : ''}`}
                            data-valor={peca.valor > 2048 ? 'maior' : peca.valor}
                            data-vez={jogadas % 2}
                            style={{ '--linha': peca.linha, '--coluna': peca.coluna }}
                        >
                            {peca.valor}
                        </div>
                    ))}

                    {(situacao === 'venceu' || situacao === 'perdeu') && (
                        <div className='jogo2048-aviso'>
                            <strong>{situacao === 'venceu' ? 'Você chegou no 2048!' : 'Fim de jogo'}</strong>
                            <div className='jogo2048-aviso-botoes'>
                                {situacao === 'venceu' && (
                                    <button type='button' className='config-botao' onClick={() => setSituacao('continuando')}>
                                        Continuar
                                    </button>
                                )}
                                <button type='button' className='config-botao' onClick={recomecar}>Jogar de novo</button>
                            </div>
                        </div>
                    )}
                </div>

                <aside className='jogo2048-lateral'>
                    <h2 className='jogo2048-titulo'>2048</h2>
                    <p className='jogo2048-dica'>Junte as peças iguais até chegar no <b>2048</b>.</p>
                    <div className='jogo2048-placar'>
                        <div><small>Pontos</small><b>{pontos}</b></div>
                        <div><small>Recorde</small><b>{recorde}</b></div>
                    </div>
                    <button type='button' className='config-botao' onClick={recomecar}>Novo jogo</button>
                    <p className='jogo2048-controles'>Setas / WASD ou arraste no tabuleiro</p>
                </aside>
            </div>
        </div>
    )
}

export default Jogo2048
