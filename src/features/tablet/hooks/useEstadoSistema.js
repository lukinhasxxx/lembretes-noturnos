import { useCallback, useEffect, useRef, useState } from 'react'
import {
    DURACAO_BOAS_VINDAS_MS,
    DURACAO_BOOT_EXTRA_MAXIMA_MS,
    DURACAO_BOOT_EXTRA_MINIMA_MS,
    DURACAO_BOOT_MS,
    DURACAO_ENCERRANDO_MS,
    DURACAO_ENTRANDO_MS,
    DURACAO_TELA_APAGADA_MS,
    ESTADOS_SISTEMA,
} from '../tablet.config'

const sortearEntre = (minimo, maximo) => minimo + Math.random() * (maximo - minimo)

// passos do boot depois do "ligando": [estado, espera em ms antes de entrar nele]
const passosDoBoot = () => {
    // as animações usam só o DURACAO_BOOT_MS; o extra sorteado é a barrinha rodando com o logo já pronto
    const duracaoBootComCarregamento =
        DURACAO_BOOT_MS + sortearEntre(DURACAO_BOOT_EXTRA_MINIMA_MS, DURACAO_BOOT_EXTRA_MAXIMA_MS)

    return [
        [ESTADOS_SISTEMA.boasVindas, duracaoBootComCarregamento],
        [ESTADOS_SISTEMA.areaDeTrabalho, DURACAO_BOAS_VINDAS_MS],
    ]
}

// Controla em que ponto o sistema do tablet está (desligado, ligando, boas-vindas, área de trabalho, bloqueado,
// login, desligando, reiniciando...). Não é salvo no navegador: depois do F5 o tablet volta desligado.
// Usado pelo SistemaTabletProvider; de fora, use o useSistemaTablet (contexts/SistemaTablet.js).
export const useEstadoSistema = () => {
    const [estadoSistema, setEstadoSistema] = useState(ESTADOS_SISTEMA.desligado)
    // guarda os timers da sequência atual para dar para cancelar quando outra ação começa
    const timersRef = useRef([])

    // só usam a ref e o setState: não mudam entre renders
    const limparTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }, [])

    // entra no primeiro estado na hora e agenda os seguintes; cada espera conta a partir do passo anterior
    const iniciarSequencia = useCallback((estadoInicial, passos) => {
        limparTimers()
        setEstadoSistema(estadoInicial)

        let tempoAcumulado = 0
        passos.forEach(([estado, espera]) => {
            tempoAcumulado += espera
            timersRef.current.push(setTimeout(() => setEstadoSistema(estado), tempoAcumulado))
        })
    }, [limparTimers])

    // boot → boas-vindas → área de trabalho. Só faz algo se o tablet estiver desligado.
    const ligarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.desligado) return

        iniciarSequencia(ESTADOS_SISTEMA.ligando, passosDoBoot())
    }, [estadoSistema, iniciarSequencia])

    // bloquear (menu iniciar → usuário): só a partir da área de trabalho
    const bloquearSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.areaDeTrabalho) return

        iniciarSequencia(ESTADOS_SISTEMA.bloqueado, [])
    }, [estadoSistema, iniciarSequencia])

    // a tela de bloqueio terminou de sair (arrastada ou clicada): mostra a tela de login (usuário + "Entrar")
    const desbloquearSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.bloqueado) return

        setEstadoSistema(ESTADOS_SISTEMA.login)
    }, [estadoSistema])

    // "Entrar" na tela de login: spinner com "Aguarde..." → área de trabalho
    const entrarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.login) return

        iniciarSequencia(ESTADOS_SISTEMA.entrando, [
            [ESTADOS_SISTEMA.areaDeTrabalho, DURACAO_ENTRANDO_MS],
        ])
    }, [estadoSistema, iniciarSequencia])

    // desligar (menu iniciar → energia): "Desligando..." → tela preta → desligado (quem usa o hook fecha o modal)
    const desligarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.areaDeTrabalho) return

        iniciarSequencia(ESTADOS_SISTEMA.desligando, [
            [ESTADOS_SISTEMA.apagado, DURACAO_ENCERRANDO_MS],
            [ESTADOS_SISTEMA.desligado, DURACAO_TELA_APAGADA_MS],
        ])
    }, [estadoSistema, iniciarSequencia])

    // reiniciar (menu iniciar → energia): "Reiniciando..." → tela preta → boot completo
    const reiniciarSistema = useCallback(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.areaDeTrabalho) return

        iniciarSequencia(ESTADOS_SISTEMA.reiniciando, [
            [ESTADOS_SISTEMA.apagado, DURACAO_ENCERRANDO_MS],
            [ESTADOS_SISTEMA.ligando, DURACAO_TELA_APAGADA_MS],
            ...passosDoBoot(),
        ])
    }, [estadoSistema, iniciarSequencia])

    // cancela a sequência se o App sair da tela
    useEffect(() => limparTimers, [limparTimers])

    return {
        estadoSistema,
        // atalho para quem está fora da feature (App): fecha o modal quando o desligar termina
        sistemaDesligado: estadoSistema === ESTADOS_SISTEMA.desligado,
        ligarSistema,
        bloquearSistema,
        desbloquearSistema,
        entrarSistema,
        desligarSistema,
        reiniciarSistema,
    }
}
