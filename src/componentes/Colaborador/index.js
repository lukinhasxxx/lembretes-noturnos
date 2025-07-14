import { useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";

import './Colaborador.css'



const Colaborador = ({nome,imagem,cargo, corDeFundo, aoDeletar}) => {

    // function subirImagem () {

    //     const [previa, setPrevia] = useState(null)

    //     const lidarComMudancas = (evento) => {
    //     const arquivo = evento.target.files[0]
        
    //     if (arquivo) {
    //         setPrevia (URL.createObjectURL(file));
    //         }
    //     }
    // }



    return (
        <div className='colaborador'>
            <AiFillCloseCircle size={20} className='deletar' onClick={aoDeletar}/>

            <div className='cabecalho' style={{backgroundColor: corDeFundo}}>
                <img src = {imagem} alt = {nome}/>
            </div>
            <div className='rodape'>
                <h4>{nome}</h4>
                <h5> {cargo}</h5>
            </div>
        </div>
    )
}

export default Colaborador