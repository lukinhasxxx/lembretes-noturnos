import './PlayerRadio.css'

const PlayerRadio = ({corLuzRadio, radioLigado, aoClicarNoRadio, painelRadio}) => {




    return (
        <div className='zona-radio' >
          <div className='zona-interacao-radio' onClick={aoClicarNoRadio}>
            <img 
                className='imagem-radio' 
                alt='imagem de um radio' 
                src = { process.env.PUBLIC_URL + '/imagens/playerRadio.png'} 
                style={{filter: radioLigado? `drop-shadow(-18px 38px 37px ${corLuzRadio})`: "none"}}
            />
            <div 
            className='painel-shadow'
            style={{filter: painelRadio()? ` opacity(1)`: "opacity(0)"}}
            >

            </div>

            
            <div 
                className='painel-radio'
                style={{filter: painelRadio()? ` opacity(0.9)`: "opacity(0)"}}
            ></div>
        </div>
    </div>
    )
}

export default PlayerRadio