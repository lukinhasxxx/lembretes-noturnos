import './TelaBoot.css'
import './TelaBootPixel.css'
import { useEffect, useRef } from 'react'
import { DURACAO_BOOT_PIXEL_MS } from '../../tablet.config'

// Boot do PixelOS (tema de dia, pixel art). Desenhado pixel a pixel num canvas pequeno (ALTURA pixels de altura,
// a largura acompanha a tela) e esticado sem suavizar (image-rendering: pixelated): cada pixel do desenho vira um
// quadradinho na tela, como num jogo antigo.
// Uma janela redonda com o sol nascendo atrás dos morros (entra pixelando), um anel em volta enchendo com uma
// faísca na ponta (como a órbita e o satélite do eclipse). Quando fecha, sai uma onda de pixels e a tela pisca na
// paleta do Game Boy (o "glitch" do PixelOS); no fim a janela desce encolhendo e vira o "O" do nome.
const ALTURA = 90

// ---------- utilidades ----------
export const limitar = (valor, min = 0, max = 1) => Math.min(max, Math.max(min, valor))
export const suave = (valor) => valor * valor * (3 - 2 * valor)
export const entre = (a, b, quanto) => a + (b - a) * quanto
export const misturar = (cor1, cor2, quanto) => [0, 1, 2].map((canal) => entre(cor1[canal], cor2[canal], quanto))
export const rgb = (hex) => [1, 3, 5].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16))

// pontilhado ordenado (Bayer 4×4): o degradê vira faixas com pontinhos na divisa, o jeito clássico de pixel art
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((valor) => (valor + 0.5) / 16)
export const limiarDe = (x, y) => BAYER[(y % 4) * 4 + (x % 4)]
const PASSO_DA_COR = 28
export const pontilhar = (cor, x, y) => {
    const limiar = limiarDe(x, y) - 0.5
    return cor.map((canal) => limitar(Math.round(canal / PASSO_DA_COR + limiar) * PASSO_DA_COR, 0, 255))
}

// número "aleatório" fixo por posição (estrelas e árvores não mudam de lugar a cada quadro)
export const sorteioFixo = (semente) => {
    const valor = Math.sin(semente * 127.1) * 43758.5453
    return valor - Math.floor(valor)
}

// letras de 5 de altura (só as do "INICIANDO")
const LETRAS = {
    I: ['111', '010', '010', '010', '111'],
    // o N precisa de 4 de largura (com 3 parece um M)
    N: ['1001', '1101', '1011', '1001', '1001'],
    C: ['111', '100', '100', '100', '111'],
    A: ['111', '101', '111', '101', '101'],
    D: ['110', '101', '101', '101', '110'],
    O: ['111', '101', '101', '101', '111'],
}

// o nome do sistema, "PixelOS", numa fonte de 7 de altura (com 5 não cabem minúsculas legíveis). O "O" é vazio e
// da largura do círculo (7 × escala 2 = 14 pixels): é o lugar onde a janela pousa
const LETRAS_DO_NOME = {
    P: ['1110', '1001', '1001', '1110', '1000', '1000', '1000'],
    i: ['1', '0', '1', '1', '1', '1', '1'],
    x: ['000', '000', '101', '101', '010', '101', '101'],
    e: ['0000', '0000', '0110', '1001', '1111', '1000', '0111'],
    l: ['10', '10', '10', '10', '10', '10', '01'],
    O: Array(7).fill('0000000'),
    S: ['0111', '1000', '1000', '0110', '0001', '0001', '1110'],
}
const NOME = 'PixelOS'

// onde começa cada letra (em pixels da tela) num texto centralizado em centroX; a última posição é o fim
const posicoesDoTexto = (palavra, centroX, escala, fonte) => {
    // cada letra começa onde a anterior acabou + 1 de espaço
    const letras = [...palavra]
    const inicioDe = letras.reduce((inicios, letra, indice) => [...inicios, inicios[indice] + fonte[letra][0].length + 1], [0])
    const inicio = Math.round(centroX - ((inicioDe[letras.length] - 1) * escala) / 2)
    return inicioDe.map((posicao) => inicio + posicao * escala)
}

