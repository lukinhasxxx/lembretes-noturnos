import './TelaFormatando.css'
import { useEffect, useMemo, useState } from 'react'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { DURACAO_FORMATANDO_MS, NOME_SISTEMA_POR_TEMA, SISTEMA } from '../../tablet.config'
import { arquivosParaApagar, formatarDeVerdade } from '../../utils/formatacao'

// depois do último arquivo, quanto tempo o "Pronto" fica na tela antes de apagar tudo e recarregar
const DURACAO_PRONTO_MS = 1300
// NightOS: quantos nomes de arquivo ficam voando para dentro do eclipse ao mesmo tempo
const NOMES_VOANDO = 7

// o que as duas telas têm em comum: os "arquivos" (as chaves salvas de verdade, ver formatacao.js) saem um
// por um ao longo do DURACAO_FORMATANDO_MS; depois do "Pronto", apaga tudo de verdade e recarrega a página
const useFormatando = () => {
    const { formatacao } = useSistemaTablet()
    // lista fixa no começo (o que existia quando a pessoa confirmou)
    const arquivos = useMemo(() => arquivosParaApagar(formatacao?.apagarLembretes), [formatacao])
    const [apagados, setApagados] = useState(0)
    const total = Math.max(arquivos.length, 1)
    const terminou = apagados >= total

    useEffect(() => {
        if (terminou) {
            const timer = setTimeout(() => formatarDeVerdade(formatacao ?? {}), DURACAO_PRONTO_MS)
            return () => clearTimeout(timer)
        }
        const timer = setTimeout(() => setApagados((quantos) => quantos + 1), DURACAO_FORMATANDO_MS / total)
        return () => clearTimeout(timer)
    }, [apagados, terminou, total, formatacao])

    return { arquivos, apagados, progresso: Math.min(1, apagados / total), terminou }
}

// CyberOS: tela escura com scanlines (a do boot), porcentagem grande, barra e o log dos arquivos saindo
const FormatandoCyber = () => {
    const { arquivos, apagados, progresso, terminou } = useFormatando()
    // as últimas linhas do log (a mais nova embaixo)
    const ultimas = arquivos.slice(Math.max(0, apagados - 6), apagados)

    return (
        <div className='tela-boot tela-formatando tela-formatando-cyber' style={{ '--progresso': progresso }}>
            <p className='tela-formatando-titulo'>{terminou ? 'Pronto' : `Formatando o ${SISTEMA.nome}`}</p>
            <strong className='tela-formatando-porcentagem'>{Math.round(progresso * 100)}%</strong>
            <div className='tela-formatando-barra' />
            <ol className='tela-formatando-log' aria-live='polite'>
                {ultimas.map((arquivo, indice) => (
                    <li key={arquivo} style={{ '--idade': ultimas.length - 1 - indice }}>
                        <span>apagando</span> C:\{SISTEMA.nome}\{SISTEMA.usuario}\{arquivo}
                        <b>ok</b>
                    </li>
                ))}
                {terminou && <li className='tela-formatando-fim'>Reiniciando como saiu de fábrica…</li>}
            </ol>
        </div>
    )
}

// NightOS: o eclipse no meio, com o anel de progresso em volta; cada arquivo aparece em volta e é "engolido"
// pela lua. No fim o anel acende inteiro e a tela apaga
const FormatandoNoturno = () => {
    const { arquivos, apagados, progresso, terminou } = useFormatando()
    // posição de cada nome em volta da lua: ângulo fixo por arquivo (espalha sem sortear a cada render)
    const voando = arquivos.slice(Math.max(0, apagados - NOMES_VOANDO), apagados)

    return (
        <div className={`tela-boot tela-boot-noturno tela-formatando tela-formatando-noturno${terminou ? ' terminou' : ''}`} style={{ '--progresso': progresso }}>
            <div className='tela-formatando-ceu'>
                {voando.map((arquivo) => {
                    const indice = arquivos.indexOf(arquivo)
                    return (
                        <span
                            key={arquivo}
                            className='tela-formatando-arquivo'
                            style={{ '--angulo': `${(indice * 137.5) % 360}deg`, '--distancia': `${150 + (indice % 3) * 28}px` }}
                        >
                            {arquivo}
                        </span>
                    )
                })}
                <div className='tela-formatando-eclipse'>
                    <svg className='tela-formatando-anel' viewBox='0 0 120 120' aria-hidden='true'>
                        <circle className='tela-formatando-anel-trilho' cx='60' cy='60' r='54' />
                        <circle className='tela-formatando-anel-arco' cx='60' cy='60' r='54' pathLength='100' />
                    </svg>
                </div>
            </div>
            <p className='tela-boot-texto tela-formatando-legenda'>
                {terminou ? 'Pronto' : `Apagando o ${NOME_SISTEMA_POR_TEMA.noturno}… ${Math.round(progresso * 100)}%`}
            </p>
        </div>
    )
}

// Tela de formatação (Config → Sistema → Formatar): cada tema formata do seu jeito
const TelaFormatando = () => {
    const { tema } = useSistemaTablet()
    return tema === TEMAS.noturno ? <FormatandoNoturno /> : <FormatandoCyber />
}

export default TelaFormatando
