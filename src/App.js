
import Banner from './componentes/Banner';
import Formulario from './componentes/Formulario';
import { useState } from 'react';
import Time from './componentes/Time'
import Footer from './componentes/Footer';



function App() {

  const [times, setTimes] = useState([
    {  
      nome:'Programacao',
      
      cor:'#D9F7E9'
    },
    {  
      nome:'Front-End',
      
      cor:'#E8F8FF'
    },
    {  
      nome:'Data Science',
      
      cor:'#F0F8E2'
    },
    {  
      nome:'Devops',
      
      cor:'#FDE7E8'
    },
    {  
      nome:'UX e Design',
      
      cor:'#FAE9F5'
    },
    {  
      nome:'Mobile',
      
      cor:'#FFF5D9'
    },
    {  
      nome:'Inovacao e Gestao',
      
      cor:'#FFEEDF'
    }
  ])

  const [colaboradores, setColadoradores] = useState([])

  const aoNovoColaboradorAdicionado = (colaborador) => {
    setColadoradores([...colaboradores,colaborador])
  }

    function deletarColaborador() {
    console.log("deletando colaborador")
    }

  function mudarCorDoTime (cor, nome) {
    setTimes(times.map( time =>
    {
      if(time.nome === nome) {
          return { ...time, cor: cor }
      } 
      return time;}
      
     ))
  }    


  return (
    <div className="App">
      <Banner/>
      <Formulario times = {times.map(time => time.nome )} aoColaboradorCadastrado= {colaborador => aoNovoColaboradorAdicionado(colaborador)}/>

      {times.map(time => 
        <Time  
          mudarCor = {mudarCorDoTime}
          key = {time.nome}
          nome={time.nome}
          corPrimaria = {time.cor}
          corSecundaria = {time.cor}
          colaboradores = {colaboradores.filter(colaborador=> colaborador.time 
          === time.nome)}
          aoDeletar = {deletarColaborador}

        />)
      }
        <Footer/>
    </div>
  );
}

export default App;
