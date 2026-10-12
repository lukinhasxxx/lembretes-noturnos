import './BarraDeTarefas.css'
import { useEffect, useRef, useState } from 'react'
import BotaoBarraDeTarefas from '../BotaoBarraDeTarefas/BotaoBarraDeTarefas'
import MenuIniciar from '../MenuIniciar/MenuIniciar'
import Relogio from '../Relogio/Relogio'
import Calendario from '../Calendario/Calendario'
import { BalaoNotificacao, CentralDeNotificacoes } from '../Notificacoes/Notificacoes'
import { APPS } from '../../apps.config'
import { useSistemaTablet } from '../../contexts/SistemaTablet'

// fecha um painel da barra (menu iniciar, calendário...) ao clicar fora dele e do botão que o abre, ou com Esc
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

// ciclo de um painel da barra: 'fechado' → 'aberto' → 'fechando' (animação de fechar) → 'fechado'.
// areaRef vai no elemento que envolve o botão e o painel: clicar fora dele fecha
const usePainelDaBarra = () => {
    const [estado, setEstado] = useState('fechado')
    const areaRef = useRef(null)
    const aberto = estado === 'aberto'

    const fechar = () => setEstado(atual => (atual === 'aberto' ? 'fechando' : atual))
    const alternar = () => setEstado(atual => (atual === 'aberto' ? 'fechando' : 'aberto'))

    useFecharAoClicarFora(aberto, areaRef, fechar)

    return {
        aberto,
        montado: estado !== 'fechado',
        areaRef,
        alternar,
        fechar,
        // props que todo painel recebe
        propsDoPainel: { fechando: estado === 'fechando', aoTerminarDeFechar: () => setEstado('fechado') },
    }
}

// Barra de tarefas do sistema: à esquerda iniciar, voltar e apps abertos; à direita a bandeja (ícones de status,
// idioma, relógio e notificações). A bandeja vai para a direita sozinha (margin-left: auto), sem medida fixa.
// O relógio abre o calendário e o ícone do canto, a central de notificações.
// appsAbertos: ids do apps.config.js, na ordem em que foram abertos
// aoAbrirApp(idDoApp): abre um app pelo menu iniciar; aoBloquear / aoDesligar / aoReiniciar: ações do menu iniciar
const BarraDeTarefas = ({ appsAbertos, aoClicarNoApp, aoAbrirApp, aoBloquear, aoDesligar, aoReiniciar, aoVoltarParaAreaDeTrabalho }) => {
    const { notificacoes, esconderBalao, setDestacarTemas } = useSistemaTablet()

    const menuIniciar = usePainelDaBarra()
    const calendario = usePainelDaBarra()
    const central = usePainelDaBarra()

    // abrir a central esconde o balão (a notificação já está na lista)
    const alternarCentral = () => {
        esconderBalao()
        central.alternar()
    }

    // botão de ação de uma notificação
    const agirNaNotificacao = (acao) => {
        if (acao !== 'experimentarTema') return
        central.fechar()
        esconderBalao()
        setDestacarTemas(true)
        aoAbrirApp('app_config')
    }

    return (
        <div className='barra-de-tarefas'>
            <div ref={menuIniciar.areaRef} className='barra-de-tarefas-area-menu-iniciar'>
                <BotaoBarraDeTarefas
                    icone='/imagens/windows/menuIniciar.png'
                    alt='Menu iniciar'
                    tamanhoIcone={18}
                    ativo={menuIniciar.aberto}
                    aoClicar={menuIniciar.alternar}
                />
                {menuIniciar.montado && (
                    <MenuIniciar
                        aoAbrirApp={aoAbrirApp}
                        aoBloquear={aoBloquear}
                        aoDesligar={aoDesligar}
                        aoReiniciar={aoReiniciar}
                        aoFechar={menuIniciar.fechar}
                        fechando={menuIniciar.propsDoPainel.fechando}
                        aoTerminarDeFechar={menuIniciar.propsDoPainel.aoTerminarDeFechar}
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
                <div ref={calendario.areaRef} className='barra-de-tarefas-area-painel'>
                    <BotaoBarraDeTarefas largura={86} ativo={calendario.aberto} aoClicar={calendario.alternar}>
                        <Relogio />
                    </BotaoBarraDeTarefas>
                    {calendario.montado && <Calendario {...calendario.propsDoPainel} />}
                </div>
                <div ref={central.areaRef} className='barra-de-tarefas-area-painel'>
                    {/* com notificação: o balão do ícone fica preenchido (como no Windows); vazio, só o contorno */}
                    <BotaoBarraDeTarefas
                        className='botao-notificacoes'
                        icone={notificacoes.length > 0 ? '/imagens/windows/iconeNotificacoesCheio.png' : '/imagens/windows/iconeNotificacoes.png'}
                        alt='Notificações'
                        tamanhoIcone={20}
                        largura={34}
                        ativo={central.aberto}
                        aoClicar={alternarCentral}
                    />
                    {central.montado && <CentralDeNotificacoes aoAgir={agirNaNotificacao} {...central.propsDoPainel} />}
                </div>
            </div>

            {!central.montado && <BalaoNotificacao aoAgir={agirNaNotificacao} />}
        </div>
    )
}

export default BarraDeTarefas
