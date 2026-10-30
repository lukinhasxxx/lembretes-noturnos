import './SolIniciar.css'

// grade de 16 × 16 "pixels": o miolo do sol (3 tons, do centro para a borda) e os 8 raios em volta
const LADO = 16
const CENTRO = (LADO - 1) / 2
const CORES = { miolo: '#fff3b0', meio: '#ffd166', borda: '#ffa94d', raio: '#ffe08a' }

const PIXELS_DO_SOL = []
for (let y = 0; y < LADO; y += 1) {
    for (let x = 0; x < LADO; x += 1) {
        const distancia = Math.hypot(x - CENTRO, y - CENTRO)
        if (distancia <= 1.6) PIXELS_DO_SOL.push({ x, y, cor: CORES.miolo })
        else if (distancia <= 2.8) PIXELS_DO_SOL.push({ x, y, cor: CORES.meio })
        else if (distancia <= 3.9) PIXELS_DO_SOL.push({ x, y, cor: CORES.borda })
    }
}

// raios: 2 pixels de comprimento, a 5 e 6 do centro, nas 8 direções
const PIXELS_DOS_RAIOS = Array.from({ length: 8 }, (_, indice) => {
    const angulo = (indice * Math.PI) / 4
    return [5.2, 6.4].map((distancia) => ({
        x: Math.round(CENTRO + Math.cos(angulo) * distancia - 0.5),
        y: Math.round(CENTRO + Math.sin(angulo) * distancia - 0.5),
    }))
}).flat()

// Logo do botão iniciar no PixelOS: um solzinho de pixel. Com o menu aberto, os raios giram em passos (como os
// do sol no boot). aberto: menu iniciar aberto
const SolIniciar = ({ aberto }) => (
    <svg
        className={`sol-iniciar ${aberto ? 'aberto' : ''}`}
        viewBox={`0 0 ${LADO} ${LADO}`}
        shapeRendering='crispEdges'
        aria-hidden='true'
    >
        <g className='sol-iniciar-raios'>
            {PIXELS_DOS_RAIOS.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width='1' height='1' fill={CORES.raio} />)}
        </g>
        {PIXELS_DO_SOL.map(({ x, y, cor }) => <rect key={`${x}-${y}`} x={x} y={y} width='1' height='1' fill={cor} />)}
    </svg>
)

export default SolIniciar
