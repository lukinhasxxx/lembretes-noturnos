import './BotaoTema.css'
import { useEffect, useRef, useState } from 'react'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { NOME_SISTEMA_POR_TEMA, SISTEMA } from '../../tablet.config'
import LogoSistema from '../../sistema/LogoSistema/LogoSistema'
import { TEMAS } from '../../hooks/useTemaSistema'
import LuaEclipse from './LuaEclipse'
import ChoqueLua from './ChoqueLua'
import TransicaoTema from './TransicaoTema'

// clique na lua: quanto a penumbra segura antes do raio, e quanto o raio + o sumiço da penumbra duram
const ATRASO_ANTES_DO_RAIO_MS = 400
const DURACAO_RAIO_MS = 750

// Botões dos temas, só com o ícone de cada um: o logo do CyberOS (tema padrão) e a lua em eclipse do NightOS
// (ideia 1 do IDEIAS.md). O do tema ativo fica aceso. Hover na lua anima (~2 s, com o choquezinho em volta e
// a penumbra na tela) e volta sozinho ao tirar o mouse; clique liga o tema noturno.
const BotaoTema = () => {
    const { tema, setTema, telaDoModal } = useSistemaTablet()
    const [mouseNaLua, setMouseNaLua] = useState(false)
    // muda a cada entrada do mouse: sorteia arcos novos para o choque
    const [sementeChoque, setSementeChoque] = useState(0)

    // passagem para o noturno na tela toda (ver TransicaoTema.js): null | 'penumbra' | 'carregando' | 'raio'
    const [faseTransicao, setFaseTransicao] = useState(null)
    // ponto da lua dentro da tela do tablet, de onde o raio sai (array novo a cada clique = raio novo)
    const [origemRaio, setOrigemRaio] = useState(null)
    const timersTransicao = useRef([])
    const aplicandoTema = faseTransicao === 'carregando' || faseTransicao === 'raio'
    const ligada = tema === TEMAS.noturno || aplicandoTema

    useEffect(() => () => timersTransicao.current.forEach(clearTimeout), [])

    // centro do botão nas coordenadas da tela do tablet (o modal pode estar escalado, daí a divisão)
    const centroNaTela = (botao) => {
        const caixaTela = telaDoModal.getBoundingClientRect()
        const escala = caixaTela.width / telaDoModal.offsetWidth || 1
        const caixaBotao = botao.getBoundingClientRect()
        return [
            (caixaBotao.left + caixaBotao.width / 2 - caixaTela.left) / escala,
            (caixaBotao.top + caixaBotao.height / 2 - caixaTela.top) / escala,
        ]
    }

    // clique na lua: segura a penumbra ~0.4 s, aí o raio e o tema de verdade, e a penumbra some
    const aplicarNoturno = (botao) => {
        if (tema === TEMAS.noturno || aplicandoTema) return
        const origem = centroNaTela(botao)
        setFaseTransicao('carregando')
        timersTransicao.current = [
            setTimeout(() => {
                setOrigemRaio(origem)
                setFaseTransicao('raio')
                setTema(TEMAS.noturno)
            }, ATRASO_ANTES_DO_RAIO_MS),
            setTimeout(() => setFaseTransicao(null), ATRASO_ANTES_DO_RAIO_MS + DURACAO_RAIO_MS),
        ]
    }

    // logo do CyberOS: por enquanto sem efeito, só o mesmo respiro de ~0.4 s antes de voltar
    const voltarAoCyber = () => {
        if (aplicandoTema || tema === TEMAS.padrao) return
        timersTransicao.current = [setTimeout(() => setTema(TEMAS.padrao), ATRASO_ANTES_DO_RAIO_MS)]
    }

    const entrarNaLua = () => {
        setMouseNaLua(true)
        setSementeChoque(semente => semente + 1)
        if (tema !== TEMAS.noturno && !aplicandoTema) setFaseTransicao('penumbra')
    }

    const sairDaLua = () => {
        setMouseNaLua(false)
        // depois do clique a passagem segue sozinha, mesmo tirando o mouse
        setFaseTransicao(fase => (fase === 'penumbra' ? null : fase))
    }

    return (
        <div className='botao-tema-area'>
            {/* CyberOS (o tema padrão): só o logo, como a lua do noturno */}
            <button
                type='button'
                className={`botao-tema botao-tema-cyber ${ligada ? '' : 'ligado'}`}
                aria-label={SISTEMA.nome}
                title={SISTEMA.nome}
                onClick={voltarAoCyber}
            >
                <LogoSistema className='botao-tema-logo' />
            </button>

            <button
                type='button'
                className={`botao-tema ${ligada ? 'ligado' : ''}`}
                aria-label={NOME_SISTEMA_POR_TEMA.noturno}
                title={NOME_SISTEMA_POR_TEMA.noturno}
                onClick={(evento) => aplicarNoturno(evento.currentTarget)}
                onMouseEnter={entrarNaLua}
                onMouseLeave={sairDaLua}
            >
                <LuaEclipse />
                <ChoqueLua semente={mouseNaLua ? sementeChoque : 0} />
            </button>

            <TransicaoTema tela={telaDoModal} fase={faseTransicao} origemRaio={origemRaio} />
        </div>
    )
}

export default BotaoTema
