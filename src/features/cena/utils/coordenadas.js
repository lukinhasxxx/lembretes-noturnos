import { CENA } from '../cena.config'

const porcentagem = (valor, total) => `${(valor / total) * 100}%`

// Converte um ponto em pixels da arte para posição/tamanho em % do palco.
export const pontoParaEstilo = ({ x, y, largura, altura }) => ({
    left: porcentagem(x, CENA.largura),
    top: porcentagem(y, CENA.altura),
    width: porcentagem(largura, CENA.largura),
    height: porcentagem(altura, CENA.altura),
})
