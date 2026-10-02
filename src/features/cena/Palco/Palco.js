import './Palco.css'

// O palco tem sempre a proporção do vídeo e cobre a tela inteira (mesma lógica do object-fit: cover).
// Tudo que for renderizado como children fica no mesmo sistema de coordenadas da arte:
// left: 15% dentro do palco = 15% da largura do vídeo, em qualquer tela.
const Palco = ({ videoSrc, children }) => {
    return (
        <div className='palco'>
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
