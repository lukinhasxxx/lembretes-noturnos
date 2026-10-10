import './EspelhoTablet.css'
import { useLayoutEffect, useRef, useState } from 'react'
import { CANTOS_TELA_TABLET_MESA, IMAGEM_TABLET_MESA, TELA_ESPELHO } from '../tablet.config'
import { matrizCornerPin } from '../utils/cornerPin'
import { useSistemaTablet } from '../contexts/SistemaTablet'
import { useEspelhoDom } from '../hooks/useEspelhoDom'

// a conta só depende de números fixos do config: calcula uma vez
const MATRIZ_TELA_NA_MESA = matrizCornerPin(TELA_ESPELHO.largura, TELA_ESPELHO.altura, CANTOS_TELA_TABLET_MESA)

// Espelho da tela do tablet, encaixado na telinha do tablet da mesa (fica dentro do TabletMesa, por cima da imagem).
// O conteúdo é uma cópia ao vivo do HTML da tela do modal (useEspelhoDom): o que aparece lá aparece aqui.
// Duas camadas:
// - .espelho-tablet: do tamanho real da imagem (974×443 px), escalada para o tamanho que a imagem tem na tela agora.
//   Assim os cantos medidos no Paint (px da imagem) valem em qualquer resolução.
// - .espelho-tablet-tela: a tela em si (666×389, como a do modal), entortada pelo corner pin até os 4 cantos.
// Não recebe cliques (inert): o clique continua indo para o tablet da mesa.
// Desligado: a cópia fica escondida (fica a imagem original do tablet, como sempre foi).
const EspelhoTablet = () => {
    const { sistemaDesligado, telaDoModal } = useSistemaTablet()
    const espelhoRef = useRef(null)
    const copiaRef = useRef(null)
    const [escala, setEscala] = useState(0)

    useEspelhoDom(telaDoModal, copiaRef)

    // mede a largura que a imagem do tablet tem na tela e guarda a escala (imagem real → tela);
    // o ResizeObserver refaz a conta quando a janela (e com ela a cena) muda de tamanho
    useLayoutEffect(() => {
        const tabletNaTela = espelhoRef.current.parentElement
        const medir = () => setEscala(tabletNaTela.offsetWidth / IMAGEM_TABLET_MESA.largura)

        medir()
        const observador = new ResizeObserver(medir)
        observador.observe(tabletNaTela)
        return () => observador.disconnect()
    }, [])

    return (
        <div
            ref={espelhoRef}
            className='espelho-tablet'
            style={{
                width: IMAGEM_TABLET_MESA.largura,
                height: IMAGEM_TABLET_MESA.altura,
                transform: `scale(${escala})`,
            }}
        >
            <div
                className='espelho-tablet-tela'
                style={{
                    width: TELA_ESPELHO.largura,
                    height: TELA_ESPELHO.altura,
                    transform: MATRIZ_TELA_NA_MESA,
                    visibility: sistemaDesligado ? 'hidden' : 'visible',
                }}
            >
                <div ref={copiaRef} className='espelho-tablet-copia' inert='' />
                {/* reflexo do vidro + leve brilho de tela acesa por cima da cópia */}
                <div className='espelho-tela-reflexo' />
            </div>
        </div>
    )
}

export default EspelhoTablet
