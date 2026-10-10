import './Calendario.css'
import { useState } from 'react'
import { useDataAtual } from '../../hooks/useDataAtual'
import { useIdioma } from '../../../../shared/i18n/Idioma'

// 6 semanas fixas: a grade não muda de altura de um mês para o outro
const TOTAL_DE_DIAS_NA_GRADE = 42

const mesmoDia = (dataA, dataB) =>
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()

// dias da grade do mês (começando no domingo), incluindo o fim do mês anterior e o começo do próximo
const montarDiasDaGrade = (ano, mes) => {
    const primeiroDiaDaGrade = new Date(ano, mes, 1 - new Date(ano, mes, 1).getDay())

    return Array.from({ length: TOTAL_DE_DIAS_NA_GRADE }, (_, indice) =>
        new Date(primeiroDiaDaGrade.getFullYear(), primeiroDiaDaGrade.getMonth(), primeiroDiaDaGrade.getDate() + indice)
    )
}

// Calendário que abre ao clicar no relógio da barra de tarefas: só para ver (hoje destacado, setas trocam o mês).
// fechando: toca a animação de fechar; aoTerminarDeFechar: chamado no fim dela, para desmontar
const Calendario = ({ fechando, aoTerminarDeFechar }) => {
    const hoje = useDataAtual()
    const { idioma, t } = useIdioma()
    const [mesExibido, setMesExibido] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1))
    // 1 = foi para o próximo mês, -1 = voltou: decide de que lado a grade nova entra
    const [direcaoDaTroca, setDirecaoDaTroca] = useState(0)

    const trocarMes = (direcao) => {
        setDirecaoDaTroca(direcao)
        setMesExibido(mes => new Date(mes.getFullYear(), mes.getMonth() + direcao, 1))
    }

    const diasDaGrade = montarDiasDaGrade(mesExibido.getFullYear(), mesExibido.getMonth())
    const nomesDosDias = diasDaGrade.slice(0, 7).map(dia => dia.toLocaleDateString(idioma, { weekday: 'narrow' }))
    const nomeDoMes = mesExibido.toLocaleDateString(idioma, { month: 'long', year: 'numeric' })

    return (
        <div
            className={`calendario ${fechando ? 'fechando' : ''}`}
            onAnimationEnd={(evento) => {
                if (fechando && evento.target === evento.currentTarget) aoTerminarDeFechar()
            }}
        >
            <div className='calendario-hora'>
                {hoje.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className='calendario-data-por-extenso'>
                {hoje.toLocaleDateString(idioma, { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>

            <div className='calendario-cabecalho'>
                <span className='calendario-nome-do-mes'>{nomeDoMes}</span>
                <button type='button' title={t('calendario.mesAnterior')} onClick={() => trocarMes(-1)}>‹</button>
                <button type='button' title={t('calendario.proximoMes')} onClick={() => trocarMes(1)}>›</button>
            </div>

            <div className='calendario-grade'>
                {nomesDosDias.map((nome, indice) => (
                    <span key={indice} className='calendario-dia-da-semana'>{nome}</span>
                ))}
            </div>

            {/* a key muda a cada mês: a grade é recriada e toca a animação de entrar pelo lado certo */}
            <div
                key={mesExibido.getTime()}
                className={`calendario-grade calendario-dias ${direcaoDaTroca === 1 ? 'vindo-da-direita' : ''} ${direcaoDaTroca === -1 ? 'vindo-da-esquerda' : ''}`}
            >
                {diasDaGrade.map(dia => (
                    <span
                        key={dia.getTime()}
                        className={[
                            'calendario-dia',
                            dia.getMonth() !== mesExibido.getMonth() ? 'fora-do-mes' : '',
                            mesmoDia(dia, hoje) ? 'hoje' : '',
                        ].join(' ')}
                    >
                        {dia.getDate()}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default Calendario
