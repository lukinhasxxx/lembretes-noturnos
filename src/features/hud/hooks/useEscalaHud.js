import { useEffect, useState } from 'react'
import { ehCelular } from '../../../shared/hooks/useDispositivo'
import { ESCALA_HUD, ESCALA_HUD_CELULAR, MODAL_TABLET } from '../hud.config'

const calcularEscala = () => {
    // celular: o tablet ocupa quase a tela toda (ver ESCALA_HUD_CELULAR)
    if (ehCelular()) {
        return Math.min(
            ESCALA_HUD_CELULAR.maxima,
            (window.innerWidth * ESCALA_HUD_CELULAR.fracaoLargura) / MODAL_TABLET.largura,
            (window.innerHeight * ESCALA_HUD_CELULAR.fracaoAltura) / MODAL_TABLET.altura,
        )
    }

    return Math.min(
        ESCALA_HUD.maxima,
        window.innerWidth / ESCALA_HUD.larguraReferencia,
        window.innerHeight / ESCALA_HUD.alturaReferencia,
    )
}

// Escala contínua para janelas do HUD; recalcula no resize (no máximo uma vez por frame).
export const useEscalaHud = () => {
    const [escala, setEscala] = useState(calcularEscala)

    useEffect(() => {
        let frame

        const aoRedimensionar = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => setEscala(calcularEscala()))
        }

        window.addEventListener('resize', aoRedimensionar)
        return () => {
            window.removeEventListener('resize', aoRedimensionar)
            cancelAnimationFrame(frame)
        }
    }, [])

    return escala
}
