import { useEffect, useState } from 'react'
import { ehCelular } from './useDispositivo'

// a parte visível da página encolheu mais que isso: é o teclado do celular aberto
const FRACAO_TECLADO = 0.8

const lerTeclado = () => {
    const visivel = window.visualViewport
    if (!visivel || !ehCelular()) return { aberto: false, topo: 0 }
    return {
        aberto: visivel.height < window.innerHeight * FRACAO_TECLADO,
        // quanto a parte visível desceu (o navegador pode rolar a página ao abrir o teclado)
        topo: visivel.offsetTop,
    }
}

// Teclado virtual do celular aberto? O teclado não muda o tamanho da página, só a parte visível dela
// (visualViewport), então é ela que diz se ele está aberto. Devolve { aberto, topo }.
export const useTecladoAberto = () => {
    const [teclado, setTeclado] = useState(lerTeclado)

    useEffect(() => {
        const visivel = window.visualViewport
        if (!visivel) return

        const atualizar = () => setTeclado(atual => {
            const novo = lerTeclado()
            return novo.aberto === atual.aberto && novo.topo === atual.topo ? atual : novo
        })

        visivel.addEventListener('resize', atualizar)
        visivel.addEventListener('scroll', atualizar)
        return () => {
            visivel.removeEventListener('resize', atualizar)
            visivel.removeEventListener('scroll', atualizar)
        }
    }, [])

    return teclado
}
