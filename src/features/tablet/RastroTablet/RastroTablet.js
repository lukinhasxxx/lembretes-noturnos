import './RastroTablet.css'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CANTOS_TELA_TABLET_MESA, IMAGEM_TABLET_MESA } from '../tablet.config'
import { useSistemaTablet } from '../contexts/SistemaTablet'

const DURACAO_RASTRO_MS = 420
// cópias atrasadas do holograma, cada vez mais fracas: formam o rastro ("alma") no caminho
const ECOS_DO_RASTRO = [0, 1, 2]
const ATRASO_ENTRE_ECOS_MS = 45

// disparo em zigue-zague "pixelado": só degraus retos (sobe/desce e anda), alinhados numa grade de "pixels"
const PIXEL_DISPARO_PX = 3
const PASSO_DISPARO_PX = 15
const DESVIO_DISPARO_PX = 12
// folga para a grossura do traço (9px) e os saltos do glitch
const ALTURA_DISPARO_PX = (DESVIO_DISPARO_PX + PIXEL_DISPARO_PX * 4) * 2

const noPixel = (valor) => Math.round(valor / PIXEL_DISPARO_PX) * PIXEL_DISPARO_PX

// pontos do <polyline>: a cada passo, pula na vertical para um desvio sorteado e anda na horizontal
const sortearDisparo = (comprimento) => {
    const meio = ALTURA_DISPARO_PX / 2
    const pontos = [`0,${meio}`]
    let y = meio
    for (let x = PASSO_DISPARO_PX; x < comprimento; x += PASSO_DISPARO_PX) {
        pontos.push(`${x},${y}`) // anda reto até aqui...
        y = meio + noPixel((Math.random() * 2 - 1) * DESVIO_DISPARO_PX)
        pontos.push(`${x},${y}`) // ...e pula na vertical
    }
    pontos.push(`${comprimento},${y}`, `${comprimento},${meio}`)
    return pontos.join(' ')
}

const centro = (caixa) => ({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 })

// quanto da reta (saindo do centro da caixa, no ângulo dado) fica dentro dela: do centro até a borda
const metadeDentroDa = (caixa, angulo) => Math.min(
    caixa.width / 2 / Math.abs(Math.cos(angulo) || 1e-6),
    caixa.height / 2 / Math.abs(Math.sin(angulo) || 1e-6)
)

// disparo da borda da origem até a borda do destino (null se as caixas estão encostadas/sobrepostas)
const calcularDisparo = (origem, destino) => {
    const de = centro(origem)
    const para = centro(destino)
    const angulo = Math.atan2(para.y - de.y, para.x - de.x)
    const inicio = metadeDentroDa(origem, angulo)
    const comprimento = Math.hypot(para.x - de.x, para.y - de.y) - inicio - metadeDentroDa(destino, angulo)
    if (comprimento < PASSO_DISPARO_PX * 2) return null
    return {
        x: de.x + Math.cos(angulo) * inicio,
        y: de.y + Math.sin(angulo) * inicio,
        angulo,
        comprimento,
        pontos: sortearDisparo(comprimento),
    }
}

// retângulo que envolve a telinha do tablet da mesa, em fração da imagem (pelos 4 cantos medidos no Paint)
const cantos = Object.values(CANTOS_TELA_TABLET_MESA)
const xs = cantos.map(([x]) => x / IMAGEM_TABLET_MESA.largura)
const ys = cantos.map(([, y]) => y / IMAGEM_TABLET_MESA.altura)
const TELA_NA_IMAGEM = {
    esquerda: Math.min(...xs),
    topo: Math.min(...ys),
    largura: Math.max(...xs) - Math.min(...xs),
    altura: Math.max(...ys) - Math.min(...ys),
}

const caixaDaTelaNaMesa = (tabletNaTela) => {
    const caixa = tabletNaTela.getBoundingClientRect()
    return {
        left: caixa.left + caixa.width * TELA_NA_IMAGEM.esquerda,
        top: caixa.top + caixa.height * TELA_NA_IMAGEM.topo,
        width: caixa.width * TELA_NA_IMAGEM.largura,
        height: caixa.height * TELA_NA_IMAGEM.altura,
    }
}

// caixa da tela do modal; null quando ela está escondida (display: none mede 0)
const caixaDoModal = (telaDoModal) => {
    if (!telaDoModal) return null
    const { left, top, width, height } = telaDoModal.getBoundingClientRect()
    return width === 0 ? null : { left, top, width, height }
}

