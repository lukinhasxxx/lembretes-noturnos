// Sons do xadrez, gerados na hora pelo Web Audio (sem arquivos): o "toc" da peça é um ruído bem curto passando
// por um filtro (o estalo da madeira) mais um grave rápido (o corpo da peça batendo no tabuleiro).
// tocarSomXadrez(tipo, atrasoS): 'lance' | 'captura' | 'roque' | 'xeque' | 'vitoria' | 'derrota' | 'empate'

let contexto = null

// um contexto de áudio só para o jogo inteiro; o navegador só deixa tocar depois de um clique na página
const pegarContexto = () => {
    if (!contexto) {
        const Contexto = window.AudioContext || window.webkitAudioContext
        if (!Contexto) return null
        contexto = new Contexto()
    }
    if (contexto.state === 'suspended') contexto.resume()
    return contexto
}

// o "toc": agudo = estalo (frequência do filtro), grave = corpo (Hz), volume de 0 a 1
const toc = (audio, quando, { agudo = 1700, grave = 170, volume = 0.45, duracao = 0.07 } = {}) => {
    const amostras = Math.max(1, Math.floor(audio.sampleRate * duracao))
    const buffer = audio.createBuffer(1, amostras, audio.sampleRate)
    const dados = buffer.getChannelData(0)
    // ruído que some rápido (curva ^4: o estalo é quase todo no comecinho)
    for (let i = 0; i < amostras; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / amostras) ** 4

    const ruido = audio.createBufferSource()
    ruido.buffer = buffer
    const filtro = audio.createBiquadFilter()
    filtro.type = 'bandpass'
    filtro.frequency.value = agudo
    filtro.Q.value = 1.1
    const volumeRuido = audio.createGain()
    volumeRuido.gain.value = volume
    ruido.connect(filtro).connect(volumeRuido).connect(audio.destination)
    ruido.start(quando)

    const corpo = audio.createOscillator()
    corpo.type = 'sine'
    corpo.frequency.setValueAtTime(grave, quando)
    corpo.frequency.exponentialRampToValueAtTime(grave * 0.6, quando + duracao)
    const volumeCorpo = audio.createGain()
    volumeCorpo.gain.setValueAtTime(volume * 0.7, quando)
    volumeCorpo.gain.exponentialRampToValueAtTime(0.001, quando + duracao)
    corpo.connect(volumeCorpo).connect(audio.destination)
    corpo.start(quando)
    corpo.stop(quando + duracao)
}

// uma nota curta e suave (sobe rápido, some devagar), para o xeque e o fim da partida
const nota = (audio, quando, frequencia, duracao, volume = 0.1) => {
    const oscilador = audio.createOscillator()
    oscilador.type = 'triangle'
    oscilador.frequency.value = frequencia
    const envelope = audio.createGain()
    envelope.gain.setValueAtTime(0.0001, quando)
    envelope.gain.exponentialRampToValueAtTime(volume, quando + 0.015)
    envelope.gain.exponentialRampToValueAtTime(0.0001, quando + duracao)
    oscilador.connect(envelope).connect(audio.destination)
    oscilador.start(quando)
    oscilador.stop(quando + duracao)
}

// notas (Hz) dos acordes do fim: dó-mi-sol subindo (vitória), descendo e menor (derrota), duas iguais (empate)
const ACORDES = {
    vitoria: [523.25, 659.25, 783.99, 1046.5],
    derrota: [659.25, 587.33, 523.25, 392],
    empate: [587.33, 587.33],
}

const tocarAcorde = (audio, quando, notas) => {
    notas.forEach((frequencia, indice) => nota(audio, quando + indice * 0.11, frequencia, 0.45))
}

const SONS = {
    lance: (audio, quando) => toc(audio, quando),
    captura: (audio, quando) => {
        toc(audio, quando, { agudo: 2500, grave: 230, volume: 0.6, duracao: 0.05 })
        toc(audio, quando + 0.045, { agudo: 1300, volume: 0.45 })
    },
    roque: (audio, quando) => {
        toc(audio, quando)
        toc(audio, quando + 0.11, { agudo: 1450 })
    },
    xeque: (audio, quando) => {
        toc(audio, quando)
        nota(audio, quando + 0.03, 987.77, 0.22, 0.07)
    },
    vitoria: (audio, quando) => tocarAcorde(audio, quando, ACORDES.vitoria),
    derrota: (audio, quando) => tocarAcorde(audio, quando, ACORDES.derrota),
    empate: (audio, quando) => tocarAcorde(audio, quando, ACORDES.empate),
}

// atrasoS: quanto esperar antes de tocar (segundos)
export const tocarSomXadrez = (tipo, atrasoS = 0) => {
    try {
        const audio = pegarContexto()
        if (audio) SONS[tipo]?.(audio, audio.currentTime + 0.01 + atrasoS)
    } catch (erro) {
        console.warn('Som do xadrez não tocou.', erro)
    }
}

// qual som um lance faz (lance do chess.js com verbose): xeque/mate > captura > roque > lance normal
export const somDoLance = (lance) => {
    if (lance.san.includes('+') || lance.san.includes('#')) return 'xeque'
    if (lance.captured) return 'captura'
    if (lance.flags.includes('k') || lance.flags.includes('q')) return 'roque'
    return 'lance'
}
