import { useEffect, useLayoutEffect, useState } from 'react'
import { ESTADOS_SISTEMA } from '../tablet.config'

const PASTA_BLOQUEIO = `${process.env.PUBLIC_URL}/imagens/windows/telaDeBloqueio`

// imagens da tela de bloqueio de cada tema: uma é sorteada a cada vez que o tablet bloqueia.
// Tema sem lista usa o wallpaper da área de trabalho, como antes
const WALLPAPERS_BLOQUEIO_POR_TEMA = {
    noturno: [1, 2, 3, 4, 5, 6].map(numero => `${PASTA_BLOQUEIO}/noturno/bloqueio${numero}.jpg`),
}

const sortearDiferenteDe = (lista, anterior) => {
    const opcoes = lista.length > 1 ? lista.filter(imagem => imagem !== anterior) : lista
    return opcoes[Math.floor(Math.random() * opcoes.length)]
}

// Wallpaper da tela de bloqueio (e do login que fica por baixo dela, para a passagem de uma para a outra
// continuar sem emenda, como no Windows). Sorteia na hora de bloquear, sem repetir a anterior.
export const useWallpaperBloqueio = (tema, estadoSistema, wallpaperAtual) => {
    const lista = WALLPAPERS_BLOQUEIO_POR_TEMA[tema]
    const [sorteado, setSorteado] = useState(null)

    // layout effect: o sorteio acontece antes da tela de bloqueio ser pintada (sem um frame com o wallpaper antigo)
    useLayoutEffect(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.bloqueado || !lista) return
        setSorteado(anterior => sortearDiferenteDe(lista, anterior))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoSistema, tema])

    // deixa as imagens do tema já baixadas: na hora de bloquear, a escolhida aparece na hora (sem fundo preto)
    useEffect(() => {
        lista?.forEach(imagem => { new Image().src = imagem })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tema])

    return lista && lista.includes(sorteado) ? sorteado : wallpaperAtual
}
