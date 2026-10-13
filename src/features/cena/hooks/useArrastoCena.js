import { useCallback, useEffect, useRef, useState } from 'react'
import { CENA, PARADAS_CELULAR, PARADA_INICIAL_CELULAR } from '../cena.config'
import { vibrar } from '../../../shared/utils/vibrar'

// movimento mínimo (px da tela) para o toque virar arraste (abaixo disso continua sendo um toque/clique)
const LIMIAR_ARRASTE_PX = 8
// soltou mais rápido que isso (px da tela por ms): "flick", a cena desliza até a próxima parada
const VELOCIDADE_FLICK = 0.35
// tempo do deslize até uma parada
const TRANSICAO_PARADA = 'transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1)'
// margem (px da arte) para considerar que ainda tem cena para um lado
const FOLGA_BORDA = 4

const xInicial = PARADAS_CELULAR.find(parada => parada.nome === PARADA_INICIAL_CELULAR).x

// Celular em pé: a cena fica mais larga que a tela e a pessoa arrasta para os lados com o dedo.
// Devagar a cena acompanha e fica onde soltou; rápido ela desliza até a próxima parada (PARADAS_CELULAR).
// Escreve direto no style do palco (como o usePontoFocal, que fica desligado enquanto este está ativo).
// Devolve quais lados ainda têm cena (para as luzinhas das bordas) e irPara(direção): -1 esquerda, 1 direita.
// foco: { parada, vez } — quando muda, a cena desliza sozinha até essa parada (ex.: o painel, ao mandar um lembrete);
// "vez" só serve para o mesmo pedido poder se repetir.
export const useArrastoCena = (palcoRef, ativo, foco) => {
    // meio da tela, em px da arte
    const centroRef = useRef(xInicial)
    const [lados, setLados] = useState({ esquerda: false, direita: false })

    // px da tela por px da arte, e quanto da arte cabe na largura da tela
    const medir = useCallback(() => {
        const escala = palcoRef.current.offsetWidth / CENA.largura
        return { escala, visivel: window.innerWidth / escala }
    }, [palcoRef])

    const limitar = useCallback((x) => {
        const { visivel } = medir()
        return Math.min(Math.max(x, visivel / 2), CENA.largura - visivel / 2)
    }, [medir])

    // posiciona o palco com o ponto x da arte no meio da tela (com ou sem deslize)
    const aplicar = useCallback((x, comTransicao = false) => {
        const palco = palcoRef.current
        const { escala, visivel } = medir()
        const centro = limitar(x)
        centroRef.current = centro

        palco.style.transition = comTransicao ? TRANSICAO_PARADA : 'none'
        palco.style.transform = `translate(calc(-50% + ${(CENA.largura / 2 - centro) * escala}px), -50%)`

        const esquerda = centro - visivel / 2 > FOLGA_BORDA
        const direita = CENA.largura - (centro + visivel / 2) > FOLGA_BORDA
        setLados(atual => (atual.esquerda === esquerda && atual.direita === direita ? atual : { esquerda, direita }))
    }, [palcoRef, medir, limitar])

    // próxima parada a partir do meio atual, na direção pedida (-1 esquerda, 1 direita); sem parada, vai até a borda
    const irPara = useCallback((direcao) => {
        const centro = centroRef.current
        const candidatas = PARADAS_CELULAR
            .map(parada => limitar(parada.x))
            .filter(x => (direcao > 0 ? x > centro + FOLGA_BORDA : x < centro - FOLGA_BORDA))
        const destino = candidatas.length
            ? (direcao > 0 ? Math.min(...candidatas) : Math.max(...candidatas))
            : (direcao > 0 ? CENA.largura : 0)
        // vibraçãozinha ao grudar numa parada
        if (Math.abs(limitar(destino) - centro) > FOLGA_BORDA) vibrar()
        aplicar(destino, true)
    }, [aplicar, limitar])

    useEffect(() => {
        if (!ativo) return
        const palco = palcoRef.current
        let toque = null

        aplicar(centroRef.current)

        const aoTocar = (evento) => {
            if (evento.pointerType === 'mouse') return
            toque = {
                inicioX: evento.clientX,
                centroInicial: centroRef.current,
                arrastando: false,
                // últimas posições, para medir a velocidade na hora de soltar
                amostras: [{ x: evento.clientX, t: evento.timeStamp }],
            }
        }

        const aoMover = (evento) => {
            if (!toque) return
            const deslocamento = evento.clientX - toque.inicioX
            if (!toque.arrastando && Math.abs(deslocamento) < LIMIAR_ARRASTE_PX) return

            toque.arrastando = true
            toque.amostras = [...toque.amostras.slice(-4), { x: evento.clientX, t: evento.timeStamp }]
            aplicar(toque.centroInicial - deslocamento / medir().escala)
        }

        const aoSoltar = (evento) => {
            if (!toque) return
            const { arrastando, amostras } = toque
            toque = null
            if (!arrastando || evento.type === 'pointercancel') return

            // o toque que terminou num arraste não vale como clique (não liga o rádio, não abre o tablet...)
            const engolirClique = (clique) => { clique.stopPropagation(); clique.preventDefault() }
            window.addEventListener('click', engolirClique, { capture: true, once: true })
            setTimeout(() => window.removeEventListener('click', engolirClique, { capture: true }), 400)

            const primeira = amostras[0]
            const ultima = { x: evento.clientX, t: evento.timeStamp }
            const velocidade = (ultima.x - primeira.x) / Math.max(1, ultima.t - primeira.t)
            // dedo indo para a esquerda (velocidade negativa) = a cena anda para a direita
            if (Math.abs(velocidade) > VELOCIDADE_FLICK) irPara(velocidade < 0 ? 1 : -1)
        }

        const aoRedimensionar = () => aplicar(centroRef.current)

        palco.addEventListener('pointerdown', aoTocar)
        window.addEventListener('pointermove', aoMover)
        window.addEventListener('pointerup', aoSoltar)
        window.addEventListener('pointercancel', aoSoltar)
        window.addEventListener('resize', aoRedimensionar)
        return () => {
            palco.removeEventListener('pointerdown', aoTocar)
            window.removeEventListener('pointermove', aoMover)
            window.removeEventListener('pointerup', aoSoltar)
            window.removeEventListener('pointercancel', aoSoltar)
            window.removeEventListener('resize', aoRedimensionar)
            palco.style.transition = ''
        }
    }, [ativo, palcoRef, aplicar, irPara, medir])

    // pedido de foco vindo de fora: desliza até a parada pedida
    useEffect(() => {
        if (!ativo || !foco) return
        const parada = PARADAS_CELULAR.find(item => item.nome === foco.parada)
        if (parada) aplicar(parada.x, true)
        // só quando chega um pedido novo (não a cada mudança de ativo/aplicar)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [foco])

    return { lados: ativo ? lados : { esquerda: false, direita: false }, irPara }
}
