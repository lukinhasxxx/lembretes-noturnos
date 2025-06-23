import './time.css'

const Time = (props) => {
    const primaryColor = {borderColor: props.corPrimaria}
    
    return (
       
        <section className='time' style={{ backgroundColor: props.corSecundaria}}>

            <h3 style={primaryColor} >{props.nome}</h3>
        </section>

    )

}

export default Time