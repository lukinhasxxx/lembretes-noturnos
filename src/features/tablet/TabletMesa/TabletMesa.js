import './TabletMesa.css'
import { useRef } from 'react'
import EspelhoTablet from '../EspelhoTablet/EspelhoTablet'
import RastroTablet from '../RastroTablet/RastroTablet'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'

// Tablet desenhado sobre a mesinha da cena. Usado dentro de <Ancora ponto="tablet">.
// Clicar abre/fecha o modal; quando ligado, ganha um brilho azul.
// Por cima da imagem fica o espelho da tela do sistema, encaixado na telinha.
// Ao abrir/fechar, um rastro de luz liga a telinha ao modal (ligado = modal aberto).
// Primeira visita (só em tela de toque, pelo CSS): um "toque fantasma" pulsa em cima dele até a pessoa tocar.
const TabletMesa = ({ ligado, aoClicar }) => {
    const zonaRef = useRef(null)
    const [jaTocou, setJaTocou] = useEstadoPersistido('dica-tablet-vista', false)

    const clicar = (evento) => {
        setJaTocou(true)
        aoClicar(evento)
    }

    return (
        <div ref={zonaRef} className='zona-interacao-tablet' onClick={clicar}>
            {!jaTocou && !ligado && <span className='tablet-dica-toque' aria-hidden='true' />}
            <img
                className='tablet-img'
                src={process.env.PUBLIC_URL + '/imagens/tabletPNG.png'}
                alt='tablet'
                style={{
                    filter: ligado
                        ? 'drop-shadow(calc(1 * var(--px-arte)) calc(1 * var(--px-arte)) calc(3 * var(--px-arte)) #00D7FF)'
                        : 'none',
                }}
            />
            <EspelhoTablet />
            <RastroTablet aberto={ligado} tabletRef={zonaRef} />
        </div>
    )
}

export default TabletMesa
