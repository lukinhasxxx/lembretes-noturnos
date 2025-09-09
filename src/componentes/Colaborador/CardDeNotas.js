import './CardDeNotas.css'


const CardDeNotas = ({lembretes}) => {


    return (
        <div className='cards'>
            <div className="card" >
                <h4>{lembretes.texto}</h4>
            </div>
        </div>
        )
} 

export default CardDeNotas