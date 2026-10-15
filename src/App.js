import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ModalTablet, TabletMesa, useSistemaTablet } from './features/tablet';
import { MuralDeNotas, VisibilidadePainelProvider } from './features/mural';
import { PlayerRadio, MiniPlayer } from './features/radio';
import { Palco, Ancora } from './features/cena';
import { JanelaArrastavel, MINI_PLAYER, MODAL_TABLET } from './features/hud';
import { ModoCelular } from './features/celular';
import { useEstadoPersistido } from './shared/hooks/useEstadoPersistido';
import { useDispositivo } from './shared/hooks/useDispositivo';
import { vibrar } from './shared/utils/vibrar';

// momento em que a borda neon definitiva do mural acende (neonGlow começa com 6s de atraso em .painel-surgindo,
// no MuralDeNotas.css). As notas só aparecem aqui, no fim da animação de ligar.
const MOMENTO_BORDA_FINAL_MURAL_MS = 6000

// duração do glitch das notas sumindo ao limpar o mural (igual à animação notas-apagando no MuralDeNotas.css)
const DURACAO_APAGANDO_NOTAS_MS = 450


function App() {

const [lembretes, setLembretes] = useEstadoPersistido('lembretes', [])
const [painelLigadoPermanente,setPainelLigadoPermanente] = useState(false)
const [animacaoJaAtivada,setAnimacaoJaAtivada] = useState(false)
const [primeiraMensagemPainel,setPrimeiraMensagemPainel] = useState(false)
const [radioLigado, setRadioLigado] = useState(false)
const [foiDesligadoComBotao, setfoiDesligadoComBotao] = useState(true)
const [foiPausadoManualmente, setFoiPausadoManualmente] = useState(false);
const [luzRadio, setLuzRadio] = useEstadoPersistido('luz-radio', '#00D7FF')
const [volume, setVolume] = useEstadoPersistido('volume', 1)
const [ligarTabletPrimeiraVez, setLigarTabletPrimeiraVez] = useState(false)
// enquanto o mural faz a animação de ligar, as notas (inclusive as salvas) ficam escondidas;
// todas aparecem juntas na piscada final, no mesmo momento em que a nota nova entra
const [notasVisiveisNoMural, setNotasVisiveisNoMural] = useState(true)
// glitch das notas sumindo no mural enquanto o "limpar tudo" acontece
const [apagandoNotas, setApagandoNotas] = useState(false)






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
    vibrar()
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

// Liga o mural pela primeira vez (com a animação de inicialização) e fecha o tablet para a pessoa ver.
// Usado ao mandar o primeiro lembrete e pelo botão "Mostrar painel" quando já existem lembretes salvos.
const ligarMuralComAnimacao = () => {
    focarNoPainel()
    setPainelLigadoPermanente(true)
    setAnimacaoJaAtivada(true);
    setModalAberto(false);
    setLigarTablet(false);
    setNotasVisiveisNoMural(false);

    // revela as notas e libera a mensagem de "sem lembretes" juntas, para ela não piscar antes
    setTimeout(()=> {
        setNotasVisiveisNoMural(true);
        setPrimeiraMensagemPainel(true);
        } ,MOMENTO_BORDA_FINAL_MURAL_MS)
}

const adicionarLembrete = (textoDaNota) => {

  const novoLembrete = {
    id: uuidv4(),
    texto: textoDaNota,
    fixar: false
  };

setTimeout(()=> {

if(!painelLigadoPermanente){
    ligarMuralComAnimacao()

    setTimeout(()=> {
        setLembretes(lembretesAnteriores => [...lembretesAnteriores, novoLembrete])
        } ,5000)
      } else {
          focarNoPainel()
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


// painel do rádio aceso enquanto a música toca
const painelRadio = () => estaTocando



function fixarLembrete(id) {
  vibrar()
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
      vibrar()
      setTimeout(()=>{
        setLembretes(lembretes.filter(lembrete => lembrete.id !== id))}
        ,200)
    }

// "Limpar" (aba holográfica na lateral do mural): se o mural está mostrando notas, elas dão um glitch e somem antes de apagar
const limparTodosLembretes = () => {
  if (!painelLigadoPermanente || !notasVisiveisNoMural) {
    setLembretes([])
    return
  }

  setApagandoNotas(true)
  setTimeout(() => {
    setLembretes([])
    setApagandoNotas(false)
  }, DURACAO_APAGANDO_NOTAS_MS)
}
    

const [ligarTablet,setLigarTablet] = useState(false)
const [modalAberto,setModalAberto] = useState(false)
// sistema do tablet (vem do SistemaTabletProvider, no index.js): desligado até o primeiro clique;
// aí roda boot → boas-vindas → área de trabalho. O resto (bloquear, desligar...) o modal pega direto do contexto.
const { sistemaDesligado, ligarSistema, tema } = useSistemaTablet()
// celular (toque, sem mouse) e se está em pé: o celular ganha tamanhos e posições próprios
const { celular, emPe } = useDispositivo()
// celular em pé: pedido para a cena deslizar até uma parada (ex.: o painel ao mandar um lembrete)
const [focoCena, setFocoCena] = useState(null)
const focarNoPainel = () => setFocoCena({ parada: 'mural', vez: Date.now() })

// "Desligar" no menu iniciar terminou: fecha o modal e apaga a tela do tablet da mesa.
// O próximo clique no tablet da mesa liga de novo (boot completo).
useEffect(() => {
  if (!sistemaDesligado) return

  setModalAberto(false)
  setLigarTablet(false)
}, [sistemaDesligado])

const gerenciarTablet = () => {

ligarSistema() // só faz algo se o tablet estiver desligado
setModalAberto(ligado=> !ligado);
setLigarTablet(ligado =>!ligado);
setLigarTabletPrimeiraVez(true)
}

  return (
    <VisibilidadePainelProvider>
    
    {/* data-celular / data-orientacao: o CSS ajusta tamanhos só no celular (ver Ancora.css) */}
    <div className="App" data-celular={celular || undefined} data-orientacao={emPe ? 'em-pe' : 'deitado'}>

    <Palco
      // celular: versão menor do vídeo (o Full HD nem chega a ser baixado)
      videoSrc={process.env.PUBLIC_URL + (celular ? '/videos/video-background-hd-mobile.mp4' : '/videos/video-background.mp4')}
      posterSrc={process.env.PUBLIC_URL + '/imagens/poster-cena.jpg'}
      // celular em pé: a cena fica mais larga que a tela e dá para arrastar para os lados
      arrastavel={celular && emPe}
      foco={focoCena}
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
          lembretes={notasVisiveisNoMural ? lembretes : []}
          aoDeletar={deletarLembrete}
          apagandoNotas={apagandoNotas}
          aoLimparTudo={limparTodosLembretes}
          aoFixar={fixarLembrete}
          painelLigadoPermanente={painelLigadoPermanente}
          animacaoDeveRodar={animacaoJaAtivada}
          conteudoVisivelPainel={primeiraMensagemPainel}
          tema={tema}
        />
      </Ancora>
    </Palco>
    {/* celular: card oferecendo tela cheia deitado, e o X para voltar */}
    {celular && <ModoCelular />}

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
   // celular: embaixo e centralizado, no alcance do dedo; PC: no lugar de sempre
   posicaoInicial={({ larguraTela, alturaTela, larguraJanela, alturaJanela }) => (celular
     ? { x: (larguraTela - larguraJanela) / 2, y: alturaTela - alturaJanela - 16 }
     : { x: larguraTela * 0.09, y: alturaTela * 0.57 })}
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
  // celular: centralizado (ele ocupa quase a tela toda); PC: no lugar de sempre
  posicaoInicial={({ larguraTela, alturaTela, larguraJanela, alturaJanela }) => (celular
    ? { x: (larguraTela - larguraJanela) / 2, y: (alturaTela - alturaJanela) / 2 }
    : { x: larguraTela * 0.2, y: alturaTela * 0.09 })}
  visivel={modalAberto}
  // celular: com o teclado aberto o tablet encolhe e sobe, para a caixa de texto não ficar atrás dele
  // (só deitado: em pé encolher deixava o tablet pequeno demais)
  subirComTeclado={!emPe}
  handle=".handle"
  cancel="button, input, textarea, select, option, a, .no-drag"
>
    <ModalTablet
      aoSubmeter={adicionarLembrete}
      validarLigadoDesligado={ligarTablet}
      painelLigadoPermanente={painelLigadoPermanente}
      haLembretesSalvos={lembretes.length > 0}
      aoLigarMural={ligarMuralComAnimacao}
      aoMostrarPainel={focarNoPainel}
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
