import { useCallback, useEffect, useRef, useState } from 'react'
import {
    DURACAO_BOAS_VINDAS_MS,
    DURACAO_BOOT_EXTRA_MAXIMA_MS,
    DURACAO_BOOT_EXTRA_MINIMA_MS,
    DURACAO_BOOT_MS,
    DURACAO_ENTRANDO_MS,
    ESTADOS_SISTEMA,
} from '../tablet.config'

const sortearEntre = (minimo, maximo) => minimo + Math.random() * (maximo - minimo)

// Controla em que ponto o sistema do tablet está (desligado, ligando, boas-vindas, área de trabalho, bloqueado, login).
// Não é salvo no navegador: depois do F5 o tablet volta desligado.
export const useSistemaTablet = () => {
    const [estadoSistema, setEstadoSistema] = useState(ESTADOS_SISTEMA.desligado)
    // guarda os timers da sequência para dar para cancelar (vai servir no desligar/reiniciar do menu iniciar)
    const timersRef = useRef([])

    const limparTimers = () => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }

    // boot → boas-vindas → área de trabalho. Só faz algo se o tablet estiver desligado.
    const ligarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.desligado) return

        // as animações usam só o DURACAO_BOOT_MS; o extra sorteado é a barrinha rodando com o logo já pronto
        const duracaoBootComCarregamento =
            DURACAO_BOOT_MS + sortearEntre(DURACAO_BOOT_EXTRA_MINIMA_MS, DURACAO_BOOT_EXTRA_MAXIMA_MS)

        limparTimers()
        setEstadoSistema(ESTADOS_SISTEMA.ligando)
        timersRef.current.push(
            setTimeout(() => setEstadoSistema(ESTADOS_SISTEMA.boasVindas), duracaoBootComCarregamento),
            setTimeout(() => setEstadoSistema(ESTADOS_SISTEMA.areaDeTrabalho), duracaoBootComCarregamento + DURACAO_BOAS_VINDAS_MS),
        )
    }, [estadoSistema])

    // bloquear (menu iniciar → usuário): só a partir da área de trabalho
    const bloquearSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.areaDeTrabalho) return

        limparTimers()
        setEstadoSistema(ESTADOS_SISTEMA.bloqueado)
    }, [estadoSistema])

    // a tela de bloqueio terminou de sair (arrastada ou clicada): mostra a tela de login (usuário + "Entrar")
    const desbloquearSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.bloqueado) return

        setEstadoSistema(ESTADOS_SISTEMA.login)
    }, [estadoSistema])

    // "Entrar" na tela de login: spinner com "Aguarde..." → área de trabalho
    const entrarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.login) return

        limparTimers()
        setEstadoSistema(ESTADOS_SISTEMA.entrando)
        timersRef.current.push(
            setTimeout(() => setEstadoSistema(ESTADOS_SISTEMA.areaDeTrabalho), DURACAO_ENTRANDO_MS),
        )
    }, [estadoSistema])

    // cancela a sequência se o App sair da tela
    useEffect(() => limparTimers, [])

    return { estadoSistema, ligarSistema, bloquearSistema, desbloquearSistema, entrarSistema }
}
