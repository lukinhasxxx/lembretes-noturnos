import { PREFIXO_CHAVE } from '../../../shared/hooks/useEstadoPersistido'
import { NOME_SISTEMA_POR_TEMA } from '../tablet.config'
import { apagarBanco, apagarBancoDoSite } from './wallpaperSalvo'

// Formatar (Config → Sistema): o que este site guardou no navegador, resumido com números para a confirmação,
// e a formatação de verdade. Só mexe no que é deste site (chaves com o PREFIXO_CHAVE, o banco de wallpapers e o
// dos saves do DOOM):
// o domínio do GitHub Pages é dividido com outros projetos.

// saves e configuração do DOOM: o Dwasm guarda no IndexedDB com o nome do ponto de montagem (/dwasm, ver
// src/WASM/wasm_io.c dele). Vão sempre na formatação, sem perguntar
const BANCO_DO_DOOM = '/dwasm'

// marca, na sessão, que a página recarregou por causa do Formatar: aí o tablet abre e dá o boot sozinho
const MARCA_FORMATOU = `${PREFIXO_CHAVE}acabou-de-formatar`
// os lembretes do mural: apagar é opcional (a pessoa marca na confirmação)
const CHAVE_LEMBRETES = 'lembretes'

const ler = (chave) => {
    try {
        const salvo = localStorage.getItem(PREFIXO_CHAVE + chave)
        return salvo === null ? undefined : JSON.parse(salvo)
    } catch {
        return undefined
    }
}

// as chaves deste site, sem o prefixo
export const chavesSalvas = () => {
    try {
        return Object.keys(localStorage).filter((chave) => chave.startsWith(PREFIXO_CHAVE)).map((chave) => chave.slice(PREFIXO_CHAVE.length))
    } catch {
        return []
    }
}

const plural = (quantos, singular, varios) => `${quantos} ${quantos === 1 ? singular : varios}`

// O que o Formatar vai apagar, só o que a pessoa de fato usou (os jogos gravam o valor padrão ao abrir:
// por isso olha o valor, não só se a chave existe). Devolve { itens: [{ id, rotulo, detalhe }], lembretes }
export const levantarDados = () => {
    const chaves = chavesSalvas()
    const itens = []
    const contadas = new Set()
    const adicionar = (id, rotulo, detalhes, chavesDoItem) => {
        chavesDoItem.forEach((chave) => contadas.add(chave))
        const texto = detalhes.filter(Boolean).join(' · ')
        if (texto) itens.push({ id, rotulo, detalhe: texto })
    }

    const tema = ler('tema-sistema')
    const wallpapers = chaves.filter((chave) => chave.startsWith('wallpaper-preset') && ler(chave))
    adicionar('aparencia', 'Aparência', [
        tema && tema !== 'padrao' ? `tema ${NOME_SISTEMA_POR_TEMA[tema] ?? tema}` : null,
        ler('temas-instalados') ? 'temas instalados' : null,
        wallpapers.length ? plural(wallpapers.length, 'wallpaper escolhido', 'wallpapers escolhidos') : null,
    ], ['tema-sistema', 'passagem-pixel', 'temas-instalados', ...chaves.filter((chave) => chave.startsWith('wallpaper-preset'))])

    const idiomas = ler('idiomas-instalados') ?? []
    adicionar('idiomas', 'Idiomas', [
        idiomas.length > 1 ? plural(idiomas.length - 1, 'idioma instalado', 'idiomas instalados') : null,
    ], ['idiomas-instalados', 'idioma-sistema', 'idioma-teclado', 'idioma'])

    const elo = ler('xadrez-elo')
    const partidasXadrez = ler('xadrez-historico') ?? []
    const emAndamento = [ler('xadrez-partida'), ler('xadrez-partida-dois')].filter((partida) => partida?.lances?.length && !partida.fimEm).length
    adicionar('xadrez', 'Xadrez', [
        elo?.revelado ? `elo ${elo.valor}` : null,
        partidasXadrez.length ? plural(partidasXadrez.length, 'partida no histórico', 'partidas no histórico') : null,
        emAndamento ? plural(emAndamento, 'partida em andamento', 'partidas em andamento') : null,
    ], chaves.filter((chave) => chave.startsWith('xadrez-')))

    const ranking = Object.values(ler('ranking-sudoku') ?? {}).flat()
    adicionar('sudoku', 'Sudoku', [
        ranking.length ? plural(ranking.length, 'tempo no ranking', 'tempos no ranking') : null,
        ler('sudoku-partida')?.jogo ? 'jogo salvo' : null,
    ], chaves.filter((chave) => chave.includes('sudoku')))

    const recorde = ler('recorde-2048')
    adicionar('2048', '2048', [recorde > 0 ? `recorde ${recorde}` : null], chaves.filter((chave) => chave.includes('2048')))

    adicionar('desempenho', 'Desempenho', [ler('sobre-desempenho') ? 'último teste' : null], ['sobre-desempenho'])

    contadas.add(CHAVE_LEMBRETES)
    const outras = chaves.filter((chave) => !contadas.has(chave)).length
    if (outras) itens.push({ id: 'outras', rotulo: 'Preferências', detalhe: `mais ${plural(outras, 'ajuste', 'ajustes')} (resolução, som, avisos já vistos…)` })

    return { itens, lembretes: (ler(CHAVE_LEMBRETES) ?? []).length }
}

// arquivos "do sistema" que toda formatação apaga primeiro (a tela nunca fica vazia, mesmo num tablet novo)
const ARQUIVOS_DO_SISTEMA = ['sistema/cache.tmp', 'sistema/registro.dat', 'sistema/sessao.dat']

// os "arquivos" que a tela de formatação mostra sendo apagados: os do sistema e cada chave salva como um .dat
export const arquivosParaApagar = (apagarLembretes) => [
    ...ARQUIVOS_DO_SISTEMA,
    ...chavesSalvas()
        .filter((chave) => apagarLembretes || chave !== CHAVE_LEMBRETES)
        .map((chave) => `${chave}.dat`),
]

// apaga tudo deste site (os lembretes só se pedir), marca na sessão e recarrega a página: a página nova
// abre o tablet e dá o boot como no primeiro acesso (ver acabouDeFormatar)
// (os bancos primeiro, porque é assíncrono: as chaves saem logo antes do recarregar, sem dar tempo de algum
// componente gravar de novo)
export const formatarDeVerdade = async ({ apagarLembretes }) => {
    await Promise.all([apagarBancoDoSite(), apagarBanco(BANCO_DO_DOOM)])
    chavesSalvas()
        .filter((chave) => apagarLembretes || chave !== CHAVE_LEMBRETES)
        .forEach((chave) => {
            try {
                localStorage.removeItem(PREFIXO_CHAVE + chave)
            } catch {
                // sem acesso ao armazenamento: não tinha nada salvo mesmo
            }
        })
    try {
        sessionStorage.setItem(MARCA_FORMATOU, '1')
    } catch {
        // sem sessão: a página só não abre o tablet sozinha
    }
    window.location.reload()
}

// a página acabou de recarregar por causa do Formatar? Lido uma vez só, quando a página carrega (a marca sai
// da sessão na hora): assim a resposta não muda mesmo que quem pergunta rode mais de uma vez
const formatouAoCarregar = (() => {
    try {
        const formatou = sessionStorage.getItem(MARCA_FORMATOU) === '1'
        sessionStorage.removeItem(MARCA_FORMATOU)
        return formatou
    } catch {
        return false
    }
})()

export const acabouDeFormatar = () => formatouAoCarregar
