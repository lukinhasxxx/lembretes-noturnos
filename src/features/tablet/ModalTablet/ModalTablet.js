import { VisibilidadePainelContext } from '../../mural'
import './ModalTablet.css'
import Botao from '../componentes/Botao/Botao'
import { useState, useContext, useLayoutEffect } from 'react'
import '../sistema/temaSistema.css'
import BarraDeTarefas from '../sistema/BarraDeTarefas/BarraDeTarefas'
import WindowBar from '../sistema/WindowBar/WindowBar'
import BotaoUpload from '../componentes/BotaoUpload/BotaoUpload'
import SecaoTemas from '../componentes/BotaoTema/SecaoTemas'
import WallpaperEspecial from '../componentes/WallpaperEspecial/WallpaperEspecial'
import IconeAreaDeTrabalho from '../sistema/IconeAreaDeTrabalho/IconeAreaDeTrabalho'
import { TEMAS } from '../hooks/useTemaSistema'
import { useWallpaperBloqueio } from '../hooks/useWallpaperBloqueio'
import TelaBoot from '../sistema/TelaBoot/TelaBoot'
import TelaBoasVindas from '../sistema/TelaBoasVindas/TelaBoasVindas'
import TelaBloqueio from '../sistema/TelaBloqueio/TelaBloqueio'
import { ESTADOS_SISTEMA } from '../tablet.config'
import { APPS } from '../apps.config'
import { useSistemaTablet } from '../contexts/SistemaTablet'

