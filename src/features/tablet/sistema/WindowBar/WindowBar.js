import "./WindowBar.css"

// Barra de cima das janelas dos apps: abas (children) à esquerda, minimizar e fechar à direita.
// minimizarApp(id): o app continua aberto na barra de tarefas; fecharApp(id): fecha o app
// escura: visual escuro (teste do tema noturno, por enquanto só no Config)
const WindowBar = ({ children, fecharApp, minimizarApp, idDoAppPraFechar, escura = false }) => {
    const sufixoIcone = escura ? 'Escuro' : ''

    return (
        <div className={`window-bar ${escura ? 'window-bar-escura' : ''}`} >

            {children}
            <div className='window-bar-botoes'>
                {minimizarApp && (
                    <img src={process.env.PUBLIC_URL + `/imagens/windows/iconeMinimizar${sufixoIcone}.png`} alt="Icone de minimizar"
                        onClick={() => minimizarApp(idDoAppPraFechar)} />
                )}
                <img src={process.env.PUBLIC_URL + `/imagens/windows/iconeFechar${sufixoIcone}.png`} alt="Icone de fechar"
                    onClick={() => fecharApp(idDoAppPraFechar)} />
            </div>
        </div>
    )
}

export default WindowBar
