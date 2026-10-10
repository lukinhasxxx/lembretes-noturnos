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

export const salvarWallpaperUpload = (arquivo) =>
    naTabela('readwrite', (tabela) => tabela.put(arquivo, CHAVE_UPLOAD)).catch(() => {})

export const lerWallpaperUpload = () =>
    naTabela('readonly', (tabela) => tabela.get(CHAVE_UPLOAD)).catch(() => undefined)

export const apagarWallpaperUpload = () =>
    naTabela('readwrite', (tabela) => tabela.delete(CHAVE_UPLOAD)).catch(() => {})
