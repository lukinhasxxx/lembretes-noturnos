import { useEffect, useState } from 'react'
import { ESCALA_HUD } from '../hud.config'

const calcularEscala = () => Math.min(
    ESCALA_HUD.maxima,
    window.innerWidth / ESCALA_HUD.larguraReferencia,
    window.innerHeight / ESCALA_HUD.alturaReferencia,
)

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
