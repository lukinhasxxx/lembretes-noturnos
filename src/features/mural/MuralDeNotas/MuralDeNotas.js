import { VisibilidadePainelContext } from '../contexts/VisibilidadePainel'
import './MuralDeNotas.css'
import CardDeNotas from '../CardDeNotas/CardDeNotas'
import { useContext, useState } from 'react'

const sortearEntre = (minimo, maximo) => minimo + Math.random() * (maximo - minimo)

// A cada volta da animação de vento (14s), sorteia a força do próximo ciclo para o vento não ser sempre igual.
// A troca acontece no fim do ciclo, quando o balanço está em 0°, então não dá "pulo".
// Escreve direto no style do painel: não causa re-render.
const sortearForcaDoVento = (evento) => {
    if (evento.animationName !== 'ventoComOscilacao' || evento.target !== evento.currentTarget) return

    // rajada: 0.6 a 1.5 × o balanço original (pico de ~2.2° a ~5.4°)
    evento.currentTarget.style.setProperty('--forca-rajada-vento', sortearEntre(0.6, 1.5).toFixed(2))
    // brisa: -1.2 a 1.2 → às vezes a ondinha vai para frente, às vezes para trás
    evento.currentTarget.style.setProperty('--forca-brisa-vento', sortearEntre(-1.2, 1.2).toFixed(2))
}

// apagandoNotas: o "limpar tudo" está rodando o glitch das notas sumindo
const MuralDeNotas = ({lembretes, aoDeletar, aoFixar, aoLimparTudo, apagandoNotas, painelLigadoPermanente, animacaoDeveRodar, conteudoVisivelPainel}) => {
    const {mostrarPainel} = useContext(VisibilidadePainelContext)
    // aba "Deletar tudo": aparece no hover da faixa da esquerda; clicar na faixa fixa/solta a aba
    const [abaFixada, setAbaFixada] = useState(false)
    // depois de clicar em "Deletar tudo" a pergunta fica fixa até escolher Sim ou Não
    const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)
    // mouse em cima de "Deletar tudo"/"Sim": a borda do painel pisca com o glitch do botão "Wallpapers"
    const [bordaEmGlitch, setBordaEmGlitch] = useState(false)
    const podeLimpar = lembretes.length > 0 && !apagandoNotas

    return (

        painelLigadoPermanente === true && (<section className={`painel ${animacaoDeveRodar ? 'painel-surgindo' : ''} ${apagandoNotas ? 'apagando-notas' : ''} ${bordaEmGlitch && podeLimpar ? 'borda-em-glitch' : ''}`} style={{opacity:mostrarPainel?'1':'0'}} onAnimationIteration={sortearForcaDoVento} >

            {podeLimpar && (
                <>
                    {/* faixa na borda esquerda: hover projeta a aba para fora do painel; clique fixa/solta */}
                    <div
                        className={`zona-hover-limpar ${abaFixada ? 'ativa' : ''}`}
                        onClick={() => setAbaFixada(fixada => !fixada)}
                    />

                    <div className={`aba-limpar ${abaFixada ? 'fixada' : ''} ${confirmandoLimpeza ? 'confirmando' : ''}`}>
                        {!confirmandoLimpeza ? (
                            <button
                                className='botao-aba-limpar'
                                onMouseEnter={() => setBordaEmGlitch(true)}
                                onMouseLeave={() => setBordaEmGlitch(false)}
                                onClick={() => setConfirmandoLimpeza(true)}
                            >
                                Deletar tudo
                            </button>
                        ) : (
                            <>
                                <span className='pergunta-aba-limpar'>Apagar todas?</span>
                                <button
                                    className='botao-aba-limpar botao-aba-limpar-sim'
                                    onMouseEnter={() => setBordaEmGlitch(true)}
                                    onMouseLeave={() => setBordaEmGlitch(false)}
                                    onClick={() => {
                                        setConfirmandoLimpeza(false)
                                        setBordaEmGlitch(false)
                                        setAbaFixada(false)
                                        aoLimparTudo()
                                    }}
                                >
                                    Sim
                                </button>
                                <button
                                    className='botao-aba-limpar botao-aba-limpar-nao'
                                    onClick={() => setConfirmandoLimpeza(false)}
                                >
                                    Não
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

        <p>Lembretes Noturnos</p>

            <div className='zona-dos-cards'>
                {lembretes.map(lembrete => {
                        return <CardDeNotas
                        lembretes = {lembrete}
                        key = {lembrete.id}
                        aoDeletar = {aoDeletar}  
                        aoFixar={aoFixar}
                        />
                    })
                }
            {lembretes.length <= 0 && conteudoVisivelPainel && (<p
            className='lembrete-vazio'>
                    Você ainda não possui lembretes no painel, por favor, vá até o tablet e adicione.
                </p>)}
                </div>
            </section>)
    )
}

export default MuralDeNotas