import './WallpaperEspecial.css'
import { useState } from 'react'

// wallpaper que só existe no tema noturno (caminho sem o PUBLIC_URL, como os outros wallpapers de exemplo)
export const WALLPAPER_ESPECIAL_NOTURNO = '/imagens/windows/temas/wallpaperEspecialNoturno.jpg'
const MINIATURA_ESPECIAL_NOTURNO = '/imagens/windows/previasWallpaper/miniaturas/especialNoturno.webp'

// "Apresentaçãozinha" do wallpaper especial do noturno: com a galeria aberta, aparece embaixo do "Wallpapers"
// um botãozinho de vidro embaçado com o próprio wallpaper escondido atrás (só uma mancha de cor); no hover o vidro
// desembaça, a imagem entra em foco e um reflexo passa — uma "espiada" no segredo;
// clicando, ele "libera" um mini-modal à esquerda com a miniatura do wallpaper, que aplica normal.
// aoEscolher(caminho): o mesmo selecionarPreset da galeria (aplica e salva no tema)
const WallpaperEspecial = ({ aoEscolher }) => {
    const [aberto, setAberto] = useState(false)

    return (
        <div className='wallpaper-especial'>
            <button
                type='button'
                className={`wallpaper-especial-botao ${aberto ? 'aberto' : ''}`}
                aria-label='Wallpaper especial'
                onClick={() => setAberto(estado => !estado)}
            >
                {/* o próprio wallpaper, atrás do vidro embaçado (o hover desembaça) */}
                <span
                    className='wallpaper-especial-espiada'
                    style={{ backgroundImage: `url(${process.env.PUBLIC_URL + MINIATURA_ESPECIAL_NOTURNO})` }}
                />
            </button>

            {aberto && (
                <div className='wallpaper-especial-modal'>
                    <img
                        className='wallpaper-especial-miniatura'
                        src={process.env.PUBLIC_URL + MINIATURA_ESPECIAL_NOTURNO}
                        alt='Wallpaper especial do tema noturno'
                        draggable={false}
                        onClick={() => aoEscolher(WALLPAPER_ESPECIAL_NOTURNO)}
                    />
                </div>
            )}
        </div>
    )
}

export default WallpaperEspecial
