import './BotaoTema.css'
import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import LuaEclipse from './LuaEclipse'
import ChoqueLua from './ChoqueLua'
import TransicaoTema from './TransicaoTema'

// clique na lua: quanto a penumbra segura antes do raio, e quanto o raio + o sumiço da penumbra duram
const ATRASO_ANTES_DO_RAIO_MS = 400
const DURACAO_RAIO_MS = 750

// Botão do tema noturno: a lua em eclipse (ideia 1 do IDEIAS.md). Hover anima (~2 s, com o choquezinho em volta
// e a penumbra na tela) e volta sozinho ao tirar o mouse; clique liga o tema noturno.
// O "↺ Original" ao lado volta ao tema padrão.
const BotaoTema = () => {
    const { t } = useIdioma()
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

    // "↺ Original": por enquanto sem efeito, só o mesmo respiro de ~0.4 s antes de voltar
    const voltarAoOriginal = () => {
        if (aplicandoTema) return
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
            <button
                type='button'
                className={`botao-tema ${ligada ? 'ligado' : ''}`}
                onClick={(evento) => aplicarNoturno(evento.currentTarget)}
                onMouseEnter={entrarNaLua}
                onMouseLeave={sairDaLua}
            >
                <LuaEclipse />
                <ChoqueLua semente={mouseNaLua ? sementeChoque : 0} />
            </button>

            {ligada && (
                <button type='button' className='botao-tema-original' onClick={voltarAoOriginal}>
                    ↺ {t('config.temaOriginal')}
                </button>
            )}

            <TransicaoTema tela={telaDoModal} fase={faseTransicao} origemRaio={origemRaio} />
        </div>
    )
}

export default BotaoTema
