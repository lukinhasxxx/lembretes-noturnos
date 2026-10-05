import { useState, useEffect } from 'react'

// Hora e data do sistema, atualizadas a cada segundo. O visual vem do botão da barra de tarefas onde ele fica.
const Relogio = () => {
    const [dataAtual, setDataAtual] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setDataAtual(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <>
            <span>{dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{dataAtual.toLocaleDateString('pt-BR')}</span>
        </>
    )
}

export default Relogio
