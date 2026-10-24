import { VisibilidadePainelContext } from '../../mural'
import './ModalTablet.css'
import Botao from '../componentes/Botao/Botao'
import { useState, useContext, useLayoutEffect, useRef, lazy, Suspense } from 'react'
import '../sistema/temaSistema.css'
import BarraDeTarefas from '../sistema/BarraDeTarefas/BarraDeTarefas'
import WindowBar from '../sistema/WindowBar/WindowBar'
import Config from '../componentes/Config/Config'
import IconeAreaDeTrabalho from '../sistema/IconeAreaDeTrabalho/IconeAreaDeTrabalho'
import { TEMAS } from '../hooks/useTemaSistema'
import { useWallpaperBloqueio } from '../hooks/useWallpaperBloqueio'
import TelaBoot from '../sistema/TelaBoot/TelaBoot'
import TelaBoasVindas from '../sistema/TelaBoasVindas/TelaBoasVindas'
import TelaBloqueio from '../sistema/TelaBloqueio/TelaBloqueio'
import TelaFormatando from '../sistema/TelaFormatando/TelaFormatando'
import CarregandoApp from '../sistema/CarregandoApp/CarregandoApp'
import { ESTADOS_SISTEMA } from '../tablet.config'
import { APPS, appDaTela } from '../apps.config'
import { useSistemaTablet } from '../contexts/SistemaTablet'

// jogos: cada um vira um arquivo à parte, baixado só quando a pessoa abre o jogo pela primeira vez
// (o código deles e o chess.js não pesam na abertura do site). Na 1ª abertura o "Abrindo..." (CarregandoApp)
// fica pelo menos ESPERA_MINIMA_CARREGANDO_MS na tela, mesmo se o arquivo chegar antes: assim ele não vira um pisco
const ESPERA_MINIMA_CARREGANDO_MS = 450
const comEsperaMinima = (importar) => () => Promise.all([
    importar(),
    new Promise((resolver) => setTimeout(resolver, ESPERA_MINIMA_CARREGANDO_MS)),
]).then(([modulo]) => modulo)
const Jogo2048 = lazy(comEsperaMinima(() => import('../componentes/Jogo2048/Jogo2048')))
const JogoSudoku = lazy(comEsperaMinima(() => import('../componentes/JogoSudoku/JogoSudoku')))
const JogoXadrez = lazy(comEsperaMinima(() => import('../componentes/JogoXadrez/JogoXadrez')))
const JogoDoom = lazy(comEsperaMinima(() => import('../componentes/JogoDoom/JogoDoom')))

