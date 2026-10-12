import './Notificacoes.css'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { NOME_SISTEMA_POR_TEMA } from '../../tablet.config'
import PainelBandeja from '../PainelBandeja/PainelBandeja'

// Uma notificação: de onde veio + "agora", título, texto, barrinha (enquanto está em andamento) e botão de ação.
// aoFechar: o "×" do canto; aoAgir(acao): botão de ação (ex.: "Experimentar")
const CartaoNotificacao = ({ notificacao, aoFechar, aoAgir }) => {
    const { t } = useIdioma()
    const { tema } = useSistemaTablet()
    const { titulo, texto, progresso, acao, rotuloAcao } = notificacao

    return (
        <div className={`cartao-notificacao ${progresso ? 'em-andamento' : ''}`}>
            <div className='cartao-notificacao-origem'>
                <span>{NOME_SISTEMA_POR_TEMA[tema] ?? NOME_SISTEMA_POR_TEMA.padrao} · {t('notificacoes.agora')}</span>
                <button type='button' className='cartao-notificacao-fechar' title={t('notificacoes.fechar')} onClick={aoFechar}>×</button>
            </div>
            <div className='cartao-notificacao-titulo'>{t(titulo)}</div>
            <div className='cartao-notificacao-texto'>{t(texto)}</div>
            {progresso && <div className='cartao-notificacao-progresso' />}
            {acao && (
                <button type='button' className='cartao-notificacao-acao' onClick={() => aoAgir(acao)}>
                    {t(rotuloAcao)}
                </button>
            )}
        </div>
    )
}

// Central de notificações (clique no ícone do canto da barra): lista com rolagem, "×" em cada uma e "Limpar tudo".
export const CentralDeNotificacoes = ({ aoAgir, ...painel }) => {
    const { t } = useIdioma()
    const { notificacoes, removerNotificacao, limparNotificacoes } = useSistemaTablet()

    return (
        <PainelBandeja className='central-notificacoes' {...painel}>
            <div className='central-notificacoes-cabecalho'>
                <span className='painel-bandeja-titulo'>{t('notificacoes.titulo')}</span>
                {notificacoes.length > 0 && (
                    <button type='button' className='central-notificacoes-limpar' onClick={limparNotificacoes}>
                        {t('notificacoes.limparTudo')}
                    </button>
                )}
            </div>

            {notificacoes.length === 0 ? (
                <div className='central-notificacoes-vazia'>{t('notificacoes.vazio')}</div>
            ) : (
                <div className='central-notificacoes-lista'>
                    {notificacoes.map(notificacao => (
                        <CartaoNotificacao
                            key={notificacao.id}
                            notificacao={notificacao}
                            aoFechar={() => removerNotificacao(notificacao.id)}
                            aoAgir={aoAgir}
                        />
                    ))}
                </div>
            )}
        </PainelBandeja>
    )
}

// Balão: a notificação nova sobe sozinha acima da bandeja e some depois de alguns segundos.
// O de "instalando" vira o de "instalado" no mesmo lugar (mesmo id = mesmo balão, só troca o conteúdo).
export const BalaoNotificacao = ({ aoAgir }) => {
    const { notificacaoDoBalao, esconderBalao } = useSistemaTablet()
    if (!notificacaoDoBalao) return null

    return (
        <div className='balao-notificacao'>
            <CartaoNotificacao notificacao={notificacaoDoBalao} aoFechar={esconderBalao} aoAgir={aoAgir} />
        </div>
    )
}
