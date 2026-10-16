import { useEffect, useState } from 'react'
import { ehCelular } from '../../../shared/hooks/useDispositivo'
import { ESCALA_HUD, ESCALA_HUD_CELULAR, FRACAO_MAXIMA_TELA, MODAL_TABLET } from '../hud.config'

export const calcularEscala = () => {
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

// maior escala em que uma janela desse tamanho base ainda cabe inteira na tela
export const escalaQueCabe = (largura, altura) => Math.min(
    (window.innerWidth * FRACAO_MAXIMA_TELA.largura) / largura,
    (window.innerHeight * FRACAO_MAXIMA_TELA.altura) / altura,
)

// a escala normal vezes o fator (resolução escolhida), sem passar do que cabe na tela.
// No celular a escala normal já é a maior possível (o tablet quase da tela toda): lá só dá para diminuir.
export const escalaComFator = (fator, largura, altura) => {
    const escalaNormal = calcularEscala()
    if (fator === 1) return escalaNormal
    const limite = ehCelular() ? escalaNormal : escalaQueCabe(largura, altura)
    return Math.min(escalaNormal * fator, limite)
}

// Escala contínua para janelas do HUD; recalcula no resize (no máximo uma vez por frame).
// fator/largura/altura: só para janela com tamanho escolhível (o tablet); sem eles, é a escala normal.
export const useEscalaHud = ({ fator = 1, largura = MODAL_TABLET.largura, altura = MODAL_TABLET.altura } = {}) => {
    const [escala, setEscala] = useState(() => escalaComFator(fator, largura, altura))

    useEffect(() => {
        let frame
        const atualizar = () => setEscala(escalaComFator(fator, largura, altura))

        const aoRedimensionar = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(atualizar)
        }

        atualizar()
        window.addEventListener('resize', aoRedimensionar)
        return () => {
            window.removeEventListener('resize', aoRedimensionar)
            cancelAnimationFrame(frame)
        }
    }, [fator, largura, altura])

    return escala
}
