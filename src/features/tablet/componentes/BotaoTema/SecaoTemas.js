import { useEffect, useRef } from 'react'
import BotaoTema from './BotaoTema'

// quanto tempo a lua fica pulsando quando o Config abre pelo "Experimentar" da notificação
const DURACAO_DESTAQUE_MS = 2400

// Seção "Temas" do Config (título + a lua).
// destacada: veio do "Experimentar" da notificação → rola o Config até aqui e a lua pulsa um pouco;
// aoTerminarDestaque: avisa que acabou (para não repetir na próxima vez que o Config abrir)
const SecaoTemas = ({ destacada, aoTerminarDestaque }) => {
    const tituloRef = useRef(null)

    useEffect(() => {
        if (!destacada) return

        // rola só a janela do Config (scrollIntoView rolaria a página inteira junto)
        const titulo = tituloRef.current
        const janela = titulo.closest('.janela-configuracao-led')
        if (janela) janela.scrollTo({ top: titulo.offsetTop - 16, behavior: 'smooth' })

        const timer = setTimeout(aoTerminarDestaque, DURACAO_DESTAQUE_MS)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destacada])

    return (
        <>
            <h3 ref={tituloRef}>Temas</h3>

            <div className={`espaco-botao-tema ${destacada ? 'destacada' : ''}`}>
                <BotaoTema />
            </div>
        </>
    )
}

export default SecaoTemas
