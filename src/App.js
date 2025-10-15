//aqui eh pra eu importar o provider, sem o contexto
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ModalTablet from './componentes/ModalTablet/ModalTablet';
import VisibilidadePainelProvider from './contexts/VisibilidadePainel';
import PlayerRadio from './componentes/Radio/PlayerRadio';
import MuralDeNotas from './componentes/Time/MuralDeNotas'
import MiniPlayer from './componentes/MiniPlayer/MiniPlayer';


function App() {

const [lembretes, setLembretes] = useState([])
const [painelLigadoPermanente,setPainelLigadoPermanente] = useState(false)
const [animacaoJaAtivada,setAnimacaoJaAtivada] = useState(false)
const [primeiraMensagemPainel,setPrimeiraMensagemPainel] = useState(false)
const [radioLigado, setRadioLigado] = useState(false)
const [luzRadio, setLuzRadio] = useState('#00D7FF')




// const [tabletJaIniciou,setTabletJaIniciou] = useState(false);
// const [animacaoTabletDeveRodar, setAnimacaoTabletDeveRodar] = useState(false)

const audioRef = useRef(null);
const playlist = [
  {nome:"Good Night\nFFASounds", src:"/audio/track1.mp3"},
  {nome:"4EM\nGrimes", src:"/audio/track2.mp3"},
  {nome:"Backyard\nLofium", src:"/audio/track3.mp3"},
  {nome:"Antagonistic\nChris Cardena-4EM\nGrimes", src:"/audio/track4.mp3"},
  {nome:"Shadow of Winter\nFrosty", src:"/audio/track5.mp3"},
  {nome:"Rain\nLo-fi Ambience", src:"/audio/track6.mp3"},
  {nome:"Oblivion\nGrimes", src:"/audio/track7.mp3"},
  {nome:"Bonham's Goodbye\nSebastian Robertson", src:"/audio/track8.mp3"}
  ]

const [musicas] = useState(playlist);
const [indiceMusicaAtual, setIndiceMusicaAtual] = useState(0);
const [estaTocando, setEstaTocando] = useState(false);

const tocarOuPausar = () => {
  if(estaTocando){
    audioRef.current.pause();
  } else {
    audioRef.current.play();
  }
  setEstaTocando(!estaTocando)
}

const proximaMusica= () => {
  // eh praticamente um(0 + 1) % 2 = 1. (1 + 1) % 2 = 0.
  setIndiceMusicaAtual( (indiceAnterior)=> (indiceAnterior + 1) % musicas.length     )
}

const musicaAnterior = () => {
setIndiceMusicaAtual ( (indiceAnterior)=> (indiceAnterior -1 +musicas.length) % musicas.length)
}

useEffect( () => {
  if (estaTocando){
    audioRef.current.play();
    console.log(audioRef.current)
  }
},[indiceMusicaAtual]  )

const gerenciarEstadoRadio = () => {

  if (radioLigado) {
    audioRef.current.pause();
    setEstaTocando(false);  
  } 

  else {
    audioRef.current.play(); 
    setEstaTocando(true); 
  }
  setRadioLigado(ligado => !ligado);
}





const adicionarLembrete = (textoDaNota) => {

  const novoLembrete = {
    id: uuidv4(),
    texto: textoDaNota,
    fixar: false
  };


setTimeout(()=> {

if(!painelLigadoPermanente){
    setPainelLigadoPermanente(true)
    setAnimacaoJaAtivada(true);
    setModalAberto(false);
    setLigarTablet(false);


    setTimeout(()=> {
        setLembretes(lembretesAnteriores => [...lembretesAnteriores, novoLembrete])
          setPrimeiraMensagemPainel(true);
        
        } ,5000) 
      } else {
          setLembretes( lembretesAnteriores => [...lembretesAnteriores, novoLembrete]);
          if(!primeiraMensagemPainel){
            setPrimeiraMensagemPainel(true)
          }
  }

},200)
};

function fixarLembrete(id) {
  setLembretes(lembretes.map(lembrete => {
    if (lembrete.id === id) {
      return { ...lembrete, fixar: !lembrete.fixar
      };
    } else{
      return lembrete
    }
  }).sort((a,b)=> b.fixar-a.fixar)
);

}
   function deletarLembrete(id) {
      setTimeout(()=>{
        setLembretes(lembretes.filter(lembrete => lembrete.id !== id))}
        ,200)

    }
    

const [ligarTablet,setLigarTablet] = useState(false)
const [modalAberto,setModalAberto] = useState(false)

const gerenciarTablet = () => {

setModalAberto(ligado=> !ligado);
setLigarTablet(ligado =>!ligado);
}

  return (
    <VisibilidadePainelProvider>
    
    <div className="App">

    <video autoPlay loop muted className='video-background' >
      <source src={process.env.PUBLIC_URL + '/videos/video-background.mp4'} type='video/mp4' />
    </video>
    <audio ref={audioRef} src= {process.env.PUBLIC_URL +musicas[indiceMusicaAtual].src } />

    {radioLigado === true &&
    <MiniPlayer
    radioLigado={radioLigado}
    musicaAtual={musicas[indiceMusicaAtual]}
    estaTocando= {estaTocando}
    tocarOuPausar={tocarOuPausar}
    proximaMusica={proximaMusica}
    musicaAnterior={musicaAnterior}
    />}

      <PlayerRadio 
        corLuzRadio = {luzRadio} 
        radioLigado={radioLigado} 
        setRadioLigado={setRadioLigado}
        aoClicarNoRadio = {gerenciarEstadoRadio}
        />

          {modalAberto && 
        <ModalTablet
          aoSubmeter={adicionarLembrete}
          validarLigadoDesligado = {ligarTablet}
          painelLigadoPermanente={painelLigadoPermanente}
          corNeon = {setLuzRadio}
          radioLigado={radioLigado}
        />
       }

        <div className='zona-interacao-tablet' 
        onClick={gerenciarTablet}>{ligarTablet}
          <img 
          className='tablet-img'
          src= {process.env.PUBLIC_URL + '/imagens/tabletPNG.png'}
            alt='tablet'
            style ={{filter: ligarTablet ?  "drop-shadow(1px 1px 3px #00D7FF)" : "none"
            }}
            onClick={gerenciarTablet}
          />

      </div>
      
        <MuralDeNotas
          lembretes={lembretes} 
          aoDeletar={deletarLembrete}
          aoFixar={fixarLembrete}
          painelLigadoPermanente={painelLigadoPermanente}
          animacaoDeveRodar={animacaoJaAtivada}
          conteudoVisivelPainel={primeiraMensagemPainel}
      />
     
    </div>
  </VisibilidadePainelProvider>
  );
}

export default App;
