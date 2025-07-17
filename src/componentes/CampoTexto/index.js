
import './CampoTexto.css'

const CampoTexto = ({valor, obrigatorio, placeholder,label, aoAlterado, type = 'text'}) => {


    const aoDigitado = (evento) => {
    aoAlterado(evento.target.value)
    }

    return (
        <div className={`campo-texto campo-texto-${type}`}>
            <label>{label}</label>
            <input type = {type}
            value = {valor} 
            onChange={aoDigitado}
            required = {obrigatorio}
            placeholder={placeholder}/>
        </div>
       
    );
}

export default CampoTexto;