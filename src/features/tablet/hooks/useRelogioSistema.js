import { useState } from 'react'

const FUSO_BRASILIA = 'America/Sao_Paulo'

// hora de Brasília agora, como uma data "local" (os mesmos números de dia/hora que um relógio em Brasília mostra)
const agoraEmBrasilia = () => {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: FUSO_BRASILIA,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hourCycle: 'h23',
        }).formatToParts(new Date()).map(({ type, value }) => [type, Number(value)])
    )
    return new Date(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second)
}

// Relógio do sistema do tablet: a pessoa pode mudar a hora e o dia (pelo calendário da barra de tarefas),
// como num computador de verdade. Guarda só a diferença para a hora real, então o relógio continua andando.
// Some no F5 (o tablet volta para a hora do aparelho).
export const useRelogioSistema = () => {
    const [ajusteRelogioMs, setAjusteRelogioMs] = useState(0)

    // passa a mostrar esta data/hora a partir de agora
    const definirDataHora = (novaData) => setAjusteRelogioMs(novaData.getTime() - Date.now())

    // volta para a hora certa (horário de Brasília)
    const sincronizarHorarioDeBrasilia = () => setAjusteRelogioMs(agoraEmBrasilia().getTime() - Date.now())

    return { ajusteRelogioMs, definirDataHora, sincronizarHorarioDeBrasilia }
}
