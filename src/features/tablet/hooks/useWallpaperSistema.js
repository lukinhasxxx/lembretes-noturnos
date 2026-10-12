import { useEffect, useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import { apagarWallpaperUpload, lerWallpaperUpload, salvarWallpaperUpload } from '../utils/wallpaperSalvo'

// wallpaper que vem com cada tema (usado quando a pessoa não escolheu nenhum naquele tema)
const WALLPAPER_PADRAO_POR_TEMA = {
    padrao: `${process.env.PUBLIC_URL}/imagens/windows/windowsWallpaper.jpg`,
    noturno: `${process.env.PUBLIC_URL}/imagens/windows/temas/wallpaperNoturno.jpg`,
}

// onde cada tema guarda a sua escolha: no localStorage (preset ou a marca de upload) e no IndexedDB (o arquivo do upload).
// As chaves do padrão são as de antes dos temas, para quem já tinha escolhido um wallpaper não perder a escolha
const CHAVES_POR_TEMA = {
    padrao: { navegador: 'wallpaper-preset', upload: 'upload' },
    noturno: { navegador: 'wallpaper-preset-noturno', upload: 'upload-noturno' },
}

// marca, no lugar do caminho do preset, que o wallpaper salvo é a imagem enviada (guardada no IndexedDB)
const MARCA_UPLOAD = 'upload'

// caminho salvo de um preset → endereço da imagem (upload volta como null: o arquivo vem depois, do IndexedDB)
const enderecoDoPreset = (salvo) => (salvo && salvo !== MARCA_UPLOAD ? process.env.PUBLIC_URL + salvo : null)

// Wallpaper do sistema do tablet (área de trabalho, telas de boas-vindas/login/bloqueio e o espelho na mesa).
// Cada tema vem com o seu wallpaper, e a escolha da pessoa (exemplo ou upload) vale só no tema em que foi feita:
// ligar o noturno mostra o do noturno; voltar ao padrão volta o que estava escolhido lá. As duas escolhas ficam salvas.
// O que fica salvo no localStorage, por tema:
// - null: wallpaper do tema
// - caminho de um wallpaper de exemplo (sem o PUBLIC_URL, para funcionar no localhost e no GitHub Pages)
// - 'upload': a imagem enviada pela pessoa, que fica no IndexedDB (utils/wallpaperSalvo)
export const useWallpaperSistema = (tema) => {
    const [salvoPadrao, setSalvoPadrao] = useEstadoPersistido(CHAVES_POR_TEMA.padrao.navegador, null)
    const [salvoNoturno, setSalvoNoturno] = useEstadoPersistido(CHAVES_POR_TEMA.noturno.navegador, null)
    const salvoPorTema = { padrao: salvoPadrao, noturno: salvoNoturno }
    const salvarPorTema = { padrao: setSalvoPadrao, noturno: setSalvoNoturno }

    // escolha da pessoa em cada tema (null = usa o wallpaper que vem com o tema)
    const [escolhaPorTema, setEscolhaPorTema] = useState(() => ({
        padrao: enderecoDoPreset(salvoPadrao),
        noturno: enderecoDoPreset(salvoNoturno),
    }))

    const temaComChaves = CHAVES_POR_TEMA[tema] ? tema : 'padrao'
    const chaves = CHAVES_POR_TEMA[temaComChaves]
    const salvar = salvarPorTema[temaComChaves]
    const escolher = (endereco) => setEscolhaPorTema(escolhas => ({ ...escolhas, [temaComChaves]: endereco }))

    // prévia do Config (só a escolha do tema atual) e wallpaper que está na área de trabalho agora
    const previa = escolhaPorTema[temaComChaves] ?? null
    const wallpaperAtual = previa ?? WALLPAPER_PADRAO_POR_TEMA[temaComChaves]

    // F5 com upload salvo: busca as imagens no IndexedDB (leva alguns ms; o boot cobre a troca)
    useEffect(() => {
        let cancelado = false
        Object.entries(CHAVES_POR_TEMA).forEach(([temaDoUpload, { upload }]) => {
            if (salvoPorTema[temaDoUpload] !== MARCA_UPLOAD) return
            lerWallpaperUpload(upload).then((arquivo) => {
                if (!cancelado && arquivo) {
                    setEscolhaPorTema(escolhas => ({ ...escolhas, [temaDoUpload]: URL.createObjectURL(arquivo) }))
                }
            })
        })
        return () => { cancelado = true }
        // só na montagem: depois disso a escolha já é atualizada por quem troca o wallpaper
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selecionarPreset = (caminhoDaImagem) => {
        escolher(process.env.PUBLIC_URL + caminhoDaImagem)
        salvar(caminhoDaImagem)
        apagarWallpaperUpload(chaves.upload)
    }

    // input de arquivo do Config.exe
    const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]
        // limpa o input: sem isso, escolher de novo o mesmo arquivo (ex.: depois do "↺ Padrão") não dispara nada
        evento.target.value = ''
        if (!arquivo) return

        escolher(URL.createObjectURL(arquivo))
        salvar(MARCA_UPLOAD)
        salvarWallpaperUpload(arquivo, chaves.upload)
    }

    // "↺ Padrão": volta para o wallpaper que vem com o tema atual e esquece a escolha dele
    const voltarParaWallpaperPadrao = () => {
        escolher(null)
        salvar(null)
        apagarWallpaperUpload(chaves.upload)
    }

    return { wallpaperAtual, previa, selecionarPreset, lidarComMudancas, voltarParaWallpaperPadrao }
}
