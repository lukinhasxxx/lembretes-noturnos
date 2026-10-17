import { useEffect, useRef, useState } from 'react'
import { aleatorioEntre } from '../../../../shared/utils/aleatorio'

// quanto a instalação inteira demora (sorteado a cada vez): a velocidade dos arquivos acompanha
const DURACAO_MIN_MS = 4000
const DURACAO_MAX_MS = 6000
// arquivos "pesados" (os easter eggs) demoram esse tanto a mais que os outros
const EXTRA_PESADO_MS = 200

// Lista (mockada) dos arquivos que o instalador "copia", um por vez, na ordem. Dois são easter eggs (pesado: true).
// Para mudar o que aparece na instalação, é só mexer aqui.
const ARQUIVOS = [
    { nome: 'langpack_en-US.cab' },
    { nome: 'ui_strings_en-US.dll' },
    { nome: 'mui_shell_en-US.dll' },
    { nome: 'keyboard_us.kbd' },
    { nome: 'feijao_por_cima_do_arroz.dll', pesado: true },
    { nome: 'date_format_en-US.dll' },
    { nome: 'spellcheck_en-US.dic' },
    { nome: 'hyphenation_en-US.dat' },
    { nome: 'fonts_latin_ext.dll' },
    { nome: 'input_method_en-US.dll' },
    { nome: 'biscoito_somente_de_polvilho.dll', pesado: true },
    { nome: 'speech_en-US.dat' },
    { nome: 'ocr_en-US.dat' },
    { nome: 'help_en-US.chm' },
    { nome: 'locale_en-US.nls' },
]

// depois dos arquivos, os passos de fechamento (como no Windows); também contam na barra
const finalizacao = (idioma) => [
    'Adicionando entradas ao registro',
    'Atualizando cache de fontes',
    `Registrando idioma ${idioma.id}`,
    'Limpando arquivos temporários',
]

// tudo o que o instalador faz, em ordem: copiar cada arquivo e depois finalizar
const montarPassos = (idioma) => [
    ...ARQUIVOS.map(arquivo => ({ texto: `Copiando ${arquivo.nome}`, pesado: arquivo.pesado })),
    ...finalizacao(idioma).map(texto => ({ texto })),
]

const QUANTIDADE_PESADOS = ARQUIVOS.filter(arquivo => arquivo.pesado).length

// "[1.24s]" desde o começo da instalação, para o terminal dos detalhes
const carimbo = (inicio) => `[${((performance.now() - inicio) / 1000).toFixed(2)}s]`

// Caixinha de instalação de um idioma (por cima do Config): pergunta → instalando (arquivos passando,
// barra de progresso em degraus, "Concluir" desabilitado) → pronto ("Concluir" libera). Sem escolher pasta,
// como um instalador de sistema. "Mostrar detalhes" abre um terminalzinho com o log de cada arquivo.
// aoConcluir: o idioma passa a estar instalado; aoCancelar: fecha sem instalar.
const InstaladorIdioma = ({ idioma, aoConcluir, aoCancelar }) => {
    const [etapa, setEtapa] = useState('pergunta')
    const [passosFeitos, setPassosFeitos] = useState(0)
    const [log, setLog] = useState([])
    const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
    // tempo de um passo comum (sorteado ao começar) e o momento em que começou
    const passoMsRef = useRef(0)
    const inicioRef = useRef(0)
    const timerRef = useRef(null)
    const terminalRef = useRef(null)

    useEffect(() => () => clearTimeout(timerRef.current), [])

    const escrever = (linha) => setLog(atual => [...atual, `${carimbo(inicioRef.current)} ${linha}`])

    const passos = montarPassos(idioma)

    // a cada passo: espera o tempo dele, marca como feito e escreve no log
    useEffect(() => {
        if (etapa !== 'instalando') return
        if (passosFeitos >= passos.length) {
            escrever('Instalação concluída.')
            setEtapa('pronto')
            return
        }
        const passo = passos[passosFeitos]
        const espera = passoMsRef.current + (passo.pesado ? EXTRA_PESADO_MS : 0)
        timerRef.current = setTimeout(() => {
            escrever(`${passo.texto}... OK`)
            setPassosFeitos(total => total + 1)
        }, espera)
        return () => clearTimeout(timerRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [etapa, passosFeitos])

    // o terminal acompanha a última linha
    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }, [log, mostrarDetalhes])

    const instalar = () => {
        const total = aleatorioEntre(DURACAO_MIN_MS, DURACAO_MAX_MS)
        passoMsRef.current = (total - QUANTIDADE_PESADOS * EXTRA_PESADO_MS) / passos.length
        inicioRef.current = performance.now()
        setLog([`${carimbo(inicioRef.current)} Verificando espaço em disco... OK`])
        setEtapa('instalando')
    }

    const passoAtual = passos[Math.min(passosFeitos, passos.length - 1)]
    const progresso = Math.round((passosFeitos / passos.length) * 100)

    return (
        <div className='instalador-fundo' role='dialog' aria-label={`Instalar ${idioma.nome}`}>
            <div className='instalador'>
                <div className='instalador-titulo'>Instalar idioma</div>

                {etapa === 'pergunta' ? (
                    <>
                        <p><b>{idioma.nome}</b> não está instalado neste sistema.</p>
                        <p>Deseja instalar?</p>
                        <div className='instalador-botoes'>
                            <button type='button' className='config-botao' onClick={aoCancelar}>Cancelar</button>
                            <button type='button' className='config-botao instalador-principal' onClick={instalar}>Instalar</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p>{etapa === 'pronto' ? 'Instalação concluída.' : `Instalando ${idioma.nome}...`}</p>

                        <div className='instalador-arquivo' aria-live='polite'>
                            <b>
                                {etapa === 'pronto'
                                    ? `${ARQUIVOS.length} de ${ARQUIVOS.length} arquivos instalados`
                                    : passoAtual.texto}
                            </b>
                        </div>

                        {/* a barra anda em degraus (um por arquivo), sem deslizar */}
                        <div className='instalador-barra' role='progressbar' aria-valuenow={progresso} aria-valuemin='0' aria-valuemax='100'>
                            <div className='instalador-barra-cheia' style={{ width: `${progresso}%` }} />
                        </div>
                        <div className='instalador-contagem'>{progresso}%</div>

                        {mostrarDetalhes && (
                            <pre ref={terminalRef} className='instalador-terminal'>
                                {log.join('\n')}
                            </pre>
                        )}

                        <div className='instalador-botoes instalador-botoes-espalhados'>
                            <button type='button' className='config-botao config-botao-discreto' onClick={() => setMostrarDetalhes(mostrar => !mostrar)}>
                                {mostrarDetalhes ? 'Ocultar detalhes ▴' : 'Mostrar detalhes ▾'}
                            </button>
                            <button
                                type='button'
                                className='config-botao instalador-principal'
                                disabled={etapa !== 'pronto'}
                                onClick={aoConcluir}
                            >
                                Concluir
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default InstaladorIdioma
