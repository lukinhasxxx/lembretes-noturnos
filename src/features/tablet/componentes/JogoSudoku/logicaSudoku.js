// Regras e gerador do Sudoku, sem nada de tela. O tabuleiro é uma lista de 81 números (0 = casa vazia),
// lida linha por linha: a casa (linha, coluna) é o índice linha * 9 + coluna.

export const LADO = 9
const TOTAL_CASAS = LADO * LADO

// dadas: quantos números já vêm preenchidos (menos números = mais difícil)
// limiteDesafio: tempo do modo desafio, em segundos (apertado, mas dá para quem já joga)
export const DIFICULDADES = {
    facil: { nome: 'Fácil', dadas: 40, limiteDesafio: 8 * 60 },
    medio: { nome: 'Médio', dadas: 32, limiteDesafio: 12 * 60 },
    dificil: { nome: 'Difícil', dadas: 26, limiteDesafio: 18 * 60 },
}

export const linhaDe = (indice) => Math.floor(indice / LADO)
export const colunaDe = (indice) => indice % LADO
export const quadradoDe = (indice) => Math.floor(linhaDe(indice) / 3) * 3 + Math.floor(colunaDe(indice) / 3)

const embaralhar = (lista) => {
    const copia = [...lista]
    for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copia[i], copia[j]] = [copia[j], copia[i]]
    }
    return copia
}

// números que ainda cabem na casa (sem repetir na linha, na coluna e no quadrado 3×3)
const candidatos = (grade, indice) => {
    const usados = new Set()
    const linha = linhaDe(indice)
    const coluna = colunaDe(indice)
    const topo = Math.floor(linha / 3) * 3
    const esquerda = Math.floor(coluna / 3) * 3
    for (let i = 0; i < LADO; i += 1) {
        usados.add(grade[linha * LADO + i])
        usados.add(grade[i * LADO + coluna])
        usados.add(grade[(topo + Math.floor(i / 3)) * LADO + esquerda + (i % 3)])
    }
    const livres = []
    for (let numero = 1; numero <= LADO; numero += 1) if (!usados.has(numero)) livres.push(numero)
    return livres
}

// casa vazia com menos opções (resolve muito mais rápido do que ir na ordem)
const casaMaisApertada = (grade) => {
    let melhor = null
    for (let indice = 0; indice < TOTAL_CASAS; indice += 1) {
        if (grade[indice]) continue
        const opcoes = candidatos(grade, indice)
        if (!melhor || opcoes.length < melhor.opcoes.length) melhor = { indice, opcoes }
        if (opcoes.length <= 1) break
    }
    return melhor
}

// conta as soluções (para no "limite": só precisamos saber se é 1 ou mais de 1)
const contarSolucoes = (grade, limite = 2) => {
    const casa = casaMaisApertada(grade)
    if (!casa) return 1
    let total = 0
    for (const numero of casa.opcoes) {
        grade[casa.indice] = numero
        total += contarSolucoes(grade, limite - total)
        if (total >= limite) break
    }
    grade[casa.indice] = 0
    return total
}

// preenche o tabuleiro inteiro, tentando os números em ordem sorteada (cada jogo sai diferente)
const preencher = (grade) => {
    const casa = casaMaisApertada(grade)
    if (!casa) return true
    for (const numero of embaralhar(casa.opcoes)) {
        grade[casa.indice] = numero
        if (preencher(grade)) return true
    }
    grade[casa.indice] = 0
    return false
}

// jogo novo: um tabuleiro resolvido sorteado e, a partir dele, vai tirando números (em ordem sorteada)
// enquanto o desafio continuar com UMA solução só, até sobrar a quantidade do nível
export const gerarJogo = (dificuldade = 'facil') => {
    const solucao = Array(TOTAL_CASAS).fill(0)
    preencher(solucao)

    const desafio = [...solucao]
    let preenchidas = TOTAL_CASAS
    for (const indice of embaralhar([...Array(TOTAL_CASAS).keys()])) {
        if (preenchidas <= DIFICULDADES[dificuldade].dadas) break
        const guardado = desafio[indice]
        desafio[indice] = 0
        if (contarSolucoes([...desafio]) === 1) preenchidas -= 1
        else desafio[indice] = guardado
    }
    return { desafio, solucao }
}

// a casa conflita com outra igual na mesma linha, coluna ou quadrado?
export const temConflito = (grade, indice) => {
    const numero = grade[indice]
    if (!numero) return false
    return grade.some((outro, i) => i !== indice && outro === numero && (
        linhaDe(i) === linhaDe(indice) || colunaDe(i) === colunaDe(indice) || quadradoDe(i) === quadradoDe(indice)
    ))
}

export const resolvido = (grade, solucao) => grade.every((numero, indice) => numero === solucao[indice])
