import Draggable from 'react-draggable'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEscalaHud } from '../hooks/useEscalaHud'
import JanelaHud from '../JanelaHud/JanelaHud'
import { useTecladoAberto } from '../../../shared/hooks/useTecladoAberto'

// com o teclado do celular aberto, a janela fica deste tamanho (em relação ao normal), lá em cima
const ESCALA_COM_TECLADO = 0.8
// folga entre o topo da parte visível da tela e a janela, com o teclado aberto
const MARGEM_TOPO_TECLADO = 6

// Janela do HUD arrastável, escalada conforme a tela e sempre mantida dentro dela.
// largura/altura: tamanho base (escala 1) do conteúdo.
// posicaoInicial: ({ larguraTela, alturaTela, larguraJanela, alturaJanela }) => ({ x, y }), em px da janela
// do navegador (larguraJanela/alturaJanela: o tamanho dela já escalado, para dar para centralizar).
// subirComTeclado: enquanto o teclado do celular está aberto, a janela encolhe e vai para o topo (para o que
// se digita não ficar atrás do teclado); ao fechar, volta para onde estava.
const JanelaArrastavel = ({
    largura,
    altura,
    posicaoInicial,
    visivel = true,
    subirComTeclado = false,
    handle,
    cancel,
    zIndex,
    children,
}) => {
    const nodeRef = useRef(null)
    const escala = useEscalaHud()
    const teclado = useTecladoAberto()
    const desviarDoTeclado = subirComTeclado && visivel && teclado.aberto
    const larguraNaTela = largura * escala
    const alturaNaTela = altura * escala

    // empurra a posição para dentro da tela, considerando o tamanho já escalado
    const manterNaTela = useCallback(({ x, y }) => ({
        x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - larguraNaTela)),
        y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - alturaNaTela)),
    }), [larguraNaTela, alturaNaTela])

    const [posicao, setPosicao] = useState(() =>
        posicaoInicial({
            larguraTela: window.innerWidth,
            alturaTela: window.innerHeight,
            larguraJanela: larguraNaTela,
            alturaJanela: alturaNaTela,
        })
    )

    // reaplica o limite no resize e sempre que a escala muda
    useEffect(() => {
        const aoRedimensionar = () => setPosicao((atual) => manterNaTela(atual))

        aoRedimensionar()
        window.addEventListener('resize', aoRedimensionar)
        return () => window.removeEventListener('resize', aoRedimensionar)
    }, [manterNaTela])

    // teclado aberto: menor, centralizada e no topo da parte visível (a posição guardada não muda)
    const escalaNaTela = desviarDoTeclado ? escala * ESCALA_COM_TECLADO : escala
    const posicaoNaTela = desviarDoTeclado
        ? { x: (window.innerWidth - largura * escalaNaTela) / 2, y: teclado.topo + MARGEM_TOPO_TECLADO }
        : posicao

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds='parent'
            enableUserSelectHack={false}
            handle={handle}
            cancel={cancel}
            disabled={desviarDoTeclado}
            position={posicaoNaTela}
            onDrag={(_, dados) => setPosicao({ x: dados.x, y: dados.y })}
        >
            <JanelaHud
                nodeRef={nodeRef}
                largura={largura}
                altura={altura}
                escala={escalaNaTela}
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
