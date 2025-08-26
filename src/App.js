import Banner from './componentes/Banner';
import Formulario from './componentes/Formulario';
import { useState } from 'react';
import Time from './componentes/Time'
import Footer from './componentes/Footer';
import { v4 as uuidv4 } from 'uuid';


function App() {

  const [times, setTimes] = useState([
    {  
      id:uuidv4(),
      nome:'Programacao',
      cor:'#D9F7E9'
    },
    {  
      id:uuidv4(),
      nome:'Front-End',
      cor:'#E8F8FF'
    },
    {  
      id:uuidv4(),
      nome:'Data Science',
      cor:'#F0F8E2'
    },
    {  
      id:uuidv4(),
      nome:'Devops',
      cor:'#FDE7E8'
    },
    {  
      id:uuidv4(),
      nome:'UX e Design',
      cor:'#FAE9F5'
    },
    {  
      id:uuidv4(),
      nome:'Mobile',
      cor:'#FFF5D9'
    },
    {  
      id:uuidv4(),
      nome:'Inovacao e Gestao',
      cor:'#FFEEDF'
    }
  ])


  const [colaboradores, setColaboradores] = useState([])

  const aoNovoColaboradorAdicionado = (colaborador) => {
    colaborador.id = uuidv4();
    colaborador.favorito = false;
    console.log(colaborador.favorito)
    setColaboradores([...colaboradores,colaborador])
  }

    function deletarColaborador(id) {
      setColaboradores(colaboradores.filter(colaborador => colaborador.id !== id))
      
    }

  function mudarCorDoTime (cor, id) {
    setTimes(times.map( time =>
    {
      if(time.id === id) {
          time.cor=cor;
          console.log(id)
      } 
      return time;}
      
     ))
  }    

  function cadastrarTime (novoTime){
    setTimes([...times,{...novoTime, id:uuidv4()}])
  }

function resolverFavorito(id) {
  setColaboradores(colaboradores.map(colaborador => {
    if (colaborador.id === id) {
      return { ...colaborador, favorito: !colaborador.favorito };
    }
    return colaborador;
  }));
}

  return (
    <div className="App">
      <Banner/>
      <Formulario 
      cadastrarTime= {cadastrarTime}
      times = {times.map(time => time.nome )} 
      aoColaboradorCadastrado= {colaborador => aoNovoColaboradorAdicionado(colaborador)}/>

      {times.map(time => 
        <Time  
          aoFavoritar = {resolverFavorito}
          id={time.id} 
          mudarCor = {mudarCorDoTime}
          key = {time.nome}
          nome={time.nome}
          corPrimaria = {time.cor}
          corSecundaria = {time.cor}
          colaboradores = {colaboradores.filter(colaborador=> colaborador.time === time.nome)}
          aoDeletar = {deletarColaborador}

        />)
      }
        <Footer/>
    </div>
  );
}

export default App;
