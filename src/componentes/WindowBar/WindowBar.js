// VER JEITO LEGAL DE ENCAIXAR IMAGEM NO DESKTOP E OPCAO DE FAZER UPLOAD DA IMAGEM NO FUTURO
import "./WindowBar.css"

const WindowBar = ({ children, fecharApp,idDoAppPraFechar}) => {
    return (
        <div className='window-bar' >
            
            {children}
                <img src={ process.env.PUBLIC_URL+ "/imagens/windows/iconeFechar.png"} alt="Icone de fechar"
                 onClick={() => fecharApp(idDoAppPraFechar)} />
        </div>
    )
}

export default WindowBar