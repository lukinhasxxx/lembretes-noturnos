import './BarraDeTarefas.css'
import { useEffect, useRef, useState } from 'react'
import BotaoBarraDeTarefas from '../BotaoBarraDeTarefas/BotaoBarraDeTarefas'
import MenuIniciar from '../MenuIniciar/MenuIniciar'
import Relogio from '../Relogio/Relogio'
import Calendario from '../Calendario/Calendario'
import LuaIniciar from '../LuaIniciar/LuaIniciar'
import { PainelBateria, PainelIdioma, PainelVolume, PainelWifi, sortearNomeDeWifi } from '../PainelBandeja/PaineisDaBandeja'
import { BalaoNotificacao, CentralDeNotificacoes } from '../Notificacoes/Notificacoes'
import { APPS } from '../../apps.config'
import { ESTADOS_SISTEMA } from '../../tablet.config'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { TEMAS } from '../../hooks/useTemaSistema'

// clique em "Idioma" no pop-up da bandeja: espera antes de abrir o Config (dá tempo do pop-up fechar)
const ATRASO_ABRIR_CONFIG_IDIOMA_MS = 500

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
// Cada item da bandeja abre um pop-up (bateria, wi-fi, volume, idioma, calendário e a central de notificações).
// appsAbertos: ids do apps.config.js, na ordem em que foram abertos
// aoAbrirApp(idDoApp): abre um app pelo menu iniciar; aoBloquear / aoDesligar / aoReiniciar: ações do menu iniciar
// aoMostrarAreaDeTrabalho: faixinha do canto direito (minimiza todos os apps)
const BarraDeTarefas = ({ appsAbertos, aoClicarNoApp, aoAbrirApp, aoBloquear, aoDesligar, aoReiniciar, aoVoltarParaAreaDeTrabalho, aoMostrarAreaDeTrabalho }) => {
    const { estadoSistema, notificacoes, esconderBalao, setDestacarTemas, setDestacarWallpaper, tema, idiomaTeclado, setDestacarIdioma } = useSistemaTablet()

    const menuIniciar = usePainelDaBarra()
    const calendario = usePainelDaBarra()
    const bateria = usePainelDaBarra()
    const wifi = usePainelDaBarra()
    const volume = usePainelDaBarra()
    const idioma = usePainelDaBarra()
    const central = usePainelDaBarra()

    // nome da rede "conectada": sorteado de novo cada vez que o sistema liga
    const [nomeDaRede, setNomeDaRede] = useState(sortearNomeDeWifi)
    useEffect(() => {
        if (estadoSistema === ESTADOS_SISTEMA.ligando) setNomeDaRede(sortearNomeDeWifi())
    }, [estadoSistema])

    // abrir a central esconde o balão (a notificação já está na lista)
    const alternarCentral = () => {
        esconderBalao()
        central.alternar()
    }

    // "Idioma" no pop-up da bandeja: fecha o pop-up e, depois de um respiro, abre o Config na parte de idioma
    const timerConfigIdiomaRef = useRef(null)
    useEffect(() => () => clearTimeout(timerConfigIdiomaRef.current), [])
    const abrirConfigIdioma = () => {
        idioma.fechar()
        timerConfigIdiomaRef.current = setTimeout(() => {
            setDestacarIdioma(true)
            aoAbrirApp('app_config')
        }, ATRASO_ABRIR_CONFIG_IDIOMA_MS)
    }

    // botão de ação de uma notificação
    const agirNaNotificacao = (acao) => {
        if (acao !== 'experimentarTema' && acao !== 'personalizarWallpaper') return
        central.fechar()
        esconderBalao()
        if (acao === 'experimentarTema') setDestacarTemas(true)
        else setDestacarWallpaper(true)
        aoAbrirApp('app_config')
    }

    return (
        <div className='barra-de-tarefas'>
            <div ref={menuIniciar.areaRef} className='barra-de-tarefas-area-menu-iniciar'>
                {/* a lua é a logo do tema noturno; no original fica o ícone de sempre */}
                {tema === TEMAS.noturno ? (
                    <BotaoBarraDeTarefas ativo={menuIniciar.aberto} aoClicar={menuIniciar.alternar} aria-label='Menu iniciar'>
                        <LuaIniciar cheia={menuIniciar.aberto} />
                    </BotaoBarraDeTarefas>
                ) : (
                    <BotaoBarraDeTarefas
                        icone='/imagens/windows/menuIniciar.png'
                        alt='Menu iniciar'
                        tamanhoIcone={18}
                        ativo={menuIniciar.aberto}
                        aoClicar={menuIniciar.alternar}
                    />
                )}
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
                        data-app={idDoApp}
                    />
                ))}
            </div>

            <div className='barra-de-tarefas-bandeja'>
                <div ref={bateria.areaRef} className='barra-de-tarefas-area-painel'>
                    <BotaoBarraDeTarefas icone='/imagens/windows/bateriaIcone.png' alt='Bateria carregando' tamanhoIcone={12} largura={24}
                        ativo={bateria.aberto} aoClicar={bateria.alternar} />
                    {bateria.montado && <PainelBateria {...bateria.propsDoPainel} />}
                </div>
                <div ref={wifi.areaRef} className='barra-de-tarefas-area-painel'>
                    <BotaoBarraDeTarefas icone='/imagens/windows/wifiIcone.png' alt='Wi-Fi' tamanhoIcone={15} largura={20}
                        ativo={wifi.aberto} aoClicar={wifi.alternar} />
                    {wifi.montado && <PainelWifi nomeDaRede={nomeDaRede} {...wifi.propsDoPainel} />}
                </div>
                <div ref={volume.areaRef} className='barra-de-tarefas-area-painel'>
                    <BotaoBarraDeTarefas icone='/imagens/windows/semSomIcone.png' alt='Sem som' tamanhoIcone={26} largura={26}
                        ativo={volume.aberto} aoClicar={volume.alternar} />
                    {volume.montado && <PainelVolume {...volume.propsDoPainel} />}
                </div>
                <div ref={idioma.areaRef} className='barra-de-tarefas-area-painel'>
                    <BotaoBarraDeTarefas largura={35} ativo={idioma.aberto} aoClicar={idioma.alternar}>
                        <span>{idiomaTeclado.sigla}</span>
                        <span>{idiomaTeclado.teclado}</span>
                    </BotaoBarraDeTarefas>
                    {idioma.montado && <PainelIdioma {...idioma.propsDoPainel} aoAbrirConfigIdioma={abrirConfigIdioma} />}
                </div>
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
                {/* faixinha no canto direito, como no Windows: clique minimiza tudo e mostra a área de trabalho */}
                <button
                    type='button'
                    className='botao-mostrar-area-de-trabalho'
                    aria-label='Mostrar área de trabalho'
                    onClick={aoMostrarAreaDeTrabalho}
                />
            </div>

            {!central.montado && <BalaoNotificacao aoAgir={agirNaNotificacao} />}
        </div>
    )
}

export default BarraDeTarefas
