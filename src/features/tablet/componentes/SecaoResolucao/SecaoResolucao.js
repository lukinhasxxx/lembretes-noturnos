import './SecaoResolucao.css'
import { useEffect, useRef, useState } from 'react'
import { MODAL_TABLET, RESOLUCOES_TABLET, RESOLUCAO_PADRAO, calcularEscala, escalaQueCabe, useEscalaHud } from '../../../hud'
import { ehCelular } from '../../../../shared/hooks/useDispositivo'
import { useSistemaTablet } from '../../contexts/SistemaTablet'

// folga para arredondamento: a opção só some se passar mesmo da tela
const TOLERANCIA = 0.001

// tamanho que o tablet teria na tela com esse fator (em px) e se ele cabe.
// No celular o tamanho normal já é o máximo: só as opções menores (ou a normal) cabem
const medirOpcao = (fator) => {
    const escala = calcularEscala() * fator
    const cabe = fator <= 1
        || (!ehCelular() && escala <= escalaQueCabe(MODAL_TABLET.largura, MODAL_TABLET.altura) + TOLERANCIA)
    return {
        largura: Math.round(MODAL_TABLET.largura * escala),
        altura: Math.round(MODAL_TABLET.altura * escala),
        cabe,
    }
}

const rotuloDaOpcao = (opcao) => {
    const { largura, altura } = medirOpcao(opcao.fator)
    return `${largura} × ${altura}${opcao.id === RESOLUCAO_PADRAO ? ' (Recomendável)' : ''}`
}

// "Resolução da tela" do Config, igual à do Windows: o tamanho atual do tablet (em px da sua tela) e, ao abrir,
// as outras opções (15% menor, a recomendável, 15% maior e 40% maior). As que não cabem na tela nem aparecem.
const SecaoResolucao = () => {
    const { resolucaoTablet, setResolucaoTablet } = useSistemaTablet()
    const [aberta, setAberta] = useState(false)
    const areaRef = useRef(null)
    // só para redesenhar os tamanhos quando a janela do navegador muda
    useEscalaHud()

    useEffect(() => {
        if (!aberta) return
        const fecharAoClicarFora = (evento) => {
            if (!areaRef.current.contains(evento.target)) setAberta(false)
        }
        const fecharComEsc = (evento) => { if (evento.key === 'Escape') setAberta(false) }
        document.addEventListener('mousedown', fecharAoClicarFora)
        document.addEventListener('keydown', fecharComEsc)
        return () => {
            document.removeEventListener('mousedown', fecharAoClicarFora)
            document.removeEventListener('keydown', fecharComEsc)
        }
    }, [aberta])

    const escolher = (id) => {
        setResolucaoTablet(id)
        setAberta(false)
    }

    const opcoesQueCabem = RESOLUCOES_TABLET.filter(opcao => medirOpcao(opcao.fator).cabe)

    return (
        <div className='secao-resolucao'>
            <h3>Resolução da tela</h3>

            <div ref={areaRef} className={`seletor-resolucao ${aberta ? 'aberto' : ''}`}>
                <button
                    type='button'
                    className='seletor-resolucao-atual'
                    aria-haspopup='listbox'
                    aria-expanded={aberta}
                    onClick={() => setAberta(estado => !estado)}
                >
                    {rotuloDaOpcao(resolucaoTablet)}
                    <i className='seletor-resolucao-seta' aria-hidden='true' />
                </button>

                {aberta && (
                    <ul className='seletor-resolucao-lista' role='listbox'>
                        {opcoesQueCabem.map(opcao => {
                            const escolhida = opcao.id === resolucaoTablet.id
                            return (
                                <li key={opcao.id}>
                                    <button
                                        type='button'
                                        role='option'
                                        aria-selected={escolhida}
                                        className={escolhida ? 'escolhida' : ''}
                                        onClick={() => escolher(opcao.id)}
                                    >
                                        {rotuloDaOpcao(opcao)}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default SecaoResolucao
