import { useEffect, useState } from 'react'

// prefixo para não misturar com dados de outros sites no mesmo domínio (github.io)
const PREFIXO_CHAVE = 'lembretes-noturnos:'

const lerValorSalvo = (chave, valorInicial) => {
    try {
        const salvo = window.localStorage.getItem(PREFIXO_CHAVE + chave)
        return salvo !== null ? JSON.parse(salvo) : valorInicial
    } catch {
        // aba anônima bloqueada, dado corrompido etc.: segue com o valor inicial
        return valorInicial
    }
}

// Igual ao useState, mas o valor sobrevive ao recarregar a página (fica no localStorage deste navegador).
export const useEstadoPersistido = (chave, valorInicial) => {
    const [valor, setValor] = useState(() => lerValorSalvo(chave, valorInicial))

    useEffect(() => {
        try {
            window.localStorage.setItem(PREFIXO_CHAVE + chave, JSON.stringify(valor))
        } catch {
            // sem armazenamento disponível (ou cheio): o valor continua só em memória
        }
    }, [chave, valor])

    return [valor, setValor]
}
