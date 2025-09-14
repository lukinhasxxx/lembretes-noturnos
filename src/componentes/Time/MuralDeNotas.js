import  VisibilidadePainel  from '../../contexts/VisibilidadePainel'
import { VisibilidadePainelContext } from '../../contexts/VisibilidadePainel'
import './MuralDeNotas.css'
import CardDeNotas from '../Colaborador/CardDeNotas'
import { useContext } from 'react'

const MuralDeNotas = ({lembretes, aoDeletar, aoFixar,painelLigadoPermanente}) => {
    const {mostrarPainel} = useContext(VisibilidadePainelContext)


    return (
    
        painelLigadoPermanente === true && <section className='painel' style={{display:mostrarPainel?'block':'none'}} > 
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