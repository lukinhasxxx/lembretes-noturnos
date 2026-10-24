import './Config.css'
import { useEffect, useRef, useState } from 'react'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import BotaoUpload from '../BotaoUpload/BotaoUpload'
import SecaoTemas from '../BotaoTema/SecaoTemas'
import WallpaperEspecial from '../WallpaperEspecial/WallpaperEspecial'
import SecaoResolucao from '../SecaoResolucao/SecaoResolucao'
import SecaoIdioma from '../SecaoIdioma/SecaoIdioma'
import SobreSistema from '../SobreSistema/SobreSistema'
import Calendario from '../../sistema/Calendario/Calendario'
import { IconeCena, IconePersonalizacao, IconeSistema, IconeSobre } from './IconesConfig'
import { TEMAS } from '../../hooks/useTemaSistema'
import { useDataAtual } from '../../hooks/useDataAtual'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { aleatorioEntre } from '../../../../shared/utils/aleatorio'
import SecaoFormatar from '../SecaoFormatar/SecaoFormatar'

const CATEGORIAS = [
    { id: 'personalizacao', nome: 'Personalização', frase: 'Deixe o tablet com a sua cara.', Icone: IconePersonalizacao },
    { id: 'cena', nome: 'Cena', frase: 'Ajuste o que está à sua volta na varanda.', Icone: IconeCena },
    { id: 'sistema', nome: 'Sistema', frase: 'Tela, data e hora, idioma e formatar.', Icone: IconeSistema },
    { id: 'sobre', nome: 'Sobre', frase: 'O que roda neste tablet.', Icone: IconeSobre },
]

// miniatura: versão pequena (400×250) só para o quadradinho da galeria; ao clicar, aplica a imagem cheia (src).
// O GIF não tem miniatura: continua animado na galeria
const WALLPAPERS_PRONTOS = [
    { id: 1, src: '/imagens/windows/previasWallpaper/previa1.png', miniatura: '/imagens/windows/previasWallpaper/miniaturas/previa1.webp', alt: 'Previa 1' },
    { id: 2, src: '/imagens/windows/previasWallpaper/previa2.png', miniatura: '/imagens/windows/previasWallpaper/miniaturas/previa2.webp', alt: 'Previa 2' },
    { id: 3, src: '/imagens/windows/previasWallpaper/previa3.gif', alt: 'Previa 3' },
    { id: 4, src: '/imagens/windows/previasWallpaper/previa4.png', miniatura: '/imagens/windows/previasWallpaper/miniaturas/previa4.webp', alt: 'Previa 4' },
]

// cabeçalho de cada categoria: nome e uma frase (a página nunca começa "vazia")
const Cabecalho = ({ categoria }) => (
    <header className='config-cabecalho'>
        <h2>{categoria.nome}</h2>
        <p>{categoria.frase}</p>
    </header>
)

// miniatura do próprio tablet com o wallpaper e o tema atuais: muda na hora quando a pessoa troca
const PreviaTablet = ({ wallpaper }) => (
    <div className='config-previa' aria-hidden='true'>
        <div className='config-previa-tela' style={{ backgroundImage: `url(${wallpaper})` }}>
            <div className='config-previa-janela' />
            <div className='config-previa-barra' />
        </div>
    </div>
)

