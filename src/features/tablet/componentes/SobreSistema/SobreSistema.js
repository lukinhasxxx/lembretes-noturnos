import './SobreSistema.css'
import { useEffect, useState } from 'react'
import ChoqueLua from '../BotaoTema/ChoqueLua'
import { aleatorioEntre } from '../../../../shared/utils/aleatorio'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { useDataAtual } from '../../hooks/useDataAtual'
import { NAO_INFORMADO, useEspecificacoesAparelho } from '../../hooks/useEspecificacoesAparelho'
import { TEMAS } from '../../hooks/useTemaSistema'
import { NOME_SISTEMA_POR_TEMA, SISTEMA } from '../../tablet.config'
import LogoSistema from '../../sistema/LogoSistema/LogoSistema'
import { useEstadoPersistido } from '../../../../shared/hooks/useEstadoPersistido'
import {
    BASE_DA_NOTA, NOME_DO_TIPO, TESTES_DESEMPENHO, classeDaNota, medirDesempenho, notaDe, notaGeral, notaSingleThread, tipoDeAparelho,
} from './desempenho'
// gerado pelo scripts/gerarFeitoCom.js antes do start/build (lê o package.json, só a lista permitida)
import feitoCom from './feitoCom.gerado.json'

// quando a página abriu: o "Ligado há" conta a partir daqui
const ABERTO_EM = Date.now()

const ABAS = [
    { id: 'sistema', nome: 'Sistema' },
    { id: 'aparelho', nome: 'Seu aparelho' },
    { id: 'desempenho', nome: 'Desempenho' },
    { id: 'feito', nome: 'Tecnologias' },
]

// fora do package.json (arquivos em public/): também aparecem na aba Tecnologias
const OUTRAS_TECNOLOGIAS = [
    { id: 'stockfish', nome: 'Stockfish 19', papel: 'Xadrez: níveis fortes, dica e análise (WebAssembly)', versao: '19.0.1' },
]

// choquezinho do eclipse do NightOS: dura pouco e volta de tempos em tempos (sorteado entre os dois valores)
const DURACAO_CHOQUE_MS = 500
const INTERVALO_CHOQUE_MS = [2800, 5600]

const NOME_DO_TEMA = { [TEMAS.padrao]: 'CyberOS', [TEMAS.noturno]: 'NightOS' }

const doisDigitos = (numero) => String(numero).padStart(2, '0')

const tempoLigado = () => {
    const segundos = Math.floor((Date.now() - ABERTO_EM) / 1000)
    return `${doisDigitos(Math.floor(segundos / 3600))}:${doisDigitos(Math.floor(segundos / 60) % 60)}:${doisDigitos(segundos % 60)}`
}

// uma linha "rótulo | caixinha com o valor", como no CPU-Z. Sem valor (o navegador não contou): NULL
const Linha = ({ rotulo, valor, aguardando = false }) => (
    <div className='sobre-linha'>
        <dt>{rotulo}</dt>
        <dd className={valor === NAO_INFORMADO ? 'sobre-sem-valor' : ''}>
            {valor !== NAO_INFORMADO ? valor : aguardando ? 'Medindo…' : 'NULL'}
        </dd>
    </div>
)

// grupo com título na borda (o <fieldset> com <legend> dos programas de spec)
const Grupo = ({ titulo, children }) => (
    <fieldset className='sobre-grupo'>
        <legend>{titulo}</legend>
        <dl>{children}</dl>
    </fieldset>
)

// NightOS: o mini eclipse do login, que de vez em quando solta um choquezinho (o mesmo da lua do botão de tema)
const EmblemaEclipse = () => {
    const [semente, setSemente] = useState(0)

    useEffect(() => {
        let timer
        const agendar = () => {
            timer = setTimeout(() => {
                setSemente(Date.now())
                agendar()
            }, aleatorioEntre(INTERVALO_CHOQUE_MS[0], INTERVALO_CHOQUE_MS[1]))
        }
        agendar()
        return () => clearTimeout(timer)
    }, [])

    return (
        <span className='sobre-emblema sobre-emblema-eclipse' aria-hidden='true'>
            <ChoqueLua semente={semente} duracaoMs={DURACAO_CHOQUE_MS} />
        </span>
    )
}

