import './TabletMesa.css'
import EspelhoTablet from '../EspelhoTablet/EspelhoTablet'

// Tablet desenhado sobre a mesinha da cena. Usado dentro de <Ancora ponto="tablet">.
// Clicar abre/fecha o modal; quando ligado, ganha um brilho azul.
// Por cima da imagem fica o espelho da tela do sistema, encaixado na telinha.
const TabletMesa = ({ ligado, aoClicar }) => {
    return (
        <div className='zona-interacao-tablet' onClick={aoClicar}>
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
        </div>
    )
}

export default TabletMesa
