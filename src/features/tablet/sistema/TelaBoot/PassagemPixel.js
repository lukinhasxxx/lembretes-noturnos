import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import TelaBoot from './TelaBoot'
import TelaBootPixel from './TelaBootPixel'
import PixelarTela from './PixelarTela'
import { LINHAS_DO_PIXELADO, SEQUENCIAS_PIXEL } from './sequenciasPixel'

// O 1º boot depois de entrar no PixelOS ou sair dele, no lugar da tela de boot normal (ver passagemPixel no
// useTemaSistema e as sequências em sequenciasPixel.js). tipo: 'entrada' | 'saida'; temaDoBoot: o tema do boot que
// aparece pixelado (na entrada, o de antes; na saída, o novo)
const PassagemPixel = ({ tipo, temaDoBoot }) => {
    const sequencia = SEQUENCIAS_PIXEL[tipo]
    const camadaRef = useRef(null)
    const [base, setBase] = useState(2)
    // índice do passo atual; passos.length = já no boot do PixelOS
    const [passo, setPasso] = useState(0)

    // o tamanho do bloco de 16 bits sai da altura da tela do tablet (ela muda com a janela do navegador)
    useLayoutEffect(() => {
        setBase(Math.max(2, Math.round(camadaRef.current.clientHeight / LINHAS_DO_PIXELADO)))
    }, [])

    useEffect(() => {
        const momentos = sequencia.passos.slice(1).map((proximo) => proximo.em)
        if (sequencia.pixelOSEm) momentos.push(sequencia.pixelOSEm)
        const timers = momentos.map((em, indice) => setTimeout(() => setPasso(indice + 1), em))
        return () => timers.forEach(clearTimeout)
    }, [sequencia])

    const atual = sequencia.passos[passo]
    return (
        <div className='passagem-pixel' ref={camadaRef}>
            {atual ? (
                <PixelarTela bloco={atual.bloco === 'base' ? base : atual.bloco} niveis={atual.tons}>
                    <TelaBoot tema={temaDoBoot} />
                </PixelarTela>
            ) : (
                <TelaBootPixel />
            )}
        </div>
    )
}

export default PassagemPixel
