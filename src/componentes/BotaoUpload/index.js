import { useState } from "react"

const BotaoUpload = ({previa, lidarComMudancas}) => {
    

    return (
        <div>
            <input type="file" accept="image/*" onChange={lidarComMudancas}/>
            {previa && <img src={previa} alt = "aqui ta a previa da imagem"  width="100"/> }
            <div style={{color:'green',cursor:'pointer'}} >CLICA E VE SE A IMAGEM EH AP REVIA MESMO</div>
            
        </div>
    )

}

export default BotaoUpload;