// tela de pixels: um ImageData com pixel(x, y, cor), ler(x, y), fundo(cor) e texto(...)
const criarTela = (largura, altura) => {
    const imagem = new ImageData(largura, altura)
    const pixel = (x, y, cor) => {
        const px = Math.round(x)
        const py = Math.round(y)
        if (px < 0 || py < 0 || px >= largura || py >= altura) return
        const indice = (py * largura + px) * 4
        imagem.data[indice] = cor[0]
        imagem.data[indice + 1] = cor[1]
        imagem.data[indice + 2] = cor[2]
        imagem.data[indice + 3] = 255
    }
    // texto centralizado em x; quantas = quantas letras já apareceram
    const texto = (palavra, centroX, topo, escala, cor, sombra, quantas = palavra.length, fonte = LETRAS) => {
        const posicoes = posicoesDoTexto(palavra, centroX, escala, fonte)
        ;[...palavra].slice(0, quantas).forEach((letra, indiceLetra) => {
            fonte[letra].forEach((linha, ly) => [...linha].forEach((acesa, lx) => {
                if (acesa !== '1') return
                for (let ex = 0; ex < escala; ex += 1) {
                    for (let ey = 0; ey < escala; ey += 1) {
                        const x = posicoes[indiceLetra] + lx * escala + ex
                        const y = topo + ly * escala + ey
                        if (sombra) pixel(x + 1, y + 1, sombra)
                        pixel(x, y, cor)
                    }
                }
            }))
        })
    }
    const ler = (x, y) => {
        const indice = (y * largura + x) * 4
        return [imagem.data[indice], imagem.data[indice + 1], imagem.data[indice + 2]]
    }
    const fundo = (cor) => {
        for (let y = 0; y < altura; y += 1) for (let x = 0; x < largura; x += 1) pixel(x, y, cor)
    }
    return { imagem, pixel, texto, ler, fundo, largura, altura }
}

// junta os pixels da tela em blocos de bloco × bloco, cada um com a média das cores
const pixelar = (tela, bloco) => {
    if (bloco <= 1) return
    for (let by = 0; by < tela.altura; by += bloco) {
        for (let bx = 0; bx < tela.largura; bx += bloco) {
            const soma = [0, 0, 0]
            let quantos = 0
            for (let y = by; y < Math.min(by + bloco, tela.altura); y += 1) {
                for (let x = bx; x < Math.min(bx + bloco, tela.largura); x += 1) {
                    const cor = tela.ler(x, y)
                    soma[0] += cor[0]; soma[1] += cor[1]; soma[2] += cor[2]
                    quantos += 1
                }
            }
            const media = soma.map((canal) => canal / quantos)
            for (let y = by; y < Math.min(by + bloco, tela.altura); y += 1) {
                for (let x = bx; x < Math.min(bx + bloco, tela.largura); x += 1) tela.pixel(x, y, media)
            }
        }
    }
}

// barra: moldura de 1 pixel e o miolo enchendo pixel a pixel (a linha de cima mais clara dá um brilho)
const COR_CREME = rgb('#f6e7a1')
const LARGURA_DA_BARRA = 49
const desenharBarra = ({ pixel, largura: L }, topo, andamento, corDoCheio) => {
    const larguraBarra = LARGURA_DA_BARRA
    const esquerda = Math.floor(L / 2 - larguraBarra / 2)
    for (let x = 0; x <= larguraBarra; x += 1) {
        pixel(esquerda + x, topo, COR_CREME)
        pixel(esquerda + x, topo + 4, COR_CREME)
    }
    for (let y = 0; y <= 4; y += 1) {
        pixel(esquerda, topo + y, COR_CREME)
        pixel(esquerda + larguraBarra, topo + y, COR_CREME)
    }
    const cheiosEmPixels = Math.floor(andamento * (larguraBarra - 3))
    for (let dx = 0; dx < cheiosEmPixels; dx += 1) {
        for (let dy = 0; dy < 3; dy += 1) pixel(esquerda + 2 + dx, topo + 1 + dy, dy === 0 ? CORES_DO_SOL.miolo : corDoCheio)
    }
}

