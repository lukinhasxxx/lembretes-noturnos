import './ModalTablet.css'
import Botao from '../Botao'
import { useState } from 'react'
import Relogio from '../Relogio/Relogio'

const ModalTablet = ({aoSubmeter, validarLigadoDesligado}) => {
    const [nome, setNome] = useState('')
    const [telaAtiva, setTelaAtiva] = useState('desktop')
    const [appsAbertos,setAppsAbertos] = useState([])

    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
};

    const abrirApp = (nomeDoApp) => {
        setTelaAtiva(nomeDoApp);
        if (!appsAbertos.includes(nomeDoApp)){
            setAppsAbertos([...appsAbertos,nomeDoApp])
        }
    }

    return (
    <div>
            <div className='tablet-tela'  > 
            <div className='area-de-trabalho' style={{backgroundImage:"url('/imagens/windows/windowsWallpaper.jpg')",backgroundRepeat:"no-repeat"}}  >
                {/* icone */}
                {telaAtiva === 'desktop' && (<div className='icone-lembretes'
                   onClick={() => abrirApp('lembretes.exe') }>
                    <img src='/imagens/windows/lembretesIcone.png'
                    alt='abrir lembretes' />
                    <span>Lembretes.exe</span>
                </div>)}
                {/* icone */}
                {telaAtiva === 'desktop' && (<div className='icone-led'
                   onClick={() => abrirApp('config.exe') }>
                    <img src='/imagens/windows/ledIcone.png'
                    alt='abrir lembretes' />
                    <span>Config.exe</span>
                </div>)}
                {/* app de fato */}
                {telaAtiva ==='config.exe' && (<div className='janela-configuracao-led' >
                        <img src="/imagens/windows/iconeFechar.png" alt="Icone de fechar" />
                        <span>Aqui vai ficar a configuracao teste</span>
                    </div>
                )}
                {/* APP de fato */}
                { telaAtiva === 'lembretes.exe' && (

                <div className='janela-lembretes' >
                    <img src="/imagens/windows/iconeFechar.png" alt="Icone de fechar" />
                    <form onSubmit={aoSalvar}>
                    <h2>Deixe seu lembrete para ser incluído no painel.</h2>
                    <textarea
                        required={true}
                        placeholder='Digite sua mensagem'
                        value= {nome}
                        onChange={evento => setNome(evento.target.value)}
                        name='mensagem'
                        >
                    </textarea>
                
                    <Botao>Enviar lembrete</Botao>
                </form>
            </div>
                )}
            </div>

    <div className="barra-de-tarefas">
    
        <div className='menu-iniciar' >
            <img src="/imagens/windows/menuIniciar.png" alt="Menu iniciar" />
        </div>

        <div className="seta-voltar" onClick={() => setTelaAtiva('desktop')}>
          <img src="/imagens/windows/setaVoltar.png" alt="Voltar para o Desktop" />
        </div>

    <div className='icones-apps-abertos' >
    {
        appsAbertos.map(app =>(
            <div key={app} className='icone-na-barra' onClick={() => setTelaAtiva(app)} >
                {app === 'lembretes.exe' && <img src= '/imagens/windows/lembretesIcone.png' alt='abrir lembretes' /> }
                {app === 'config.exe' && <img src='/imagens/windows/ledIcone.png' alt='abrir config' /> }

            </div>
         )
        )
    }
    </div>

       <div className='icone-bateria' >
            <img src="/imagens/windows/bateriaIcone.png" alt="Bateria carregando" />
        </div> 
    
       <div className='icone-wifi' >
            <img src="/imagens/windows/wifiIcone.png" alt="\Icone wifi" />
        </div> 

        <div className='icone-som' >
            <img src="/imagens/windows/semSomIcone.png" alt="Icone sem som" />
        </div> 

        <div className='idioma'>
            <span>POR</span>
            <br></br>
            <span>PTB2</span>
        </div>

        <Relogio/>

        <div className='icone-notificacoes' >
        <img src="/imagens/windows/iconeNotificacoes.png" alt="Icone de notificacoes" />
        </div> 

    </div>

        </div>
            <section className='secao-tablet-modal'>
                <img className='tablet-modal' src='/imagens/tabletModal.png'
                style={{display: validarLigadoDesligado ? "" : " none" }}
                alt='Modal do tablet'
            />
            </section>

    </div>
    )
}

export default ModalTablet