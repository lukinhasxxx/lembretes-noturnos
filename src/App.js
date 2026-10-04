//aqui eh pra eu importar o provider, sem o contexto
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ModalTablet, TabletMesa } from './features/tablet';
import { MuralDeNotas, VisibilidadePainelProvider } from './features/mural';
import { PlayerRadio, MiniPlayer } from './features/radio';
import { Palco, Ancora } from './features/cena';
import { JanelaArrastavel, MINI_PLAYER, MODAL_TABLET } from './features/hud';


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
const [ligarPainelRadio, setLigarPainelRadio] = useState(false)
const [ligarTabletPrimeiraVez, setLigarTabletPrimeiraVez] = useState(false)





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
}},[volume] )


const painelRadio = () => {

if (estaTocando) {
   setLigarPainelRadio(true)
} else {
  setLigarPainelRadio(false)
}

return ligarPainelRadio
}



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
setLigarTabletPrimeiraVez(true)
console.log("foi ligado a primeira vez?",ligarTabletPrimeiraVez)
}

  return (
    <VisibilidadePainelProvider>
    
    <div className="App">

    <Palco
      videoSrc={process.env.PUBLIC_URL + '/videos/video-background.mp4'}
      posterSrc={process.env.PUBLIC_URL + '/imagens/poster-cena.jpg'}
    >
      <Ancora ponto='radio'>
        <PlayerRadio
          corLuzRadio = {luzRadio}
          radioLigado={radioLigado}
          setRadioLigado={setRadioLigado}
          aoClicarNoRadio = {gerenciarEstadoRadio}
          painelRadio = {painelRadio}
          />
      </Ancora>

      <Ancora ponto='tablet'>
        <TabletMesa ligado={ligarTablet} aoClicar={gerenciarTablet} />
      </Ancora>

      <Ancora ponto='mural'>
        <MuralDeNotas
          lembretes={lembretes}
          aoDeletar={deletarLembrete}
          aoFixar={fixarLembrete}
          painelLigadoPermanente={painelLigadoPermanente}
          animacaoDeveRodar={animacaoJaAtivada}
          conteudoVisivelPainel={primeiraMensagemPainel}
        />
      </Ancora>
    </Palco>
    <audio
    ref={audioRef}
    // não baixa nada de áudio ao abrir o site; a faixa só carrega quando o rádio der play
    preload='none'
    src= {process.env.PUBLIC_URL +musicas[indiceMusicaAtual].src}
    onEnded={proximaMusica}
    />



{radioLigado === true &&
   <JanelaArrastavel
   largura={MINI_PLAYER.largura}
   altura={MINI_PLAYER.altura}
   posicaoInicial={({ larguraTela, alturaTela }) => ({ x: larguraTela * 0.09, y: alturaTela * 0.57 })}
   cancel="button, input, textarea, select, option, a, img"
   zIndex={1}
   >
      <div className='draggable-wrapper'>
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
    </JanelaArrastavel>
}


 {ligarTabletPrimeiraVez &&
<JanelaArrastavel
  largura={MODAL_TABLET.largura}
  altura={MODAL_TABLET.altura}
  posicaoInicial={({ larguraTela, alturaTela }) => ({ x: larguraTela * 0.2, y: alturaTela * 0.09 })}
  visivel={modalAberto}
  handle=".handle"
  cancel="button, input, textarea, select, option, a, .no-drag"
>
    <ModalTablet
      aoSubmeter={adicionarLembrete}
      validarLigadoDesligado={ligarTablet}
      painelLigadoPermanente={painelLigadoPermanente}
      corNeon={setLuzRadio}
      radioLigado={radioLigado}
    />
</JanelaArrastavel>
 }








      
     
    </div>
  </VisibilidadePainelProvider>

  );
}

export default App;
