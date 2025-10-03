import { useState } from 'react'
import './PlayerRadio.css'

const PlayerRadio = () => {

    const [radioLigado, setRadioLigado] = useState(false)
    const [cor, setCor] = useState('#ff0000ff')
    const controlarRadio = () => {
        setRadioLigado( ligado => !ligado )
     }


    return (
    <div className='zona-radio' >
        <div className='zona-interacao-radio' onClick={()=>controlarRadio()}>
        <input 
            className='color-pick' 
            type='color' 
            value={cor}
            onChange={(evento)=>setCor(evento.target.value)
            }
        />

            <img 
                className='imagem-radio' 
                alt='imagem de um radio' 
                src = { process.env.PUBLIC_URL + '/imagens/playerRadio.png'} 
                style={{filter: radioLigado? `drop-shadow(3px 14px 37px ${cor})`: "none"}}
            />
        </div>
    </div>
    )
}

export default PlayerRadio