const AbaSistema = () => {
    const { tema, idiomaSistema, idiomaTeclado, telaDoModal } = useSistemaTablet()
    // só para redesenhar a cada segundo (o tempo ligado é pelo relógio real, não pela hora mudada no calendário)
    useDataAtual()
    const caixaTela = telaDoModal?.getBoundingClientRect()

    const cartoes = [
        ['Usuário', SISTEMA.usuario],
        ['Ligado há', tempoLigado()],
        ['Tema', NOME_DO_TEMA[tema] ?? tema],
        ['Resolução', caixaTela?.width ? `${Math.round(caixaTela.width)} × ${Math.round(caixaTela.height)}` : '—'],
        ['Idioma', idiomaSistema.nome],
        ['Teclado', idiomaTeclado.tecladoNome],
    ]

    return (
        <>
            {/* topo do "Sobre o telefone" do Android: o emblema do sistema grande, com nome e versão */}
            <div className='sobre-heroi'>
                {tema === TEMAS.noturno ? <EmblemaEclipse /> : <LogoSistema className='sobre-emblema' />}
                <div>
                    <strong className='sobre-heroi-nome'>{NOME_SISTEMA_POR_TEMA[tema] ?? SISTEMA.nome}</strong>
                    <span className='sobre-heroi-versao'>Versão 1.0</span>
                </div>
            </div>

            <dl className='sobre-cartoes'>
                {cartoes.map(([rotulo, valor]) => (
                    <div key={rotulo}>
                        <dt>{rotulo}</dt>
                        <dd>{valor}</dd>
                    </div>
                ))}
            </dl>
        </>
    )
}

const AbaAparelho = () => {
    const spec = useEspecificacoesAparelho()
    const { tela, plataforma } = spec
    const telaReal = tela.densidade !== 1
        ? ` (${Math.round(tela.largura * tela.densidade)} × ${Math.round(tela.altura * tela.densidade)} reais)`
        : ''

    return (
        <>
            <Grupo titulo='Processador'>
                <Linha rotulo='Threads' valor={spec.threads} />
                <Linha rotulo='Arquitetura' valor={plataforma.arquitetura} />
            </Grupo>
            <Grupo titulo='Placa de vídeo'>
                <Linha rotulo='Modelo' valor={spec.gpu.modelo} />
                <Linha rotulo='Fabricante' valor={spec.gpu.fabricante} />
                <Linha rotulo='API' valor={spec.gpu.api} />
            </Grupo>
            <Grupo titulo='Memória'>
                <Linha
                    rotulo='RAM'
                    // o Chrome trava o número em 8 (privacidade): 8 quer dizer "8 GB ou mais"
                    valor={spec.memoriaGb === NAO_INFORMADO ? NAO_INFORMADO : spec.memoriaGb >= 8 ? '8 GB ou mais' : `${spec.memoriaGb} GB`}
                />
                <Linha rotulo='Em uso pelo site' valor={spec.memoriaJsMb === NAO_INFORMADO ? NAO_INFORMADO : `${spec.memoriaJsMb} MB`} />
            </Grupo>
            <Grupo titulo='Tela'>
                <Linha rotulo='Resolução' valor={`${tela.largura} × ${tela.altura}${telaReal}`} />
                <Linha rotulo='Atualização' valor={spec.taxaHz === NAO_INFORMADO ? NAO_INFORMADO : `${spec.taxaHz} Hz`} aguardando />
                <Linha rotulo='Cores' valor={`${tela.profundidadeCor} bits`} />
                <Linha rotulo='Toque' valor={spec.toque ? 'Sim' : 'Não'} />
            </Grupo>
            <Grupo titulo='Plataforma'>
                <Linha rotulo='Sistema' valor={plataforma.sistema} />
                <Linha rotulo='Navegador' valor={plataforma.navegador} />
                {plataforma.modelo !== NAO_INFORMADO && <Linha rotulo='Aparelho' valor={plataforma.modelo} />}
                <Linha rotulo='Idioma' valor={spec.idiomaNavegador} />
                <Linha rotulo='Fuso horário' valor={spec.fusoHorario} />
            </Grupo>
        </>
    )
}

// as barras dos testes vão até esta nota (ou até a nota do teste, se passar)
const TOPO_DAS_BARRAS = 1500