// "Alma" da tela viajando entre o tablet da mesa e o modal (ao abrir; ao fechar, o caminho de volta):
// 1. um disparo largo em zigue-zague pixelado e quadriculado (3 tons de verde) atravessa o caminho,
//    com fatias de glitch como o botão "Wallpapers";
// 2. perto do destino, aparece um holograma transparente que chega com o formato da tela,
//    com o glitch de fatias ciano/roxo do logo do boot e duas cópias atrasadas que deixam um rastro.
// O elemento fica no lugar/tamanho do destino; a animação parte da origem (posição/tamanho vindos do JS).
// Fica num portal no <body> para não herdar o transform do palco (as contas são em px da janela).
const RastroTablet = ({ aberto, tabletRef }) => {
    const { telaDoModal } = useSistemaTablet()
    const telaDoModalRef = useRef(telaDoModal)
    const ultimaCaixaDoModal = useRef(null)
    const abertoAnterior = useRef(aberto)
    const timerRef = useRef(null)
    const [rastro, setRastro] = useState(null)

    // o rAF abaixo roda depois do render: lê a tela do modal sempre atual por ref
    useLayoutEffect(() => {
        telaDoModalRef.current = telaDoModal
    }, [telaDoModal])

    // enquanto aberto, guarda onde o modal está a cada soltura do mouse (pega o arraste);
    // ao fechar ele já some (display: none), então o rastro de volta usa a última posição guardada
    useEffect(() => {
        if (!aberto) return
        const lembrarPosicao = () => {
            const caixa = caixaDoModal(telaDoModalRef.current)
            if (caixa) ultimaCaixaDoModal.current = caixa
        }
        window.addEventListener('pointerup', lembrarPosicao)
        return () => window.removeEventListener('pointerup', lembrarPosicao)
    }, [aberto])

    useEffect(() => {
        // só dispara quando muda (o StrictMode roda o efeito 2x na montagem com o mesmo valor)
        if (abertoAnterior.current === aberto) return
        abertoAnterior.current = aberto

        const quadro = requestAnimationFrame(() => {
            if (!tabletRef.current) return
            const modal = aberto ? caixaDoModal(telaDoModalRef.current) : ultimaCaixaDoModal.current
            if (!modal) return
            ultimaCaixaDoModal.current = modal

            const mesa = caixaDaTelaNaMesa(tabletRef.current)
            // abrindo: da mesa para o modal; fechando: do modal para a mesa
            const [origem, destino] = aberto ? [mesa, modal] : [modal, mesa]

            setRastro({ id: Date.now(), origem, destino, disparo: calcularDisparo(origem, destino) })
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(
                () => setRastro(null),
                DURACAO_RASTRO_MS + ATRASO_ENTRE_ECOS_MS * (ECOS_DO_RASTRO.length - 1)
            )
        })

        return () => cancelAnimationFrame(quadro)
    }, [aberto, tabletRef])

    useEffect(() => () => clearTimeout(timerRef.current), [])

    if (!rastro) return null
    const { origem, destino, disparo } = rastro
    const duracao = { '--duracao-rastro-tablet': `${DURACAO_RASTRO_MS}ms` }

    return createPortal(
        <div key={rastro.id}>
            {disparo && (
                <div
                    className='rastro-tablet-disparo'
                    style={{
                        left: disparo.x,
                        top: disparo.y,
                        width: disparo.comprimento,
                        height: ALTURA_DISPARO_PX,
                        marginTop: -ALTURA_DISPARO_PX / 2,
                        transform: `rotate(${disparo.angulo}rad)`,
                        ...duracao,
                    }}
                >
                    <svg width={disparo.comprimento} height={ALTURA_DISPARO_PX}>
                        {/* 3 tons de verde: base escura, xadrez por cima (tracejado) e um fio claro no meio */}
                        <polyline className='rastro-tablet-disparo-base' points={disparo.pontos} />
                        <polyline className='rastro-tablet-disparo-xadrez' points={disparo.pontos} />
                        <polyline className='rastro-tablet-disparo-brilho' points={disparo.pontos} />
                        {/* cópia deslocada que pisca em fatias, como o hover do "Wallpapers" */}
                        <polyline className='rastro-tablet-disparo-glitch' points={disparo.pontos} />
                    </svg>
                </div>
            )}
            <div
                className='rastro-tablet'
                style={{
                    left: destino.left,
                    top: destino.top,
                    width: destino.width,
                    height: destino.height,
                    '--rastro-desloca-x': `${origem.left - destino.left}px`,
                    '--rastro-desloca-y': `${origem.top - destino.top}px`,
                    '--rastro-largura-origem': `${origem.width}px`,
                    '--rastro-altura-origem': `${origem.height}px`,
                    ...duracao,
                }}
            >
                {ECOS_DO_RASTRO.map((eco) => (
                    <div
                        key={eco}
                        className='rastro-tablet-holograma'
                        style={{
                            animationDelay: `${eco * ATRASO_ENTRE_ECOS_MS}ms`,
                            '--forca-eco': 1 - eco * 0.35,
                        }}
                    />
                ))}
            </div>
        </div>,
        document.body
    )
}

export default RastroTablet