// Modal do tablet: desenha o sistema (área de trabalho, apps, barra, telas do sistema).
// O estado do sistema (ligado/bloqueado..., tela na frente, apps abertos, wallpaper) vem do SistemaTabletProvider,
// o mesmo que o tablet da mesa lê; aqui fica só o que é da interface do modal (texto digitado). O Config.exe fica no componente Config.
const ModalTablet = ({aoSubmeter, validarLigadoDesligado, painelLigadoPermanente, haLembretesSalvos, muralJaTeveLembretes, aoLigarMural, aoMostrarPainel, corNeon, radioLigado, volume, aoMudarVolume, musicaTocando, aoDesligarRadio}) => {

    const {alterarVisibilidadePainel, textoBotao, mostrarPainel} = useContext(VisibilidadePainelContext)
    const {
        estadoSistema, bloquearSistema, desbloquearSistema, entrarSistema, desligarSistema, reiniciarSistema,
        telaAtiva, appsAbertos, ultimaTela, abrirApp, fecharApp, mostrarTelaDoApp, alternarAppPelaBarra, minimizarApp, minimizarTudo, voltarParaAreaDeTrabalho,
        wallpaperAtual, registrarTelaDoModal, telaDoModal, tema, animacaoJanela,
    } = useSistemaTablet()
    const [nome, setNome] = useState('')
    // bloqueio e o login embaixo dele: imagem sorteada do tema (ou o wallpaper da área de trabalho)
    const wallpaperBloqueio = useWallpaperBloqueio(tema, estadoSistema, wallpaperAtual)
    // centro do ícone do app na barra (em px da tela): a janela minimiza "para dentro" dele e restaura "saindo" dele
    const [origemJanelaX, setOrigemJanelaX] = useState(null)
    // tema do momento em que o tablet abriu: a animação de abrir é escolhida por ele. Se seguisse o tema atual,
    // ir para o noturno com o tablet aberto trocaria a animação e o navegador rodaria ela de novo (o tablet "piscava")
    const [abertura, setAbertura] = useState({ aberto: validarLigadoDesligado, tema })
    if (abertura.aberto !== validarLigadoDesligado) setAbertura({ aberto: validarLigadoDesligado, tema })
    const secaoRef = useRef(null)
    const temaAnteriorRef = useRef(tema)

    // voltando para o Original com o tablet aberto: aí sim ele se materializa de novo (o holograma do CyberOS)
    useLayoutEffect(() => {
        const temaAnterior = temaAnteriorRef.current
        temaAnteriorRef.current = tema
        if (!validarLigadoDesligado || temaAnterior === tema || tema !== TEMAS.padrao) return
        setAbertura({ aberto: true, tema })
        // reinicia as animações da caixa do tablet (e da "pele" ::after), mesmo se o data-tema já era o do Original
        const quadro = requestAnimationFrame(() => {
            const secao = secaoRef.current
            secao?.getAnimations({ subtree: true })
                .filter((animacao) => animacao.effect?.target === secao)
                .forEach((animacao) => { animacao.cancel(); animacao.play() })
        })
        return () => cancelAnimationFrame(quadro)
    }, [tema, validarLigadoDesligado])

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

    // janela de app aberto que não está na frente (minimizada ou atrás de outra): continua montada, só escondida.
    // Assim ela volta como estava — rolagem, texto digitado, partida dos jogos. Fechar o app desmonta (começa do zero)
    const telaGuardada = (tela) => {
        const dono = appDaTela(tela)
        return Boolean(dono) && appsAbertos.includes(dono) && ultimaTela[dono] === tela
    }
    // Suspense: enquanto o arquivo de um jogo ainda está baixando (só na 1ª vez), mostra o "Abrindo..." no lugar
    const guardar = (tela, janela) => (telaVisivel(tela) || telaGuardada(tela)) && (
        // "contents": a caixa em volta não existe para o layout; escondida, sai da tela sem desmontar
        <div key={tela} style={{ display: telaVisivel(tela) ? 'contents' : 'none' }}>
            <Suspense fallback={<CarregandoApp app={APPS[appDaTela(tela)]} />}>{janela}</Suspense>
        </div>
    )

    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
};






    return (
        <div>
            <section
                ref={secaoRef}
                className={`secao-tablet-modal${validarLigadoDesligado ? ' secao-tablet-modal-aberta' : ''}`}
                // cada tema abre o tablet do seu jeito (ModalTablet.css → secao-tablet-modal-aberta)
                data-tema={abertura.tema}
                // formato do holograma ao se materializar (ModalTablet.css → secao-tablet-modal-aberta::after)
                style={{ '--mascara-tablet-modal': `url(${process.env.PUBLIC_URL}/imagens/tabletModal.png)` }}
            >

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
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/jogos/icone2048.svg'
                            nome='2048.exe'
                            alt='abrir o jogo 2048'
                            aoAbrir={() => abrirApp('app_2048', '2048.exe')}
                        />
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/jogos/iconeSudoku.svg'
                            nome='Sudoku.exe'
                            alt='abrir o Sudoku'
                            aoAbrir={() => abrirApp('app_sudoku', 'sudoku.exe')}
                        />
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/jogos/iconeXadrez.svg'
                            nome='Xadrez.exe'
                            alt='abrir o xadrez'
                            aoAbrir={() => abrirApp('app_xadrez', 'xadrez.exe')}
                        />
                        <IconeAreaDeTrabalho
                            icone='/imagens/windows/jogos/iconeDoom.svg'
                            nome='DOOM.exe'
                            alt='abrir o DOOM'
                            aoAbrir={() => abrirApp('app_doom', 'doom.exe')}
                        />
                    </div>
                )}

                {/* janelas dos apps: guardar() deixa a janela montada (escondida) enquanto o app está aberto */}
                {guardar('doom.exe', (
                    <JogoDoom
                        fecharApp={fecharApp}
                        minimizarApp={minimizarApp}
                        classeAnimacao={classeAnimacaoJanela('app_doom')}
                    />
                ))}

                {guardar('xadrez.exe', (
                    <JogoXadrez
                        fecharApp={fecharApp}
                        minimizarApp={minimizarApp}
                        classeAnimacao={classeAnimacaoJanela('app_xadrez')}
                    />
                ))}

                {guardar('sudoku.exe', (
                    <JogoSudoku
                        fecharApp={fecharApp}
                        minimizarApp={minimizarApp}
                        classeAnimacao={classeAnimacaoJanela('app_sudoku')}
                    />
                ))}

                {guardar('2048.exe', (
                    <Jogo2048
                        fecharApp={fecharApp}
                        minimizarApp={minimizarApp}
                        classeAnimacao={classeAnimacaoJanela('app_2048')}
                    />
                ))}

                {/* app de fato */}
                {guardar('config.exe', (
                    <Config
                        fecharApp={fecharApp}
                        minimizarApp={minimizarApp}
                        classeAnimacao={classeAnimacaoJanela('app_config')}
                        radioLigado={radioLigado}
                        corNeon={corNeon}
                        volume={volume}
                        aoMudarVolume={aoMudarVolume}
                        musicaTocando={musicaTocando}
                        aoDesligarRadio={aoDesligarRadio}
                    />
                ))}

                {/* APP de fato */}
                { guardar('lembretes.exe', (

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
                        
                    { // mural ligado: mostrar/esconder o painel — quando existe algum lembrete ou quando o mural já teve
                      // lembretes nesta sessão e eles foram apagados (sem nunca ter tido, ex.: depois de reiniciar o
                      // tablet com o mural vazio, o botão não aparece)
                        painelLigadoPermanente === true && (haLembretesSalvos || muralJaTeveLembretes) && (
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

            ))}
            {guardar('about.exe', (
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
        </div>))}
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
        {estadoSistema === ESTADOS_SISTEMA.formatando && <TelaFormatando />}

    </div>
            </section>
    </div>

    )
}

export default ModalTablet
