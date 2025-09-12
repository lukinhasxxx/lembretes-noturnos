import './MuralDeNotas.css'
import CardDeNotas from '../Colaborador/CardDeNotas'

const MuralDeNotas = ({lembretes, aoDeletar, aoFixar,painelLigadoPermanente}) => {
    
    return (

    painelLigadoPermanente===true && <section className='painel'> 
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
        {lembretes.length <= 0 && <text
        className='lembrete-vazio'>
                Você ainda não possui lembretes no painel, por favor, vá até o tablet e adicione.
            </text>}
            </div>
        </section>
    )
}

export default MuralDeNotas