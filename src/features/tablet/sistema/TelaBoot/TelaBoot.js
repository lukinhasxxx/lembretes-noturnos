import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import TelaBootCyber from './TelaBootCyber'
import TelaBootNoturno from './TelaBootNoturno'
import TelaBootPixel from './TelaBootPixel'

const BOOT_POR_TEMA = {
    [TEMAS.padrao]: TelaBootCyber,
    [TEMAS.noturno]: TelaBootNoturno,
    [TEMAS.pixel]: TelaBootPixel,
}

// Tela de boot: cada tema tem a sua (CyberOS = partículas → logo; NightOS = eclipse; PixelOS = janela com o sol
// nascendo que vira o "O" do nome).
const TelaBoot = () => {
    const { tema } = useSistemaTablet()
    const Boot = BOOT_POR_TEMA[tema] ?? TelaBootCyber

    return <Boot />
}

export default TelaBoot
