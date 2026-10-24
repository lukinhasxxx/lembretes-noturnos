import { useEffect } from 'react'

// campos cujo valor digitado não fica no HTML (é propriedade do elemento): copiados à parte
const CAMPOS_COM_VALOR = 'input, textarea, select'

// quantas vezes por segundo a imagem de um iframe (ex.: o DOOM) é copiada para o espelho
const QUADROS_IFRAME_POR_SEGUNDO = 10

// copia o valor atual de um campo para a cópia (input de arquivo não aceita valor por código)
const copiarValor = (origem, copia) => {
    if (origem.matches?.(CAMPOS_COM_VALOR) && origem.type !== 'file') copia.value = origem.value
}

// iframe clonado carregaria a página de novo (um segundo jogo rodando, com som): na cópia ele vira um canvas
// com as mesmas classes e estilo, e a imagem do canvas de dentro do iframe é desenhada nele de tempos em tempos
const telaNoLugarDoIframe = (iframe) => {
    const tela = document.createElement('canvas')
    for (const { name, value } of iframe.attributes) {
        if (name === 'class' || name === 'style') tela.setAttribute(name, value)
    }
    return tela
}

const desenharIframe = (iframe, tela) => {
    let fonte
    try {
        fonte = iframe.contentDocument?.querySelector('canvas')
    } catch {
        return
    }
    if (!fonte?.width || !iframe.offsetWidth) return
    if (tela.width !== iframe.offsetWidth) tela.width = iframe.offsetWidth
    if (tela.height !== iframe.offsetHeight) tela.height = iframe.offsetHeight
    // "contain", como a página do jogo mostra
    const escala = Math.min(tela.width / fonte.width, tela.height / fonte.height)
    const largura = fonte.width * escala
    const altura = fonte.height * escala
    const contexto = tela.getContext('2d')
    contexto.fillStyle = '#000'
    contexto.fillRect(0, 0, tela.width, tela.height)
    contexto.drawImage(fonte, (tela.width - largura) / 2, (tela.height - altura) / 2, largura, altura)
}

// Espelho do HTML de um elemento, ao vivo, sem React e sem "prints":
// clona o elemento uma vez para dentro do destino e, a cada mudança avisada pelo MutationObserver do navegador
// (nó entrou/saiu, atributo/classe/style mudou, texto mudou), aplica só aquela mudança na cópia.
// Texto digitado e scroll não fazem parte do HTML: são copiados ouvindo os eventos 'input' e 'scroll'.
// origem: elemento a espelhar (pode ser null enquanto não existe); destinoRef: ref de onde a cópia fica
export const useEspelhoDom = (origem, destinoRef) => {
    useEffect(() => {
        const destino = destinoRef.current
        if (!origem || !destino) return

        // cada nó da origem → o nó equivalente na cópia (WeakMap: nós que saem da página somem daqui sozinhos)
        const copiaDe = new WeakMap()
        // iframes da origem → o canvas que ocupa o lugar deles na cópia
        const iframes = new Map()

        // devolve o nó da cópia (o próprio, ou o canvas que entrou no lugar de um iframe)
        const indexar = (noOrigem, noCopia) => {
            if (noOrigem.nodeName === 'IFRAME') {
                const tela = telaNoLugarDoIframe(noOrigem)
                noCopia.replaceWith(tela)
                iframes.set(noOrigem, tela)
                copiaDe.set(noOrigem, tela)
                return tela
            }
            copiaDe.set(noOrigem, noCopia)
            copiarValor(noOrigem, noCopia)
            // childNodes da cópia lido antes do laço: trocar um iframe não muda a posição dos outros
            const filhosDaCopia = [...noCopia.childNodes]
            for (let i = 0; i < noOrigem.childNodes.length; i++) {
                indexar(noOrigem.childNodes[i], filhosDaCopia[i])
            }
            return noCopia
        }

        const clonar = (noOrigem) => indexar(noOrigem, noOrigem.cloneNode(true))

        // copia a imagem dos iframes que ainda estão na página
        const desenharIframes = () => {
            for (const [iframe, tela] of iframes) {
                if (!iframe.isConnected) iframes.delete(iframe)
                else desenharIframe(iframe, tela)
            }
        }

        // cópia completa: no começo e, por segurança, se alguma mudança chegar sem par na cópia
        // (o clone novo reindexa tudo, sobrescrevendo os pares antigos)
        const reconstruir = () => destino.replaceChildren(clonar(origem))

        const aplicarMudancas = (registros) => {
            for (const registro of registros) {
                const alvo = copiaDe.get(registro.target)
                if (!alvo) return reconstruir()

                if (registro.type === 'childList') {
                    registro.removedNodes.forEach(no => copiaDe.get(no)?.remove())
                    const referencia = registro.nextSibling ? copiaDe.get(registro.nextSibling) : null
                    // o vizinho de referência não tem par na cópia: não dá para saber onde inserir
                    if (referencia === undefined) return reconstruir()
                    registro.addedNodes.forEach(no => {
                        // nó que já saiu de novo no mesmo lote: não precisa copiar
                        if (no.parentNode !== registro.target) return
                        alvo.insertBefore(clonar(no), referencia)
                    })
                } else if (registro.type === 'attributes') {
                    const valor = registro.target.getAttribute(registro.attributeName)
                    if (valor === null) alvo.removeAttribute(registro.attributeName)
                    else alvo.setAttribute(registro.attributeName, valor)
                } else if (registro.type === 'characterData') {
                    alvo.data = registro.target.data
                }
            }
        }

        const copiarDigitado = (evento) => {
            const copia = copiaDe.get(evento.target)
            if (copia) copiarValor(evento.target, copia)
        }

        const copiarScroll = (evento) => {
            const copia = copiaDe.get(evento.target)
            if (!copia) return
            copia.scrollTop = evento.target.scrollTop
            copia.scrollLeft = evento.target.scrollLeft
        }

        reconstruir()
        const observador = new MutationObserver(aplicarMudancas)
        observador.observe(origem, { childList: true, subtree: true, attributes: true, characterData: true })
        origem.addEventListener('input', copiarDigitado, true)
        // scroll não "sobe" pelo DOM: escuta na fase de captura para pegar o de qualquer elemento dentro
        origem.addEventListener('scroll', copiarScroll, true)
        const timerIframes = setInterval(desenharIframes, 1000 / QUADROS_IFRAME_POR_SEGUNDO)

        return () => {
            clearInterval(timerIframes)
            observador.disconnect()
            origem.removeEventListener('input', copiarDigitado, true)
            origem.removeEventListener('scroll', copiarScroll, true)
            destino.replaceChildren()
        }
    }, [origem, destinoRef])
}