// teste de desempenho (desempenho.js): roda na hora, dá a nota e o que ela quer dizer para o tipo de aparelho
// (celular/tablet tem a régua um pouco mais baixa) e guarda o último resultado no navegador
const AbaDesempenho = () => {
    // último resultado: { data, porSegundo: { inteiros, flutuante, memoria, multi }, threads, aparelho }
    const [resultado, setResultado] = useEstadoPersistido('sobre-desempenho', null)
    // rodando: { fracao, teste } (null = parado)
    const [rodando, setRodando] = useState(null)
    const [falhou, setFalhou] = useState(false)
    // o "i" ao lado da nota: explica a base (1000 pontos)
    const [infoAberta, setInfoAberta] = useState(false)

    const testar = async () => {
        if (rodando) return
        setFalhou(false)
        setRodando({ fracao: 0, teste: TESTES_DESEMPENHO[0].id })
        try {
            const porSegundo = await medirDesempenho((fracao, teste) => setRodando({ fracao, teste }))
            setResultado({ data: new Date().toISOString(), porSegundo, threads: navigator.hardwareConcurrency || null, aparelho: tipoDeAparelho() })
        } catch (erro) {
            console.warn('Não deu para rodar o teste de desempenho.', erro)
            setFalhou(true)
        } finally {
            setRodando(null)
        }
    }

    const geral = resultado && notaGeral(resultado.porSegundo)
    // o que a nota quer dizer (Muito bom, Bom...) para o tipo de aparelho em que o teste rodou
    const aparelho = resultado?.aparelho ?? tipoDeAparelho()
    const classe = geral !== null && geral !== undefined ? classeDaNota(geral, aparelho) : null
    const nomeDoTeste = TESTES_DESEMPENHO.find(({ id }) => id === rodando?.teste)?.nome

    // uma linha "nome | barra | nota" (as barras vão até TOPO_DAS_BARRAS, ou até a nota, se passar)
    const linhaDoTeste = (id, nome, nota, descricao) => (
        <div key={id} className='sobre-desempenho-teste' title={descricao}>
            <dt>{nome}</dt>
            <dd>
                <div className='sobre-desempenho-trilho' style={{ '--voce': (nota ?? 0) / Math.max(TOPO_DAS_BARRAS, nota ?? 0) }} />
                <span>{nota ?? '—'}</span>
            </dd>
        </div>
    )
    const testesDeUmNucleo = TESTES_DESEMPENHO.filter(({ id }) => id !== 'multi')
    const multi = TESTES_DESEMPENHO.find(({ id }) => id === 'multi')

    return (
        <>
            <div className='sobre-desempenho-topo'>
                <div>
                    <strong className='sobre-desempenho-nota'>{geral ?? '—'}</strong>
                    <span className='sobre-desempenho-legenda'>
                        {geral ? `pontos · ${NOME_DO_TIPO[aparelho]}` : 'Mede a força do seu aparelho'}
                    </span>
                    {classe && !rodando && <b className={`sobre-desempenho-veredito ${classe.id}`}>{classe.nome}</b>}
                    <button
                        type='button'
                        className={`sobre-desempenho-info${infoAberta ? ' aberta' : ''}`}
                        aria-expanded={infoAberta}
                        aria-label='Como a nota é calculada'
                        onClick={() => setInfoAberta((aberta) => !aberta)}
                    >
                        i
                    </button>
                </div>
                <button type='button' className='config-botao' onClick={testar} disabled={Boolean(rodando)}>
                    {rodando ? 'Testando…' : resultado ? '↻ Testar de novo' : '▶ Testar'}
                </button>
            </div>

            {infoAberta && (
                <p className='sobre-desempenho-explicacao'>
                    Base da nota: <b>1000 pontos</b> = um PC com {BASE_DA_NOTA.processador}, {BASE_DA_NOTA.memoria} de RAM
                    e {BASE_DA_NOTA.placaDeVideo}. O teste mede o processador e a memória; celular e tablet são comparados
                    com uma régua um pouco mais baixa.
                </p>
            )}

            {rodando && (
                <div className='sobre-desempenho-progresso' role='status'>
                    <span>{nomeDoTeste ? `Testando: ${nomeDoTeste}…` : 'Terminando…'}</span>
                    <div className='sobre-desempenho-barra' style={{ '--fracao': rodando.fracao }} />
                </div>
            )}
            {falhou && <p className='sobre-aviso'>Não deu para rodar o teste neste navegador.</p>}

            <Grupo titulo='Resumo'>
                {linhaDoTeste('single', 'Single-thread', resultado ? notaSingleThread(resultado.porSegundo) : null, 'Um núcleo só (média dos três testes abaixo)')}
                {linhaDoTeste(multi.id, multi.nome, resultado ? notaDe(multi.id, resultado.porSegundo[multi.id]) : null, multi.descricao)}
            </Grupo>

            <Grupo titulo='Testes de um núcleo'>
                {testesDeUmNucleo.map(({ id, nome, descricao }) => (
                    linhaDoTeste(id, nome, resultado ? notaDe(id, resultado.porSegundo[id]) : null, descricao)
                ))}
            </Grupo>

            <p className='sobre-aviso'>
                O teste roda em tempo real, no seu aparelho.
                {resultado?.data && ` Último teste: ${new Date(resultado.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`}
            </p>
        </>
    )
}

