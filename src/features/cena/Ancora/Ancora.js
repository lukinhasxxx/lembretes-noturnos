import './Ancora.css'
import { PONTOS } from '../cena.config'
import { pontoParaEstilo } from '../utils/coordenadas'

// Prende o conteúdo a um ponto da arte. Precisa estar dentro do <Palco>.
// O conteúdo (children) deve ocupar 100% da âncora; posição e tamanho vêm do cena.config.
const Ancora = ({ ponto, children }) => {
    const coordenadas = PONTOS[ponto]

    if (!coordenadas) {
        console.warn(`Ancora: ponto "${ponto}" não existe em cena.config.js`)
        return null
    }

    return (
        <div className='ancora' data-ponto={ponto} style={pontoParaEstilo(coordenadas)}>
            {children}
        </div>
    )
}

export default Ancora
