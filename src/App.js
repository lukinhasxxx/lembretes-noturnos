import Formulario from './componentes/Formulario';
import { useState } from 'react';
import Time from './componentes/Time'
import Footer from './componentes/Footer';
import { v4 as uuidv4 } from 'uuid';

// comentando funcoes que serao usadas la na frente
 
function App() {



  const [colaboradores, setColaboradores] = useState([])

  const adicionarLembrete = (textoDaNota) => {
    const novoLembrete = {
      id:uuidv4(),
      texto:textoDaNota,
      favorito:false
    };

  
   setColaboradores([...colaboradores,novoLembrete])
  // setModalAberto(ligado=> !ligado);
  // setLigarTablet(ligado =>!ligado);
  }


    function deletarColaborador(id) {
      setColaboradores(colaboradores.filter(colaborador => colaborador.id !== id))
      
    }




function resolverFavorito(id) {
  setColaboradores(colaboradores.map(colaborador => {
    if (colaborador.id === id) {
      return { ...colaborador, favorito: !colaborador.favorito };
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
        />
       }
        <div className='zona-interacao-tablet' onClick={gerenciarTablet}>{ligarTablet}
          <img src='/imagens/tabletPNG.png' alt='tablet' style ={{filter: ligarTablet ?  "drop-shadow(1px 1px 3px #00D7FF)" : "none"}}
          onClick={gerenciarTablet}/>
      </div>


    </div>
  );
}

export default App;