// o sol (com halo pontilhado) e os raios girando em passos, 1/16 de volta a cada ~130 ms
const CORES_DO_SOL = { miolo: rgb('#fff3b0'), meio: rgb('#ffd166'), borda: rgb('#ffa94d'), halo: rgb('#ffcf7a'), raio: rgb('#ffe08a') }
const desenharSol = ({ pixel }, sol, quadro) => {
    for (let y = Math.floor(sol.y - sol.raio - sol.halo); y <= sol.y + sol.raio + sol.halo; y += 1) {
        for (let x = Math.floor(sol.x - sol.raio - sol.halo); x <= sol.x + sol.raio + sol.halo; x += 1) {
            const distancia = Math.hypot(x - sol.x, y - sol.y)
            if (distancia <= sol.raio) {
                pixel(x, y, distancia < sol.raio * 0.55 ? CORES_DO_SOL.miolo : distancia < sol.raio * 0.85 ? CORES_DO_SOL.meio : CORES_DO_SOL.borda)
            } else if (distancia <= sol.raio + sol.halo && 0.45 * (1 - (distancia - sol.raio) / sol.halo) > limiarDe(x, y)) {
                pixel(x, y, CORES_DO_SOL.halo)
            }
        }
    }
    const giro = Math.floor(quadro / 8) * (Math.PI / 8)
    for (let raio = 0; raio < 8; raio += 1) {
        const angulo = giro + (raio * Math.PI) / 4
        for (let distancia = sol.raio + 3; distancia <= sol.raio + 2 + sol.tamanhoDoRaio; distancia += 1) {
            pixel(sol.x + Math.cos(angulo) * distancia, sol.y + Math.sin(angulo) * distancia, CORES_DO_SOL.raio)
        }
    }
}

const NUVEM = ['..1111....', '.11111111.', '1111111111', '.11111111.']

// ---------- a paisagem: o sol nascendo atrás dos morros ----------
// céu (cor de cima, cor da linha do horizonte) ao longo do carregamento: madrugada → roxo → laranja → dia
const CEU = [
    { ate: 0, topo: rgb('#070a1f'), horizonte: rgb('#1b1b47') },
    { ate: 0.35, topo: rgb('#1d1a4f'), horizonte: rgb('#7a3f78') },
    { ate: 0.6, topo: rgb('#3e4f9e'), horizonte: rgb('#f08a5d') },
    { ate: 0.85, topo: rgb('#5aa0e6'), horizonte: rgb('#f6c58a') },
    { ate: 1, topo: rgb('#4f9be8'), horizonte: rgb('#bfe6ff') },
]
const ceuEm = (progresso) => {
    const depois = CEU.findIndex((chave) => chave.ate >= progresso)
    if (depois <= 0) return CEU[0]
    const antes = CEU[depois - 1]
    const quanto = (progresso - antes.ate) / (CEU[depois].ate - antes.ate)
    return { topo: misturar(antes.topo, CEU[depois].topo, quanto), horizonte: misturar(antes.horizonte, CEU[depois].horizonte, quanto) }
}

const PASSARO = [['1.1', '.1.'], ['...', '1.1']]

