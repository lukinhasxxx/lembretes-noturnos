import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'
import { RESOLUCOES_TABLET, RESOLUCAO_PADRAO } from '../../hud'

// Resolução (tamanho na tela) do modal do tablet, escolhida no Config e salva entre visitas.
// resolucaoTablet: { id, fator, rotulo } (ver RESOLUCOES_TABLET no hud.config.js)
export const useResolucaoTablet = () => {
    const [idSalvo, setResolucaoTablet] = useEstadoPersistido('resolucao-tablet', RESOLUCAO_PADRAO)
    const resolucaoTablet = RESOLUCOES_TABLET.find(opcao => opcao.id === idSalvo)
        ?? RESOLUCOES_TABLET.find(opcao => opcao.id === RESOLUCAO_PADRAO)

    return { resolucaoTablet, setResolucaoTablet }
}
