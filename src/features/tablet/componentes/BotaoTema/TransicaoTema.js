import { useMemo } from 'react'
import { createPortal } from 'react-dom'

// Camada por cima da tela do tablet que faz a passagem para o tema noturno:
// - 'penumbra' (mouse em cima da lua): a sombra chega pelas bordas, sem virar o tema ainda;
// - 'carregando' (clicou): a penumbra segura uns 0.4 s;
// - 'raio': sai um raio roxo da lua atravessando a tela, o tema troca por baixo do clarão e a penumbra some.
// Fica dentro da .tablet-tela (portal), então o espelho do tablet da mesa copia junto.

const SEGMENTOS_RAIO = 11
const DESVIO_RAIO_PX = 13
const sortearEntre = (minimo, maximo) => minimo + Math.random() * (maximo - minimo)

// zigue-zague de um ponto a outro: os pontos do meio saem da linha para os dois lados
const zigueZague = ([x0, y0], [x1, y1], segmentos, desvio) => {
    const comprimento = Math.hypot(x1 - x0, y1 - y0) || 1
    const [normalX, normalY] = [-(y1 - y0) / comprimento, (x1 - x0) / comprimento]

    return Array.from({ length: segmentos + 1 }, (_, indice) => {
        const progresso = indice / segmentos
        const afastamento = indice === 0 || indice === segmentos ? 0 : sortearEntre(-desvio, desvio)
        return [x0 + (x1 - x0) * progresso + normalX * afastamento, y0 + (y1 - y0) * progresso + normalY * afastamento]
    })
}

const pontosParaTexto = (pontos) => pontos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

// o raio vai da lua para o lado oposto da tela, com um galhinho saindo do meio
const sortearRaio = (origem, largura, altura) => {
    const destino = [
        origem[0] < largura / 2 ? sortearEntre(largura * 0.7, largura) : sortearEntre(0, largura * 0.3),
        origem[1] < altura / 2 ? sortearEntre(altura * 0.65, altura) : sortearEntre(0, altura * 0.35),
    ]
    const tronco = zigueZague(origem, destino, SEGMENTOS_RAIO, DESVIO_RAIO_PX)

    const inicioGalho = tronco[4 + Math.floor(Math.random() * 3)]
    const angulo = Math.atan2(destino[1] - origem[1], destino[0] - origem[0]) + (Math.random() < 0.5 ? -0.6 : 0.6)
    const tamanhoGalho = Math.hypot(destino[0] - origem[0], destino[1] - origem[1]) * 0.28
    const fimGalho = [inicioGalho[0] + Math.cos(angulo) * tamanhoGalho, inicioGalho[1] + Math.sin(angulo) * tamanhoGalho]

    return {
        tronco: pontosParaTexto(tronco),
        galho: pontosParaTexto(zigueZague(inicioGalho, fimGalho, 4, DESVIO_RAIO_PX * 0.6)),
    }
}

const TransicaoTema = ({ tela, fase, origemRaio }) => {
    const largura = tela?.offsetWidth || 0
    const altura = tela?.offsetHeight || 0

    // sorteia um raio novo a cada clique (origemRaio muda junto)
    const raio = useMemo(
        () => (origemRaio ? sortearRaio(origemRaio, largura, altura) : null),
        [origemRaio, largura, altura]
    )

    if (!tela) return null

    return createPortal(
        <div className={`transicao-tema ${fase ? `fase-${fase}` : ''}`} aria-hidden='true'>
            <div className='transicao-tema-penumbra' />
            {fase === 'raio' && raio && (
                <>
                    <div className='transicao-tema-clarao' />
                    <svg className='transicao-tema-raio' viewBox={`0 0 ${largura} ${altura}`}>
                        <polyline points={raio.tronco} />
                        <polyline className='transicao-tema-raio-galho' points={raio.galho} />
                    </svg>
                </>
            )}
        </div>,
        tela
    )
}

export default TransicaoTema
