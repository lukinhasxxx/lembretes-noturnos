import { useState } from 'react'
import { CATEGORIAS } from './analiseXadrez'

const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((categoria) => [categoria.id, categoria]))

// Análise da partida (Stockfish) num quadro por cima do xadrez: uma coluna para cada lado (quem joga na
// esquerda, o oponente na direita), com a precisão em cima e, em cada linha, quantos lances de cada categoria
// (o selo da categoria no meio; o nome aparece num balão ao passar o mouse). Abre pela lateral, pelo quadro de
// fim ou pelo histórico.
// Na direita, o painel "Lances": passar o mouse num número mostra quais lances foram (clicar fixa); com
// aoEscolherLance, clicar num lance leva o tabuleiro até ele (para estudar a partida).
// lados: [{ cor, nome, precisao: número|null, contagem: { brilhante, otimo, ... } }] (2 itens)
// jogadas: [{ san (já em português), categoria }] na ordem da partida (opcional: sem ela, não tem o painel)
const ModalAnalise = ({ lados, jogadas, subtitulo, aoFechar, aoEscolherLance }) => {
    const [esquerda, direita] = lados
    // célula mostrada no painel: a que está sob o mouse ou, sem nenhuma, a que foi clicada ({ cor, categoria })
    const [sobMouse, setSobMouse] = useState(null)
    const [fixa, setFixa] = useState(null)
    const mostrando = sobMouse ?? fixa

    const lancesDa = (cor, categoria) => (jogadas ?? [])
        .map((jogada, indice) => ({ ...jogada, indice }))
        .filter((jogada) => (jogada.indice % 2 === 0 ? 'w' : 'b') === cor && jogada.categoria === categoria)
        .map(({ indice, san }) => ({ indice, texto: `${Math.floor(indice / 2) + 1}${indice % 2 === 0 ? '.' : '…'} ${san}` }))

    const cabecaDo = (lado) => (
        <div className='xadrez-modal-analise-lado'>
            <b title={lado.nome}>{lado.nome}</b>
            <span className='xadrez-modal-analise-precisao' title='Precisão'>{lado.precisao ?? '—'}%</span>
        </div>
    )

    // número de lances de um lado numa categoria; com o painel, passar o mouse mostra os lances e clicar fixa
    const numeroDo = (lado, categoria) => {
        const quantos = lado.contagem?.[categoria.id] ?? 0
        const esta = (celula) => celula?.cor === lado.cor && celula?.categoria === categoria.id
        if (!jogadas) {
            return <span className={`xadrez-modal-analise-numero${quantos ? '' : ' zero'}`}>{quantos}</span>
        }
        const celula = { cor: lado.cor, categoria: categoria.id }
        return (
            <button
                type='button'
                className={`xadrez-modal-analise-numero${quantos ? '' : ' zero'}${esta(fixa) ? ' fixa' : ''}`}
                aria-label={`${categoria.nome}, ${lado.nome}: ${quantos}`}
                aria-pressed={esta(fixa)}
                onMouseEnter={() => setSobMouse(celula)}
                onMouseLeave={() => setSobMouse(null)}
                onFocus={() => setSobMouse(celula)}
                onBlur={() => setSobMouse(null)}
                onClick={() => setFixa(esta(fixa) ? null : celula)}
            >
                {quantos}
            </button>
        )
    }

    const ladoMostrado = mostrando && lados.find((lado) => lado.cor === mostrando.cor)
    const categoriaMostrada = mostrando && CATEGORIA_POR_ID[mostrando.categoria]
    const lancesMostrados = mostrando ? lancesDa(mostrando.cor, mostrando.categoria) : []

    return (
        <div className='xadrez-modal-analise' role='dialog' aria-label='Análise da partida' onClick={aoFechar}>
            <div className={`xadrez-modal-analise-quadro${jogadas ? ' com-lances' : ''}`} onClick={(evento) => evento.stopPropagation()}>
                <header className='xadrez-modal-analise-topo'>
                    <strong>Análise da partida</strong>
                    {subtitulo && <span>{subtitulo}</span>}
                </header>

                <div className='xadrez-modal-analise-conteudo'>
                    <div className='xadrez-modal-analise-tabela'>
                        <div className='xadrez-modal-analise-linha cabeca'>
                            {cabecaDo(esquerda)}
                            <span className='xadrez-modal-analise-rotulo-precisao'>precisão</span>
                            {cabecaDo(direita)}
                        </div>

                        {CATEGORIAS.map((categoria) => (
                            <div key={categoria.id} className={`xadrez-modal-analise-linha ${categoria.id}`}>
                                {numeroDo(esquerda, categoria)}
                                <span className='xadrez-modal-analise-categoria' aria-label={categoria.nome}>
                                    <span className='xadrez-chip'><span className='xadrez-chip-simbolo'>{categoria.simbolo}</span></span>
                                    <span className='xadrez-modal-analise-nome' aria-hidden='true'>{categoria.nome}</span>
                                </span>
                                {numeroDo(direita, categoria)}
                            </div>
                        ))}
                    </div>

                    {jogadas && (
                        <aside className='xadrez-modal-analise-painel' aria-live='polite'>
                            {mostrando ? (
                                <>
                                    <p className={`xadrez-modal-analise-painel-titulo ${categoriaMostrada.id}`}>
                                        <span className='xadrez-chip'><span className='xadrez-chip-simbolo'>{categoriaMostrada.simbolo}</span></span>
                                        <b>{categoriaMostrada.nome}</b>
                                        <span>{ladoMostrado.nome}</span>
                                    </p>
                                    {lancesMostrados.length ? (
                                        <ul className='xadrez-modal-analise-painel-lances'>
                                            {lancesMostrados.map(({ indice, texto }) => (
                                                <li key={indice}>
                                                    {aoEscolherLance ? (
                                                        <button type='button' onClick={() => aoEscolherLance(indice)} title='Ver no tabuleiro'>{texto}</button>
                                                    ) : (
                                                        <span>{texto}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className='xadrez-modal-analise-painel-dica'>Nenhum lance.</p>
                                    )}
                                </>
                            ) : (
                                <p className='xadrez-modal-analise-painel-dica'>
                                    Passe o mouse num número para ver quais lances foram (clique para fixar).
                                    {aoEscolherLance && ' Clicando num lance, o tabuleiro vai até ele.'}
                                </p>
                            )}
                        </aside>
                    )}
                </div>

                <div className='xadrez-aviso-botoes'>
                    <button type='button' className='config-botao' onClick={aoFechar}>Fechar</button>
                </div>
            </div>
        </div>
    )
}

export default ModalAnalise
