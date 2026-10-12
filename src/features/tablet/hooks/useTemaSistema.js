import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'

export const TEMAS = {
    padrao: 'padrao',
    noturno: 'noturno',
}

// Tema do sistema do tablet, salvo no navegador (F5 mantém o tema, e o boot já sai no tema escolhido).
// A tela do modal recebe data-tema="..." e o CSS de cada tema se pendura nisso.
export const useTemaSistema = () => {
    const [temaSalvo, setTema] = useEstadoPersistido('tema-sistema', TEMAS.padrao)
    // valor estranho salvo (ex.: um tema que deixou de existir) volta para o padrão
    const tema = Object.values(TEMAS).includes(temaSalvo) ? temaSalvo : TEMAS.padrao

    return { tema, setTema }
}
