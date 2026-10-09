import { createContext, useContext, useState } from 'react'
import { useEstadoSistema } from '../hooks/useEstadoSistema'
import { useAreaDeTrabalho } from '../hooks/useAreaDeTrabalho'
import { useWallpaperSistema } from '../hooks/useWallpaperSistema'

// Tudo que o sistema do tablet "é" num lugar só: estado (ligado, boot, bloqueado...), área de trabalho
// (tela na frente, apps abertos) e wallpaper. O modal e o tablet da mesa (espelho) leem daqui,
// então os dois mostram sempre a mesma coisa.
const SistemaTabletContext = createContext(null)

export const SistemaTabletProvider = ({ children }) => {
    const estado = useEstadoSistema()
    const areaDeTrabalho = useAreaDeTrabalho(estado.estadoSistema)
    const wallpaper = useWallpaperSistema()
    // elemento da tela do modal (.tablet-tela): o espelho da mesa copia o HTML dele.
    // Fica em state (e não em ref) para o espelho começar assim que o modal aparece pela primeira vez.
    const [telaDoModal, registrarTelaDoModal] = useState(null)

    return (
        <SistemaTabletContext.Provider
            value={{ ...estado, ...areaDeTrabalho, ...wallpaper, telaDoModal, registrarTelaDoModal }}
        >
            {children}
        </SistemaTabletContext.Provider>
    )
}

export const useSistemaTablet = () => useContext(SistemaTabletContext)
