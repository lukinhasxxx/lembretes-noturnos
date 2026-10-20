import './JogoSudoku.css'
import { useEffect, useRef, useState } from 'react'
import WindowBar from '../../sistema/WindowBar/WindowBar'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'
import { DIFICULDADES, LADO, colunaDe, gerarJogo, linhaDe, quadradoDe, resolvido, temConflito } from './logicaSudoku'
import { SISTEMA } from '../../tablet.config'
import { ControlesModoJogo, useModoJogo } from '../ModoJogo/ModoJogo'

// quantos tempos o ranking guarda por nível
const TAMANHO_RANKING = 5

const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const doisDigitos = (numero) => String(numero).padStart(2, '0')
const formatarTempo = (segundos) => `${doisDigitos(Math.floor(segundos / 60))}:${doisDigitos(segundos % 60)}`

const SETAS = { ArrowUp: -LADO, ArrowDown: LADO, ArrowLeft: -1, ArrowRight: 1 }

// jogo salvo que vale a pena perguntar se continua: tem algo escrito, não foi resolvido e o tempo do desafio
// (se era desafio) não acabou
const retomavel = (salvo) => {
    if (!salvo?.jogo?.grade) return false
    const { jogo, segundos } = salvo
    const escreveu = jogo.grade.some((numero, indice) => numero !== jogo.desafio[indice])
    const esgotou = jogo.contraRelogio && segundos >= DIFICULDADES[jogo.nivel].limiteDesafio
    return escreveu && !resolvido(jogo.grade, jogo.solucao) && !esgotou
}

// começa um jogo do nível pedido: o tabuleiro de jogo nasce igual ao desafio.
// contraRelogio: modo desafio (tem que resolver antes do tempo do nível acabar)
const comecar = (nivel, contraRelogio) => {
    const { desafio, solucao } = gerarJogo(nivel)
    return { nivel, contraRelogio, desafio, solucao, grade: [...desafio] }
}

