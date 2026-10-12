import { useIdioma } from '../../../../shared/i18n/Idioma'
import PainelBandeja from './PainelBandeja'

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

// por enquanto só o português (o mesmo "POR / PTB2" da barra)
export const PainelIdioma = (painel) => {
    const { t } = useIdioma()
    return (
        <PainelBandeja className='no-icone painel-idioma' {...painel}>
            <div className='painel-bandeja-titulo'>{t('bandeja.idioma')}</div>
            <div className='painel-bandeja-item selecionado'>
                <span className='painel-bandeja-sigla'>POR</span>
                <div className='painel-bandeja-item-textos'>
                    <span className='painel-bandeja-item-nome'>{t('bandeja.portuguesBrasil')}</span>
                    <span className='painel-bandeja-item-detalhe'>{t('bandeja.tecladoPtb2')}</span>
                </div>
            </div>
        </PainelBandeja>
    )
}
