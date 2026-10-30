import { useCallback } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'

export const TEMAS = {
    padrao: 'padrao',
    noturno: 'noturno',
    pixel: 'pixel',
}

// a passagem que o próximo boot mostra depois de entrar no PixelOS ou sair dele (ver PassagemPixel.js):
// { tipo: 'entrada' | 'saida', temaDoBoot } — na entrada, o boot do tema de antes pixelando até o do PixelOS;
// na saída, o boot do tema novo começando pixelado e voltando ao normal
const passagemDepoisDaTroca = (temaAntes, temaNovo, passagemPendente) => {
    if (temaNovo === TEMAS.pixel) return { tipo: 'entrada', temaDoBoot: temaAntes }
    if (temaAntes === TEMAS.pixel) {
        // entrou e saiu sem reiniciar: não chegou a ver o PixelOS, então não tem do que sair
        return passagemPendente?.tipo === 'entrada' ? null : { tipo: 'saida', temaDoBoot: temaNovo }
    }
    // trocando entre os outros com uma saída pendente: ela passa a mostrar o boot do tema novo
    return passagemPendente?.tipo === 'saida' ? { tipo: 'saida', temaDoBoot: temaNovo } : passagemPendente
}

// Tema do sistema do tablet, salvo no navegador (F5 mantém o tema, e o boot já sai no tema escolhido).
// A tela do modal recebe data-tema="..." e o CSS de cada tema se pendura nisso.
// passagemPixel: a passagem pendente para o próximo boot (null = boot normal); consumirPassagem: o boot já mostrou
export const useTemaSistema = () => {
    const [temaSalvo, setTemaSalvo] = useEstadoPersistido('tema-sistema', TEMAS.padrao)
    const [passagemPixel, setPassagemPixel] = useEstadoPersistido('passagem-pixel', null)
    // valor estranho salvo (ex.: um tema que deixou de existir) volta para o padrão
    const tema = Object.values(TEMAS).includes(temaSalvo) ? temaSalvo : TEMAS.padrao

    const setTema = (temaNovo) => {
        if (temaNovo === tema) return
        setPassagemPixel(passagemDepoisDaTroca(tema, temaNovo, passagemPixel))
        setTemaSalvo(temaNovo)
    }

    const consumirPassagem = useCallback(() => setPassagemPixel(null), [setPassagemPixel])

    return { tema, setTema, passagemPixel, consumirPassagem }
}
