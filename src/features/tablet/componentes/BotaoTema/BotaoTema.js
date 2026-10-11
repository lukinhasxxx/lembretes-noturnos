import './BotaoTema.css'
import { useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import LuaEclipse from './LuaEclipse'
import ChoqueLua from './ChoqueLua'

// Teste das ideias de botão do tema noturno, lado a lado, numeradas como no IDEIAS.md.
const LUAS_EM_TESTE = [
    { numero: 1, Lua: LuaEclipse },
]

// Cada lua: hover anima (~2 s, com o choquezinho em volta) e volta sozinha ao tirar o mouse;
// clique deixa ela "ligada". O "↺ Original" no fim da linha desliga todas. Ainda não troca o tema.
const BotaoTema = () => {
    const { t } = useIdioma()
    const [luasLigadas, setLuasLigadas] = useState([])
    // lua com o mouse em cima (liga o choque e avisa a lua)
    const [luaComMouse, setLuaComMouse] = useState(null)
    // muda a cada entrada do mouse: sorteia arcos novos para o choque
    const [sementeChoque, setSementeChoque] = useState(0)

    const ligarLua = (numero) => setLuasLigadas(ligadas => (ligadas.includes(numero) ? ligadas : [...ligadas, numero]))

    const entrarNaLua = (numero) => {
        setLuaComMouse(numero)
        setSementeChoque(semente => semente + 1)
    }

    return (
        <div className='botao-tema-area'>
            {LUAS_EM_TESTE.map(({ numero, Lua }) => (
                <div key={numero} className='botao-tema-opcao'>
                    <button
                        type='button'
                        className={`botao-tema ${luasLigadas.includes(numero) ? 'ligado' : ''}`}
                        onClick={() => ligarLua(numero)}
                        onMouseEnter={() => entrarNaLua(numero)}
                        onMouseLeave={() => setLuaComMouse(null)}
                    >
                        <Lua ativa={luaComMouse === numero || luasLigadas.includes(numero)} />
                        <ChoqueLua semente={luaComMouse === numero ? sementeChoque : 0} />
                    </button>
                    <span className='botao-tema-numero'>{numero}</span>
                </div>
            ))}

            {luasLigadas.length > 0 && (
                <button type='button' className='botao-tema-original' onClick={() => setLuasLigadas([])}>
                    ↺ {t('config.temaOriginal')}
                </button>
            )}
        </div>
    )
}

export default BotaoTema
