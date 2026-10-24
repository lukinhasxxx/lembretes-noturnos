// Guarda a imagem de wallpaper enviada pelo usuário no IndexedDB do navegador.
// (o localStorage só guarda texto e tem pouco espaço; o IndexedDB guarda o arquivo da imagem como está)
// Tudo fica só no navegador da pessoa. Se o IndexedDB não estiver disponível (ex.: aba anônima restrita),
// as funções falham em silêncio e o wallpaper só não é lembrado depois do F5.

const NOME_BANCO = 'lembretes-noturnos'
const NOME_TABELA = 'wallpaper'
const CHAVE_UPLOAD = 'upload'

const abrirBanco = () => new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open(NOME_BANCO, 1)
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(NOME_TABELA)
    pedido.onsuccess = () => resolver(pedido.result)
    pedido.onerror = () => rejeitar(pedido.error)
})

// roda uma operação na tabela e devolve o resultado dela
const naTabela = async (modo, operacao) => {
    const banco = await abrirBanco()
    return new Promise((resolver, rejeitar) => {
        const pedido = operacao(banco.transaction(NOME_TABELA, modo).objectStore(NOME_TABELA))
        pedido.onsuccess = () => resolver(pedido.result)
        pedido.onerror = () => rejeitar(pedido.error)
    })
}

// chave: cada tema guarda o seu upload (sem chave = o do tema padrão, como sempre foi)
export const salvarWallpaperUpload = (arquivo, chave = CHAVE_UPLOAD) =>
    naTabela('readwrite', (tabela) => tabela.put(arquivo, chave)).catch(() => {})

export const lerWallpaperUpload = (chave = CHAVE_UPLOAD) =>
    naTabela('readonly', (tabela) => tabela.get(chave)).catch(() => undefined)

export const apagarWallpaperUpload = (chave = CHAVE_UPLOAD) =>
    naTabela('readwrite', (tabela) => tabela.delete(chave)).catch(() => {})

// Formatar: apaga um banco do IndexedDB pelo nome (só os deste site: o domínio github.io é dividido com outros
// projetos). Nunca trava: se o navegador não responder em 1 s, segue assim mesmo
export const apagarBanco = (nome) => Promise.race([
    new Promise((resolver) => {
        try {
            const pedido = indexedDB.deleteDatabase(nome)
            pedido.onsuccess = resolver
            pedido.onerror = resolver
            pedido.onblocked = resolver
        } catch {
            resolver()
        }
    }),
    new Promise((resolver) => setTimeout(resolver, 1000)),
])

// o banco deste site (wallpaper enviado)
export const apagarBancoDoSite = () => apagarBanco(NOME_BANCO)
