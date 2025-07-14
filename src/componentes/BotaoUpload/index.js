import { useState } from "react"

const BotaoUpload = () => {
    
        const [previa, setPrevia] = useState(null)

        const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]
        
        if (arquivo) {
            setPrevia (URL.createObjectURL(arquivo));
            }
        }
    


    return (
        <div>
            <input type="file" accept="imagem/*" onChange={lidarComMudancas}/>
            {previa && <img src={previa} alt = "aqui ta a previa da imagem"  width="100"/>}

        </div>
    )

}

export default BotaoUpload;