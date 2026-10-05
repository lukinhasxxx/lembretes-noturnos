import { VisibilidadePainelContext } from '../../mural'
import './ModalTablet.css'
import Botao from '../componentes/Botao/Botao'
import { useState,useContext } from 'react'
import '../sistema/temaSistema.css'
import BarraDeTarefas from '../sistema/BarraDeTarefas/BarraDeTarefas'
import WindowBar from '../sistema/WindowBar/WindowBar'
import BotaoUpload from '../componentes/BotaoUpload/BotaoUpload'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import TelaBoot from '../sistema/TelaBoot/TelaBoot'
import TelaBoasVindas from '../sistema/TelaBoasVindas/TelaBoasVindas'
import { ESTADOS_SISTEMA } from '../tablet.config'
import { APPS } from '../apps.config'

// estadoSistema: em que ponto o sistema está (boot, boas-vindas, área de trabalho), vem do useSistemaTablet
const ModalTablet = ({aoSubmeter, validarLigadoDesligado, estadoSistema, painelLigadoPermanente, haLembretesSalvos, aoLigarMural, corNeon, radioLigado}) => {

    //perto do fim do projeto ai componetiza, modulariza as coisas
    const {alterarVisibilidadePainel, textoBotao} = useContext(VisibilidadePainelContext)   
    const [nome, setNome] = useState('')
    const [telaAtiva, setTelaAtiva] = useState('desktop')
    const [appsAbertos,setAppsAbertos] = useState([])
    const [ultimaTela,setUltimaTela] = useState({
        app_lembrete:'about.exe',
        app_config:'config.exe'
    })
    // só o wallpaper de exemplo (preset) é salvo; o de upload é uma imagem inteira e não cabe bem no localStorage.
    // salva o caminho sem o PUBLIC_URL, para funcionar tanto no localhost quanto no GitHub Pages
    const [wallpaperPresetSalvo, setWallpaperPresetSalvo] = useEstadoPersistido('wallpaper-preset', null)
    const [previa, setPrevia] = useState(() =>
        wallpaperPresetSalvo ? process.env.PUBLIC_URL + wallpaperPresetSalvo : null
    )
    const [mudarWallpaper, setMudarWallpaper] = useState(() => Boolean(wallpaperPresetSalvo))
    const [wrapperPreviaWallpaper, setWrapperPreviaWallpaper] = useState(false)
    // wallpaper que está na área de trabalho agora (também usado no fundo da tela de boas-vindas)
    const wallpaperAtual = mudarWallpaper ? previa : `${process.env.PUBLIC_URL}/imagens/windows/windowsWallpaper.jpg`

    const wallpapersProntos = [
    { id: 1, src: "/imagens/windows/previasWallpaper/previa1.png", alt: "Previa 1" },
    { id: 2, src: "/imagens/windows/previasWallpaper/previa2.png", alt: "Previa 2" },
    { id: 3, src: "/imagens/windows/previasWallpaper/previa3.gif", alt: "Previa 3" },
    { id: 4, src: "/imagens/windows/previasWallpaper/previa4.png", alt: "Previa 4" } 
];

const selecionarPreset = (caminhoDaImagem) => {
    setPrevia(process.env.PUBLIC_URL + caminhoDaImagem);
    setMudarWallpaper(true)
    setWallpaperPresetSalvo(caminhoDaImagem)
}

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
    
        const lidarComMudancas = (evento) => {
        const arquivo = evento.target.files[0]
        
        if (arquivo) {
            setPrevia (URL.createObjectURL(arquivo));
            console.log("teste arquivo",arquivo)
            }
            setMudarWallpaper(arquivo)
        }
        
        const abrirWrapperWallpaper = () => {
            setWrapperPreviaWallpaper( 
                wrapperPreviaWallpaper => !wrapperPreviaWallpaper
            )
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

            <div className="handle"></div>

                <img className='tablet-modal' src={ process.env.PUBLIC_URL + '/imagens/tabletModal.png'}
                style={{display: validarLigadoDesligado ? "" : " none" }}
                alt='Modal do tablet'
            />
    <div className='tablet-tela' > 
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
                            setTelaAtiva(proximaTela);
                            setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
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
                setTelaAtiva(proximaTela);
                    setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
                    }} >
                <p>Lembretes</p> 
        </div>
    </WindowBar>

                     {/* <div className='window-bar' >
                        <div className='tab-lembrete' 
                            onClick={
                                ()=> {
                                const proximaTela = 'lembretes.exe';
                                setTelaAtiva(proximaTela);
                                 setUltimaTela({...ultimaTela,app_lembretes:proximaTela})
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
                        <ui>
                            <li>
                                O tablet em cima da mesa
                            </li>
                            <br></br>
                            <li>
                                Com as notas dentro painel, fixar, desfixar etc.
                            </li>
                            <br></br>
                            <li>
                                Parcialmente com o sistema do tablet
                            </li>
                            <br></br>
                            <li>Interagir com o rádio e com o player</li>
                            <br></br>
                            <li>Também é possível movimentar o tablet e o player de rádio livremente</li>
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

    <BarraDeTarefas
        appsAbertos={appsAbertos}
        aoClicarNoApp={(idDoApp) => setTelaAtiva(ultimaTela[idDoApp])}
        aoAbrirApp={(idDoApp) => abrirApp(idDoApp, APPS[idDoApp].telaInicial)}
        aoVoltarParaAreaDeTrabalho={() => setTelaAtiva('desktop')}
    />

        {/* boot e boas-vindas cobrem a tela inteira (área de trabalho + barra de tarefas) */}
        {estadoSistema === ESTADOS_SISTEMA.ligando && <TelaBoot />}
        {estadoSistema === ESTADOS_SISTEMA.boasVindas && <TelaBoasVindas wallpaper={wallpaperAtual} />}

    </div>
            </section>
    </div>

    )
}

export default ModalTablet