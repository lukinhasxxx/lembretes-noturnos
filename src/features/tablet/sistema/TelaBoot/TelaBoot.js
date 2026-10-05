import './TelaBoot.css'
import LogoSistema from '../LogoSistema/LogoSistema'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { DURACAO_BOOT_MS, SISTEMA } from '../../tablet.config'

// Cada partícula estaciona no centro de um quadrado do logo (ângulo + distância a partir do meio,
// medidos no .tela-boot-centro de 110px) e depois cruza para a diagonal oposta: 1 ↔ 4, 2 ↔ 3.
// escalaFinal: quanto a bolinha (8px) cresce ao virar quadrado, igual ao tamanho do quadrado onde ela chega
// (os da direita são maiores por causa da perspectiva).
// Se o desenho do LogoSistema mudar, esses números precisam acompanhar.
const PARTICULAS = [
    { id: 1, anguloFinal: '217deg', raioFinal: '21px', escalaFinal: 3.8, cor: '#6ef0ff' }, // estaciona em cima/esquerda → vai para baixo/direita
    { id: 2, anguloFinal: '315deg', raioFinal: '23px', escalaFinal: 3.1, cor: '#ff4fd8' }, // em cima/direita → baixo/esquerda
    { id: 3, anguloFinal: '145deg', raioFinal: '21px', escalaFinal: 3.8, cor: '#b98cff' }, // embaixo/esquerda → cima/direita
    { id: 4, anguloFinal: '43deg', raioFinal: '22px', escalaFinal: 3.1, cor: '#ffe45c' },  // embaixo/direita → cima/esquerda
]

// Tela de boot do sistema do tablet. Os tempos das animações são frações de --duracao-boot (vem do config).
const TelaBoot = () => {
    const { t } = useIdioma()

    return (
        <div className='tela-boot' style={{ '--duracao-boot': `${DURACAO_BOOT_MS}ms` }}>
            <div className='tela-boot-centro'>
                {PARTICULAS.map(particula => (
                    <span
                        key={particula.id}
                        className='tela-boot-particula'
                        style={{
                            '--angulo-final': particula.anguloFinal,
                            '--raio-final': particula.raioFinal,
                            '--escala-final': particula.escalaFinal,
                            '--cor-particula': particula.cor,
                        }}
                    />
                ))}
                <LogoSistema className='tela-boot-logo' />
                {/* cópias do logo que dão o glitch (mesmo efeito do botão "Wallpapers") quando ele pisca */}
                <LogoSistema className='tela-boot-logo-glitch' />
                <LogoSistema className='tela-boot-logo-glitch tela-boot-logo-glitch-reverso' />
            </div>

            <p className='tela-boot-texto'>{t('sistema.iniciando', { sistema: SISTEMA.nome })}</p>
            <div className='tela-boot-barra' />
        </div>
    )
}

export default TelaBoot
