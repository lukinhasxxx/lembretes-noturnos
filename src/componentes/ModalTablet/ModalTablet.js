import './ModalTablet.css'
import Botao from '../Botao'
import { useState } from 'react'
import Relogio from '../Relogio/Relogio'

const ModalTablet = ({aoSubmeter, validarLigadoDesligado}) => {
    const [nome, setNome] = useState('')
    const [telaAtiva, setTelaAtiva] = useState('desktop')

    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
}
    return (
    <div>
            <div className='tablet-tela'  > 
            <div className='area-de-trabalho' style={{backgroundImage:"url('/imagens/windows/windowsWallpaper.jpg')",backgroundRepeat:"no-repeat"}}  >

                {telaAtiva === 'desktop' && (<div className='icone-lembretes'
                   onClick={() => setTelaAtiva('lembretes') }>
                    <img src='/imagens/windows/iconeLembretes.png'
                    alt='abrir lembretes' />
                    <span>Lembretes.exe</span>
                </div>)}

                {telaAtiva === 'desktop' && (<div className='icone-led'
                   onClick={() => setTelaAtiva('icone-led') }>
                    <img src='/imagens/windows/ledIcone.png'
                    alt='abrir lembretes' />
                    <span>Config.exe</span>
                </div>)}

                {telaAtiva ==='icone-led' && (<div className='janela-configuracao-led' >

                        <span>Aqui vai ficar a configuracao teste</span>
                    </div>
                )}

                { telaAtiva === 'lembretes' && (

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