const Personalizacao = () => {
    const {
        wallpaperAtual, previa, selecionarPreset, lidarComMudancas, voltarParaWallpaperPadrao,
        tema, temasDisponiveis, destacarTemas, setDestacarTemas, destacarWallpaper, setDestacarWallpaper,
    } = useSistemaTablet()
    const [galeriaAberta, setGaleriaAberta] = useState(false)
    const tituloGaleriaRef = useRef(null)

    // veio da notificação de wallpaper: abre a galeria e rola até ela
    useEffect(() => {
        if (!destacarWallpaper) return
        setGaleriaAberta(true)
        const titulo = tituloGaleriaRef.current
        const janela = titulo?.closest('.janela-configuracao-led')
        if (janela) janela.scrollTo({ top: titulo.offsetTop - 12, behavior: 'smooth' })
        setDestacarWallpaper(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destacarWallpaper])

    return (
        <>
            <PreviaTablet wallpaper={wallpaperAtual} />

            <h3 className='texto-wallpaper'>Adicione seu próprio wallpaper</h3>
            <BotaoUpload previa={previa} lidarComMudancas={lidarComMudancas} aoVoltarParaPadrao={voltarParaWallpaperPadrao} />

            <h3 ref={tituloGaleriaRef}>Wallpapers pré-instalados</h3>
            <button
                className='botao-abrir-previa'
                onClick={() => setGaleriaAberta(aberta => !aberta)}
                style={{ boxShadow: galeriaAberta ? '1px 1px 11px #0015ffff' : 'none' }}
            >Wallpapers</button>

            {galeriaAberta && (
                // área da galeria: no noturno, o wallpaper especial aparece no espaço vazio à esquerda dela
                <div className='area-galeria-presets'>
                    <div className='container-galeria-presets'>
                        {WALLPAPERS_PRONTOS.map(wallpaper => (
                            <img
                                onDragStart={(e) => e.preventDefault()}
                                key={wallpaper.id}
                                className='miniatura-preset'
                                src={process.env.PUBLIC_URL + (wallpaper.miniatura ?? wallpaper.src)}
                                alt={wallpaper.alt}
                                onClick={() => selecionarPreset(wallpaper.src)}
                            />
                        ))}
                    </div>
                    {tema === TEMAS.noturno && <WallpaperEspecial aoEscolher={selecionarPreset} />}
                </div>
            )}

            {/* só aparece depois da "instalação" dos temas (notificação na barra de tarefas) */}
            {temasDisponiveis && (
                <SecaoTemas destacada={destacarTemas} aoTerminarDestaque={() => setDestacarTemas(false)} />
            )}
        </>
    )
}

// Rádio na Cena: ligado (mini player aberto) → cor do LED e volume, com um botão para desligar de vez;
// "minimizado" (fechado pelo próprio rádio, mas a música segue) → só o LED está apagado;
// desligado de verdade (sem música) → o rádio inteiro está desligado.
const Cena = ({ radioLigado, musicaTocando, corNeon, volume, aoMudarVolume, aoDesligarRadio }) => (
    <>
        <h3 className='luz-radio'>Luz do rádio</h3>
        {radioLigado && (
            <div className='config-linha'>
                <p className='texto-alterar-luz-radio'>Escolha a cor do LED do rádio:</p>
                <input className='input-cor' type='color' onChange={(evento) => corNeon(evento.target.value)} />
            </div>
        )}
        {!radioLigado && musicaTocando && (
            <p className='aviso-radio-desligado'>
                O led do rádio está <strong>desligado</strong> no momento.<br />
                Para ligar, clique no rádio na escada.
            </p>
        )}
        {!radioLigado && !musicaTocando && (
            <p className='aviso-radio-desligado'>
                O rádio está <strong>desligado</strong> no momento.<br />
                Para ligar, clique no rádio na escada.
            </p>
        )}

        {/* o volume só existe com o rádio ligado */}
        {radioLigado && (
            <>
                <h3>Volume do rádio</h3>
                <div className='config-linha'>
                    <input
                        className='config-volume'
                        type='range'
                        min='0'
                        max='1'
                        step='0.01'
                        value={volume}
                        onChange={(evento) => aoMudarVolume(Number(evento.target.value))}
                        aria-label='Volume do rádio'
                    />
                    <b className='config-valor'>{Math.round(volume * 100)}%</b>
                    {/* desliga de vez (para a música e fecha o player), igual ao botão de desligar do mini player */}
                    <button type='button' className='config-botao' onClick={aoDesligarRadio}>Desligar rádio</button>
                </div>
            </>
        )}
    </>
)

// "Sincronizar com Brasília": o tempo que fica girando antes de acertar a hora (sorteado a cada clique)
const SINCRONIZAR_MIN_MS = 500
const SINCRONIZAR_MAX_MS = 1500

const Sistema = () => {
    const { sincronizarHorarioDeBrasilia } = useSistemaTablet()
    const { idioma } = useIdioma()
    const dataAtual = useDataAtual()
    const [sincronizando, setSincronizando] = useState(false)
    const timerRef = useRef(null)
    // calendário do "Alterar": 'fechado' → 'aberto' → 'fechando' (animação) → 'fechado'
    const [calendario, setCalendario] = useState('fechado')
    const areaCalendarioRef = useRef(null)

    useEffect(() => () => clearTimeout(timerRef.current), [])

    // fecha o calendário clicando fora dele (e do botão) ou com Esc
    useEffect(() => {
        if (calendario !== 'aberto') return
        const fechar = () => setCalendario('fechando')
        const aoClicarFora = (evento) => { if (!areaCalendarioRef.current.contains(evento.target)) fechar() }
        const aoTeclar = (evento) => { if (evento.key === 'Escape') fechar() }
        document.addEventListener('mousedown', aoClicarFora)
        document.addEventListener('keydown', aoTeclar)
        return () => {
            document.removeEventListener('mousedown', aoClicarFora)
            document.removeEventListener('keydown', aoTeclar)
        }
    }, [calendario])

    const sincronizar = () => {
        if (sincronizando) return
        setSincronizando(true)
        timerRef.current = setTimeout(() => {
            sincronizarHorarioDeBrasilia()
            setSincronizando(false)
        }, aleatorioEntre(SINCRONIZAR_MIN_MS, SINCRONIZAR_MAX_MS))
    }

    return (
        <>
            <SecaoResolucao />

            <h3>Data e hora</h3>
            <div className='config-linha'>
                <b className='config-relogio'>
                    {dataAtual.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {' · '}
                    {dataAtual.toLocaleDateString(idioma, { day: '2-digit', month: 'long', year: 'numeric' })}
                </b>
                {/* "Alterar" sempre antes do "Sincronizar" */}
                <div ref={areaCalendarioRef} className='config-area-calendario'>
                    <button
                        type='button'
                        className={`config-botao ${calendario === 'aberto' ? 'ativo' : ''}`}
                        onClick={() => setCalendario(estado => (estado === 'aberto' ? 'fechando' : 'aberto'))}
                    >
                        Alterar
                    </button>
                    {/* o mesmo calendário da barra de tarefas (15% menor), flutuando no canto do Config */}
                    {calendario !== 'fechado' && (
                        <div className='config-calendario'>
                            <Calendario fechando={calendario === 'fechando'} aoTerminarDeFechar={() => setCalendario('fechado')} />
                        </div>
                    )}
                </div>
                <button type='button' className={`config-botao ${sincronizando ? 'sincronizando' : ''}`} onClick={sincronizar}>
                    <i className='config-botao-giro' aria-hidden='true'>⟳</i> Sincronizar
                </button>
            </div>

            <SecaoIdioma />

            <SecaoFormatar />
        </>
    )
}

// Config.exe: menu de ícones na esquerda (o nome aparece no hover) e a categoria escolhida na direita,
// sempre com um cabeçalho. Vindo do "Experimentar" da notificação de temas, abre direto em Personalização.
const Config = ({ fecharApp, minimizarApp, classeAnimacao, radioLigado, musicaTocando, corNeon, volume, aoMudarVolume, aoDesligarRadio }) => {
    const { tema, destacarTemas, destacarIdioma, destacarWallpaper } = useSistemaTablet()
    const [idCategoria, setIdCategoria] = useState(() => (destacarIdioma ? 'sistema' : 'personalizacao'))
    const conteudoRef = useRef(null)
    const categoria = CATEGORIAS.find(item => item.id === idCategoria)

    useEffect(() => {
        if (destacarTemas || destacarWallpaper) setIdCategoria('personalizacao')
    }, [destacarTemas, destacarWallpaper])

    // vindo da bandeja (clique em "Idioma"): abre em Sistema, e a seção de idioma rola até ela mesma
    useEffect(() => {
        if (destacarIdioma) setIdCategoria('sistema')
    }, [destacarIdioma])

    const escolher = (id) => {
        setIdCategoria(id)
        if (conteudoRef.current) conteudoRef.current.scrollTop = 0
    }

    return (
        <div className={`janela-config ${classeAnimacao}`}>
            <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_config' escura={tema === TEMAS.noturno} />

            <div className='config-corpo'>
                <nav className='config-menu' aria-label='Categorias'>
                    {CATEGORIAS.map(({ id, nome, Icone }) => (
                        <button
                            key={id}
                            type='button'
                            className={id === idCategoria ? 'ativa' : ''}
                            aria-current={id === idCategoria ? 'page' : undefined}
                            onClick={() => escolher(id)}
                        >
                            <Icone />
                            <em>{nome}</em>
                        </button>
                    ))}
                </nav>

                <div ref={conteudoRef} className='janela-configuracao-led'>
                    <div className='wrapper-configuracao' key={idCategoria}>
                        <Cabecalho categoria={categoria} />
                        {idCategoria === 'personalizacao' && <Personalizacao />}
                        {idCategoria === 'cena' && (
                            <Cena
                                radioLigado={radioLigado}
                                musicaTocando={musicaTocando}
                                corNeon={corNeon}
                                volume={volume}
                                aoMudarVolume={aoMudarVolume}
                                aoDesligarRadio={aoDesligarRadio}
                            />
                        )}
                        {idCategoria === 'sistema' && <Sistema />}
                        {idCategoria === 'sobre' && <SobreSistema />}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Config
