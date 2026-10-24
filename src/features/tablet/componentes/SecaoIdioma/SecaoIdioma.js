import './SecaoIdioma.css'
import { useEffect, useRef, useState } from 'react'
import InstaladorIdioma from './InstaladorIdioma'
import { IDIOMAS_SISTEMA } from '../../hooks/useIdiomaSistema'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { aleatorioEntre } from '../../../../shared/utils/aleatorio'

// trocar entre idiomas já instalados: quase instantâneo, só um respiro de "aplicando"
const TROCA_MS = 200
// desinstalar é mais simples que instalar: só um "Desinstalando..." rápido na própria linha
const DESINSTALAR_MIN_MS = 700
const DESINSTALAR_MAX_MS = 1300
// vindo da bandeja: quanto tempo a seção fica acesa depois de rolar até ela
const DESTAQUE_MS = 1800

// Seção "Idioma do sistema" do Config: a lista de idiomas (como "Idiomas preferenciais" do Windows) com o
// estado de cada um. Instalado: "Usar" troca na hora e "Desinstalar" remove. Não instalado: "Instalar" abre a
// caixinha de instalação. O idioma do teclado é outro: fica na barra de tarefas.
// Ainda não traduz o site: só muda o idioma do tablet — a tradução vem depois.
const SecaoIdioma = () => {
    const {
        idiomaSistema, idiomasInstalados, idiomaDeFabrica, instalarIdioma, desinstalarIdioma, trocarIdiomaSistema,
        destacarIdioma, setDestacarIdioma,
    } = useSistemaTablet()
    const [instalando, setInstalando] = useState(null)
    // id do idioma que está aplicando / desinstalando agora (um por vez)
    const [aplicando, setAplicando] = useState(null)
    const [desinstalando, setDesinstalando] = useState(null)
    const tituloRef = useRef(null)
    const timerRef = useRef(null)
    const ocupado = aplicando !== null || desinstalando !== null

    useEffect(() => () => clearTimeout(timerRef.current), [])

    // aberto pela bandeja: rola até aqui e acende a seção um pouco
    useEffect(() => {
        if (!destacarIdioma) return
        const titulo = tituloRef.current
        const janela = titulo?.closest('.janela-configuracao-led')
        if (janela) janela.scrollTo({ top: titulo.offsetTop - 12, behavior: 'smooth' })
        const timer = setTimeout(() => setDestacarIdioma(false), DESTAQUE_MS)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destacarIdioma])

    const usar = (id) => {
        setAplicando(id)
        timerRef.current = setTimeout(() => {
            trocarIdiomaSistema(id)
            setAplicando(null)
        }, TROCA_MS)
    }

    const desinstalar = (id) => {
        setDesinstalando(id)
        timerRef.current = setTimeout(() => {
            desinstalarIdioma(id)
            setDesinstalando(null)
        }, aleatorioEntre(DESINSTALAR_MIN_MS, DESINSTALAR_MAX_MS))
    }

    const concluirInstalacao = () => {
        instalarIdioma(instalando.id)
        setInstalando(null)
    }

    const estadoDoIdioma = (id, instalado, emUso) => {
        if (desinstalando === id) return 'Desinstalando...'
        if (emUso) return 'Em uso'
        return instalado ? 'Instalado' : 'Não instalado'
    }

    return (
        <>
            <h3 ref={tituloRef}>Idioma do sistema</h3>
            <ul className={`lista-idiomas ${destacarIdioma ? 'destacada' : ''}`}>
                {Object.values(IDIOMAS_SISTEMA).map(idioma => {
                    const instalado = idiomasInstalados.includes(idioma.id)
                    const emUso = idioma.id === idiomaSistema.id
                    const podeDesinstalar = instalado && !emUso && idioma.id !== idiomaDeFabrica
                    return (
                        <li key={idioma.id} className={emUso ? 'em-uso' : ''}>
                            <b className='lista-idiomas-sigla'>{idioma.sigla}</b>
                            <div className='lista-idiomas-textos'>
                                <b>{idioma.nome}</b>
                                <small className={desinstalando === idioma.id ? 'lista-idiomas-trabalhando' : ''}>
                                    {estadoDoIdioma(idioma.id, instalado, emUso)}
                                </small>
                            </div>
                            {podeDesinstalar && (
                                <button type='button' className='config-botao config-botao-discreto' disabled={ocupado} onClick={() => desinstalar(idioma.id)}>
                                    Desinstalar
                                </button>
                            )}
                            {!emUso && (
                                <button
                                    type='button'
                                    className={`config-botao ${aplicando === idioma.id ? 'lista-idiomas-trabalhando' : ''}`}
                                    disabled={ocupado}
                                    onClick={() => (instalado ? usar(idioma.id) : setInstalando(idioma))}
                                >
                                    {aplicando === idioma.id ? 'Aplicando...' : instalado ? 'Usar' : 'Instalar'}
                                </button>
                            )}
                        </li>
                    )
                })}
            </ul>

            {instalando && (
                <InstaladorIdioma idioma={instalando} aoConcluir={concluirInstalacao} aoCancelar={() => setInstalando(null)} />
            )}
        </>
    )
}

export default SecaoIdioma
