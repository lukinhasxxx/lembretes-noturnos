import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import TelaBootCyber from './TelaBootCyber'
import TelaBootNoturno from './TelaBootNoturno'

// Tela de boot: cada tema tem a sua (CyberOS = partículas → logo; NightOS = eclipse).
const TelaBoot = () => {
    const { tema } = useSistemaTablet()

    return tema === TEMAS.noturno ? <TelaBootNoturno /> : <TelaBootCyber />
}

export default TelaBoot
