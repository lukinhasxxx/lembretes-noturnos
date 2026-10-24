/* eslint-disable no-restricted-globals */
// Teste de desempenho do Sobre (aba Desempenho), fora da página: cada mensagem { teste, duracaoMs } roda o
// teste pedido o máximo de vezes possível nesse tempo e responde { teste, porSegundo }.
// Os três medem coisas diferentes do processador (a nota final compara com o PC do Lucas, ver desempenho.js)

// inteiros: crivo de Eratóstenes até 20 000 (quantos primos existem)
const inteiros = () => {
    const limite = 20000
    const composto = new Uint8Array(limite + 1)
    let primos = 0
    for (let i = 2; i <= limite; i++) {
        if (composto[i]) continue
        primos++
        for (let j = i * i; j <= limite; j += i) composto[j] = 1
    }
    return primos
}

// ponto flutuante: um pedaço 64×64 do fractal de Mandelbrot, até 64 passos por ponto
const flutuante = () => {
    let dentro = 0
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const cr = -2 + (x / 64) * 2.6
            const ci = -1.3 + (y / 64) * 2.6
            let zr = 0
            let zi = 0
            let passo = 0
            while (passo < 64 && zr * zr + zi * zi < 4) {
                const temp = zr * zr - zi * zi + cr
                zi = 2 * zr * zi + ci
                zr = temp
                passo++
            }
            if (passo === 64) dentro++
        }
    }
    return dentro
}

// memória: enche 20 000 números aleatórios e ordena
const numeros = new Float64Array(20000)
const memoria = () => {
    for (let i = 0; i < numeros.length; i++) numeros[i] = Math.random()
    numeros.sort()
    return numeros[0]
}

const TESTES = { inteiros, flutuante, memoria }

self.onmessage = ({ data: { teste, duracaoMs } }) => {
    const rodar = TESTES[teste]
    // aquece (o motor do JavaScript otimiza a função depois das primeiras rodadas)
    for (let i = 0; i < 5; i++) rodar()
    let vezes = 0
    let descarte = 0
    const inicio = performance.now()
    let agora = inicio
    while (agora - inicio < duracaoMs) {
        descarte += rodar()
        vezes++
        agora = performance.now()
    }
    self.postMessage({ teste, porSegundo: (vezes * 1000) / (agora - inicio), descarte })
}
