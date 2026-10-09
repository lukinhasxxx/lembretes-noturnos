import { useEffect, useRef, useState } from 'react'
import { APPS, appDaTela } from '../apps.config'
import { ESTADOS_SISTEMA } from '../tablet.config'

// tela que cada app abre ao ser clicado na barra de tarefas (atualizada conforme a pessoa navega dentro do app).
// Começa na telaInicial de cada app do registro.
const ULTIMA_TELA_INICIAL = Object.fromEntries(Object.values(APPS).map(app => [app.id, app.telaInicial]))

// quantas telas o histórico guarda (só serve para o "minimizar" achar a tela de antes)
const LIMITE_HISTORICO_TELAS = 20

// Estado da área de trabalho do sistema do tablet: qual tela está na frente, quais apps estão abertos,
// em que tela cada app parou e o "minimizar" da barra de tarefas.
// Fica no contexto do tablet (e não dentro do modal) para o espelho do tablet da mesa ler a mesma coisa.
// estadoSistema: vem do useEstadoSistema; ao ligar/reiniciar, tudo volta ao começo
export const useAreaDeTrabalho = (estadoSistema) => {
    const [telaAtiva, setTelaAtiva] = useState('desktop')
    const [appsAbertos, setAppsAbertos] = useState([])
    const [ultimaTela, setUltimaTela] = useState(ULTIMA_TELA_INICIAL)
    // telas por onde a pessoa passou, da mais antiga para a mais recente (não precisa de re-render)
    const historicoTelasRef = useRef(['desktop'])
    // apps minimizados pela barra: ficam de fora quando outro app é minimizado, então minimizar um por um
    // acaba na área de trabalho (sem ficar pulando entre dois apps)
    const appsMinimizadosRef = useRef(new Set())

    useEffect(() => {
        // app que voltou para a frente (por qualquer caminho) deixa de estar minimizado
        const dono = appDaTela(telaAtiva)
        if (dono) appsMinimizadosRef.current.delete(dono)

        const historico = historicoTelasRef.current
        if (historico[historico.length - 1] === telaAtiva) return

        historico.push(telaAtiva)
        if (historico.length > LIMITE_HISTORICO_TELAS) historico.shift()
    }, [telaAtiva])

    // sistema ligando (primeira vez, depois de desligar ou ao reiniciar): começa sem nenhum app aberto.
    // A tela de boot cobre tudo nessa hora, então a troca não aparece.
    useEffect(() => {
        if (estadoSistema !== ESTADOS_SISTEMA.ligando) return

        setTelaAtiva('desktop')
        setAppsAbertos([])
        setUltimaTela(ULTIMA_TELA_INICIAL)
        historicoTelasRef.current = ['desktop']
        appsMinimizadosRef.current.clear()
    }, [estadoSistema])

    const abrirApp = (idDoApp, telaParaAbrir) => {
        setTimeout(() => {
            setTelaAtiva(telaParaAbrir)
            setUltimaTela({ ...ultimaTela, [idDoApp]: telaParaAbrir })
            if (!appsAbertos.includes(idDoApp)) {
                setAppsAbertos([...appsAbertos, idDoApp])
            }
        }, 150)
    }

    const fecharApp = (idDoAppParaFechar) => {
        setTimeout(() => {
            const novosAppsAbertos = appsAbertos.filter(app => app !== idDoAppParaFechar)
            setAppsAbertos(novosAppsAbertos)
            if (novosAppsAbertos.length > 0) {
                setTelaAtiva(ultimaTela[novosAppsAbertos[novosAppsAbertos.length - 1]])
            } else {
                setTelaAtiva('desktop')
            }
        }, 300)
    }

    // troca de aba dentro de um app (ex.: About ↔ Lembretes): mostra a tela e lembra dela para a barra de tarefas
    const mostrarTelaDoApp = (idDoApp, tela) => {
        setTelaAtiva(tela)
        setUltimaTela({ ...ultimaTela, [idDoApp]: tela })
    }

    // clique num app aberto na barra de tarefas (como no Windows):
    // - app em segundo plano → traz para a frente, na tela em que ele estava
    // - app já na frente → "minimiza": volta para a tela de antes dele (outro app aberto e não minimizado,
    //   ou a área de trabalho quando não sobrar nenhum)
    const alternarAppPelaBarra = (idDoApp) => {
        if (appDaTela(telaAtiva) !== idDoApp) {
            setTelaAtiva(ultimaTela[idDoApp])
            return
        }

        const minimizados = appsMinimizadosRef.current
        minimizados.add(idDoApp)

        const telaDeAntes = [...historicoTelasRef.current].reverse().find(tela => {
            const dono = appDaTela(tela)
            return tela === 'desktop' || (dono && !minimizados.has(dono) && appsAbertos.includes(dono))
        })
        const donoDaTelaDeAntes = appDaTela(telaDeAntes)
        // outro app: volta na tela atual dele (pode ter mudado de aba depois)
        setTelaAtiva(donoDaTelaDeAntes ? ultimaTela[donoDaTelaDeAntes] : 'desktop')
    }

    const voltarParaAreaDeTrabalho = () => setTelaAtiva('desktop')

    return {
        telaAtiva,
        appsAbertos,
        ultimaTela,
        abrirApp,
        fecharApp,
        mostrarTelaDoApp,
        alternarAppPelaBarra,
        voltarParaAreaDeTrabalho,
    }
}
