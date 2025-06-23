import './Colaborador.css'

const Colaborador = (props) => {
    return (
        <div className='colaborador'>
            <div className='cabecalho'>
                <img src = 'https://github.com/lukinhasxxx.png' alt = 'nome alternativo'/>
            </div>
            <div className='rodape'>
                <h4>{props.nome}</h4>
                <h5> o brabo</h5>
            </div>
        </div>
    )
}

export default Colaborador