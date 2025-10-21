// aqui vai ficar o BOTAO pra desligar, o onclick nele e plin, altera a variavel que da true no radio
// SE o radio estiver ligado, outro click nao funciona, clicou, ON pra sempre, o que da TURN OFF 


import React from "react"
import "./MiniPlayer.css"

const MiniPlayer = ({ musicaAtual, estaTocando, tocarOuPausar, proximaMusica, musicaAnterior, aoDesligarRadio}) => {
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

                <button 
                    className="botao-desligar"
                    onClick={aoDesligarRadio}
                    onMouseEnter={(e) => e.currentTarget.firstChild.src = process.env.PUBLIC_URL + '/imagens/player/botaoDesligarHover.png'}
                    onMouseLeave={(e) => e.currentTarget.firstChild.src = process.env.PUBLIC_URL + '/imagens/player/botaoDesligar.png'}
>
  <img
    src={process.env.PUBLIC_URL + '/imagens/player/botaoDesligar.png'}
    alt="botão de desligar"
  />
                </button>
            </div>

        </div>
    )
}

export default MiniPlayer