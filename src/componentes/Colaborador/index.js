import './Colaborador.css'

const Colaborador = (props) => {




return (
    <section>
        <form>
            <label>a</label>
            <input placeholder='poe a senha'></input>
            <button onClick={(evento) => {evento.preventDefault(); console.log("clicadasso")}}>s</button>
        </form>
    </section>
    
    )
}

export default Colaborador

