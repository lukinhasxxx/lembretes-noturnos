import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import TelaBootCyber from './TelaBootCyber'
import TelaBootNoturno from './TelaBootNoturno'
import TelaBootPixel from './TelaBootPixel'
import PassagemPixel from './PassagemPixel'

const BOOT_POR_TEMA = {
    [TEMAS.padrao]: TelaBootCyber,
    [TEMAS.noturno]: TelaBootNoturno,
    [TEMAS.pixel]: TelaBootPixel,
}

// Tela de boot: cada tema tem a sua (CyberOS = partículas → logo; NightOS = eclipse; PixelOS = janela com o sol
// nascendo que vira o "O" do nome). O 1º boot depois de entrar no PixelOS ou sair dele é a passagem (bootDaVez).
// tema (opcional): mostra o boot desse tema, sem passagem (é o que a própria passagem usa por dentro)
const TelaBoot = ({ tema: temaForcado }) => {
    const { tema, bootDaVez } = useSistemaTablet()

    if (!temaForcado && bootDaVez) return <PassagemPixel tipo={bootDaVez.tipo} temaDoBoot={bootDaVez.temaDoBoot} />
    const Boot = BOOT_POR_TEMA[temaForcado ?? tema] ?? TelaBootCyber
    return <Boot />
}

export default TelaBoot
