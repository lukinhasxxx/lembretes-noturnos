import React from "react"
import "./MiniPlayer.css"

const MiniPlayer = ({ musicaAtual, estaTocando, tocarOuPausar, proximaMusica, musicaAnterior}) => {
    return (

        <div className="mini-player-container"> {}
            <div className="mini-player-display">
                <p className="nome-musica" data-text={`Tocando no momento: ${musicaAtual.nome}`}>
                 Tocando no momento: {musicaAtual.nome}
                 </p>
    
        </div>

            <div className="controle-player">
                <button className="botao-voltar" onClick={musicaAnterior}>
                    <img src={process.env.PUBLIC_URL + '/imagens/player/voltar.png'} alt="botao de voltar musica" />
                </button>


            <button  className="botao-play-pause" onClick={tocarOuPausar}>
                    <img
                        src={process.env.PUBLIC_URL + (estaTocando ? '/imagens/player/pause.svg' : '/imagens/player/play.svg')}
                        alt={estaTocando ? 'botao de pausar musica' : 'botao de tocar musica'}
                     />
            </button>

                <button className="botao-avancar" onClick={proximaMusica}>
                    <img src={process.env.PUBLIC_URL + '/imagens/player/avancar.png'} alt="botao de avancar a musica" />
                </button>
            </div>

        </div>
    )
}

export default MiniPlayer