import { useEffect, useState } from 'react'

// Choquezinho na lua enquanto ela se ajusta (os ~2 s do hover): raios em zigue-zague que pulam de lugar.
// A cada piscada aparecem de 1 a 3 raios em pontos sorteados da borda (às vezes um atravessando a face
// da lua); entre as piscadas, nada. Começa de novo a cada vez que o mouse entra (semente muda).

const TAMANHO = 53 // mesmo tamanho do botão
const CENTRO = TAMANHO / 2
const RAIO_LUA = 22
const DURACAO_MS = 2000
const PISCADA_MS = [60, 130] // quanto tempo um raio fica aceso (mín, máx)
const PAUSA_MS = [70, 220] // quanto tempo fica apagado entre piscadas (mín, máx)
const CHANCE_RAIO_NA_FACE = 0.25
const DESVIO_PX = 2.6 // quanto o zigue-zague sai da linha, para os dois lados

const sortearEntre = ([minimo, maximo]) => minimo + Math.random() * (maximo - minimo)

const pontosParaTexto = (pontos) => pontos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

// raio colado na borda: um pedaço de arco (~25° a 50°) com zigue-zague
const sortearRaioNaBorda = () => {
    const anguloInicial = Math.random() * Math.PI * 2
    const abertura = 0.45 + Math.random() * 0.45
    const totalPontos = 5 + Math.floor(Math.random() * 3)

    return pontosParaTexto(Array.from({ length: totalPontos }, (_, indice) => {
        const angulo = anguloInicial + (indice / (totalPontos - 1)) * abertura
        const raio = RAIO_LUA + (indice % 2 === 0 ? 1 : -1) * Math.random() * DESVIO_PX
        return [CENTRO + Math.cos(angulo) * raio, CENTRO + Math.sin(angulo) * raio]
    }))
}

// raio curto atravessando a face: de um ponto perto da borda em direção ao centro
const sortearRaioNaFace = () => {
    const angulo = Math.random() * Math.PI * 2
    const inicio = [CENTRO + Math.cos(angulo) * RAIO_LUA * 0.9, CENTRO + Math.sin(angulo) * RAIO_LUA * 0.9]
    const fim = [CENTRO + Math.cos(angulo) * RAIO_LUA * 0.2, CENTRO + Math.sin(angulo) * RAIO_LUA * 0.2]
    const totalPontos = 5

    return pontosParaTexto(Array.from({ length: totalPontos }, (_, indice) => {
        const progresso = indice / (totalPontos - 1)
        const desvio = indice === 0 || indice === totalPontos - 1 ? 0 : (Math.random() * 2 - 1) * DESVIO_PX * 1.4
        return [
            inicio[0] + (fim[0] - inicio[0]) * progresso - Math.sin(angulo) * desvio,
            inicio[1] + (fim[1] - inicio[1]) * progresso + Math.cos(angulo) * desvio,
        ]
    }))
}

const sortearPiscada = () => {
    const totalRaios = 1 + Math.floor(Math.random() * 3)
    return Array.from({ length: totalRaios }, () =>
        Math.random() < CHANCE_RAIO_NA_FACE ? sortearRaioNaFace() : sortearRaioNaBorda()
    )
}

const ChoqueLua = ({ semente }) => {
    const [raios, setRaios] = useState([])

    useEffect(() => {
        if (!semente) {
            setRaios([])
            return
        }

        const inicio = performance.now()
        let timer

        // alterna: piscada (raios em lugares novos) → pausa (nada) → piscada... até dar os 2 s
        const piscar = () => {
            if (performance.now() - inicio > DURACAO_MS) {
                setRaios([])
                return
            }
            setRaios(sortearPiscada())
            timer = setTimeout(() => {
                setRaios([])
                timer = setTimeout(piscar, sortearEntre(PAUSA_MS))
            }, sortearEntre(PISCADA_MS))
        }

        timer = setTimeout(piscar, sortearEntre(PAUSA_MS))
        return () => clearTimeout(timer)
    }, [semente])

    return (
        <svg className='choque-lua' viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} aria-hidden='true'>
            {raios.map((pontos, indice) => (
                <polyline key={indice} className='choque-lua-arco' points={pontos} />
            ))}
        </svg>
    )
}

export default ChoqueLua