// aba Tecnologias (o "Feito com"): as principais do package.json (só as de uma lista permitida, ver
// scripts/gerarFeitoCom.js) e as que ficam em public/. "Técnico" mostra do jeito que veio do package.json
const AbaFeitoCom = () => {
    const [tecnico, setTecnico] = useState(false)
    const tecnologias = [...feitoCom.tecnologias, ...OUTRAS_TECNOLOGIAS]

    return (
        <>
            <div className='sobre-feito-topo'>
                <span>{tecnologias.length} principais tecnologias</span>
                <button type='button' className={`config-botao${tecnico ? ' ativo' : ''}`} aria-pressed={tecnico} onClick={() => setTecnico((ligado) => !ligado)}>
                    {'</>'} Técnico
                </button>
            </div>

            {tecnico ? (
                <pre className='sobre-feito-codigo'>
                    <span className='sobre-feito-comentario'>{'// package.json → só o que está na lista permitida\n'}</span>
                    {feitoCom.tecnologias.map(({ id, pedida, versao }) => (
                        <span key={id}>
                            {`"${id}": "${pedida}"`}
                            <span className='sobre-feito-comentario'>{`  // ${versao}\n`}</span>
                        </span>
                    ))}
                    <span className='sobre-feito-comentario'>{'\n// public/ (fora do package.json)\n'}</span>
                    {OUTRAS_TECNOLOGIAS.map(({ id, versao }) => `"${id}": "${versao}"\n`)}
                    <span className='sobre-feito-comentario'>
                        {'\n// lido do package.json do projeto na hora do build; de propósito, só o que está numa lista\n// permitida aparece aqui (scripts/gerarFeitoCom.js)'}
                    </span>
                </pre>
            ) : (
                <ul className='sobre-feito-lista'>
                    {tecnologias.map(({ id, nome, papel, versao }) => (
                        <li key={id}>
                            <b>{nome}</b>
                            <span>{papel}</span>
                            <small>{versao}</small>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

const PAINEIS = { sistema: AbaSistema, aparelho: AbaAparelho, desempenho: AbaDesempenho, feito: AbaFeitoCom }

// "Sobre" do Config em quatro abas:
// Sistema = o tablet, no jeito do "Sobre o telefone" do Android (emblema grande + cartões);
// Seu aparelho = o hardware de verdade de quem está visitando (useEspecificacoesAparelho), no estilo CPU-Z;
// Desempenho = teste na hora, com a nota e o que ela quer dizer; Tecnologias = as principais do projeto.
const SobreSistema = () => {
    const [aba, setAba] = useState(ABAS[0].id)
    const Painel = PAINEIS[aba]

    return (
        <div className='sobre-sistema'>
            <div className='sobre-abas' role='tablist'>
                {ABAS.map(({ id, nome }) => (
                    <button
                        key={id}
                        type='button'
                        role='tab'
                        aria-selected={id === aba}
                        className={id === aba ? 'ativa' : ''}
                        onClick={() => setAba(id)}
                    >
                        {nome}
                    </button>
                ))}
            </div>

            <div className='sobre-painel' role='tabpanel'>
                <Painel />
            </div>

            <p className='sobre-assinatura'>
                Desenvolvido por <a href='https://github.com/lukinhasxxx' target='_blank' rel='noreferrer'>Lucas da Silva</a>
            </p>
        </div>
    )
}

export default SobreSistema
