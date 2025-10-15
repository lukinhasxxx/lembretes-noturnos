import React from "react"
import "./MiniPlayer.css"

const MiniPlayer = ({ musicaAtual, estaTocando, tocarOuPausar, proximaMusica, musicaAnterior}) => {
    return (

        <div className="mini-player-container"> {}
            <p className="nome-musica"> tocando no momento :{musicaAtual.nome} </p>

            <div className="controle-player">
                <button onClick={musicaAnterior}>anterior</button>

                <button onClick={tocarOuPausar}>{estaTocando?'Pause':'Play'}</button>

                <button onClick={proximaMusica}>proximo</button>
            </div>

        </div>
    )
}

export default MiniPlayer