const desenharSolNascendo = (tela, progresso, quadro) => {
    const { largura: L, altura: A, pixel } = tela
    const ceu = ceuEm(progresso)
    const linhaHorizonte = A * 0.7

    // céu em faixas pontilhadas
    for (let y = 0; y < A; y += 1) {
        const cor = misturar(ceu.topo, ceu.horizonte, limitar(y / linhaHorizonte))
        for (let x = 0; x < L; x += 1) pixel(x, y, pontilhar(cor, x, y))
    }

    // estrelas: somem conforme clareia (cada uma num momento, pelo pontilhado)
    for (let i = 0; i < 45; i += 1) {
        const x = Math.floor(sorteioFixo(i + 1) * L)
        const y = Math.floor(sorteioFixo(i + 101) * A * 0.55)
        const brilho = 1 - progresso * 2.4 + sorteioFixo(i + 7) * 0.5
        const pisca = (quadro + i * 3) % 40 < 3 ? 0.4 : 0
        if (brilho - pisca > limiarDe(x, y)) pixel(x, y, [235, 235, 255])
    }

    // sol: sobe de trás dos morros até um pouco acima do meio
    desenharSol(tela, { x: L * 0.62, y: entre(A * 0.95, A * 0.3, suave(limitar(progresso * 1.1))), raio: 8, halo: 5, tamanhoDoRaio: 4 }, quadro)

    // nuvens andando devagar, de roxo-escuro a branco
    const corNuvem = misturar(rgb('#2a2350'), rgb('#ffffff'), limitar(progresso * 1.3))
    ;[{ x: 18, y: 14 }, { x: 95, y: 24 }].forEach((nuvem, indice) => {
        const deslocamento = progresso * (14 + indice * 8)
        NUVEM.forEach((linha, ly) => [...linha].forEach((cheia, lx) => {
            if (cheia === '1') pixel(nuvem.x + deslocamento + lx, nuvem.y + ly, pontilhar(corNuvem, lx, ly))
        }))
    })

    // morros: o de trás e o da frente (com pinheiros). Silhueta escura que ganha cor de baixo para cima
    const morroLonge = (x) => A * 0.62 + Math.sin(x * 0.07) * 4 + Math.sin(x * 0.023 + 1) * 5
    const morroPerto = (x) => A * 0.76 + Math.sin(x * 0.05 + 2) * 3 + Math.sin(x * 0.11) * 2
    const corDoMorro = (x, y, escuro, claro, comecaEm) => {
        const luz = limitar((progresso - comecaEm) * 2.2 + (y / A - 0.7) * 1.8)
        return luz > limiarDe(x, y) ? claro : escuro
    }
    for (let x = 0; x < L; x += 1) {
        for (let y = Math.floor(morroLonge(x)); y < A; y += 1) {
            pixel(x, y, corDoMorro(x, y, rgb('#11122b'), rgb('#5c9a62'), 0.4))
        }
    }
    for (let x = 0; x < L; x += 1) {
        for (let y = Math.floor(morroPerto(x)); y < A; y += 1) {
            pixel(x, y, corDoMorro(x, y, rgb('#0a0b1c'), rgb('#3a7a3c'), 0.5))
        }
    }
    for (let i = 0; i < 14; i += 1) {
        const base = { x: Math.floor((i + sorteioFixo(i + 31) * 0.6) * (L / 14)), altura: 6 + Math.floor(sorteioFixo(i + 51) * 5) }
        const chao = Math.floor(morroPerto(base.x))
        for (let nivel = 0; nivel < base.altura; nivel += 1) {
            const meiaLargura = Math.floor((base.altura - nivel) / 2.5)
            for (let dx = -meiaLargura; dx <= meiaLargura; dx += 1) {
                const x = base.x + dx
                const y = chao - 1 - nivel
                pixel(x, y, corDoMorro(x, y + 6, rgb('#06070f'), rgb('#24572a'), 0.55))
            }
        }
    }

    // passarinhos cruzando no fim
    if (progresso > 0.7) {
        const voo = (progresso - 0.7) / 0.3
        ;[0, 6, 11].forEach((atraso, indice) => {
            const x = -8 + voo * (L + 16) - atraso
            const y = A * 0.22 + indice * 3 + Math.sin(voo * 9 + indice) * 1.5
            PASSARO[(Math.floor(quadro / 6) + indice) % 2].forEach((linha, ly) => [...linha].forEach((cheia, lx) => {
                if (cheia === '1') pixel(x + lx, y + ly, rgb('#1d2340'))
            }))
        })
    }
}

