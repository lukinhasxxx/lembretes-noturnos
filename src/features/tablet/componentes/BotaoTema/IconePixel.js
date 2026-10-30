import { useEffect, useRef } from 'react'
import { pintarIconePixel } from '../../sistema/TelaBoot/TelaBootPixel'

// tempo para o sol subir e a paisagem ficar nítida com o mouse em cima (e para voltar ao tirar)
const DURACAO_ACENDER_MS = 1200
// tempo para o anel encher (o clique) ou esvaziar
export const DURACAO_ANEL_MS = 650
// o pixelado da paisagem conforme acende: começa em blocos e termina nítida
const BLOCOS = [5, 4, 3, 2, 1]
// quanto o sol já subiu com o ícone apagado (amanhecendo) e aceso (dia)
const DIA_APAGADO = 0.4

const limitar = (valor) => Math.min(1, Math.max(0, valor))

// O ícone do PixelOS no botão do tema: a janela do boot em miniatura, desenhada num canvas (ver pintarIconePixel).
// Apagado: amanhecendo e pixelada; aceso (hover ou tema ligado): o sol sobe e ela fica nítida, aos poucos.
// anelCheio: o anel em volta enche (clique / tema ligado) ou esvazia. dia (opcional): fixa a hora do desenho e deixa
// nítido (ex.: o Sobre, que fica à noite, mostra a janela ainda escura, com estrelas)
const IconePixel = ({ aceso, anelCheio, dia: diaFixo }) => {
    const canvasRef = useRef(null)
    // o desenho roda num requestAnimationFrame próprio: lê os alvos daqui e anda até eles
    const alvosRef = useRef({ aceso, anelCheio, diaFixo })

    useEffect(() => {
        alvosRef.current = { aceso, anelCheio, diaFixo }
    }, [aceso, anelCheio, diaFixo])

    useEffect(() => {
        let luz = alvosRef.current.aceso ? 1 : 0
        let anel = alvosRef.current.anelCheio ? 1 : 0
        let anterior = performance.now()
        let quadro = 0
        let pedido = null
        const passo = (agora) => {
            const tempo = agora - anterior
            anterior = agora
            const alvos = alvosRef.current
            luz = limitar(luz + (alvos.aceso ? 1 : -1) * (tempo / DURACAO_ACENDER_MS))
            anel = limitar(anel + (alvos.anelCheio ? 1 : -1) * (tempo / DURACAO_ANEL_MS))
            pintarIconePixel(canvasRef.current, {
                dia: alvos.diaFixo ?? DIA_APAGADO + (1 - DIA_APAGADO) * luz,
                bloco: alvos.diaFixo !== undefined ? 1 : BLOCOS[Math.min(BLOCOS.length - 1, Math.floor(luz * BLOCOS.length))],
                anel,
                quadro,
                // com a janela ainda escura (o Sobre, à noite), borda e anel também nas cores da noite
                noite: alvos.diaFixo !== undefined && alvos.diaFixo < DIA_APAGADO,
            })
            quadro += 1
            pedido = requestAnimationFrame(passo)
        }
        pedido = requestAnimationFrame(passo)
        return () => cancelAnimationFrame(pedido)
    }, [])

    return <canvas ref={canvasRef} className='icone-pixel' aria-hidden='true' />
}

export default IconePixel
