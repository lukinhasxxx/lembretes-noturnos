import { createContext, useContext, useState } from 'react'
import { useEstadoSistema } from '../hooks/useEstadoSistema'
import { useAreaDeTrabalho } from '../hooks/useAreaDeTrabalho'
import { useWallpaperSistema } from '../hooks/useWallpaperSistema'
import { TEMAS, useTemaSistema } from '../hooks/useTemaSistema'
import { useNotificacoesSistema } from '../hooks/useNotificacoesSistema'
import { useRelogioSistema } from '../hooks/useRelogioSistema'
import { useResolucaoTablet } from '../hooks/useResolucaoTablet'
import { useIdiomaSistema } from '../hooks/useIdiomaSistema'

// Tudo que o sistema do tablet "é" num lugar só: estado (ligado, boot, bloqueado...), área de trabalho
// (tela na frente, apps abertos), wallpaper, tema, notificações, relógio, resolução (tamanho do modal) e idioma do sistema. O modal e o tablet da mesa (espelho) leem daqui,
// então os dois mostram sempre a mesma coisa.
const SistemaTabletContext = createContext(null)

// animação das janelas por tema (o CSS de cada uma fica no ModalTablet.css):
// original — encolhe até o ícone (minimizar/restaurar); noturno — abre e fecha em círculo, inclusive ao abrir um app
const ANIMACAO_JANELA_POR_TEMA = {
    [TEMAS.padrao]: {},
    [TEMAS.noturno]: { duracaoAnimacaoMs: 340, animarAoAbrir: true },
}

export const SistemaTabletProvider = ({ children }) => {
    const estado = useEstadoSistema()
    const tema = useTemaSistema()
    // o jeito de abrir/minimizar as janelas muda com o tema (no noturno: em círculo, como uma lua)
    const areaDeTrabalho = useAreaDeTrabalho(estado.estadoSistema, ANIMACAO_JANELA_POR_TEMA[tema.tema])
    const wallpaper = useWallpaperSistema(tema.tema)
    const notificacoes = useNotificacoesSistema(estado.estadoSistema, tema.tema)
    const relogio = useRelogioSistema()
    const resolucao = useResolucaoTablet()
    const idiomaSistema = useIdiomaSistema()
    // elemento da tela do modal (.tablet-tela): o espelho da mesa copia o HTML dele.
    // Fica em state (e não em ref) para o espelho começar assim que o modal aparece pela primeira vez.
    const [telaDoModal, registrarTelaDoModal] = useState(null)

    return (
        <SistemaTabletContext.Provider
            value={{ ...estado, ...areaDeTrabalho, ...wallpaper, ...tema, ...notificacoes, ...relogio, ...resolucao, ...idiomaSistema, telaDoModal, registrarTelaDoModal }}
        >
            {children}
        </SistemaTabletContext.Provider>
    )
}

export const useSistemaTablet = () => useContext(SistemaTabletContext)
