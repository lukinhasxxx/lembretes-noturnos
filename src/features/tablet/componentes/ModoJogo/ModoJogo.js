import './ModoJogo.css'
import { useEffect } from 'react'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'

// Modo jogo dos jogos (xadrez, sudoku, 2048): a janela cobre a tela inteira do tablet, sem a barra da janela
// nem a barra de tarefas, e o jogo cresce. Cada jogo lembra se estava no modo jogo; Esc sai.
//
// Uso: const [modoJogo, alternarModoJogo] = useModoJogo('sudoku')
//      <div className={`janela-sudoku${modoJogo ? ' janela-modo-jogo' : ''}`}> ... {!modoJogo && <WindowBar />}
//      <ControlesModoJogo ... /> no canto de cima (ou só o <BotaoModoJogo /> onde o jogo quiser)
export const useModoJogo = (jogo) => {
    const [modoJogo, setModoJogo] = useEstadoPersistido(`${jogo}-modo-jogo`, false)

    useEffect(() => {
        if (!modoJogo) return
        const aoTeclar = (evento) => {
            if (evento.key === 'Escape') setModoJogo(false)
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [modoJogo, setModoJogo])

    return [modoJogo, () => setModoJogo((ligado) => !ligado)]
}

// ícone: quatro cantos para fora (entrar) ou para dentro (sair)
const IconeModoJogo = ({ sair }) => (
    <svg viewBox='0 0 16 16' width='13' height='13' aria-hidden='true' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'>
        {sair
            ? <path d='M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5' />
            : <path d='M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5' />}
    </svg>
)

export const BotaoModoJogo = ({ modoJogo, alternar }) => (
    <button
        type='button'
        className={`config-botao botao-modo-jogo${modoJogo ? ' ativo' : ''}`}
        aria-label={modoJogo ? 'Sair do modo jogo' : 'Modo jogo'}
        title={modoJogo ? 'Sair do modo jogo (Esc)' : 'Modo jogo (tela cheia)'}
        onClick={alternar}
    >
        <IconeModoJogo sair={modoJogo} />
    </button>
)

// canto de cima da janela: o botão do modo jogo e, nele (sem a barra da janela), minimizar e fechar
export const ControlesModoJogo = ({ modoJogo, alternar, idDoApp, minimizarApp, fecharApp }) => (
    <div className='controles-modo-jogo'>
        <BotaoModoJogo modoJogo={modoJogo} alternar={alternar} />
        {modoJogo && (
            <>
                <button type='button' className='config-botao botao-modo-jogo' aria-label='Minimizar' onClick={() => minimizarApp(idDoApp)}>–</button>
                <button type='button' className='config-botao botao-modo-jogo' aria-label='Fechar' onClick={() => fecharApp(idDoApp)}>✕</button>
            </>
        )}
    </div>
)
