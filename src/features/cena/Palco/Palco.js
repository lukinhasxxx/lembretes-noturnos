import './Palco.css'
import { useRef } from 'react'
import { CENA } from '../cena.config'
import { usePontoFocal } from '../hooks/usePontoFocal'
import { useArrastoCena } from '../hooks/useArrastoCena'

// O palco tem sempre a proporção do vídeo e cobre a tela inteira (mesma lógica do object-fit: cover).
// Tudo que for renderizado como children fica no mesmo sistema de coordenadas da arte:
// left: 15% dentro do palco = 15% da largura do vídeo, em qualquer tela.
// Quando a tela corta a arte, o ponto focal desloca o palco para manter os pontos de interesse visíveis.
// posterSrc: imagem do primeiro frame, mostrada na hora enquanto o vídeo carrega (evita tela preta).
// arrastavel: celular em pé — a pessoa arrasta a cena para os lados, com uma luzinha nas bordas que ainda têm cena
// (tocar nela leva para a próxima parada)
// foco: { parada, vez } — no modo arrastável, leva a cena sozinha até essa parada (ver useArrastoCena)
const Palco = ({ videoSrc, posterSrc, arrastavel = false, foco, children }) => {
    const palcoRef = useRef(null)
    usePontoFocal(palcoRef, !arrastavel)
    const { lados, irPara } = useArrastoCena(palcoRef, arrastavel, foco)

    return (
        <>
            <div
                ref={palcoRef}
                className={`palco ${arrastavel ? 'palco-arrastavel' : ''}`}
                style={{ '--palco-largura': CENA.largura, '--palco-altura': CENA.altura }}
                // a cena não é arrastável pelo navegador: bloqueia o drag nativo do vídeo/imagens/seleção
                onDragStart={(evento) => evento.preventDefault()}
            >
                <video
                    className='palco-video'
                    src={videoSrc}
                    poster={posterSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                />
                {children}
            </div>

            {/* fora do palco: ele tem transform, e um position: fixed dentro dele não ficaria preso à tela */}
            {arrastavel && (
                <>
                    <button
                        type='button'
                        className={`palco-borda palco-borda-esquerda ${lados.esquerda ? 'visivel' : ''}`}
                        aria-label='Ver o que tem à esquerda'
                        onClick={() => irPara(-1)}
                    />
                    <button
                        type='button'
                        className={`palco-borda palco-borda-direita ${lados.direita ? 'visivel' : ''}`}
                        aria-label='Ver o que tem à direita'
                        onClick={() => irPara(1)}
                    />
                </>
            )}
        </>
    )
}

export default Palco
