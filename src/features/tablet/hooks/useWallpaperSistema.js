import { useEffect, useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import { apagarWallpaperUpload, lerWallpaperUpload, salvarWallpaperUpload } from '../utils/wallpaperSalvo'

// wallpaper que vem com cada tema (usado quando a pessoa não escolheu nenhum naquele tema)
const WALLPAPER_PADRAO_POR_TEMA = {
    padrao: `${process.env.PUBLIC_URL}/imagens/windows/windowsWallpaper.jpg`,
    noturno: `${process.env.PUBLIC_URL}/imagens/windows/temas/wallpaperNoturno.jpg`,
}

// marca, no lugar do caminho do preset, que o wallpaper salvo é a imagem enviada (guardada no IndexedDB)
const MARCA_UPLOAD = 'upload'

// Wallpaper do sistema do tablet (área de trabalho, telas de boas-vindas/login/bloqueio e o espelho na mesa).
// Cada tema vem com o seu wallpaper, e a escolha da pessoa (exemplo ou upload) vale só no tema em que foi feita:
// ligar o noturno mostra o do noturno; voltar ao padrão volta o que estava escolhido lá.
// O que fica salvo em 'wallpaper-preset' (localStorage) é a escolha do tema padrão (o noturno ainda não é salvo):
// - null: wallpaper do tema
// - caminho de um wallpaper de exemplo (sem o PUBLIC_URL, para funcionar no localhost e no GitHub Pages)
// - 'upload': a imagem enviada pela pessoa, que fica no IndexedDB (utils/wallpaperSalvo)
export const useWallpaperSistema = (tema) => {
    const [wallpaperSalvo, setWallpaperSalvo] = useEstadoPersistido('wallpaper-preset', null)
    const presetSalvo = wallpaperSalvo && wallpaperSalvo !== MARCA_UPLOAD ? wallpaperSalvo : null
    // escolha da pessoa em cada tema (null = usa o wallpaper que vem com o tema)
    const [escolhaPorTema, setEscolhaPorTema] = useState(() => ({
        padrao: presetSalvo ? process.env.PUBLIC_URL + presetSalvo : null,
    }))

    const escolher = (endereco) => setEscolhaPorTema(escolhas => ({ ...escolhas, [tema]: endereco }))
    const salvaNoNavegador = tema === 'padrao'

    // prévia do Config (só a escolha do tema atual) e wallpaper que está na área de trabalho agora
    const previa = escolhaPorTema[tema] ?? null
    const wallpaperAtual = previa ?? WALLPAPER_PADRAO_POR_TEMA[tema] ?? WALLPAPER_PADRAO_POR_TEMA.padrao

    // F5 com upload salvo: busca a imagem no IndexedDB (leva alguns ms; o boot cobre a troca)
    useEffect(() => {
        if (wallpaperSalvo !== MARCA_UPLOAD) return
        let cancelado = false
        lerWallpaperUpload().then((arquivo) => {
            if (!cancelado && arquivo) setEscolhaPorTema(escolhas => ({ ...escolhas, padrao: URL.createObjectURL(arquivo) }))
        })
        return () => { cancelado = true }
        // só na montagem: depois disso a escolha já é atualizada por quem troca o wallpaper
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selecionarPreset = (caminhoDaImagem) => {
        escolher(process.env.PUBLIC_URL + caminhoDaImagem)
        if (!salvaNoNavegador) return
        setWallpaperSalvo(caminhoDaImagem)
        apagarWallpaperUpload()
    }

    // input de arquivo do Config.exe
    const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]
        // limpa o input: sem isso, escolher de novo o mesmo arquivo (ex.: depois do "↺ Padrão") não dispara nada
        evento.target.value = ''
        if (!arquivo) return

        escolher(URL.createObjectURL(arquivo))
        if (!salvaNoNavegador) return
        setWallpaperSalvo(MARCA_UPLOAD)
        salvarWallpaperUpload(arquivo)
    }

    // "↺ Padrão": volta para o wallpaper que vem com o tema atual e esquece a escolha dele
    const voltarParaWallpaperPadrao = () => {
        escolher(null)
        if (!salvaNoNavegador) return
        setWallpaperSalvo(null)
        apagarWallpaperUpload()
    }

    return { wallpaperAtual, previa, selecionarPreset, lidarComMudancas, voltarParaWallpaperPadrao }
}
