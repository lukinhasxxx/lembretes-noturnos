import { AiFillCloseCircle, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import BotaoUpload from "../BotaoUpload";
import './Colaborador.css'


const Colaborador = ({nome,imagem,cargo, corDeFundo, aoDeletar, id, colaborador, aoFavoritar}) => {
    function favoritar () {
        aoFavoritar(colaborador.id)
    }

    const propsFavorito = {
        size: 25,
        onClick: favoritar
    }

    return (
        <div className='colaborador'>
            <AiFillCloseCircle size={20} className='deletar' onClick={() =>aoDeletar(id)}/>
            <div className='cabecalho' style={{backgroundColor: corDeFundo}}>
                <img src = {imagem} alt = {nome} />
            </div>
            <div className='rodape'>
                <h4>{nome}</h4>
                <h5> {cargo}</h5>
                <div className="favoritar">
                    {colaborador.favorito 
                    ? <AiFillHeart className="coracao1" {...propsFavorito} color = '#ff0000' /> 
                    : <AiOutlineHeart className="coracao2" {...propsFavorito} />
                    
                    }
                </div>
            </div>
        </div>
        )
}

export default Colaborador