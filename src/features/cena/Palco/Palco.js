import './Palco.css'
import { useRef } from 'react'
import { CENA } from '../cena.config'
import { usePontoFocal } from '../hooks/usePontoFocal'

// O palco tem sempre a proporção do vídeo e cobre a tela inteira (mesma lógica do object-fit: cover).
// Tudo que for renderizado como children fica no mesmo sistema de coordenadas da arte:
// left: 15% dentro do palco = 15% da largura do vídeo, em qualquer tela.
// Quando a tela corta a arte, o ponto focal desloca o palco para manter os pontos de interesse visíveis.
const Palco = ({ videoSrc, children }) => {
    const palcoRef = useRef(null)
    usePontoFocal(palcoRef)

    return (
        <div
            ref={palcoRef}
            className='palco'
            style={{ '--palco-largura': CENA.largura, '--palco-altura': CENA.altura }}
            // a cena não é arrastável: bloqueia o drag nativo do vídeo/imagens/seleção
            onDragStart={(evento) => evento.preventDefault()}
        >
            <video
                className='palco-video'
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
            />
            {children}
        </div>
    )
}

export default Palco
