import { createContext, useCallback, useContext } from 'react'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import ptBR from './textos/pt-BR'
import en from './textos/en'

// Tradução do site (i18n). Em vez de escrever o texto direto no componente, usa t('chave'):
//   const { t } = useIdioma()
//   <span>{t('sistema.boasVindas')}</span>   → "Bem-vindo" ou "Welcome"
// Para adicionar um texto: cria a mesma chave em textos/pt-BR.js e textos/en.js.

export const IDIOMAS = {
    'pt-BR': ptBR,
    'en': en,
}

const IDIOMA_PADRAO = 'pt-BR'

const IdiomaContext = createContext(null)

// troca {nome} pelo valor de variaveis.nome
const preencherVariaveis = (texto, variaveis) =>
    texto.replace(/\{(\w+)\}/g, (trecho, nome) => (nome in variaveis ? variaveis[nome] : trecho))

export const IdiomaProvider = ({ children }) => {
    // o idioma escolhido fica salvo no navegador, igual ao volume
    const [idioma, setIdioma] = useEstadoPersistido('idioma', IDIOMA_PADRAO)

    const t = useCallback((chave, variaveis = {}) => {
        // se faltar a tradução no idioma atual, cai no português; se faltar nos dois, mostra a própria chave
        const texto = IDIOMAS[idioma]?.[chave] ?? IDIOMAS[IDIOMA_PADRAO][chave] ?? chave
        return preencherVariaveis(texto, variaveis)
    }, [idioma])

    return (
        <IdiomaContext.Provider value={{ idioma, setIdioma, t }}>
            {children}
        </IdiomaContext.Provider>
    )
}

export const useIdioma = () => useContext(IdiomaContext)