// ---------- a janela ----------
const TOPO_JANELA = 8
const TOPO_RODAPE = 60
const FUNDO_ESCURO = rgb('#07081a')
const RAIO_JANELA = 20
const PALETA_GAME_BOY = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'].map(rgb)
// a janela entra "pixelando": blocos grandes que vão diminuindo até ficar nítida
const BLOCOS_DA_ENTRADA = [14, 10, 7, 5, 3, 2, 1]
const FIM_DA_ENTRADA = 0.16
// a faísca na ponta do anel (um "+" de 3×3)
const FAISCA = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]
// os tempos do fim (frações do boot): o anel fecha → onda + piscar Game Boy → "Pixel" letra por letra →
// a janela desce encolhendo e vira o "O" → quique → "S"
const CHEIO_DA_JANELA = 0.7
const NOME_APARECE = [0.74, 0.82]
const JANELA_DESCE = [0.8, 0.92]
const JANELA_QUICA = [0.92, 0.96]
const RAIO_DO_O = 7

// cena(telinha, progresso, quadro) desenha a paisagem de dentro da janela
const desenharJanela = (cena) => {
    const telasDaJanela = new WeakMap()
    return (tela, progresso, quadro) => {
        const { largura: L, pixel, imagem } = tela
        tela.fundo(FUNDO_ESCURO)
        const inicial = { x: Math.floor(L / 2), y: TOPO_JANELA + 22 }

        // o lugar do "O" no nome
        const posicoes = posicoesDoTexto(NOME, L / 2, 2, LETRAS_DO_NOME)
        const final = { x: posicoes[5] + RAIO_DO_O, y: TOPO_RODAPE + RAIO_DO_O }

        // a janela: parada no meio até o fim do carregamento, depois desce encolhendo até o lugar do "O" e quica
        const descida = suave(limitar((progresso - JANELA_DESCE[0]) / (JANELA_DESCE[1] - JANELA_DESCE[0])))
        const quique = Math.sin(limitar((progresso - JANELA_QUICA[0]) / (JANELA_QUICA[1] - JANELA_QUICA[0])) * Math.PI) * 2
        const centro = { x: Math.round(entre(inicial.x, final.x, descida)), y: Math.round(entre(inicial.y, final.y, descida) - quique) }
        const raio = entre(RAIO_JANELA, RAIO_DO_O, descida)

        // embaixo: "INICIANDO" + barra enquanto carrega, depois o nome (a janela passa por cima das letras ao descer)
        if (progresso < CHEIO_DA_JANELA) {
            tela.texto('INICIANDO', L / 2, TOPO_RODAPE, 1, COR_CREME, rgb('#1a1430'))
            desenharBarra(tela, TOPO_RODAPE + 8, limitar(progresso / CHEIO_DA_JANELA), rgb('#ffd166'))
        } else {
            const letras = progresso >= JANELA_QUICA[0] + 0.01 ? 7 : Math.min(5, Math.ceil(limitar((progresso - NOME_APARECE[0]) / (NOME_APARECE[1] - NOME_APARECE[0])) * 5))
            tela.texto(NOME, L / 2, TOPO_RODAPE, 2, rgb('#ffffff'), rgb('#2b3d7a'), letras, LETRAS_DO_NOME)
        }

        // a paisagem é desenhada numa telinha quadrada à parte e copiada só dentro do círculo (encolhendo junto).
        // O dia chega por completo quando o anel fecha
        if (!telasDaJanela.has(tela)) telasDaJanela.set(tela, criarTela(RAIO_JANELA * 2 + 1, RAIO_JANELA * 2 + 1))
        const janela = telasDaJanela.get(tela)
        cena(janela, limitar(progresso / CHEIO_DA_JANELA), quadro)
        pixelar(janela, BLOCOS_DA_ENTRADA[Math.min(BLOCOS_DA_ENTRADA.length - 1, Math.floor((progresso / FIM_DA_ENTRADA) * BLOCOS_DA_ENTRADA.length))])
        const limite = Math.ceil(raio) + 1
        for (let y = -limite; y <= limite; y += 1) {
            for (let x = -limite; x <= limite; x += 1) {
                const distancia = Math.hypot(x, y)
                if (distancia <= raio - 1) {
                    const escala = RAIO_JANELA / raio
                    pixel(centro.x + x, centro.y + y, janela.ler(Math.round(x * escala) + RAIO_JANELA, Math.round(y * escala) + RAIO_JANELA))
                } else if (distancia <= raio + 0.4) {
                    pixel(centro.x + x, centro.y + y, COR_CREME)
                }
            }
        }

        // anel (só enquanto carrega; quando fecha, vira a onda): um arco que começa em cima e enche no sentido do
        // relógio, do laranja ao amarelo
        const andamento = limitar(progresso / CHEIO_DA_JANELA)
        for (let y = -RAIO_JANELA - 6; y <= RAIO_JANELA + 6 && andamento < 1; y += 1) {
            for (let x = -RAIO_JANELA - 6; x <= RAIO_JANELA + 6; x += 1) {
                const distancia = Math.hypot(x, y)
                if (distancia < RAIO_JANELA + 2.6 || distancia > RAIO_JANELA + 5.4) continue
                const fracao = ((Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)
                pixel(inicial.x + x, inicial.y + y, fracao < andamento ? misturar(rgb('#ff8a3d'), rgb('#ffe066'), fracao) : rgb('#231d47'))
            }
        }

        // faísca correndo na ponta do que já encheu (o "satélite" do eclipse, aqui um brilho de pixel)
        if (andamento < 1) {
            const angulo = andamento * Math.PI * 2 - Math.PI / 2
            const ponta = { x: inicial.x + Math.round(Math.cos(angulo) * (RAIO_JANELA + 4)), y: inicial.y + Math.round(Math.sin(angulo) * (RAIO_JANELA + 4)) }
            const corDaFaisca = quadro % 8 < 4 ? [255, 255, 255] : rgb('#fff3b0')
            FAISCA.forEach(([dx, dy]) => pixel(ponta.x + dx, ponta.y + dy, corDaFaisca))
            if (quadro % 8 < 4) [[0, -2], [-2, 0], [2, 0], [0, 2]].forEach(([dx, dy]) => pixel(ponta.x + dx, ponta.y + dy, corDaFaisca))
        }

        // anel fechou: ele vira uma onda de pixels que sai e se desfaz no pontilhado
        const onda = limitar((progresso - CHEIO_DA_JANELA) / 0.08)
        if (onda > 0 && onda < 1) {
            const raioDaOnda = RAIO_JANELA + 4 + onda * 22
            for (let y = -Math.ceil(raioDaOnda) - 1; y <= raioDaOnda + 1; y += 1) {
                for (let x = -Math.ceil(raioDaOnda) - 1; x <= raioDaOnda + 1; x += 1) {
                    if (Math.abs(Math.hypot(x, y) - raioDaOnda) > 0.8) continue
                    const px = inicial.x + x
                    const py = inicial.y + y
                    if (1 - onda > limiarDe(Math.abs(px), Math.abs(py))) pixel(px, py, COR_CREME)
                }
            }
        }

        // junto da onda: pisca trocando a paleta da tela toda
        if (progresso > CHEIO_DA_JANELA + 0.02 && progresso < JANELA_DESCE[0] && Math.floor(quadro / 4) % 2 === 0) {
            for (let indice = 0; indice < imagem.data.length; indice += 4) {
                const luz = (imagem.data[indice] * 0.3 + imagem.data[indice + 1] * 0.59 + imagem.data[indice + 2] * 0.11) / 256
                const cor = PALETA_GAME_BOY[Math.min(3, Math.floor(luz * 4))]
                imagem.data[indice] = cor[0]
                imagem.data[indice + 1] = cor[1]
                imagem.data[indice + 2] = cor[2]
            }
        }
    }
}

const desenharBoot = desenharJanela(desenharSolNascendo)

// ---------- o ícone do tema (o botão do PixelOS no Config): a janela do boot em miniatura ----------
// canvas de TAMANHO_DO_ICONE × TAMANHO_DO_ICONE, mostrado em 1:1. dia: quanto o sol já subiu (0 a 1, como o
// progresso do boot); bloco: o pixelado da paisagem (1 = nítida); anel: quanto do anel em volta está cheio (0 = sem anel);
// noite: borda e anel nas cores da noite (verde-água até o verde dos vagalumes) em vez das do sol
export const TAMANHO_DO_ICONE = 52
// a janela do tamanho da lua do NightOS (44 px), com o anel por fora
const RAIO_DO_ICONE = 20
const CORES_DO_ICONE = {
    dia: { borda: COR_CREME, anelInicio: rgb('#ff8a3d'), anelFim: rgb('#ffe066'), anelVazio: rgb('#231d47') },
    noite: { borda: rgb('#cfe8d8'), anelInicio: rgb('#2f8f86'), anelFim: rgb('#c8ff6a'), anelVazio: rgb('#0c2230') },
}
const telasDoIcone = new WeakMap()
export const pintarIconePixel = (canvas, { dia, bloco, anel, quadro, noite = false }) => {
    const cores = CORES_DO_ICONE[noite ? 'noite' : 'dia']
    if (!telasDoIcone.has(canvas)) {
        canvas.width = TAMANHO_DO_ICONE
        canvas.height = TAMANHO_DO_ICONE
        telasDoIcone.set(canvas, { tela: criarTela(TAMANHO_DO_ICONE, TAMANHO_DO_ICONE), janela: criarTela(RAIO_DO_ICONE * 2 + 1, RAIO_DO_ICONE * 2 + 1) })
    }
    const { tela, janela } = telasDoIcone.get(canvas)
    const centro = Math.floor(TAMANHO_DO_ICONE / 2)
    // fundo transparente: o ícone é só o círculo
    tela.imagem.data.fill(0)

    desenharSolNascendo(janela, dia, quadro)
    pixelar(janela, bloco)
    for (let y = -RAIO_DO_ICONE; y <= RAIO_DO_ICONE; y += 1) {
        for (let x = -RAIO_DO_ICONE; x <= RAIO_DO_ICONE; x += 1) {
            const distancia = Math.hypot(x, y)
            if (distancia <= RAIO_DO_ICONE - 1) tela.pixel(centro + x, centro + y, janela.ler(x + RAIO_DO_ICONE, y + RAIO_DO_ICONE))
            else if (distancia <= RAIO_DO_ICONE + 0.4) tela.pixel(centro + x, centro + y, cores.borda)
        }
    }

    // o anel, igual ao do boot (começa em cima e enche no sentido do relógio, do laranja ao amarelo)
    if (anel > 0) {
        for (let y = -centro; y < centro; y += 1) {
            for (let x = -centro; x < centro; x += 1) {
                const distancia = Math.hypot(x, y)
                if (distancia < RAIO_DO_ICONE + 2.6 || distancia > RAIO_DO_ICONE + 5.4) continue
                const fracao = ((Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)
                tela.pixel(centro + x, centro + y, fracao < anel ? misturar(cores.anelInicio, cores.anelFim, fracao) : cores.anelVazio)
            }
        }
    }

    canvas.getContext('2d').putImageData(tela.imagem, 0, 0)
}

const TelaBootPixel = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        // a largura em pixels acompanha a proporção da tela do tablet (a altura é sempre ALTURA)
        const largura = Math.round(ALTURA * (canvas.clientWidth / canvas.clientHeight || 16 / 9))
        canvas.width = largura
        canvas.height = ALTURA
        const contexto = canvas.getContext('2d')
        const tela = criarTela(largura, ALTURA)
        const inicio = performance.now()
        let quadro = 0
        let pedido = null
        const passo = (agora) => {
            const progresso = limitar((agora - inicio) / DURACAO_BOOT_PIXEL_MS)
            desenharBoot(tela, progresso, quadro)
            contexto.putImageData(tela.imagem, 0, 0)
            quadro += 1
            pedido = requestAnimationFrame(passo)
        }
        pedido = requestAnimationFrame(passo)
        return () => cancelAnimationFrame(pedido)
    }, [])

    return (
        <div className='tela-boot tela-boot-pixel'>
            <canvas ref={canvasRef} className='tela-boot-pixel-canvas' aria-label='Iniciando o PixelOS' />
        </div>
    )
}

export default TelaBootPixel
