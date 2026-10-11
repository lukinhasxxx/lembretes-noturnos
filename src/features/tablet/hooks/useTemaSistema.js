import { useState } from 'react'

export const TEMAS = {
    padrao: 'padrao',
    noturno: 'noturno',
}

// Tema do sistema do tablet. A tela do modal recebe data-tema="..." e o CSS de cada tema se pendura nisso.
// Por enquanto não fica salvo no navegador (F5 volta ao padrão).
export const useTemaSistema = () => {
    const [tema, setTema] = useState(TEMAS.padrao)

    return { tema, setTema }
}
