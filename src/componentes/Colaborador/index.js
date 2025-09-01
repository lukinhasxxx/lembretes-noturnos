import { AiFillCloseCircle, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import BotaoUpload from "../BotaoUpload";
import './Colaborador.css'


const Colaborador = ({colaborador}) => {


    return (//esse componente vai ser o card da nota
        <div className='colaborador'>
            <div className="rodape" >
                <h4>{colaborador.texto}</h4>
            </div>
        </div>
        )
}

export default Colaborador