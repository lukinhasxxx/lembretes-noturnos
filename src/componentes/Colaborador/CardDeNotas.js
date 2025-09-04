import './CardDeNotas.css'


const CardDeNotas = ({lembretes}) => {


    return (
        <div className='cards'>aqui na teoria eh a ``zona`` onde cada card fica, tipo a ``linha`` que o card ta dentro
            <div className="card" > na teoria aqui o ``card`` eh o card puro, cada bloco
                <h4>{lembretes.texto}</h4>
            </div>
        </div>
        )
} 

export default CardDeNotas