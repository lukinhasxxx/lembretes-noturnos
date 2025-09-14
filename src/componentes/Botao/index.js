import "./botao.css"

const Botao = ({children, className}) => {
    return (
        <button className={`botao ${className || ''}`}>
            {children}
        </button>
    )
}

export default Botao