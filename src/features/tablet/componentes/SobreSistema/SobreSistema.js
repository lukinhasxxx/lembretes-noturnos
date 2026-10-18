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

// quando a página abriu: o "Ligado há" conta a partir daqui
const ABERTO_EM = Date.now()

const ABAS = [
    { id: 'sistema', nome: 'Sistema' },
    { id: 'aparelho', nome: 'Seu aparelho' },
]

// choquezinho do eclipse do NightOS: dura pouco e volta de tempos em tempos (sorteado entre os dois valores)
const DURACAO_CHOQUE_MS = 500
const INTERVALO_CHOQUE_MS = [2800, 5600]

const NOME_DO_TEMA = { [TEMAS.padrao]: 'Original', [TEMAS.noturno]: 'Noturno' }

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
            <p className='sobre-aviso'>Lido do seu navegador, na hora. Nada disso sai do seu aparelho.</p>
        </>
    )
}

// "Sobre" do Config em duas abas:
// Sistema = o tablet, no jeito do "Sobre o telefone" do Android (emblema grande + cartões);
// Seu aparelho = o hardware de verdade de quem está visitando (useEspecificacoesAparelho), no estilo CPU-Z.
const SobreSistema = () => {
    const [aba, setAba] = useState(ABAS[0].id)

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
                {aba === 'sistema' ? <AbaSistema /> : <AbaAparelho />}
            </div>

            <p className='sobre-assinatura'>
                Desenvolvido por <a href='https://github.com/lukinhasxxx' target='_blank' rel='noreferrer'>Lucas da Silva</a>
            </p>
        </div>
    )
}

export default SobreSistema
