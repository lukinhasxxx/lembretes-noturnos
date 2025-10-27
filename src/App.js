//aqui eh pra eu importar o provider, sem o contexto
import Draggable from 'react-draggable';
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
const [foiDesligadoComBotao, setfoiDesligadoComBotao] = useState(true)
const [foiPausadoManualmente, setFoiPausadoManualmente] = useState(false);
const [luzRadio, setLuzRadio] = useState('#00D7FF')
const [volume, setVolume] = useState(1)

const nodeRefMiniPlayer = useRef(null);
const nodeRefTablet= useRef(null)


// const [tabletJaIniciou,setTabletJaIniciou] = useState(false);
// const [animacaoTabletDeveRodar, setAnimacaoTabletDeveRodar] = useState(false)

const audioRef = useRef(null);
const playlist = [
  {nome:"Good Night\nFFASounds", src:"/audio/track1.mp3"},
  {nome:"4ÆM\nGrimes", src:"/audio/track2.mp3"},
  {nome:"Backyard\nLofium", src:"/audio/track3.mp3"},
  {nome:"Antagonistic\nChris Cardena", src:"/audio/track4.mp3"},
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
    setFoiPausadoManualmente(true)
  } else {
    audioRef.current.play();
    setFoiPausadoManualmente(false)
  }
  setEstaTocando(!estaTocando)
}

const proximaMusica= () => {
  // eh praticamente um(0 + 1) % 2 = 1. (1 + 1) % 2 = 0.
  setTimeout( ()=> {
    setIndiceMusicaAtual( (indiceAnterior)=> (indiceAnterior + 1) % musicas.length)
  },150 )
  
}

const musicaAnterior = () => {
    setTimeout( ()=> {
    setIndiceMusicaAtual ( (indiceAnterior)=> (indiceAnterior -1 +musicas.length) % musicas.length)
  },150  )

}

useEffect( () => {
  if (estaTocando){
    audioRef.current.play();
  }
},[indiceMusicaAtual, estaTocando]  )


const gerenciarEstadoRadio = () => {

  if (!radioLigado) {
    if (!foiPausadoManualmente || !foiDesligadoComBotao) {
      audioRef.current.play();
      setEstaTocando(true);
      setFoiPausadoManualmente(false);
      setfoiDesligadoComBotao(true);
    } else {
      audioRef.current.pause();
      setEstaTocando(false);
    }
  }
  setRadioLigado(ligado => !ligado);
}

const gerenciarDesligamentoRadio = () => {

audioRef.current.pause();
  setEstaTocando(false);
  setRadioLigado(false);
  setfoiDesligadoComBotao(false);
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


useEffect( ()=>{
if(audioRef.current){
  audioRef.current.volume=volume
}


},[volume] )


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
    <audio 
    ref={audioRef}
    src= {process.env.PUBLIC_URL +musicas[indiceMusicaAtual].src}
    onEnded={proximaMusica}
    input type='range'
    />


{radioLigado === true &&
   <Draggable 
   nodeRef={nodeRefMiniPlayer}
   bounds='parent'
   distance={10}
   enableUserSelectHack={false}
   cancel="button, input, textarea, select, option, a, img"
   >
      <div 
        className='draggable-wrapper'
        ref={nodeRefMiniPlayer}
        >
          
          <MiniPlayer
          radioLigado={radioLigado}
          musicaAtual={musicas[indiceMusicaAtual]}
          estaTocando= {estaTocando}
          tocarOuPausar={tocarOuPausar}
          proximaMusica={proximaMusica}
          musicaAnterior={musicaAnterior}
          aoDesligarRadio = {gerenciarDesligamentoRadio}
          volumeAtual={volume}
          aoMudarVolume={setVolume}
          />

      </div>
    </Draggable>
}


 {modalAberto && 
<Draggable
  nodeRef={nodeRefTablet}
  bounds="parent"
  enableUserSelectHack={false}
  handle=".handle"
  cancel="button, input, textarea, select, option, a, .no-drag"
  defaultPosition={{
    x: window.innerWidth * 0.2,
    y: window.innerHeight * 0.09,
  }}
>
  <div
    ref={nodeRefTablet}
    style={{ display: 'inline-block', position: 'absolute', top: 0, left: 0 }}
  >
    <ModalTablet
      aoSubmeter={adicionarLembrete}
      validarLigadoDesligado={ligarTablet}
      painelLigadoPermanente={painelLigadoPermanente}
      corNeon={setLuzRadio}
      radioLigado={radioLigado}
    />
  </div>
</Draggable>
 }








 {/* {modalAberto && 
      <Draggable 
      nodeRef={nodeRefTablet}
      bounds='parent'
      enableUserSelectHack={false}
      cancel="button, input, textarea, select, option, a"
      defaultPosition={{ 
      x: window.innerWidth * 0.2,
      y: window.innerHeight * 0.09,
    }}
      >
        <div ref={nodeRefTablet} 
        style={{display: 'inline-block', position: 'absolute',        top: 0,    
        left: 0  }}
        >

              <ModalTablet
                aoSubmeter={adicionarLembrete}
                validarLigadoDesligado = {ligarTablet}
                painelLigadoPermanente={painelLigadoPermanente}
                corNeon = {setLuzRadio}
                radioLigado={radioLigado}
              />        
        </div>
      </Draggable>
 }
 */}














      <PlayerRadio 
        corLuzRadio = {luzRadio} 
        radioLigado={radioLigado} 
        setRadioLigado={setRadioLigado}
        aoClicarNoRadio = {gerenciarEstadoRadio}
        />

        

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
