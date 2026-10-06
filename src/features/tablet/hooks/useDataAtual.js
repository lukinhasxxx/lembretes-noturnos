import { useEffect, useState } from 'react'

// Data/hora atual, atualizada a cada segundo. Usada pelo relógio da barra de tarefas e pela tela de bloqueio.
export const useDataAtual = () => {
    const [dataAtual, setDataAtual] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setDataAtual(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return dataAtual
}
