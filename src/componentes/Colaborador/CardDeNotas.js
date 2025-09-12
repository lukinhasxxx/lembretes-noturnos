import { useState } from 'react'
import './CardDeNotas.css'


const CardDeNotas = ({lembretes, aoFixar, aoDeletar}) => {

const [fixarLembrete, setFixarLembrete] = useState(false)

const validarFixado = () => {
    setFixarLembrete(fixarLembrete => !fixarLembrete)
    aoFixar(lembretes.id)

}

const deletarItem = () => {
aoDeletar(lembretes.id)
}

    return ( //lembra que a borda baixo ta FIXA ela NAO ta mexendo com a rolagem, PROAVELMENTE pelo after e before, importante
        <div className='cards'>
            <div className="card" >
            <img className='lixeira'
                 src='/imagens/windows/lixeira.svg'
                  alt='lixeira'
                  onClick={() => deletarItem()}
                   />

            {
                fixarLembrete === false && (
                <img className='pinOff'
                 src='/imagens/windows/pinOff.png'
                  alt='pin fixar'
                  onClick={() => validarFixado()}
                   />
                )
            }
                <h4>{lembretes.texto}</h4>
            {
                fixarLembrete === true && (
                <img className='pinOn'
                 src='/imagens/windows/pinOn.png'
                 alt='pin desfixar'
                 onClick={() => validarFixado()}
                   />
                )
            }
            </div>
        </div>
        )
} 

export default CardDeNotas