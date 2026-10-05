import './TelaBoasVindas.css'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { SISTEMA } from '../../tablet.config'

// Tela "Bem-vindo" depois do boot: wallpaper atual desfocado, avatar, nome do usuário e o spinner de pontinhos.
// A futura tela de bloqueio vai reaproveitar este visual.
// wallpaper: url da imagem de fundo (a mesma da área de trabalho)
const TelaBoasVindas = ({ wallpaper }) => {
    const { t } = useIdioma()

    return (
        <div className='tela-boas-vindas'>
            <div className='tela-boas-vindas-fundo' style={{ backgroundImage: `url(${wallpaper})` }} />

            <div className='tela-boas-vindas-avatar'>
                {/* ícone de pessoa: cabeça + ombros */}
                <svg viewBox='0 0 64 64' aria-hidden='true'>
                    <circle cx='32' cy='22' r='12' />
                    <path d='M10 56c2-12 11-18 22-18s20 6 22 18' />
                </svg>
            </div>

            <p className='tela-boas-vindas-usuario'>{SISTEMA.usuario}</p>

            <div className='tela-boas-vindas-status'>
                <div className='spinner-pontos'>
                    {[0, 1, 2, 3, 4].map(indice => (
                        <span key={indice} style={{ '--indice-ponto': indice }} />
                    ))}
                </div>
                <span>{t('sistema.boasVindas')}</span>
            </div>
        </div>
    )
}

export default TelaBoasVindas
