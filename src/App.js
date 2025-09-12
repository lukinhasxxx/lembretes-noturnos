import ModalTablet from './componentes/ModalTablet/ModalTablet';
import { useState } from 'react';
import MuralDeNotas from './componentes/Time/MuralDeNotas'
import { v4 as uuidv4 } from 'uuid';

function App() {

const [lembretes, setLembretes] = useState([])
const [painelLigadoPermanente,setPainelLigadoPermanente] = useState(false)


const adicionarLembrete = (textoDaNota) => {

  const novoLembrete = {
    id: uuidv4(),
    texto: textoDaNota,
    fixar: false
  };

  const novaLista = [...lembretes, novoLembrete];

  setLembretes(novaLista);
  setPainelLigadoPermanente(true)
    
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
      setLembretes(lembretes.filter(lembrete => lembrete.id !== id))
    }

const [ligarTablet,setLigarTablet] = useState(false)

const [modalAberto,setModalAberto] = useState(false)

const gerenciarTablet = () => {

setModalAberto(ligado=> !ligado);
setLigarTablet(ligado =>!ligado);
}

  return (
    
    <div className="App">
          {modalAberto && 
        <ModalTablet
          aoSubmeter={adicionarLembrete}
          validarLigadoDesligado = {ligarTablet}
        />
       }

        <div className='zona-interacao-tablet' 
        onClick={gerenciarTablet}>{ligarTablet}
          <img 
          className='tablet-img'
          src='/imagens/tabletPNG.png'
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
      />
      
    </div>
  );
}

export default App;
