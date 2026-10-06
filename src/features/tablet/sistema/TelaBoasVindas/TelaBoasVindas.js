import './TelaBoasVindas.css'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { SISTEMA } from '../../tablet.config'

// Tela do usuário: wallpaper atual desfocado, avatar e nome. Embaixo do nome muda conforme a etapa:
// - 'boasVindas': spinner + "Bem-vindo" (depois do boot)
// - 'login': botão "Entrar" (depois de tirar a tela de bloqueio)
// - 'aguarde': spinner + "Aguarde..." (depois do "Entrar")
// wallpaper: url da imagem de fundo (a mesma da área de trabalho); aoEntrar: clique no "Entrar"
const TelaBoasVindas = ({ wallpaper, etapa = 'boasVindas', aoEntrar }) => {
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

            {etapa === 'login' ? (
                <button type='button' className='tela-boas-vindas-entrar' onClick={aoEntrar}>
                    {t('sistema.entrar')}
                </button>
            ) : (
                <div className='tela-boas-vindas-status'>
                    <div className='spinner-pontos'>
                        {[0, 1, 2, 3, 4].map(indice => (
                            <span key={indice} style={{ '--indice-ponto': indice }} />
                        ))}
                    </div>
                    <span>{t(etapa === 'aguarde' ? 'sistema.aguarde' : 'sistema.boasVindas')}</span>
                </div>
            )}
        </div>
    )
}

export default TelaBoasVindas
