import { useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'

const WALLPAPER_PADRAO = `${process.env.PUBLIC_URL}/imagens/windows/windowsWallpaper.jpg`

// Wallpaper do sistema do tablet (área de trabalho, telas de boas-vindas/login/bloqueio e, depois, o espelho na mesa).
// Só o wallpaper de exemplo (preset) é salvo; o de upload é uma imagem inteira e não cabe bem no localStorage.
// O preset é salvo sem o PUBLIC_URL, para funcionar tanto no localhost quanto no GitHub Pages.
export const useWallpaperSistema = () => {
    const [wallpaperPresetSalvo, setWallpaperPresetSalvo] = useEstadoPersistido('wallpaper-preset', null)
    const [previa, setPrevia] = useState(() =>
        wallpaperPresetSalvo ? process.env.PUBLIC_URL + wallpaperPresetSalvo : null
    )
    const [mudarWallpaper, setMudarWallpaper] = useState(() => Boolean(wallpaperPresetSalvo))

    // wallpaper que está na área de trabalho agora
    const wallpaperAtual = mudarWallpaper ? previa : WALLPAPER_PADRAO

    const selecionarPreset = (caminhoDaImagem) => {
        setPrevia(process.env.PUBLIC_URL + caminhoDaImagem)
        setMudarWallpaper(true)
        setWallpaperPresetSalvo(caminhoDaImagem)
    }

    // input de arquivo do Config.exe
    const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]

        if (arquivo) {
            setPrevia(URL.createObjectURL(arquivo))
        }
        setMudarWallpaper(arquivo)
    }

    return { wallpaperAtual, previa, setPrevia, selecionarPreset, lidarComMudancas }
}
