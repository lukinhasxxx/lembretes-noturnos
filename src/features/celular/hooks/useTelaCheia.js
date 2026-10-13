import { useEffect, useState } from 'react'

// Tela cheia + travar deitado funciona no Android (Chrome, Edge, Samsung Internet...).
// No iPhone o Safari não deixa uma página entrar em tela cheia nem travar a orientação.
export const suportaTelaCheia = () => Boolean(document.documentElement.requestFullscreen)

// Tela cheia do site inteiro, deitado. ativa: está em tela cheia agora (também acompanha quando a pessoa sai
// pelo gesto de voltar do celular, sem usar o nosso X).
export const useTelaCheia = () => {
    const [ativa, setAtiva] = useState(() => Boolean(document.fullscreenElement))

    useEffect(() => {
        const aoMudar = () => setAtiva(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', aoMudar)
        return () => document.removeEventListener('fullscreenchange', aoMudar)
    }, [])

    // entra em tela cheia e, já dentro dela (o navegador só deixa travar assim), trava deitado
    const entrar = async () => {
        try {
            await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
            await window.screen.orientation?.lock?.('landscape')
        } catch {
            // navegador recusou travar a orientação: fica em tela cheia mesmo assim (a pessoa pode girar na mão)
        }
    }

    const sair = async () => {
        window.screen.orientation?.unlock?.()
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
    }

    return { ativa, entrar, sair }
}
