import './ModoCelular.css'
import { useEffect, useState } from 'react'
import { useIdioma } from '../../../shared/i18n/Idioma'
import { suportaTelaCheia, useTelaCheia } from '../hooks/useTelaCheia'
import { useVibracaoNosToques } from '../hooks/useVibracaoNosToques'

// quanto tempo depois de abrir o site o card aparece (deixa a cena respirar primeiro)
const ATRASO_CARD_MS = 2500

// "Modo celular" (só aparece no celular):
// - card flutuante embaixo oferecendo o modo; "Ativar" deixa o site em tela cheia e deitado; o X do card dispensa
// - em tela cheia: um X numa bolinha no topo, no meio, volta ao normal (em pé, com a barra do navegador)
// - iPhone (sem tela cheia): o card vira só a dica de girar o celular
// - vibraçãozinha leve em cada toque em algo clicável (só Android)
const ModoCelular = () => {
    useVibracaoNosToques()
    const { t } = useIdioma()
    const telaCheia = useTelaCheia()
    const [cardVisivel, setCardVisivel] = useState(false)
    const [dispensado, setDispensado] = useState(false)
    const podeTelaCheia = suportaTelaCheia()

    useEffect(() => {
        const timer = setTimeout(() => setCardVisivel(true), ATRASO_CARD_MS)
        return () => clearTimeout(timer)
    }, [])

    if (telaCheia.ativa) {
        return (
            <button type='button' className='modo-celular-sair' aria-label={t('modoCelular.sair')} onClick={telaCheia.sair}>
                ×
            </button>
        )
    }

    if (!cardVisivel || dispensado) return null

    return (
        <div className='modo-celular-card' role='dialog' aria-label={t('modoCelular.titulo')}>
            {/* celular girando de em pé para deitado */}
            <span className='modo-celular-icone' aria-hidden='true' />

            <div className='modo-celular-textos'>
                <strong>{t('modoCelular.titulo')}</strong>
                <span>{t(podeTelaCheia ? 'modoCelular.texto' : 'modoCelular.textoGirar')}</span>
            </div>

            {podeTelaCheia && (
                <button type='button' className='modo-celular-ativar' onClick={telaCheia.entrar}>
                    {t('modoCelular.ativar')}
                </button>
            )}

            <button type='button' className='modo-celular-dispensar' aria-label={t('modoCelular.agoraNao')} onClick={() => setDispensado(true)}>
                ×
            </button>
        </div>
    )
}

export default ModoCelular
