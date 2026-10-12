import { useEffect, useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import { ESTADOS_SISTEMA } from '../tablet.config'
import { TEMAS } from './useTemaSistema'

// "instalação" dos temas na primeira vez que a pessoa chega na área de trabalho:
// espera um pouco, avisa que está instalando e, depois de ~10 s, que o tema noturno está pronto
const ESPERA_ANTES_DE_INSTALAR_MS = 3000
const DURACAO_INSTALACAO_MS = 10000
// quanto tempo o balão (a notificação que sobe sozinha na bandeja) fica na tela
export const DURACAO_BALAO_MS = 7000

export const ID_NOTIFICACAO_TEMAS = 'temas'

// Notificações do sistema do tablet (central da barra de tarefas + balão) e a instalação dos temas.
// Cada notificação: { id, titulo, texto, progresso?: true, acao?: 'experimentarTema', rotuloAcao? }
// (titulo, texto e rotuloAcao são chaves do i18n; quem trata a ação é a barra de tarefas).
// temasDisponiveis: a seção de temas do Config só aparece depois da instalação (fica salvo no navegador;
// quem já estava com um tema ligado antes disso conta como instalado).
export const useNotificacoesSistema = (estadoSistema, tema) => {
    const [temasInstalados, setTemasInstalados] = useEstadoPersistido('temas-instalados', false)
    const temasDisponiveis = temasInstalados || tema !== TEMAS.padrao
    const [notificacoes, setNotificacoes] = useState([])
    // id da notificação que está aparecendo como balão (null = nenhum)
    const [balao, setBalao] = useState(null)
    // "Experimentar": o Config abre com a seção de temas destacada
    const [destacarTemas, setDestacarTemas] = useState(false)

    // adiciona ou atualiza (mesmo id: troca o conteúdo no lugar, ex.: "instalando" → "instalado") e mostra no balão
    const notificar = (notificacao) => {
        setNotificacoes(lista => [notificacao, ...lista.filter(item => item.id !== notificacao.id)])
        setBalao(notificacao.id)
    }

    const removerNotificacao = (id) => {
        setNotificacoes(lista => lista.filter(item => item.id !== id))
        setBalao(atual => (atual === id ? null : atual))
    }

    const limparNotificacoes = () => {
        setNotificacoes([])
        setBalao(null)
    }

    const esconderBalao = () => setBalao(null)

    // sai da área de trabalho (bloqueou, desligou...) no meio da instalação: começa de novo na próxima vez
    useEffect(() => {
        if (temasDisponiveis || estadoSistema !== ESTADOS_SISTEMA.areaDeTrabalho) return

        const comecar = setTimeout(() => notificar({
            id: ID_NOTIFICACAO_TEMAS,
            titulo: 'notificacoes.instalandoTemas',
            texto: 'notificacoes.instalandoTemasTexto',
            progresso: true,
        }), ESPERA_ANTES_DE_INSTALAR_MS)

        const terminar = setTimeout(() => {
            setTemasInstalados(true)
            notificar({
                id: ID_NOTIFICACAO_TEMAS,
                titulo: 'notificacoes.temaInstalado',
                texto: 'notificacoes.temaInstaladoTexto',
                acao: 'experimentarTema',
                rotuloAcao: 'notificacoes.experimentar',
            })
        }, ESPERA_ANTES_DE_INSTALAR_MS + DURACAO_INSTALACAO_MS)

        return () => {
            clearTimeout(comecar)
            clearTimeout(terminar)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoSistema, temasDisponiveis])

    // o balão some sozinho depois de um tempo (o de "instalando" fica até virar "instalado")
    const notificacaoDoBalao = notificacoes.find(item => item.id === balao)
    useEffect(() => {
        if (!notificacaoDoBalao || notificacaoDoBalao.progresso) return
        const timer = setTimeout(() => setBalao(null), DURACAO_BALAO_MS)
        return () => clearTimeout(timer)
    }, [notificacaoDoBalao])

    // sistema ligando (de novo): a central começa vazia, como num computador de verdade
    useEffect(() => {
        if (estadoSistema === ESTADOS_SISTEMA.ligando) limparNotificacoes()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoSistema])

    return {
        notificacoes,
        notificacaoDoBalao,
        removerNotificacao,
        limparNotificacoes,
        esconderBalao,
        temasDisponiveis,
        destacarTemas,
        setDestacarTemas,
    }
}
