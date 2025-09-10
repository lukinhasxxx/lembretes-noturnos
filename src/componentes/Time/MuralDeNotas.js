import './MuralDeNotas.css'
import CardDeNotas from '../Colaborador/CardDeNotas'

const MuralDeNotas = ({lembretes, aoDeletar, aoFixar}) => {
    
    return (

       (lembretes.length > 0) && <section className='painel'> 
       <p>Lembretes Noturnos</p>

            <div className='zona-dos-cards'>
            {lembretes.map(lembrete => {
                    return <CardDeNotas
                      lembretes = {lembrete}
                      key = {lembrete.id}
                      aoDeletar = {aoDeletar}  
                      aoFixar={aoFixar}
                    />
                })
            }
            </div>
        </section>
    )
}

export default MuralDeNotas