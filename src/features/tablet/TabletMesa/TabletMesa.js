import './TabletMesa.css'

// Tablet desenhado sobre a mesinha da cena. Usado dentro de <Ancora ponto="tablet">.
// Clicar abre/fecha o modal; quando ligado, ganha um brilho azul.
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
        </div>
    )
}

export default TabletMesa
