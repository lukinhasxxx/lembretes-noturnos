import { useEffect, useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import { apagarWallpaperUpload, lerWallpaperUpload, salvarWallpaperUpload } from '../utils/wallpaperSalvo'

const WALLPAPER_PADRAO = `${process.env.PUBLIC_URL}/imagens/windows/windowsWallpaper.jpg`

// marca, no lugar do caminho do preset, que o wallpaper salvo é a imagem enviada (guardada no IndexedDB)
const MARCA_UPLOAD = 'upload'

// Wallpaper do sistema do tablet (área de trabalho, telas de boas-vindas/login/bloqueio e o espelho na mesa).
// O que fica salvo em 'wallpaper-preset' (localStorage):
// - null: wallpaper padrão
// - caminho de um wallpaper de exemplo (sem o PUBLIC_URL, para funcionar no localhost e no GitHub Pages)
// - 'upload': a imagem enviada pela pessoa, que fica no IndexedDB (utils/wallpaperSalvo)
export const useWallpaperSistema = () => {
    const [wallpaperSalvo, setWallpaperSalvo] = useEstadoPersistido('wallpaper-preset', null)
    const presetSalvo = wallpaperSalvo && wallpaperSalvo !== MARCA_UPLOAD ? wallpaperSalvo : null
    const [previa, setPrevia] = useState(() => (presetSalvo ? process.env.PUBLIC_URL + presetSalvo : null))

    // wallpaper que está na área de trabalho agora
    const wallpaperAtual = previa ?? WALLPAPER_PADRAO

    // F5 com upload salvo: busca a imagem no IndexedDB (leva alguns ms; o boot cobre a troca)
    useEffect(() => {
        if (wallpaperSalvo !== MARCA_UPLOAD) return
        let cancelado = false
        lerWallpaperUpload().then((arquivo) => {
            if (!cancelado && arquivo) setPrevia(URL.createObjectURL(arquivo))
        })
        return () => { cancelado = true }
        // só na montagem: depois disso a prévia já é atualizada por quem troca o wallpaper
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selecionarPreset = (caminhoDaImagem) => {
        setPrevia(process.env.PUBLIC_URL + caminhoDaImagem)
        setWallpaperSalvo(caminhoDaImagem)
        apagarWallpaperUpload()
    }

    // input de arquivo do Config.exe
    const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]
        // limpa o input: sem isso, escolher de novo o mesmo arquivo (ex.: depois do "↺ Padrão") não dispara nada
        evento.target.value = ''
        if (!arquivo) return

        setPrevia(URL.createObjectURL(arquivo))
        setWallpaperSalvo(MARCA_UPLOAD)
        salvarWallpaperUpload(arquivo)
    }

    // "↺ Padrão": volta para o wallpaper padrão e esquece o que estava salvo
    const voltarParaWallpaperPadrao = () => {
        setPrevia(null)
        setWallpaperSalvo(null)
        apagarWallpaperUpload()
    }

    return { wallpaperAtual, previa, setPrevia, selecionarPreset, lidarComMudancas, voltarParaWallpaperPadrao }
}