// Modal do tablet: desenha o sistema (área de trabalho, apps, barra, telas do sistema).
// O estado do sistema (ligado/bloqueado..., tela na frente, apps abertos, wallpaper) vem do SistemaTabletProvider,
// o mesmo que o tablet da mesa lê; aqui fica só o que é da interface do modal (texto digitado, galeria aberta).
const ModalTablet = ({aoSubmeter, validarLigadoDesligado, painelLigadoPermanente, haLembretesSalvos, aoLigarMural, aoMostrarPainel, corNeon, radioLigado}) => {

    const {alterarVisibilidadePainel, textoBotao, mostrarPainel} = useContext(VisibilidadePainelContext)
    const {
        estadoSistema, bloquearSistema, desbloquearSistema, entrarSistema, desligarSistema, reiniciarSistema,
        telaAtiva, appsAbertos, abrirApp, fecharApp, mostrarTelaDoApp, alternarAppPelaBarra, minimizarApp, minimizarTudo, voltarParaAreaDeTrabalho,
        wallpaperAtual, previa, selecionarPreset, lidarComMudancas, voltarParaWallpaperPadrao,
        registrarTelaDoModal, telaDoModal, tema, temasDisponiveis, destacarTemas, setDestacarTemas, animacaoJanela,
    } = useSistemaTablet()
    const [nome, setNome] = useState('')
    const [wrapperPreviaWallpaper, setWrapperPreviaWallpaper] = useState(false)
    // bloqueio e o login embaixo dele: imagem sorteada do tema (ou o wallpaper da área de trabalho)
    const wallpaperBloqueio = useWallpaperBloqueio(tema, estadoSistema, wallpaperAtual)
    // centro do ícone do app na barra (em px da tela): a janela minimiza "para dentro" dele e restaura "saindo" dele
    const [origemJanelaX, setOrigemJanelaX] = useState(null)

    useLayoutEffect(() => {
        if (!animacaoJanela || !telaDoModal) return
        const botao = telaDoModal.querySelector(`[data-app="${animacaoJanela.idDoApp}"]`)
        if (!botao) return
        // o modal pode estar escalado: converte de px da página para px da tela
        const caixaTela = telaDoModal.getBoundingClientRect()
        const escala = caixaTela.width / telaDoModal.offsetWidth || 1
        const caixaBotao = botao.getBoundingClientRect()
        setOrigemJanelaX((caixaBotao.left + caixaBotao.width / 2 - caixaTela.left) / escala)
    }, [animacaoJanela, telaDoModal])

    // classe da animação de minimizar/restaurar da janela de um app (vazia quando ela não está animando)
    const classeAnimacaoJanela = (idDoApp) =>
        animacaoJanela?.idDoApp === idDoApp ? `janela-${animacaoJanela.tipo}` : ''

    // tela desenhada: a da frente e, durante a animação, também a outra (ver animacaoJanela no useAreaDeTrabalho)
    const telaVisivel = (tela) => telaAtiva === tela || animacaoJanela?.tela === tela

    // miniatura: versão pequena (400×250) só para o quadradinho da galeria; ao clicar, aplica a imagem cheia (src).
    // O GIF não tem miniatura: continua animado na galeria
    const wallpapersProntos = [
    { id: 1, src: "/imagens/windows/previasWallpaper/previa1.png", miniatura: "/imagens/windows/previasWallpaper/miniaturas/previa1.webp", alt: "Previa 1" },
    { id: 2, src: "/imagens/windows/previasWallpaper/previa2.png", miniatura: "/imagens/windows/previasWallpaper/miniaturas/previa2.webp", alt: "Previa 2" },
    { id: 3, src: "/imagens/windows/previasWallpaper/previa3.gif", alt: "Previa 3" },
    { id: 4, src: "/imagens/windows/previasWallpaper/previa4.png", miniatura: "/imagens/windows/previasWallpaper/miniaturas/previa4.webp", alt: "Previa 4" }
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
    <div
        className='tablet-tela'
        data-tema={tema}
        ref={registrarTelaDoModal}
        style={origemJanelaX !== null ? { '--origem-janela-x': `${origemJanelaX}px` } : undefined}
    >
            <div 
                className='area-de-trabalho' 
                style={{ backgroundImage: `url(${wallpaperAtual})` }}
            >


            
                {/* aqui manda a partir da area de trabalho */}
                {/* icone */}
                {/* ícones da área de trabalho: mesmo molde para todos, em grade (desce 3 e vai para a direita) */}
                {telaVisivel('desktop') && (
                    <div className='icones-area-de-trabalho'>
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/lembretesIcone.png'
                            nome='Lembretes.exe'
                            alt='abrir lembretes'
                            aoAbrir={() => abrirApp('app_lembretes', 'about.exe')}
                        />
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/ledIcone.png'
                            nome='Config.exe'
                            alt='abrir configurações'
                            aoAbrir={() => abrirApp('app_config', 'config.exe')}
                        />
                    </div>
                )}

                {/* app de fato */}
                {telaVisivel('config.exe') && (
                   

<div className={`janela-config ${classeAnimacaoJanela('app_config')}`}>
    <WindowBar
        fecharApp = {fecharApp}
        minimizarApp = {minimizarApp}
        idDoAppPraFechar='app_config'
        escura={tema === TEMAS.noturno}
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
                    lidarComMudancas={lidarComMudancas}
                    aoVoltarParaPadrao={voltarParaWallpaperPadrao}
                    />

                <h3>Wallpapers de exemplo</h3>

                <button 
                    className='botao-abrir-previa'
                    onClick={()=> abrirWrapperWallpaper()}
                    style={{boxShadow: wrapperPreviaWallpaper?"1px 1px 11px #0015ffff":"none"}}
                 
                 >Wallpapers</button>

                {
                    wrapperPreviaWallpaper === true && (
                    // área da galeria: no noturno, o wallpaper especial aparece no espaço vazio à esquerda dela
                    <div className='area-galeria-presets'>
                    <div className='container-galeria-presets'>
                        {
                            wallpapersProntos.map((wallpaper)=>(
                                <img
                                    onDragStart={(e) => e.preventDefault()}
                                    key={wallpaper.id}
                                    className='miniatura-preset'
                                    src={process.env.PUBLIC_URL + (wallpaper.miniatura ?? wallpaper.src)}
                                    alt={wallpaper.alt}
                                    onClick={()=> selecionarPreset(wallpaper.src)}
                                />
                            ))
                        }

                    </div>
                    {tema === TEMAS.noturno && <WallpaperEspecial aoEscolher={selecionarPreset} />}
                    </div>
                    )
                }

                {/* só aparece depois da "instalação" dos temas (notificação na barra de tarefas) */}
                {temasDisponiveis && (
                    <SecaoTemas destacada={destacarTemas} aoTerminarDestaque={() => setDestacarTemas(false)} />
                )}



                    
           </div>

        </div>
    </div>

                 )}
                
                {/* APP de fato */}
                { telaVisivel('lembretes.exe') && (

        <div className={`janela-lembretes ${classeAnimacaoJanela('app_lembretes')}`} >

                <WindowBar
                fecharApp = {fecharApp}
                minimizarApp = {minimizarApp}
                idDoAppPraFechar = 'app_lembretes'
                escura={tema === TEMAS.noturno}
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
                        
                    { // mural ligado: mostrar/esconder o painel — só quando existe algum lembrete
                      // (sem nenhum, ex.: depois de reiniciar o tablet com o mural vazio, o botão não aparece)
                        painelLigadoPermanente === true && haLembretesSalvos && (
                        <div className='mostrar-e-esconder'
                            onClick={()=>{
                                // reexibindo o painel escondido: no celular em pé a cena vai até ele
                                if (!mostrarPainel) aoMostrarPainel()
                                alterarVisibilidadePainel()}
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
            {telaVisivel('about.exe') && (
                 <div className={`about ${classeAnimacaoJanela('app_lembretes')}`} >

                {/* Janela superior */}
    <WindowBar 
    idDoAppPraFechar = 'app_lembretes'
    fecharApp = {fecharApp}
    minimizarApp = {minimizarApp}
    escura={tema === TEMAS.noturno}
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
        aoMostrarAreaDeTrabalho={minimizarTudo}
    />

        {/* boot, tela do usuário e bloqueio cobrem a tela inteira (área de trabalho + barra de tarefas).
            Bloqueado: a tela de login já fica montada embaixo e a de bloqueio (por cima) sai revelando ela */}
        {estadoSistema === ESTADOS_SISTEMA.ligando && <TelaBoot />}
        {estadoSistema === ESTADOS_SISTEMA.boasVindas && <TelaBoasVindas wallpaper={wallpaperAtual} />}
        {(estadoSistema === ESTADOS_SISTEMA.bloqueado
            || estadoSistema === ESTADOS_SISTEMA.login
            || estadoSistema === ESTADOS_SISTEMA.entrando) && (
            <TelaBoasVindas
                wallpaper={wallpaperBloqueio}
                etapa={estadoSistema === ESTADOS_SISTEMA.entrando ? 'aguarde' : 'login'}
                aoEntrar={entrarSistema}
            />
        )}
        {estadoSistema === ESTADOS_SISTEMA.bloqueado && (
            <TelaBloqueio wallpaper={wallpaperBloqueio} aoDesbloquear={desbloquearSistema} />
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