// sudoku.exe: clicar numa casa e digitar (ou usar os botões de número). Números repetidos na mesma linha,
// coluna ou quadrado ficam vermelhos. Melhor tempo de cada nível salvo no navegador.
// Modo desafio: o relógio conta para trás a partir do tempo do nível (DIFICULDADES no logicaSudoku.js).
// Trocar de nível ou de modo no meio de um jogo pede confirmação (o progresso se perde).
// Regras e gerador no logicaSudoku.js; aqui só a tela e a entrada.
const JogoSudoku = ({ fecharApp, minimizarApp, classeAnimacao }) => {
    const { tema, telaAtiva } = useSistemaTablet()
    const [ultimoNivel, setUltimoNivel] = useEstadoPersistido('nivel-sudoku', 'facil')
    const [ultimoModoDesafio, setUltimoModoDesafio] = useEstadoPersistido('sudoku-modo-desafio', false)
    // ranking: { nivel: [{ usuario, data, segundos, desafio }] }, os melhores tempos primeiro
    const [ranking, setRanking] = useEstadoPersistido('ranking-sudoku', {})
    // recorde da versão anterior (só o melhor tempo, sem data): vira a primeira linha do ranking uma vez
    const [recordesAntigos] = useEstadoPersistido('recordes-sudoku', {})
    const [rankingAberto, setRankingAberto] = useState(false)
    // modo jogo (tela cheia dentro do tablet); Esc sai
    const [modoJogo, alternarModoJogo] = useModoJogo('sudoku')
    const [nivelDoRanking, setNivelDoRanking] = useState(null)
    // jogo salvo a cada mudança: { jogo, segundos } (ao reabrir, dá para continuar de onde parou)
    const [salvo, setSalvo] = useEstadoPersistido('sudoku-partida', null)
    // na abertura: tem jogo salvo pela metade (com algo escrito, sem ter resolvido nem esgotado o tempo)? pergunta
    const [perguntarRetomar, setPerguntarRetomar] = useState(() => retomavel(salvo))
    const [jogo, setJogo] = useState(() => (
        retomavel(salvo) ? salvo.jogo : comecar(DIFICULDADES[ultimoNivel] ? ultimoNivel : 'facil', ultimoModoDesafio)
    ))
    const [selecionada, setSelecionada] = useState(null)
    const [segundos, setSegundos] = useState(() => (retomavel(salvo) ? salvo.segundos : 0))
    // troca de nível/modo esperando a pessoa confirmar: { nivel, contraRelogio } ou null
    const [trocaPedida, setTrocaPedida] = useState(null)
    const terminou = resolvido(jogo.grade, jogo.solucao)
    const limite = DIFICULDADES[jogo.nivel].limiteDesafio
    const esgotou = jogo.contraRelogio && !terminou && segundos >= limite
    const acabou = terminou || esgotou

    // relógio: anda enquanto o jogo não acabou e o Sudoku está na frente (minimizado ou atrás de outra janela,
    // ele pausa: não dá para jogar sem ver o tabuleiro)
    const naFrente = telaAtiva === 'sudoku.exe'
    useEffect(() => {
        if (acabou || !naFrente || perguntarRetomar) return
        const intervalo = setInterval(() => setSegundos((total) => total + 1), 1000)
        return () => clearInterval(intervalo)
    }, [acabou, jogo, naFrente, perguntarRetomar])

    // salva o jogo a cada número escrito e a cada segundo (depois que a pessoa decidiu se continua)
    useEffect(() => {
        if (!perguntarRetomar) setSalvo({ jogo, segundos })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jogo, segundos, perguntarRetomar])

    // recorde antigo → ranking (uma vez só: quando o ranking ainda está vazio)
    useEffect(() => {
        if (Object.keys(ranking).length || !Object.keys(recordesAntigos).length) return
        setRanking(Object.fromEntries(Object.entries(recordesAntigos).map(([nivel, tempo]) => (
            [nivel, [{ usuario: SISTEMA.usuario, data: null, segundos: tempo, desafio: false }]]
        ))))
        // só na abertura
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // resolveu: entra no ranking do nível (fica com os melhores TAMANHO_RANKING tempos)
    useEffect(() => {
        if (!terminou) return
        const entrada = { usuario: SISTEMA.usuario, data: new Date().toISOString(), segundos, desafio: jogo.contraRelogio }
        setRanking((atual) => ({
            ...atual,
            [jogo.nivel]: [...(atual[jogo.nivel] ?? []), entrada]
                .sort((a, b) => a.segundos - b.segundos)
                .slice(0, TAMANHO_RANKING),
        }))
        // só na hora em que termina
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terminou])

    const abrirRanking = () => {
        setNivelDoRanking(jogo.nivel)
        setRankingAberto(true)
    }

    const novoJogo = (nivel = jogo.nivel, contraRelogio = jogo.contraRelogio) => {
        setUltimoNivel(nivel)
        setUltimoModoDesafio(contraRelogio)
        setJogo(comecar(nivel, contraRelogio))
        setSelecionada(null)
        setSegundos(0)
        setTrocaPedida(null)
        setPerguntarRetomar(false)
    }

    // já escreveu alguma coisa e o jogo ainda está valendo: trocar agora perde isso
    const temProgresso = !acabou && jogo.grade.some((numero, indice) => numero !== jogo.desafio[indice])

    // botões de nível e de modo: com progresso, pergunta antes; sem, troca direto
    const pedirTroca = (nivel, contraRelogio) => {
        if (nivel === jogo.nivel && contraRelogio === jogo.contraRelogio) return
        if (temProgresso) setTrocaPedida({ nivel, contraRelogio })
        else novoJogo(nivel, contraRelogio)
    }

    // escreve (ou apaga, com 0) na casa escolhida; as casas do desafio não mudam
    const escrever = (numero) => {
        if (selecionada === null || acabou || trocaPedida || rankingAberto || perguntarRetomar || jogo.desafio[selecionada]) return
        setJogo((atual) => {
            const grade = [...atual.grade]
            grade[selecionada] = numero
            return { ...atual, grade }
        })
    }

    // teclado: só quando o Sudoku é a janela da frente
    const teclaRef = useRef(null)
    teclaRef.current = (evento) => {
        if (evento.target.closest?.('input, textarea')) return
        if (/^[1-9]$/.test(evento.key)) escrever(Number(evento.key))
        else if (['Backspace', 'Delete', '0'].includes(evento.key)) escrever(0)
        else if (SETAS[evento.key] !== undefined) {
            const passo = SETAS[evento.key]
            const atual = selecionada ?? 0
            const destino = atual + passo
            // setas para os lados não pulam de linha
            if (destino < 0 || destino >= LADO * LADO || (Math.abs(passo) === 1 && linhaDe(destino) !== linhaDe(atual))) return
            setSelecionada(destino)
        } else return
        evento.preventDefault()
    }
    useEffect(() => {
        if (telaAtiva !== 'sudoku.exe') return
        const aoTeclar = (evento) => teclaRef.current(evento)
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [telaAtiva])

    // quantas vezes cada número já está no tabuleiro (o botão some quando os 9 estão colocados)
    const quantos = NUMEROS.reduce((contagem, numero) => ({ ...contagem, [numero]: jogo.grade.filter((n) => n === numero).length }), {})
    const numeroSelecionado = selecionada !== null ? jogo.grade[selecionada] : 0

    const classeDaCasa = (indice) => {
        const classes = ['sudoku-casa']
        if (jogo.desafio[indice]) classes.push('dada')
        if (indice === selecionada) classes.push('selecionada')
        else if (selecionada !== null && (
            linhaDe(indice) === linhaDe(selecionada) || colunaDe(indice) === colunaDe(selecionada) || quadradoDe(indice) === quadradoDe(selecionada)
        )) classes.push('vizinha')
        if (numeroSelecionado && jogo.grade[indice] === numeroSelecionado) classes.push('mesmo-numero')
        if (temConflito(jogo.grade, indice)) classes.push('conflito')
        // linhas grossas entre os quadrados 3×3
        if (colunaDe(indice) % 3 === 2 && colunaDe(indice) < LADO - 1) classes.push('borda-direita')
        if (linhaDe(indice) % 3 === 2 && linhaDe(indice) < LADO - 1) classes.push('borda-baixo')
        return classes.join(' ')
    }

    return (
        <div className={`janela-sudoku${modoJogo ? ' janela-modo-jogo' : ''} ${classeAnimacao}`}>
            {!modoJogo && (
                <WindowBar fecharApp={fecharApp} minimizarApp={minimizarApp} idDoAppPraFechar='app_sudoku' escura={tema === TEMAS.noturno} />
            )}

            <div className='sudoku-corpo'>
                <ControlesModoJogo
                    modoJogo={modoJogo}
                    alternar={alternarModoJogo}
                    idDoApp='app_sudoku'
                    minimizarApp={minimizarApp}
                    fecharApp={fecharApp}
                />
                <div className='sudoku-tabuleiro'>
                    {jogo.grade.map((numero, indice) => (
                        <button key={indice} type='button' className={classeDaCasa(indice)} onClick={() => setSelecionada(indice)}>
                            {numero || ''}
                        </button>
                    ))}

                    {terminou && (
                        <div className='sudoku-aviso'>
                            <strong>
                                {jogo.contraRelogio ? 'Desafio vencido' : 'Resolvido'} em {formatarTempo(segundos)}!
                            </strong>
                            <button type='button' className='config-botao' onClick={() => novoJogo()}>Jogar de novo</button>
                        </div>
                    )}

                    {esgotou && (
                        <div className='sudoku-aviso'>
                            <strong>Tempo esgotado!</strong>
                            <button type='button' className='config-botao' onClick={() => novoJogo()}>Tentar de novo</button>
                        </div>
                    )}

                    {rankingAberto && (
                        <div className='sudoku-aviso sudoku-ranking'>
                            <strong>🏆 Ranking</strong>
                            <div className='sudoku-ranking-niveis' role='tablist'>
                                {Object.entries(DIFICULDADES).map(([id, { nome }]) => (
                                    <button
                                        key={id}
                                        type='button'
                                        role='tab'
                                        aria-selected={id === nivelDoRanking}
                                        className={id === nivelDoRanking ? 'ativa' : ''}
                                        onClick={() => setNivelDoRanking(id)}
                                    >
                                        {nome}
                                    </button>
                                ))}
                            </div>
                            {ranking[nivelDoRanking]?.length ? (
                                <ol className='sudoku-ranking-lista'>
                                    {ranking[nivelDoRanking].map((entrada, posicao) => (
                                        <li key={`${entrada.data}-${posicao}`}>
                                            <span className='sudoku-ranking-posicao'>{posicao + 1}º</span>
                                            <span className='sudoku-ranking-usuario'>{entrada.usuario}</span>
                                            <span className='sudoku-ranking-data'>
                                                {entrada.data ? new Date(entrada.data).toLocaleDateString('pt-BR') : '—'}
                                            </span>
                                            <span className='sudoku-ranking-tempo'>
                                                {entrada.desafio && <span title='Modo desafio'>⏱ </span>}
                                                {formatarTempo(entrada.segundos)}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p>Nenhum jogo resolvido neste nível ainda.</p>
                            )}
                            <button type='button' className='config-botao' onClick={() => setRankingAberto(false)}>Fechar</button>
                        </div>
                    )}

                    {perguntarRetomar && (
                        <div className='sudoku-aviso'>
                            <strong>Você tem um jogo em andamento</strong>
                            <p>
                                {DIFICULDADES[jogo.nivel].nome} · {jogo.contraRelogio
                                    ? `restam ${formatarTempo(Math.max(0, limite - segundos))} no desafio`
                                    : `${formatarTempo(segundos)} jogados`}
                            </p>
                            <div className='sudoku-aviso-botoes'>
                                <button type='button' className='config-botao' onClick={() => setPerguntarRetomar(false)}>Continuar</button>
                                <button type='button' className='config-botao' onClick={() => novoJogo()}>Novo jogo</button>
                            </div>
                        </div>
                    )}

                    {trocaPedida && (
                        <div className='sudoku-aviso'>
                            <strong>Começar outro jogo?</strong>
                            <p>O progresso deste jogo vai ser perdido.</p>
                            <div className='sudoku-aviso-botoes'>
                                <button
                                    type='button'
                                    className='config-botao config-botao-perigo'
                                    onClick={() => novoJogo(trocaPedida.nivel, trocaPedida.contraRelogio)}
                                >
                                    Começar
                                </button>
                                <button type='button' className='config-botao' onClick={() => setTrocaPedida(null)}>Continuar este</button>
                            </div>
                        </div>
                    )}
                </div>

                <aside className='sudoku-lateral'>
                    <h2 className='sudoku-titulo'>Sudoku</h2>

                    <div className='sudoku-niveis' role='group' aria-label='Nível'>
                        {Object.entries(DIFICULDADES).map(([id, { nome }]) => (
                            <button
                                key={id}
                                type='button'
                                className={`config-botao${id === jogo.nivel ? ' ativo' : ''}`}
                                onClick={() => pedirTroca(id, jogo.contraRelogio)}
                            >
                                {nome}
                            </button>
                        ))}
                        <button type='button' className='config-botao sudoku-botao-ranking' onClick={abrirRanking}>🏆 Ranking</button>
                    </div>

                    <button
                        type='button'
                        className={`config-botao sudoku-modo${jogo.contraRelogio ? ' ativo' : ''}`}
                        aria-pressed={jogo.contraRelogio}
                        onClick={() => pedirTroca(jogo.nivel, !jogo.contraRelogio)}
                    >
                        ⏱ Desafio: {formatarTempo(limite)} {jogo.contraRelogio ? '(ligado)' : '(desligado)'}
                    </button>

                    <div className='sudoku-placar'>
                        {jogo.contraRelogio ? (
                            <div className={limite - segundos <= 60 && !acabou ? 'urgente' : ''}>
                                <small>Restante</small><b>{formatarTempo(Math.max(0, limite - segundos))}</b>
                            </div>
                        ) : (
                            <div><small>Tempo</small><b>{formatarTempo(segundos)}</b></div>
                        )}
                        <div><small>Melhor</small><b>{ranking[jogo.nivel]?.length ? formatarTempo(ranking[jogo.nivel][0].segundos) : '--:--'}</b></div>
                    </div>

                    {/* teclado de números (para o celular e para quem prefere clicar) */}
                    <div className='sudoku-numeros'>
                        {NUMEROS.map((numero) => (
                            <button
                                key={numero}
                                type='button'
                                className='sudoku-numero'
                                disabled={quantos[numero] >= LADO}
                                onClick={() => escrever(numero)}
                            >
                                {numero}
                            </button>
                        ))}
                        <button type='button' className='sudoku-numero sudoku-apagar' onClick={() => escrever(0)} aria-label='Apagar'>⌫</button>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default JogoSudoku
