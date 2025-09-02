import { AiFillCloseCircle, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import BotaoUpload from "../BotaoUpload";
import './Colaborador.css'


const Colaborador = ({colaborador}) => {


    return (//esse componente vai ser o card da nota
        <div className='colaborador'>aqui na teoria eh a ``zona`` onde cada card fica, tipo a ``linha`` que o card ta dentro
            <div className="rodape" > na teoria aqui o ``rodape`` eh o card puro, cada bloco
                <h4>{colaborador.texto}</h4>
            </div>
        </div>
        )
}

export default Colaborador