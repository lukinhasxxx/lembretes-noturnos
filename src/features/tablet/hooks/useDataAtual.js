import { useEffect, useState } from 'react'
import { useSistemaTablet } from '../contexts/SistemaTablet'

// Data/hora do sistema do tablet, atualizada a cada segundo. Usada pelo relógio da barra de tarefas,
// pelo calendário e pela tela de bloqueio. Já vem com o ajuste da pessoa (hora/dia mudados no calendário).
export const useDataAtual = () => {
    const ajusteRelogioMs = useSistemaTablet()?.ajusteRelogioMs ?? 0
    const [agora, setAgora] = useState(() => Date.now())

    useEffect(() => {
        const timer = setInterval(() => setAgora(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    return new Date(agora + ajusteRelogioMs)
}
