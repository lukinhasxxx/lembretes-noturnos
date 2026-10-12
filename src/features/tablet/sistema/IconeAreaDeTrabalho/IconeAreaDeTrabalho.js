import './IconeAreaDeTrabalho.css'
import { useState } from 'react'

const TAMANHO_DESENHO = 40 // área do desenho, em px
const ALFA_MINIMO = 20 // pixel com opacidade acima disso conta como desenho

// Lê os pixels da imagem e devolve onde está o desenho: a caixa dele (sem a sobra transparente) e o
// centro de massa (média das posições dos pixels visíveis, pesada pela opacidade).
const medirDesenho = (imagem) => {
    const canvas = document.createElement('canvas')
    canvas.width = imagem.naturalWidth
    canvas.height = imagem.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imagem, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let somaX = 0, somaY = 0, somaPesos = 0

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const alfa = data[(y * canvas.width + x) * 4 + 3]
            if (alfa <= ALFA_MINIMO) continue
            minX = Math.min(minX, x); maxX = Math.max(maxX, x)
            minY = Math.min(minY, y); maxY = Math.max(maxY, y)
            somaX += x * alfa; somaY += y * alfa; somaPesos += alfa
        }
    }

    if (!somaPesos) return null
    return {
        largura: maxX - minX + 1,
        altura: maxY - minY + 1,
        centroX: somaX / somaPesos + 0.5,
        centroY: somaY / somaPesos + 0.5,
    }
}

// Ícone da área de trabalho: o desenho de qualquer imagem fica do mesmo tamanho (o lado maior do desenho
// ocupa 40px) e com o centro de massa no meio da área — imagens com margens ou desenhos tortos ficam iguais.
// O nome vai centralizado embaixo. A caixa inteira é a área do hover/clique.
const IconeAreaDeTrabalho = ({ icone, nome, alt, aoAbrir }) => {
    const [posicao, setPosicao] = useState(null)
    const [falhouMedir, setFalhouMedir] = useState(false)

    const aoCarregar = (evento) => {
        const imagem = evento.currentTarget
        try {
            const desenho = medirDesenho(imagem)
            if (!desenho) return setFalhouMedir(true)

            const escala = TAMANHO_DESENHO / Math.max(desenho.largura, desenho.altura)
            setPosicao({
                width: imagem.naturalWidth * escala,
                height: imagem.naturalHeight * escala,
                left: TAMANHO_DESENHO / 2 - desenho.centroX * escala,
                top: TAMANHO_DESENHO / 2 - desenho.centroY * escala,
            })
        } catch {
            // se não der para ler os pixels, mostra a imagem inteira centralizada (como antes)
            setFalhouMedir(true)
        }
    }

    return (
        <div className='icone-area-de-trabalho' onClick={aoAbrir}>
            <div className='icone-area-de-trabalho-desenho'>
                <img
                    src={process.env.PUBLIC_URL + icone}
                    alt={alt}
                    draggable={false}
                    onLoad={aoCarregar}
                    className={falhouMedir ? 'sem-medida' : ''}
                    style={posicao ?? { visibility: falhouMedir ? 'visible' : 'hidden' }}
                />
            </div>
            <span>{nome}</span>
        </div>
    )
}

export default IconeAreaDeTrabalho
