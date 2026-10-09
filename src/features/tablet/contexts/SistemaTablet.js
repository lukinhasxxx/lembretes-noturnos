import { createContext, useContext } from 'react'
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

    return (
        <SistemaTabletContext.Provider value={{ ...estado, ...areaDeTrabalho, ...wallpaper }}>
            {children}
        </SistemaTabletContext.Provider>
    )
}

export const useSistemaTablet = () => useContext(SistemaTabletContext)
