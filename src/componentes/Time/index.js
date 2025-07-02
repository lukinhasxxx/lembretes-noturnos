import hexToRgba from 'hex-to-rgba';

import './time.css'
import Colaborador from '../Colaborador'

const Time = (props) => {
    const primaryColor = {borderColor: props.corPrimaria}
    
    return (
    //pra corrigir
       (props.colaboradores.length > 0) ? <section className='time' style={{ backgroundColor: hexToRgba(props.corSecundaria,'0.5')}}>

            <h3 style={primaryColor} >{props.nome}</h3>
            <div className='colaboradores'>
            <input type='color' value = {props.corPrimaria} className='input-cor' onChange={ evento => props.mudarCor(evento.target.value, props.nome  )} ></input>

                {props.colaboradores.map( colaborador => {
                    return <Colaborador corDeFundo= {props.corPrimaria}
                      key = {colaborador.nome} nome = {colaborador.nome} 
                      cargo = {colaborador.cargo} 
                      imagem = {colaborador.imagem} 
                      aoDeletar = {props.aoDeletar}  />} )}
            </div>
        </section> : ''

    )

}

export default Time