import Formulario from './componentes/ModalTablet/ModalTablet';
import { useState } from 'react';
import Time from './componentes/Time/MuralDeNotas'
import { v4 as uuidv4 } from 'uuid';

 
function App() {

  const [colaboradores, setColaboradores] = useState([])

  const adicionarLembrete = (textoDaNota) => {
    const novoLembrete = {
      id:uuidv4(),
      texto:textoDaNota,
      favorito:false
    };

   setColaboradores([...colaboradores,novoLembrete])

  }
    function deletarColaborador(id) {
      setColaboradores(colaboradores.filter(colaborador => colaborador.id !== id))
    }

function resolverFavorito(id) {
  setColaboradores(colaboradores.map(colaborador => {
    if (colaborador.id === id) {
      return { ...colaborador, favorito: !colaborador.favorito
      };
    }
    return colaborador;
  }));

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
        <Formulario
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
      <Time
        colaboradores={colaboradores} 
        aoDeletar={deletarColaborador}
        aoFavoritar={resolverFavorito}

      />

    </div>
  );
}

export default App;
