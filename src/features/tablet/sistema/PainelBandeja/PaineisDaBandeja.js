import { useRef, useState } from 'react'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import PainelBandeja from './PainelBandeja'
import { useSistemaTablet } from '../../contexts/SistemaTablet'
import { IDIOMAS_SISTEMA } from '../../hooks/useIdiomaSistema'

// Conteúdo dos pop-ups da bandeja que só mostram informação (bateria, wi-fi, volume e idioma).
// Cada um recebe fechando/aoTerminarDeFechar e repassa para o PainelBandeja.

// nomes de rede de brincadeira: um é sorteado cada vez que o sistema liga (nomes próprios: não são traduzidos)
export const NOMES_DE_WIFI = [
    'Wifi-Casa',
    'Free Wifi',
    'Não entrem no meu wifi',
    'Wifi do vizinho',
    'A senha é 12345678',
    'Esqueci a senha',
    'Lua Cheia 5G',
    'FBI Van #3',
    'Pede a senha pra mãe',
    'Rede Noturna',
]

export const sortearNomeDeWifi = () => NOMES_DE_WIFI[Math.floor(Math.random() * NOMES_DE_WIFI.length)]

// bateria do "notebook": sempre na tomada e cheia
export const PainelBateria = (painel) => {
    const { t } = useIdioma()
    return (
        <PainelBandeja className='no-icone' {...painel}>
            <div className='painel-bandeja-item'>
                <img src={process.env.PUBLIC_URL + '/imagens/windows/bateriaIcone.png'} alt='' draggable={false} />
                <div className='painel-bandeja-item-textos'>
                    <span className='painel-bateria-porcentagem'>100%</span>
                    <span className='painel-bandeja-item-detalhe'>{t('bandeja.bateriaConectada')}</span>
                </div>
            </div>
        </PainelBandeja>
    )
}

export const PainelWifi = ({ nomeDaRede, ...painel }) => {
    const { t } = useIdioma()
    return (
        <PainelBandeja className='no-icone' {...painel}>
            <div className='painel-bandeja-item selecionado'>
                <img src={process.env.PUBLIC_URL + '/imagens/windows/wifiIcone.png'} alt='' draggable={false} />
                <div className='painel-bandeja-item-textos'>
                    <span className='painel-bandeja-item-nome'>{nomeDaRede}</span>
                    <span className='painel-bandeja-item-detalhe'>{t('bandeja.wifiConectado')}</span>
                </div>
            </div>
        </PainelBandeja>
    )
}

export const PainelVolume = (painel) => {
    const { t } = useIdioma()
    return (
        <PainelBandeja className='no-icone painel-volume' {...painel}>
            <div className='painel-bandeja-item'>
                <img src={process.env.PUBLIC_URL + '/imagens/windows/semSomIcone.png'} alt='' draggable={false} />
                <div className='painel-bandeja-item-textos'>
                    <span>{t('bandeja.semDriversDeSom')}</span>
                    <span className='painel-bandeja-item-detalhe'>{t('bandeja.semDriversDeSomTexto')}</span>
                </div>
            </div>
        </PainelBandeja>
    )
}

// trocou de teclado tantas vezes neste intervalo: a pessoa provavelmente queria mudar o idioma do SISTEMA
const TROCAS_PARA_DICA = 4
const JANELA_TROCAS_MS = 2000

// Idioma do TECLADO (o "POR / PTB2" da barra): os teclados dos idiomas instalados; clicar troca.
// O título "Idioma" leva ao Config (idioma do sistema e instalar mais). Se a pessoa ficar trocando de teclado
// sem parar, aparece uma dica explicando que ali é o teclado, com atalho para o idioma do sistema.
// aoAbrirConfigIdioma: quem abre o Config (a barra de tarefas)
export const PainelIdioma = ({ aoAbrirConfigIdioma, ...painel }) => {
    const { t } = useIdioma()
    const { idiomaTeclado, idiomasInstalados, trocarTeclado } = useSistemaTablet()
    const trocasRef = useRef([])
    const [mostrarDica, setMostrarDica] = useState(false)

    const trocar = (id) => {
        if (id === idiomaTeclado.id) return
        trocarTeclado(id)
        const agora = Date.now()
        trocasRef.current = [...trocasRef.current.filter(momento => agora - momento < JANELA_TROCAS_MS), agora]
        if (trocasRef.current.length >= TROCAS_PARA_DICA) setMostrarDica(true)
    }

    return (
        <PainelBandeja className='no-icone painel-idioma' {...painel}>
            {mostrarDica && (
                <div className='painel-idioma-dica' role='status'>
                    Aqui é o idioma do <b>teclado</b>. Gostaria de mudar o idioma do sistema?{' '}
                    <button type='button' onClick={aoAbrirConfigIdioma}>Clique aqui</button>
                </div>
            )}
            <button type='button' className='painel-bandeja-titulo painel-idioma-titulo' onClick={aoAbrirConfigIdioma}>
                {t('bandeja.idioma')} <span aria-hidden='true'>›</span>
            </button>
            {idiomasInstalados.map(id => IDIOMAS_SISTEMA[id]).filter(Boolean).map(idioma => (
                <div
                    key={idioma.id}
                    className={`painel-bandeja-item ${idioma.id === idiomaTeclado.id ? 'selecionado' : ''}`}
                    onClick={() => trocar(idioma.id)}
                >
                    <span className='painel-bandeja-sigla'>{idioma.sigla}</span>
                    <div className='painel-bandeja-item-textos'>
                        <span className='painel-bandeja-item-nome'>
                            {idioma.id === 'pt-BR' ? t('bandeja.portuguesBrasil') : idioma.nome}
                        </span>
                        <span className='painel-bandeja-item-detalhe'>
                            {idioma.id === 'pt-BR' ? t('bandeja.tecladoPtb2') : idioma.tecladoNome}
                        </span>
                    </div>
                </div>
            ))}
        </PainelBandeja>
    )
}
