import { useDataAtual } from '../../hooks/useDataAtual'
import { useIdioma } from '../../../../shared/i18n/Idioma'

// Hora e data do sistema, atualizadas a cada segundo, no formato do idioma atual (como a tela de bloqueio).
// O visual vem do botão da barra de tarefas onde ele fica.
const Relogio = () => {
    const dataAtual = useDataAtual()
    const { idioma } = useIdioma()

    return (
        <>
            <span>{dataAtual.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{dataAtual.toLocaleDateString(idioma)}</span>
        </>
    )
}

export default Relogio
