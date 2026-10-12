import { createContext, useContext, useState } from 'react'
import { useEstadoSistema } from '../hooks/useEstadoSistema'
import { useAreaDeTrabalho } from '../hooks/useAreaDeTrabalho'
import { useWallpaperSistema } from '../hooks/useWallpaperSistema'
import { useTemaSistema } from '../hooks/useTemaSistema'
import { useNotificacoesSistema } from '../hooks/useNotificacoesSistema'
import { useRelogioSistema } from '../hooks/useRelogioSistema'

// Tudo que o sistema do tablet "é" num lugar só: estado (ligado, boot, bloqueado...), área de trabalho
// (tela na frente, apps abertos), wallpaper, tema, notificações e relógio. O modal e o tablet da mesa (espelho) leem daqui,
// então os dois mostram sempre a mesma coisa.
const SistemaTabletContext = createContext(null)

export const SistemaTabletProvider = ({ children }) => {
    const estado = useEstadoSistema()
    const areaDeTrabalho = useAreaDeTrabalho(estado.estadoSistema)
    const tema = useTemaSistema()
    const wallpaper = useWallpaperSistema(tema.tema)
    const notificacoes = useNotificacoesSistema(estado.estadoSistema, tema.tema)
    const relogio = useRelogioSistema()
    // elemento da tela do modal (.tablet-tela): o espelho da mesa copia o HTML dele.
    // Fica em state (e não em ref) para o espelho começar assim que o modal aparece pela primeira vez.
    const [telaDoModal, registrarTelaDoModal] = useState(null)

    return (
        <SistemaTabletContext.Provider
            value={{ ...estado, ...areaDeTrabalho, ...wallpaper, ...tema, ...notificacoes, ...relogio, telaDoModal, registrarTelaDoModal }}
        >
            {children}
        </SistemaTabletContext.Provider>
    )
}

export const useSistemaTablet = () => useContext(SistemaTabletContext)
