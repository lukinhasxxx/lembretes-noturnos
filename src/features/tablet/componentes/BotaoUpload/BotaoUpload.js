import "./BotaoUpload.css"
import { useIdioma } from "../../../../shared/i18n/Idioma"

const BotaoUpload = ({previa, lidarComMudancas, aoVoltarParaPadrao}) => {
    const { t } = useIdioma()

    return (
        <div className="wrapper-upload">
            <label className="upload">
                <img className="imagem-upload"
                    alt="imagem do upload"
                    src={process.env.PUBLIC_URL+ "/imagens/windows/novoBotaoUpload.png" }
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

            {/* volta para o wallpaper padrão; só aparece quando há um wallpaper trocado */}
            {previa && (
                <button className="botao-wallpaper-padrao" onClick={aoVoltarParaPadrao}>
                    ↺ {t('config.wallpaperPadrao')}
                </button>
            )}

        </div>
    )

}

export default BotaoUpload;
