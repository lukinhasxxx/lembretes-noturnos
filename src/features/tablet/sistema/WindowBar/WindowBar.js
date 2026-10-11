import "./WindowBar.css"

// Barra de cima das janelas dos apps: abas (children) à esquerda, minimizar e fechar à direita.
// minimizarApp(id): o app continua aberto na barra de tarefas; fecharApp(id): fecha o app
const WindowBar = ({ children, fecharApp, minimizarApp, idDoAppPraFechar }) => {
    return (
        <div className='window-bar' >

            {children}
            <div className='window-bar-botoes'>
                {minimizarApp && (
                    <img src={process.env.PUBLIC_URL + "/imagens/windows/iconeMinimizar.png"} alt="Icone de minimizar"
                        onClick={() => minimizarApp(idDoAppPraFechar)} />
                )}
                <img src={process.env.PUBLIC_URL + "/imagens/windows/iconeFechar.png"} alt="Icone de fechar"
                    onClick={() => fecharApp(idDoAppPraFechar)} />
            </div>
        </div>
    )
}

export default WindowBar
