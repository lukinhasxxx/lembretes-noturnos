import './PlayerRadio.css'

const PlayerRadio = ({corLuzRadio, radioLigado, setRadioLigado}) => {

    const controlarRadio = () => {
        setRadioLigado( ligado => !ligado )
     }


    return (
        <div className='zona-radio' >
          <div className='zona-interacao-radio' onClick={()=>controlarRadio()}>
            <img 
                className='imagem-radio' 
                alt='imagem de um radio' 
                src = { process.env.PUBLIC_URL + '/imagens/playerRadio.png'} 
                style={{filter: radioLigado? `drop-shadow(3px 14px 37px ${corLuzRadio})`: "none"}}
            />
        </div>
    </div>
    )
}

export default PlayerRadio