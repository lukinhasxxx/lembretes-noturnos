import { useState } from 'react'
import { useEstadoPersistido } from '../../../shared/hooks/useEstadoPersistido'

// Idiomas do tablet. Cada idioma instalado traz junto o teclado dele. São duas escolhas separadas, como no Windows:
// - idioma do SISTEMA: escolhido no Config (Sistema → Idioma do sistema);
// - idioma do TECLADO: o "POR / PTB2" da barra de tarefas (troca pelo pop-up da bandeja).
// Por enquanto é só do tablet: trocar aqui ainda não traduz o site (isso vem depois, com o i18n).
export const IDIOMAS_SISTEMA = {
    'pt-BR': { id: 'pt-BR', nome: 'Português (Brasil)', sigla: 'POR', teclado: 'PTB2', tecladoNome: 'Teclado Português (Brasil ABNT2)' },
    'en-US': { id: 'en-US', nome: 'English (United States)', sigla: 'ENG', teclado: 'US', tecladoNome: 'US keyboard' },
}

const IDIOMA_DE_FABRICA = 'pt-BR'

// o salvo, se ainda estiver instalado; senão o de fábrica
const escolhido = (id, instalados) =>
    IDIOMAS_SISTEMA[instalados.includes(id) && IDIOMAS_SISTEMA[id] ? id : IDIOMA_DE_FABRICA]

// Quais idiomas estão instalados (só o português vem de fábrica), qual está em uso no sistema e no teclado,
// e o pedido para o Config abrir direto na parte de idioma (vindo da bandeja).
export const useIdiomaSistema = () => {
    const [idiomasInstalados, setIdiomasInstalados] = useEstadoPersistido('idiomas-instalados', [IDIOMA_DE_FABRICA])
    const [idSistema, setIdSistema] = useEstadoPersistido('idioma-sistema', IDIOMA_DE_FABRICA)
    const [idTeclado, setIdTeclado] = useEstadoPersistido('idioma-teclado', IDIOMA_DE_FABRICA)
    const [destacarIdioma, setDestacarIdioma] = useState(false)

    const idiomaSistema = escolhido(idSistema, idiomasInstalados)
    const idiomaTeclado = escolhido(idTeclado, idiomasInstalados)

    const instalarIdioma = (id) => setIdiomasInstalados(atuais => (atuais.includes(id) ? atuais : [...atuais, id]))

    // o de fábrica e o que está em uso no sistema não saem; o teclado dele volta para o de fábrica
    const desinstalarIdioma = (id) => {
        if (id === IDIOMA_DE_FABRICA || id === idiomaSistema.id) return
        setIdiomasInstalados(atuais => atuais.filter(item => item !== id))
        if (idTeclado === id) setIdTeclado(IDIOMA_DE_FABRICA)
    }

    // só troca para idioma instalado
    const trocarIdiomaSistema = (id) => {
        if (idiomasInstalados.includes(id)) setIdSistema(id)
    }

    const trocarTeclado = (id) => {
        if (idiomasInstalados.includes(id)) setIdTeclado(id)
    }

    return {
        idiomaSistema,
        idiomaTeclado,
        idiomasInstalados,
        idiomaDeFabrica: IDIOMA_DE_FABRICA,
        instalarIdioma,
        desinstalarIdioma,
        trocarIdiomaSistema,
        trocarTeclado,
        destacarIdioma,
        setDestacarIdioma,
    }
}
