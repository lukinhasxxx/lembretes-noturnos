import Draggable from 'react-draggable'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEscalaHud } from '../hooks/useEscalaHud'
import JanelaHud from '../JanelaHud/JanelaHud'

// Janela do HUD arrastável, escalada conforme a tela e sempre mantida dentro dela.
// largura/altura: tamanho base (escala 1) do conteúdo.
// posicaoInicial: ({ larguraTela, alturaTela }) => ({ x, y }), em px da janela do navegador.
const JanelaArrastavel = ({
    largura,
    altura,
    posicaoInicial,
    visivel = true,
    handle,
    cancel,
    zIndex,
    children,
}) => {
    const nodeRef = useRef(null)
    const escala = useEscalaHud()
    const larguraNaTela = largura * escala
    const alturaNaTela = altura * escala

    // empurra a posição para dentro da tela, considerando o tamanho já escalado
    const manterNaTela = useCallback(({ x, y }) => ({
        x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - larguraNaTela)),
        y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - alturaNaTela)),
    }), [larguraNaTela, alturaNaTela])

    const [posicao, setPosicao] = useState(() =>
        posicaoInicial({ larguraTela: window.innerWidth, alturaTela: window.innerHeight })
    )

    // reaplica o limite no resize e sempre que a escala muda
    useEffect(() => {
        const aoRedimensionar = () => setPosicao((atual) => manterNaTela(atual))

        aoRedimensionar()
        window.addEventListener('resize', aoRedimensionar)
        return () => window.removeEventListener('resize', aoRedimensionar)
    }, [manterNaTela])

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds='parent'
            enableUserSelectHack={false}
            handle={handle}
            cancel={cancel}
            position={posicao}
            onDrag={(_, dados) => setPosicao({ x: dados.x, y: dados.y })}
        >
            <JanelaHud
                nodeRef={nodeRef}
                largura={largura}
                altura={altura}
                escala={escala}
                // escondida com visibility (e não display: none): continua "viva" por trás, então animações
                // em andamento (ex.: boot do tablet) seguem de onde estão em vez de recomeçar ao reaparecer
                style={{
                    visibility: visivel ? 'visible' : 'hidden',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex,
                }}
            >
                {children}
            </JanelaHud>
        </Draggable>
    )
}

export default JanelaArrastavel
