import './Calendario.css'
import { useEffect, useRef, useState } from 'react'
import { useDataAtual } from '../../hooks/useDataAtual'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { useSistemaTablet } from '../../contexts/SistemaTablet'

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

// "Sincronizar horário de Brasília": quanto tempo fica carregando antes de acertar a hora
const DURACAO_SINCRONIZANDO_MS = 1500

const doisDigitos = (numero) => String(numero).padStart(2, '0')

// Calendário que abre ao clicar no relógio da barra de tarefas (hoje destacado, setas trocam o mês).
// Também acerta o relógio do tablet: clicar na hora edita a hora, clicar num dia muda o dia (mantém a hora),
// e o botão ao lado da hora volta para o horário de Brasília.
// fechando: toca a animação de fechar; aoTerminarDeFechar: chamado no fim dela, para desmontar
const Calendario = ({ fechando, aoTerminarDeFechar }) => {
    const hoje = useDataAtual()
    const { idioma, t } = useIdioma()
    const { definirDataHora, sincronizarHorarioDeBrasilia } = useSistemaTablet()
    const [mesExibido, setMesExibido] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1))
    // 1 = foi para o próximo mês, -1 = voltou: decide de que lado a grade nova entra
    const [direcaoDaTroca, setDirecaoDaTroca] = useState(0)
    // hora sendo editada ("HH:MM:SS" do campo) ou null quando só está mostrando
    const [horaEditada, setHoraEditada] = useState(null)
    const [sincronizando, setSincronizando] = useState(false)
    const timerSincronizarRef = useRef(null)

    useEffect(() => () => clearTimeout(timerSincronizarRef.current), [])

    const trocarMes = (direcao) => {
        setDirecaoDaTroca(direcao)
        setMesExibido(mes => new Date(mes.getFullYear(), mes.getMonth() + direcao, 1))
    }

    const comecarAEditarHora = () =>
        setHoraEditada(`${doisDigitos(hoje.getHours())}:${doisDigitos(hoje.getMinutes())}:${doisDigitos(hoje.getSeconds())}`)

    // aplica a hora digitada no dia de hoje (do tablet)
    const confirmarHora = () => {
        const [horas, minutos, segundos = 0] = (horaEditada ?? '').split(':').map(Number)
        if (!Number.isNaN(horas) && !Number.isNaN(minutos)) {
            definirDataHora(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), horas, minutos, segundos))
        }
        setHoraEditada(null)
    }

    // muda o dia do tablet, mantendo a hora
    const escolherDia = (dia) => definirDataHora(new Date(
        dia.getFullYear(), dia.getMonth(), dia.getDate(), hoje.getHours(), hoje.getMinutes(), hoje.getSeconds()
    ))

    const sincronizar = () => {
        if (sincronizando) return
        setHoraEditada(null)
        setSincronizando(true)
        timerSincronizarRef.current = setTimeout(() => {
            sincronizarHorarioDeBrasilia()
            setSincronizando(false)
        }, DURACAO_SINCRONIZANDO_MS)
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
            <div className='calendario-topo'>
                {horaEditada === null ? (
                    <button type='button' className='calendario-hora' title={t('calendario.mudarHora')} onClick={comecarAEditarHora}>
                        {hoje.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </button>
                ) : (
                    <input
                        type='time'
                        step='1'
                        className='calendario-hora calendario-hora-editando'
                        value={horaEditada}
                        autoFocus
                        onChange={(evento) => setHoraEditada(evento.target.value)}
                        onBlur={confirmarHora}
                        onKeyDown={(evento) => {
                            if (evento.key === 'Enter') confirmarHora()
                            if (evento.key === 'Escape') {
                                // Esc aqui só cancela a edição (não fecha o calendário)
                                evento.stopPropagation()
                                evento.nativeEvent.stopImmediatePropagation()
                                setHoraEditada(null)
                            }
                        }}
                    />
                )}

                <button
                    type='button'
                    className={`calendario-sincronizar ${sincronizando ? 'sincronizando' : ''}`}
                    onClick={sincronizar}
                >
                    <span className='calendario-sincronizar-icone' aria-hidden='true'>⟳</span>
                    {t(sincronizando ? 'calendario.sincronizando' : 'calendario.sincronizar')}
                </button>
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
                    <button
                        type='button'
                        key={dia.getTime()}
                        title={t('calendario.mudarDia')}
                        onClick={() => escolherDia(dia)}
                        className={[
                            'calendario-dia',
                            dia.getMonth() !== mesExibido.getMonth() ? 'fora-do-mes' : '',
                            mesmoDia(dia, hoje) ? 'hoje' : '',
                        ].join(' ')}
                    >
                        {dia.getDate()}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Calendario
