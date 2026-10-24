import './SecaoFormatar.css'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { NOME_SISTEMA_POR_TEMA, SISTEMA } from '../../tablet.config'
import { levantarDados } from '../../utils/formatacao'

// a pessoa digita isto para confirmar (sem diferenciar maiúsculas)
const PALAVRA_DE_CONFIRMACAO = 'FORMATAR'

// quadro de confirmação, por cima da tela inteira do tablet: o que vai sumir (com números de verdade), os
// lembretes do mural como opção à parte e a palavra para confirmar
const ConfirmarFormatacao = ({ aoCancelar, aoConfirmar }) => {
    const { tema } = useSistemaTablet()
    // lido uma vez, quando o quadro abre
    const [dados] = useState(levantarDados)
    const [apagarLembretes, setApagarLembretes] = useState(false)
    const [digitado, setDigitado] = useState('')
    const confirmado = digitado.trim().toUpperCase() === PALAVRA_DE_CONFIRMACAO

    useEffect(() => {
        const aoTeclar = (evento) => { if (evento.key === 'Escape') aoCancelar() }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [aoCancelar])

    return (
        <div className='formatar-fundo' role='dialog' aria-modal='true' aria-labelledby='formatar-titulo'>
            {/* div e não form: o tablet tem um estilo antigo para todo <form> (o dos lembretes) */}
            <div className='formatar-quadro'>
                <strong id='formatar-titulo' className='formatar-titulo'>Formatar o {NOME_SISTEMA_POR_TEMA[tema] ?? SISTEMA.nome}?</strong>
                <p className='formatar-texto'>O tablet volta a ser como saiu de fábrica. Isto vai ser apagado:</p>

                {dados.itens.length ? (
                    <ul className='formatar-lista'>
                        {dados.itens.map(({ id, rotulo, detalhe }) => (
                            <li key={id}><b>{rotulo}</b><span>{detalhe}</span></li>
                        ))}
                    </ul>
                ) : (
                    <p className='formatar-texto formatar-vazio'>Quase nada: este tablet já está quase como saiu de fábrica.</p>
                )}

                {dados.lembretes > 0 && (
                    <label className='formatar-opcao'>
                        <input type='checkbox' checked={apagarLembretes} onChange={(evento) => setApagarLembretes(evento.target.checked)} />
                        Apagar também {dados.lembretes === 1 ? 'o lembrete' : `os ${dados.lembretes} lembretes`} do mural
                    </label>
                )}

                <label className='formatar-confirmacao'>
                    <span>Para confirmar, digite <b>{PALAVRA_DE_CONFIRMACAO}</b></span>
                    <input
                        type='text'
                        value={digitado}
                        onChange={(evento) => setDigitado(evento.target.value)}
                        onKeyDown={(evento) => { if (evento.key === 'Enter' && confirmado) aoConfirmar({ apagarLembretes }) }}
                        autoComplete='off'
                        spellCheck={false}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                    />
                </label>

                <div className='formatar-botoes'>
                    <button type='button' className='config-botao' onClick={aoCancelar}>Cancelar</button>
                    <button
                        type='button'
                        className='config-botao config-botao-perigo'
                        disabled={!confirmado}
                        onClick={() => aoConfirmar({ apagarLembretes })}
                    >
                        Formatar
                    </button>
                </div>
            </div>
        </div>
    )
}

// Config → Sistema → Formatar: abre a confirmação; confirmando, o sistema entra em "formatando" (a tela do tema
// apaga tudo e recarrega a página — ver TelaFormatando e utils/formatacao)
const SecaoFormatar = () => {
    const { formatarSistema, telaDoModal } = useSistemaTablet()
    const [confirmando, setConfirmando] = useState(false)

    return (
        <>
            <h3>Formatar</h3>
            <div className='config-linha'>
                <button type='button' className='config-botao config-botao-perigo' onClick={() => setConfirmando(true)}>
                    Formatar este tablet…
                </button>
                <span className='formatar-dica'>Volta tudo como saiu de fábrica</span>
            </div>
            {confirmando && telaDoModal && createPortal(
                <ConfirmarFormatacao
                    aoCancelar={() => setConfirmando(false)}
                    aoConfirmar={(opcoes) => {
                        setConfirmando(false)
                        formatarSistema(opcoes)
                    }}
                />,
                telaDoModal,
            )}
        </>
    )
}

export default SecaoFormatar
