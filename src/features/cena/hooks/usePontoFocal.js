import { useEffect } from 'react'
import { CENA, MARGEM_FOCAL, PONTOS } from '../cena.config'
import { calcularAreaFocal, deslocamentoNoEixo } from '../utils/pontoFocal'

const AREA_FOCAL = calcularAreaFocal(PONTOS, MARGEM_FOCAL)

// Desloca o palco (em vez de sempre centralizar) para manter os pontos de interesse visíveis
// quando a tela corta a arte. Escreve direto no style do palco: não causa re-render.
export const usePontoFocal = (palcoRef) => {
    useEffect(() => {
        const palco = palcoRef.current
        let frame

        const aplicar = () => {
            // px da tela por px da arte (offsetWidth não é afetado pelo transform)
            const escala = palco.offsetWidth / CENA.largura

            const dx = deslocamentoNoEixo(
                CENA.largura, window.innerWidth / escala, AREA_FOCAL.x0, AREA_FOCAL.x1
            ) * escala
            const dy = deslocamentoNoEixo(
                CENA.altura, window.innerHeight / escala, AREA_FOCAL.y0, AREA_FOCAL.y1
            ) * escala

            palco.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
        }

        const agendar = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(aplicar)
        }

        aplicar()
        window.addEventListener('resize', agendar)
        return () => {
            window.removeEventListener('resize', agendar)
            cancelAnimationFrame(frame)
        }
    }, [palcoRef])
}
