import { VisibilidadePainelContext } from '../../contexts/VisibilidadePainel'
import './ModalTablet.css'
import Botao from '../Botao'
import { useState,useContext } from 'react'
import Relogio from '../Relogio/Relogio'

const ModalTablet = ({aoSubmeter, validarLigadoDesligado, painelLigadoPermanente}) => {

    //perto do fim do projeto ai componetiza, modulariza as coisas
    const {alterarVisibilidadePainel, textoBotao} = useContext(VisibilidadePainelContext)   
    const [nome, setNome] = useState('')
    const [telaAtiva, setTelaAtiva] = useState('desktop')
    const [appsAbertos,setAppsAbertos] = useState([])
    const [ultimaTela,setUltimaTela] = useState({
        app_lembrete:'about.exe',
        app_config:'config.exe'
    })

    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
};

    const abrirApp = (idDoApp, telaParaAbrir) => {
        setTimeout(() => {
        setTelaAtiva(telaParaAbrir);
        setUltimaTela({...ultimaTela,[idDoApp]:telaParaAbrir})
        if (!appsAbertos.includes(idDoApp)){
            setAppsAbertos([...appsAbertos,idDoApp])
        }},150)

    }

    const fecharApp = (idDoAppParaFechar) => {
        setTimeout(() => {
            const novosAppsAbertos = appsAbertos.filter(app => app !== idDoAppParaFechar);
            setAppsAbertos(novosAppsAbertos);
            if (novosAppsAbertos.length > 0) {
                 setTelaAtiva(ultimaTela[novosAppsAbertos[novosAppsAbertos.length -1]])   
            } else {
                setTelaAtiva('desktop')} 
            },300)
}
    // depois adaptar direito essa funcao pra reciclar tudo
    // const abrirLembretes = (nomeDoApp) =>{
    // const proximaTela = 'nomeDoApp';
    // setTelaAtiva(proximaTela);
    // setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
    // }
    return (
        <div>
            <section className='secao-tablet-modal'>
                <img className='tablet-modal' src={ process.env.PUBLIC_URL + '/imagens/tabletModal.png'}
                style={{display: validarLigadoDesligado ? "" : " none" }}
                alt='Modal do tablet'
            />
                        <div className='tablet-tela'  > 
            <div className='area-de-trabalho' style={{backgroundImage:"url('/imagens/windows/windowsWallpaper.jpg')",backgroundRepeat:"no-repeat"}}  >
            
                {/* aqui manda a partir da area de trabalho */}
                {/* icone */}
                {telaAtiva === 'desktop' && (
                    <div className='icone-lembretes'
                   onClick={() => abrirApp('app_lembretes','about.exe') }>
                    
                    <img src={ process.env.PUBLIC_URL +'/imagens/windows/lembretesIcone.png'}
                    alt='abrir lembretes' />
                    <span>Lembretes.exe</span>
                    <div className='selecionar-lembrete' ></div>
                 </div>)}
                {/* icone */}
                {telaAtiva === 'desktop' && (<div className='icone-led'
                   onClick={() => abrirApp('app_config','config.exe') }>
                    <img src={ process.env.PUBLIC_URL+ '/imagens/windows/ledIcone.png'}
                    alt='abrir lembretes' />
                    <span>Config.exe</span>
                    <div className='selecionar-configuracao' ></div>
                </div>)}

                {/* app de fato */}
                {telaAtiva ==='config.exe' && (<div className='janela-configuracao-led' >
                        <img src={process.env.PUBLIC_URL +"/imagens/windows/iconeFechar.png"} alt="Icone de fechar" 
                        onClick={() => fecharApp('app_config','config.exe')}/>
                        <span>Pagina em manutenção.</span>
                    </div>
                )}
                
                {/* APP de fato */}
                { telaAtiva === 'lembretes.exe' && (

        <div className='janela-lembretes' >
                    <div className='janela-pro-about' onClick={
                        ()=> {
                           const proximaTela = 'about.exe';
                            setTelaAtiva(proximaTela);
                            setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
                            }} >
                                <p>About</p> 
                    </div>
                    
                    <img src={ process.env.PUBLIC_URL+ "/imagens/windows/iconeFechar.png"} alt="Icone de fechar"
                    onClick={() => fecharApp('app_lembretes','lembretes.exe')} />
                    <form onSubmit={aoSalvar}>
                    <h2>Deixe seu lembrete para ser incluído no painel.</h2>
                <div className='grupo-painel'>
                        <textarea
                            className='area-texto'
                            required={true}
                            placeholder='Digite sua mensagem'
                            value= {nome}
                            onChange={evento => setNome(evento.target.value)}
                            name='mensagem'
                            maxLength={150}
                            rows={5}
                            >
                        </textarea>
                        
                    { //aqui vai a funcao de estado
                        painelLigadoPermanente === true && (
                        <div className='mostrar-e-esconder'
                            onClick={()=>{alterarVisibilidadePainel()}
                                    }>
                            <div className='botao-mostrar-esconder-painel' ><p>{textoBotao}</p>
                            </div>
                        </div>
                        )
                    }
                </div>

                    <Botao className='botao-lembrete' >Enviar lembrete</Botao>
                </form>
        </div>
            )}
            {telaAtiva ==='about.exe' && (
                 <div className='about' >
                     <div className='janela-about' >
                        <div className='janela-pro-lembrete' onClick={
                            ()=> {
                                const proximaTela = 'lembretes.exe';
                                setTelaAtiva(proximaTela);
                                 setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
                                 }} >
                                <p>Lembretes</p> 
                            </div>
                            <img src={ process.env.PUBLIC_URL+ "/imagens/windows/iconeFechar.png"} alt="Icone de fechar"
                            onClick={() => fecharApp('app_lembretes','about.exe')} />
                        </div>
            <div className='tela-about'>
                        <h2>Sobre o projeto</h2>
                        <p>Olá, esse é o <strong className='strong-about' >Lembretes Noturnos</strong></p>
                        <p>Este projeto foi feito utilizando React e tem como finalidade a interação com diversos itens da cena<br></br><br></br>
                           No momento, é possível interagir com:    
                        </p>
                    <div className='listas-desordenadas-about' >
                        <ui>
                            <li>
                                O tablet em cima da mesa
                            </li>
                            <br></br>
                            <li>
                                Com as notas dentro painel, fixar, desfixar
                            </li>
                            <br></br>
                            <li>
                                Parcialmente com o sistema do tablet
                            </li>
                            <br></br>

                        </ui>
                    </div>
                <div>Para adicionar uma nota, você pode navegar na aba no canto superior esquerdo da página ou
                    <div className='abrir-lembrete' 
                    onClick={()=> {
                        const proximaTela = 'lembretes.exe';
                        setTelaAtiva(proximaTela);
                        setUltimaTela(
                            {...ultimaTela,app_lembretes:proximaTela})
                            }}> clicar aqui
                    </div>
                 </div>
            </div>
        </div>)}
    </div>

    <div className="barra-de-tarefas">
    
        <div className='menu-iniciar' >
            <img src = {process.env.PUBLIC_URL + "/imagens/windows/menuIniciar.png"} alt="Menu iniciar" />
        </div>

        <div className="seta-voltar" onClick={() => setTelaAtiva('desktop')}>
          <img src={ process.env.PUBLIC_URL + "/imagens/windows/setaVoltar.png"} alt="Voltar para o Desktop" />
        </div>

    <div className='icones-apps-abertos' >
    {
        appsAbertos.map(app =>(
            <div 
            key={app}
            className='icone-na-barra'
            onClick={() => setTelaAtiva(ultimaTela[app])} >
                {app === 'app_lembretes' && <img className='icone-na-barra-lembretes' src={ process.env.PUBLIC_URL+ '/imagens/windows/lembretesIcone.png'} alt='abrir lembretes' /> }
                {app === 'app_config' && <img className='icone-na-barra-led'  src={process.env.PUBLIC_URL+'/imagens/windows/ledIcone.png'} alt='abrir config' /> }
            </div>
         )
        )
    }
    </div>

        <div className='barra-tarefas-inferior-direito' >
            <div className='icone-bateria' >
                    <img src={ process.env.PUBLIC_URL+ "/imagens/windows/bateriaIcone.png"} alt="Bateria carregando" />
                </div> 
            
            <div className='icone-wifi' >
                    <img src={ process.env.PUBLIC_URL + "/imagens/windows/wifiIcone.png"} alt="\Icone wifi" />
                </div> 

                <div className='icone-som' >
                    <img src={ process.env.PUBLIC_URL + "/imagens/windows/semSomIcone.png"} alt="Icone sem som" />
                </div> 

                <div className='idioma'>
                    <span>POR</span>
                    <br></br>
                    <span>PTB2</span>
                </div>
                <Relogio/>
      </div>
        <div className='icone-notificacoes' >
        <img src={ process.env.PUBLIC_URL+  "/imagens/windows/iconeNotificacoes.png"} alt="Icone de notificacoes" />
        </div> 
    </div>

        </div>
            </section>
    </div>

    )
}

export default ModalTablet