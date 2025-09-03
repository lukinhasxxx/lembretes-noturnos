import hexToRgba from 'hex-to-rgba';
import './time.css'
import Colaborador from '../Colaborador'

const Time = (props) => {

    
    return (
    //esse componente vai ser o painel com as notas dentro, parte externa
       (props.colaboradores.length > 0) && <section className='painel'> painel aqui

            <div className='colaboradores'>
            {props.colaboradores.map(colaborador => {
                    return <Colaborador
                      colaborador = {colaborador}
                      key = {colaborador.nome} 
                      aoDeletar = {props.aoDeletar}  
                      aoFavoritar={props.aoFavoritar}
                    />
                })
            }

            </div>
        </section>

    )

}

export default Time