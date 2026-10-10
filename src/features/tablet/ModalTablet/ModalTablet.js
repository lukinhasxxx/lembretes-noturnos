import { VisibilidadePainelContext } from '../../mural'
import './ModalTablet.css'
import Botao from '../componentes/Botao/Botao'
import { useState,useContext } from 'react'
import '../sistema/temaSistema.css'
import BarraDeTarefas from '../sistema/BarraDeTarefas/BarraDeTarefas'
import WindowBar from '../sistema/WindowBar/WindowBar'
import BotaoUpload from '../componentes/BotaoUpload/BotaoUpload'
import TelaBoot from '../sistema/TelaBoot/TelaBoot'
import TelaBoasVindas from '../sistema/TelaBoasVindas/TelaBoasVindas'
import TelaBloqueio from '../sistema/TelaBloqueio/TelaBloqueio'
import { ESTADOS_SISTEMA } from '../tablet.config'
import { APPS } from '../apps.config'
import { useSistemaTablet } from '../contexts/SistemaTablet'

// Modal do tablet: desenha o sistema (área de trabalho, apps, barra, telas do sistema).
// O estado do sistema (ligado/bloqueado..., tela na frente, apps abertos, wallpaper) vem do SistemaTabletProvider,
// o mesmo que o tablet da mesa lê; aqui fica só o que é da interface do modal (texto digitado, galeria aberta).
const ModalTablet = ({aoSubmeter, validarLigadoDesligado, painelLigadoPermanente, haLembretesSalvos, aoLigarMural, corNeon, radioLigado}) => {

    //perto do fim do projeto ai componetiza, modulariza as coisas
    const {alterarVisibilidadePainel, textoBotao} = useContext(VisibilidadePainelContext)
    const {
        estadoSistema, bloquearSistema, desbloquearSistema, entrarSistema, desligarSistema, reiniciarSistema,
        telaAtiva, appsAbertos, abrirApp, fecharApp, mostrarTelaDoApp, alternarAppPelaBarra, voltarParaAreaDeTrabalho,
        wallpaperAtual, previa, setPrevia, selecionarPreset, lidarComMudancas,
        registrarTelaDoModal,
    } = useSistemaTablet()
    const [nome, setNome] = useState('')
    const [wrapperPreviaWallpaper, setWrapperPreviaWallpaper] = useState(false)

    const wallpapersProntos = [
    { id: 1, src: "/imagens/windows/previasWallpaper/previa1.png", alt: "Previa 1" },
    { id: 2, src: "/imagens/windows/previasWallpaper/previa2.png", alt: "Previa 2" },
    { id: 3, src: "/imagens/windows/previasWallpaper/previa3.gif", alt: "Previa 3" },
    { id: 4, src: "/imagens/windows/previasWallpaper/previa4.png", alt: "Previa 4" } 
];

    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
};

        const abrirWrapperWallpaper = () => {
            setWrapperPreviaWallpaper( 
                wrapperPreviaWallpaper => !wrapperPreviaWallpaper
            )
        } 





    return (
        <div>
            <section className={`secao-tablet-modal${validarLigadoDesligado ? ' secao-tablet-modal-aberta' : ''}`}>

            <div className="handle"></div>

                <img className='tablet-modal' src={ process.env.PUBLIC_URL + '/imagens/tabletModal.png'}
                style={{display: validarLigadoDesligado ? "" : " none" }}
                alt='Modal do tablet'
            />
    {/* registrarTelaDoModal: o espelho do tablet da mesa copia o HTML desta tela */}
    <div className='tablet-tela' ref={registrarTelaDoModal}>
            <div 
                className='area-de-trabalho' 
                style={{ backgroundImage: `url(${wallpaperAtual})` }}
            >


            
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
                   onClick={
                    () => abrirApp('app_config','config.exe') }>
                    <img src={ process.env.PUBLIC_URL+ '/imagens/windows/ledIcone.png'}
                    alt='abrir lembretes' />
                    <span>Config.exe</span>
                    <div className='selecionar-configuracao' ></div>
                </div>)}

                {/* app de fato */}
                {telaAtiva ==='config.exe' && (
                   

<div>
    <WindowBar 
        fecharApp = {fecharApp}
        idDoAppPraFechar='app_config'
    />
        <div className='janela-configuracao-led' >
            <div className='wrapper-configuracao' >


                        <span className='texto-configuracao' >Configurações</span>
                        <p className='texto-explicacao' >Aqui você pode configurar algumas coisas do sistema e/ou cenário </p>
                        <h3 className='luz-radio' >Luz do rádio</h3>

                {radioLigado ?  
                    <p className='texto-alterar-luz-radio' > Clique no botão ao lado para mudar a luz do rádio</p> : 
                        
                    <div> 
                        <p className='aviso-radio-desligado' >O led do rádio está <strong>desligado</strong> no momento. 
                            <br></br>
                            Para ligar, clique no rádio na escada.
                        </p> 
                    </div>
                }

                    <input 
                        className='input-cor' 
                        type='color' 
                        style={{display: radioLigado? "block":"none"}}
                        onChange={(evento)=>{corNeon(evento.target.value)}}
                    />

                <h3 className='texto-wallpaper' >Mudar wallpaper do sistema</h3>

                    <BotaoUpload 
                    previa={previa}
                    setPrevia={setPrevia}
                    lidarComMudancas={lidarComMudancas}
                    />

                <h3>Wallpapers de exemplo</h3>

                <button 
                    className='botao-abrir-previa'
                    onClick={()=> abrirWrapperWallpaper()}
                    style={{boxShadow: wrapperPreviaWallpaper?"1px 1px 11px #0015ffff":"none"}}
                 
                 >Wallpapers</button>

                {
                    wrapperPreviaWallpaper === true && (
                    <div className='container-galeria-presets'>
                        {
                            wallpapersProntos.map((wallpaper)=>(
                                <img
                                    onDragStart={(e) => e.preventDefault()}
                                    key={wallpaper.id}
                                    className='miniatura-preset'
                                    src={process.env.PUBLIC_URL + wallpaper.src}
                                    alt={wallpaper.alt}
                                    onClick={()=> selecionarPreset(wallpaper.src)}
                                />
                            ))
                        }

                    </div>
                    )
                }
                


                    
           </div>

        </div>
    </div>

                 )}
                
                {/* APP de fato */}
                { telaAtiva === 'lembretes.exe' && (

        <div className='janela-lembretes' >

                <WindowBar
                fecharApp = {fecharApp}
                idDoAppPraFechar = 'app_lembretes'
                >
                    <div className='janela-pro-about' onClick={
                        ()=> {
                           const proximaTela = 'about.exe';
                            mostrarTelaDoApp('app_lembretes', proximaTela)
                            }} >
                            <p>About</p>
                    </div>
                </WindowBar>

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
                    { // mural ainda desligado, mas há lembretes salvos (ex.: depois do F5): liga com a animação
                        painelLigadoPermanente === false && haLembretesSalvos && (
                        <div className='mostrar-e-esconder'
                            onClick={()=>{aoLigarMural()}
                                    }>
                            <div className='botao-mostrar-esconder-painel' ><p>Mostrar painel</p>
                            </div>
                        </div>
                        )
                    }
                </div>

                    <Botao className='botao-lembrete' data-text = "Enviar lembrete" >Enviar lembrete</Botao>
                </form>
        </div>

            )}
            {telaAtiva ==='about.exe' && (
                 <div className='about' >

                {/* Janela superior */}
    <WindowBar 
    idDoAppPraFechar = 'app_lembretes'
    fecharApp = {fecharApp} 
    >
    <div className= 'janela-pro-lembrete' 
        onClick={
            ()=> {
                const proximaTela = 'lembretes.exe';
                mostrarTelaDoApp('app_lembretes', proximaTela)
                    }} >
                <p>Lembretes</p> 
        </div>
    </WindowBar>

                     {/* <div className='window-bar' >
                        <div className='tab-lembrete' 
                            onClick={
                                ()=> {
                                const proximaTela = 'lembretes.exe';
                                mostrarTelaDoApp('app_lembretes', proximaTela)
                                 }} >
                                <p>Lembretes</p> 
                            </div>
                            <img src={ process.env.PUBLIC_URL+ "/imagens/windows/iconeFechar.png"} alt="Icone de fechar"
                            onClick={() => fecharApp('app_lembretes','about.exe')} />
                        </div> */}

            {/* <Componente as funcoes aqui,  /> */}

            <div className='tela-about'>
                        <h2>Sobre o projeto</h2>
                        <p>Olá, esse é o <strong className='strong-about' >Lembretes Noturnos</strong></p>
                        <p>Este projeto foi feito utilizando React e tem como finalidade a interação com diversos itens da cena<br></br><br></br>
                           No momento, é possível interagir com:    
                        </p>
                    <div className='listas-desordenadas-about' >
                        <ul>
                            <li>
                                O tablet em cima da mesa
                            </li>
                            <li>
                                Com as notas dentro painel, fixar, desfixar etc.
                            </li>
                            <li>
                                Parcialmente com o sistema do tablet
                            </li>
                            <li>Interagir com o rádio e com o player</li>
                            <li>Também é possível movimentar o tablet e o player de rádio livremente</li>
                        </ul>
                    </div>
                <div>Para adicionar uma nota, você pode navegar na aba no canto superior esquerdo da página ou
                    <div className='abrir-lembrete' 
                    onClick={()=> {
                        const proximaTela = 'lembretes.exe';
                        mostrarTelaDoApp('app_lembretes', proximaTela)
                            }}> clicar aqui
                    </div>
                 </div>
            </div>
        </div>)}
    </div>

    <BarraDeTarefas
        appsAbertos={appsAbertos}
        aoClicarNoApp={alternarAppPelaBarra}
        aoAbrirApp={(idDoApp) => abrirApp(idDoApp, APPS[idDoApp].telaInicial)}
        aoBloquear={bloquearSistema}
        aoDesligar={desligarSistema}
        aoReiniciar={reiniciarSistema}
        aoVoltarParaAreaDeTrabalho={voltarParaAreaDeTrabalho}
    />

        {/* boot, tela do usuário e bloqueio cobrem a tela inteira (área de trabalho + barra de tarefas).
            Bloqueado: a tela de login já fica montada embaixo e a de bloqueio (por cima) sai revelando ela */}
        {estadoSistema === ESTADOS_SISTEMA.ligando && <TelaBoot />}
        {estadoSistema === ESTADOS_SISTEMA.boasVindas && <TelaBoasVindas wallpaper={wallpaperAtual} />}
        {(estadoSistema === ESTADOS_SISTEMA.bloqueado
            || estadoSistema === ESTADOS_SISTEMA.login
            || estadoSistema === ESTADOS_SISTEMA.entrando) && (
            <TelaBoasVindas
                wallpaper={wallpaperAtual}
                etapa={estadoSistema === ESTADOS_SISTEMA.entrando ? 'aguarde' : 'login'}
                aoEntrar={entrarSistema}
            />
        )}
        {estadoSistema === ESTADOS_SISTEMA.bloqueado && (
            <TelaBloqueio wallpaper={wallpaperAtual} aoDesbloquear={desbloquearSistema} />
        )}
        {estadoSistema === ESTADOS_SISTEMA.desligando && <TelaBoasVindas wallpaper={wallpaperAtual} etapa='desligando' />}
        {estadoSistema === ESTADOS_SISTEMA.reiniciando && <TelaBoasVindas wallpaper={wallpaperAtual} etapa='reiniciando' />}
        {estadoSistema === ESTADOS_SISTEMA.apagado && <div className='tela-sistema-apagada' />}

    </div>
            </section>
    </div>

    )
}

export default ModalTablet