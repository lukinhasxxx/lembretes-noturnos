import './MenuIniciar.css'
import { useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { APPS } from '../../apps.config'
import { SISTEMA } from '../../tablet.config'

// apps em ordem alfabética, agrupados pela primeira letra (como a lista do Windows 10)
const agruparAppsPorLetra = () => {
    const appsEmOrdem = Object.values(APPS).sort((a, b) => a.nome.localeCompare(b.nome))
    return appsEmOrdem.reduce((grupos, app) => {
        const letra = app.nome[0].toUpperCase()
        grupos[letra] = [...(grupos[letra] ?? []), app]
        return grupos
    }, {})
}

// ícones em SVG (traço branco); mesmo desenho de pessoa da tela de boas-vindas
const IconeUsuario = () => (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
        <circle cx='12' cy='8' r='4' />
        <path d='M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7' />
    </svg>
)

const IconeEnergia = () => (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path d='M12 3v9' />
        <path d='M6.3 6.3a8 8 0 1 0 11.4 0' />
    </svg>
)

const IconeMenu = () => (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path d='M4 6h16M4 12h16M4 18h16' />
    </svg>
)

// Menu iniciar no estilo do Windows 10 com a pele do CyberOS:
// coluna de atalhos à esquerda, lista de apps no meio e blocos fixados à direita.
// aoAbrirApp(idDoApp): abre um app do apps.config.js; aoBloquear: vai para a tela de bloqueio; aoFechar: fecha o menu.
// Desligar e Reiniciar ainda não têm ação (próxima etapa: ligar no useSistemaTablet).
const MenuIniciar = ({ aoAbrirApp, aoBloquear, aoFechar }) => {
    const { t } = useIdioma()
    // popup aberto na coluna da esquerda: 'usuario', 'energia' ou null
    const [popupAberto, setPopupAberto] = useState(null)
    const appsPorLetra = agruparAppsPorLetra()

    const alternarPopup = (nomeDoPopup) =>
        setPopupAberto(popupAtual => (popupAtual === nomeDoPopup ? null : nomeDoPopup))

    const abrirApp = (idDoApp) => {
        aoAbrirApp(idDoApp)
        aoFechar()
    }

    const bloquear = () => {
        aoBloquear()
        aoFechar()
    }

    return (
        <div className='menu-iniciar'>
            <nav className='menu-iniciar-coluna'>
                <button type='button' className='menu-iniciar-atalho' title={t('menuIniciar.abrir')}>
                    <IconeMenu />
                </button>

                <div className='menu-iniciar-coluna-base'>
                    <div className='menu-iniciar-com-popup'>
                        <button
                            type='button'
                            className='menu-iniciar-atalho'
                            title={SISTEMA.usuario}
                            onClick={() => alternarPopup('usuario')}
                        >
                            <IconeUsuario />
                        </button>
                        {popupAberto === 'usuario' && (
                            <div className='menu-iniciar-popup'>
                                <span className='menu-iniciar-popup-titulo'>{SISTEMA.usuario}</span>
                                <button type='button' onClick={bloquear}>{t('menuIniciar.bloquear')}</button>
                            </div>
                        )}
                    </div>

                    <button
                        type='button'
                        className='menu-iniciar-atalho'
                        title={t('menuIniciar.configuracoes')}
                        onClick={() => abrirApp('app_config')}
                    >
                        <img src={process.env.PUBLIC_URL + APPS.app_config.icone} alt='' draggable={false} />
                    </button>

                    <div className='menu-iniciar-com-popup'>
                        <button
                            type='button'
                            className='menu-iniciar-atalho'
                            title={t('menuIniciar.energia')}
                            onClick={() => alternarPopup('energia')}
                        >
                            <IconeEnergia />
                        </button>
                        {popupAberto === 'energia' && (
                            <div className='menu-iniciar-popup'>
                                <button type='button'>{t('menuIniciar.desligar')}</button>
                                <button type='button'>{t('menuIniciar.reiniciar')}</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <section className='menu-iniciar-lista'>
                <span className='menu-iniciar-titulo-secao'>{t('menuIniciar.apps')}</span>
                {Object.entries(appsPorLetra).map(([letra, apps]) => (
                    <div key={letra}>
                        <span className='menu-iniciar-letra'>{letra}</span>
                        {apps.map(app => (
                            <button
                                key={app.id}
                                type='button'
                                className='menu-iniciar-item'
                                onClick={() => abrirApp(app.id)}
                            >
                                <img src={process.env.PUBLIC_URL + app.icone} alt='' draggable={false} />
                                <span>{app.nome}</span>
                            </button>
                        ))}
                    </div>
                ))}
            </section>

            <section className='menu-iniciar-blocos'>
                <span className='menu-iniciar-titulo-secao'>{t('menuIniciar.fixados')}</span>
                <div className='menu-iniciar-grade-blocos'>
                    {Object.values(APPS).map(app => (
                        <button
                            key={app.id}
                            type='button'
                            className='menu-iniciar-bloco'
                            onClick={() => abrirApp(app.id)}
                        >
                            <img src={process.env.PUBLIC_URL + app.icone} alt='' draggable={false} />
                            <span>{app.nome}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default MenuIniciar
