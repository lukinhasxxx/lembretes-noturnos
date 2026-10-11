import './BotaoTema.css'
import { useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import LuaEclipse from './LuaEclipse'
import ChoqueLua from './ChoqueLua'

// Teste das ideias de botão do tema noturno, lado a lado, numeradas como no IDEIAS.md.
// aplicaTema: a lua troca o tema de verdade; luas sem isso são só teste visual (ligam/desligam sozinhas).
const LUAS_EM_TESTE = [
    { numero: 1, Lua: LuaEclipse, aplicaTema: true },
]

// Cada lua: hover anima (~2 s, com o choquezinho em volta) e volta sozinha ao tirar o mouse; clique deixa ela
// "ligada" (a 1 liga o tema noturno). O "↺ Original" no fim da linha volta ao tema padrão e desliga todas.
const BotaoTema = () => {
    const { t } = useIdioma()
    const { tema, setTema } = useSistemaTablet()
    // luas só de teste ligadas pelo clique (a 1 não entra aqui: ela está ligada quando o tema é o noturno)
    const [luasDeTesteLigadas, setLuasDeTesteLigadas] = useState([])
    // lua com o mouse em cima (liga o choque e avisa a lua)
    const [luaComMouse, setLuaComMouse] = useState(null)
    // muda a cada entrada do mouse: sorteia arcos novos para o choque
    const [sementeChoque, setSementeChoque] = useState(0)

    const estaLigada = ({ numero, aplicaTema }) =>
        aplicaTema ? tema === TEMAS.noturno : luasDeTesteLigadas.includes(numero)

    const ligarLua = ({ numero, aplicaTema }) => {
        if (aplicaTema) return setTema(TEMAS.noturno)
        setLuasDeTesteLigadas(ligadas => (ligadas.includes(numero) ? ligadas : [...ligadas, numero]))
    }

    const voltarAoOriginal = () => {
        setTema(TEMAS.padrao)
        setLuasDeTesteLigadas([])
    }

    const entrarNaLua = (numero) => {
        setLuaComMouse(numero)
        setSementeChoque(semente => semente + 1)
    }

    const algumaLigada = LUAS_EM_TESTE.some(estaLigada)

    return (
        <div className='botao-tema-area'>
            {LUAS_EM_TESTE.map((lua) => {
                const { numero, Lua } = lua
                const ligada = estaLigada(lua)

                return (
                    <div key={numero} className='botao-tema-opcao'>
                        <button
                            type='button'
                            className={`botao-tema ${ligada ? 'ligado' : ''}`}
                            onClick={() => ligarLua(lua)}
                            onMouseEnter={() => entrarNaLua(numero)}
                            onMouseLeave={() => setLuaComMouse(null)}
                        >
                            <Lua ativa={luaComMouse === numero || ligada} />
                            <ChoqueLua semente={luaComMouse === numero ? sementeChoque : 0} />
                        </button>
                        <span className='botao-tema-numero'>{numero}</span>
                    </div>
                )
            })}

            {algumaLigada && (
                <button type='button' className='botao-tema-original' onClick={voltarAoOriginal}>
                    ↺ {t('config.temaOriginal')}
                </button>
            )}
        </div>
    )
}

export default BotaoTema
