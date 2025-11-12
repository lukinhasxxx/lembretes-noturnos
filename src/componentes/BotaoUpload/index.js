import "./botaoUpload.css"

const BotaoUpload = ({previa, lidarComMudancas}) => {
    

    return (
        <div className="wrapper-upload">
            <label className="upload">
                <img className="imagem-upload" 
                    alt="imagem do upload" 
                    src={process.env.PUBLIC_URL+ "/imagens/windows/botaoUpload.png" }
                />

                <input type="file"
                    className="botao-upload"
                    accept="image/*"
                    onChange={lidarComMudancas}
                />
            </label>

            {
                previa && <img 
                className="previa-wallpaper" 
                src={previa} 
                alt = "aqui ta a previa da imagem" 
                width="100"
                />
             }
            
        </div>
    )

}

export default BotaoUpload;