import { useEffect } from 'react'

// campos cujo valor digitado não fica no HTML (é propriedade do elemento): copiados à parte
const CAMPOS_COM_VALOR = 'input, textarea, select'

// copia o valor atual de um campo para a cópia (input de arquivo não aceita valor por código)
const copiarValor = (origem, copia) => {
    if (origem.matches?.(CAMPOS_COM_VALOR) && origem.type !== 'file') copia.value = origem.value
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

        const indexar = (noOrigem, noCopia) => {
            copiaDe.set(noOrigem, noCopia)
            copiarValor(noOrigem, noCopia)
            for (let i = 0; i < noOrigem.childNodes.length; i++) {
                indexar(noOrigem.childNodes[i], noCopia.childNodes[i])
            }
        }

        const clonar = (noOrigem) => {
            const noCopia = noOrigem.cloneNode(true)
            indexar(noOrigem, noCopia)
            return noCopia
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

        return () => {
            observador.disconnect()
            origem.removeEventListener('input', copiarDigitado, true)
            origem.removeEventListener('scroll', copiarScroll, true)
            destino.replaceChildren()
        }
    }, [origem, destinoRef])
}
