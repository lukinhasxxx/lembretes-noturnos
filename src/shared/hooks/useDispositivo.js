import { useEffect, useState } from 'react'

// Celular (ou tablet de verdade): toque com o dedo e nenhum mouse. Pergunta para a tela em vez de adivinhar pelo
// nome do aparelho, então notebook com tela de toque (que também tem mouse/touchpad) continua sendo "PC".
const CONSULTA_CELULAR = '(hover: none) and (pointer: coarse)'

export const ehCelular = () => window.matchMedia(CONSULTA_CELULAR).matches

const lerDispositivo = () => ({
    celular: ehCelular(),
    emPe: window.innerHeight > window.innerWidth,
})

// Tipo de tela atual: { celular, emPe }. Atualiza ao girar o aparelho (resize) e se a forma de toque mudar
// (ex.: o modo celular do DevTools ligado/desligado).
export const useDispositivo = () => {
    const [dispositivo, setDispositivo] = useState(lerDispositivo)

    useEffect(() => {
        const atualizar = () => setDispositivo(atual => {
            const novo = lerDispositivo()
            return novo.celular === atual.celular && novo.emPe === atual.emPe ? atual : novo
        })
        const consulta = window.matchMedia(CONSULTA_CELULAR)

        window.addEventListener('resize', atualizar)
        consulta.addEventListener('change', atualizar)
        return () => {
            window.removeEventListener('resize', atualizar)
            consulta.removeEventListener('change', atualizar)
        }
    }, [])

    return dispositivo
}
