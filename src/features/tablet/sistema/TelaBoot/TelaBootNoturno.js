import './TelaBoot.css'
import './TelaBootNoturno.css'
import { useIdioma } from '../../../../shared/i18n/Idioma'
import { DURACAO_BOOT_MS, NOME_SISTEMA_POR_TEMA } from '../../tablet.config'

const FOTO_LUA = '/imagens/windows/temas/lua.jpg'

// Boot do tema noturno (NightOS): um eclipse. A lua aparece, a sombra passa por ela até cobrir tudo,
// acende o anel de luz em volta e ele pisca com o glitch do logo do CyberOS; aí vêm o texto e a barrinha.
// Mesmos tempos do boot do CyberOS (frações de --duracao-boot), então o resto do sistema não muda.
const TelaBootNoturno = () => {
    const { t } = useIdioma()

    return (
        <div className='tela-boot tela-boot-noturno' style={{ '--duracao-boot': `${DURACAO_BOOT_MS}ms` }}>
            <div className='tela-boot-centro'>
                {/* órbita: anel de progresso que vai fechando em volta da lua enquanto a sombra cobre (cara de
                    "carregando"), com um satélite na ponta. Quando fecha, encolhe até virar o anel do eclipse */}
                <div className='tela-boot-orbita'>
                    <svg className='tela-boot-progresso' viewBox='0 0 110 110' aria-hidden='true'>
                        <circle className='tela-boot-progresso-trilho' cx='55' cy='55' r='48' />
                        <circle className='tela-boot-progresso-arco' cx='55' cy='55' r='48' pathLength='100' />
                    </svg>
                    <div className='tela-boot-satelite' />
                </div>

                <div className='tela-boot-lua' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + FOTO_LUA})` }}>
                    <div className='tela-boot-sombra' />
                </div>
                <div className='tela-boot-anel' />
                {/* cópias do anel para o glitch (mesmo efeito do logo do CyberOS) */}
                <div className='tela-boot-anel tela-boot-anel-glitch' />
                <div className='tela-boot-anel tela-boot-anel-glitch tela-boot-anel-glitch-reverso' />
            </div>

            <p className='tela-boot-texto'>{t('sistema.iniciando', { sistema: NOME_SISTEMA_POR_TEMA.noturno })}</p>
            <div className='tela-boot-barra' />
        </div>
    )
}

export default TelaBootNoturno
