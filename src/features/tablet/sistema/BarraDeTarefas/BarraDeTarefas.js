import './BarraDeTarefas.css'
import { useEffect, useRef, useState } from 'react'
import BotaoBarraDeTarefas from '../BotaoBarraDeTarefas/BotaoBarraDeTarefas'
import MenuIniciar from '../MenuIniciar/MenuIniciar'
import Relogio from '../Relogio/Relogio'
import Calendario from '../Calendario/Calendario'
import { APPS } from '../../apps.config'

// fecha um painel da barra (menu iniciar, calendário) ao clicar fora dele e do botão que o abre, ou com Esc
// fechar: só troca o estado ('aberto' → 'fechando'), então pode ser recriado a cada render
const useFecharAoClicarFora = (aberto, areaRef, fechar) => {
    useEffect(() => {
        if (!aberto) return

        const fecharAoClicarFora = (evento) => {
            if (!areaRef.current.contains(evento.target)) fechar()
        }
        const fecharComEsc = (evento) => {
            if (evento.key === 'Escape') fechar()
        }

        document.addEventListener('mousedown', fecharAoClicarFora)
        document.addEventListener('keydown', fecharComEsc)
        return () => {
            document.removeEventListener('mousedown', fecharAoClicarFora)
            document.removeEventListener('keydown', fecharComEsc)
        }
    }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps
}

// Barra de tarefas do sistema: à esquerda iniciar, voltar e apps abertos; à direita a bandeja (ícones de status,
// idioma, relógio e notificações). A bandeja vai para a direita sozinha (margin-left: auto), sem medida fixa.
// appsAbertos: ids do apps.config.js, na ordem em que foram abertos
// aoAbrirApp(idDoApp): abre um app pelo menu iniciar; aoBloquear / aoDesligar / aoReiniciar: ações do menu iniciar
const BarraDeTarefas = ({ appsAbertos, aoClicarNoApp, aoAbrirApp, aoBloquear, aoDesligar, aoReiniciar, aoVoltarParaAreaDeTrabalho }) => {
    // 'fechado' → 'aberto' → 'fechando' (animação de fechar) → 'fechado'
    const [estadoMenuIniciar, setEstadoMenuIniciar] = useState('fechado')
    const menuIniciarAberto = estadoMenuIniciar === 'aberto'
    // botão iniciar + menu: clicar fora dos dois fecha o menu
    const areaMenuIniciarRef = useRef(null)

    // calendário (clique no relógio): mesmo ciclo do menu iniciar
    const [estadoCalendario, setEstadoCalendario] = useState('fechado')
    const calendarioAberto = estadoCalendario === 'aberto'
    const areaCalendarioRef = useRef(null)

    const fecharMenuIniciar = () => setEstadoMenuIniciar(estado => (estado === 'aberto' ? 'fechando' : estado))
    const alternarMenuIniciar = () => setEstadoMenuIniciar(estado => (estado === 'aberto' ? 'fechando' : 'aberto'))
    const fecharCalendario = () => setEstadoCalendario(estado => (estado === 'aberto' ? 'fechando' : estado))
    const alternarCalendario = () => setEstadoCalendario(estado => (estado === 'aberto' ? 'fechando' : 'aberto'))

    useFecharAoClicarFora(menuIniciarAberto, areaMenuIniciarRef, fecharMenuIniciar)
    useFecharAoClicarFora(calendarioAberto, areaCalendarioRef, fecharCalendario)

    return (
        <div className='barra-de-tarefas'>
            <div ref={areaMenuIniciarRef} className='barra-de-tarefas-area-menu-iniciar'>
                <BotaoBarraDeTarefas
                    icone='/imagens/windows/menuIniciar.png'
                    alt='Menu iniciar'
                    tamanhoIcone={18}
                    ativo={menuIniciarAberto}
                    aoClicar={alternarMenuIniciar}
                />
                {estadoMenuIniciar !== 'fechado' && (
                    <MenuIniciar
                        aoAbrirApp={aoAbrirApp}
                        aoBloquear={aoBloquear}
                        aoDesligar={aoDesligar}
                        aoReiniciar={aoReiniciar}
                        aoFechar={fecharMenuIniciar}
                        fechando={estadoMenuIniciar === 'fechando'}
                        aoTerminarDeFechar={() => setEstadoMenuIniciar('fechado')}
                    />
                )}
            </div>

            <BotaoBarraDeTarefas
                icone='/imagens/windows/setaVoltar.png'
                alt='Voltar para a área de trabalho'
                tamanhoIcone={20}
                largura={45}
                aoClicar={aoVoltarParaAreaDeTrabalho}
            />

            <div className='barra-de-tarefas-apps-abertos'>
                {appsAbertos.map(idDoApp => (
                    <BotaoBarraDeTarefas
                        key={idDoApp}
                        icone={APPS[idDoApp].icone}
                        alt={`Abrir ${APPS[idDoApp].nome}`}
                        tamanhoIcone={APPS[idDoApp].tamanhoIconeBarra}
                        aoClicar={() => aoClicarNoApp(idDoApp)}
                    />
                ))}
            </div>

            <div className='barra-de-tarefas-bandeja'>
                <BotaoBarraDeTarefas icone='/imagens/windows/bateriaIcone.png' alt='Bateria carregando' tamanhoIcone={12} largura={24} />
                <BotaoBarraDeTarefas icone='/imagens/windows/wifiIcone.png' alt='Wi-Fi' tamanhoIcone={15} largura={20} />
                <BotaoBarraDeTarefas icone='/imagens/windows/semSomIcone.png' alt='Sem som' tamanhoIcone={26} largura={26} />
                <BotaoBarraDeTarefas largura={35}>
                    <span>POR</span>
                    <span>PTB2</span>
                </BotaoBarraDeTarefas>
                <div ref={areaCalendarioRef} className='barra-de-tarefas-area-calendario'>
                    <BotaoBarraDeTarefas largura={86} ativo={calendarioAberto} aoClicar={alternarCalendario}>
                        <Relogio />
                    </BotaoBarraDeTarefas>
                    {estadoCalendario !== 'fechado' && (
                        <Calendario
                            fechando={estadoCalendario === 'fechando'}
                            aoTerminarDeFechar={() => setEstadoCalendario('fechado')}
                        />
                    )}
                </div>
                <BotaoBarraDeTarefas
                    className='botao-notificacoes'
                    icone='/imagens/windows/iconeNotificacoes.png'
                    alt='Notificações'
                    tamanhoIcone={20}
                    largura={34}
                />
            </div>
        </div>
    )
}

export default BarraDeTarefas
