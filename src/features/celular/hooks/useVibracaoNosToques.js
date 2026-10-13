import { useEffect } from 'react'
import { vibrar } from '../../../shared/utils/vibrar'

// toque comum: bem mais leve que as vibrações de ações importantes (fixar/apagar nota, ligar o rádio...)
const VIBRACAO_TOQUE_MS = 6
// o que conta como "algo clicável" além do que já tem cursor de mãozinha
const CLICAVEIS = 'button, a, [role="button"], input[type="checkbox"], input[type="radio"], label'

const ehClicavel = (alvo) =>
    alvo instanceof Element && (alvo.closest(CLICAVEIS) || getComputedStyle(alvo).cursor === 'pointer')

// Celular: cada toque em algo clicável dá uma vibraçãozinha bem leve. Escuta o clique (e não o toque),
// então arrastar a cena ou uma janela não vibra (o clique depois de um arraste é engolido antes de chegar aqui).
// As ações importantes chamam vibrar() de novo, um pouco mais forte, e essa substitui a leve.
export const useVibracaoNosToques = () => {
    useEffect(() => {
        const aoClicar = (evento) => {
            if (ehClicavel(evento.target)) vibrar(VIBRACAO_TOQUE_MS)
        }

        document.addEventListener('click', aoClicar, { capture: true })
        return () => document.removeEventListener('click', aoClicar, { capture: true })
    }, [])
}
