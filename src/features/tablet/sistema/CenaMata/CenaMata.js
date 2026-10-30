import './CenaMata.css'
import { useEffect, useRef } from 'react'
import { entre, limiarDe, limitar, misturar, rgb, sorteioFixo, suave } from '../TelaBoot/TelaBootPixel'

// Cena de mata em pixel art (PixelOS), desenhada pixel a pixel num canvas pequeno e esticada sem suavizar.
// hora: de 0 (manhã clara) a 1 (noite com lua e vagalumes), passando pela tarde dourada e pelo anoitecer. Quando a
// hora muda, a luz anda até a nova (não troca de uma vez). A água corre e os vagalumes/poeirinhas se mexem.
const ALTURA = 120
// tempo de cada troca de hora (sempre o mesmo, começando e terminando devagar: assim até uma troca pequena, como o
// anoitecer → noite, dá tempo de ver a lua subindo)
const DURACAO_DA_TROCA_MS = 1300
// o movimento (água, vagalumes) anda em passos, como num jogo antigo
const INTERVALO_DO_MOVIMENTO_MS = 50

// ---------- as cores em 4 horas: manhã, tarde, anoitecer, noite ----------
const HORAS_DAS_PALETAS = [0, 0.35, 0.65, 1]
const PALETAS = {
    ceuTopo: ['#7cc6f0', '#f0b47c', '#4a3f7a', '#081a33'],
    ceuBaixo: ['#e8f7d6', '#ffe0a0', '#d9846a', '#17485a'],
    nevoa: ['#b4dcc4', '#e6c48e', '#7a5f82', '#1d4650'],
    folhaClara: ['#c4ee3a', '#ead44a', '#b98a62', '#86dc74'],
    folhaMedia: ['#5cbc3c', '#93a83c', '#56604c', '#1f6448'],
    folhaEscura: ['#1f6a3a', '#3e5a2c', '#28293c', '#0a2628'],
    sombra: ['#0f3a26', '#2a2a1e', '#16162a', '#040e12'],
    tronco: ['#5c3b28', '#6a3a26', '#3a2838', '#0c141a'],
    troncoLuz: ['#a8703c', '#cc8448', '#6a4858', '#2a5050'],
    grama: ['#74c83e', '#aab43c', '#4e5c48', '#174030'],
    // de tarde a água continua azul, só pegando um pouco do dourado (laranja demais parecia uma estrada de terra)
    agua: ['#56d2f2', '#8cc8d6', '#8676a6', '#2a7c8c'],
    aguaFunda: ['#1c7fc4', '#3c78a0', '#3a386a', '#0a3446'],
    espuma: ['#f2ffff', '#fff2c4', '#e8c4c0', '#b0f6e4'],
    pedra: ['#9a927e', '#b48e72', '#5e5668', '#22343a'],
    pedraLuz: ['#e2dac2', '#f2d2a2', '#988a92', '#5c8282'],
    luz: ['#fff6c2', '#ffd892', '#ffb48c', '#d2ffd8'],
}
const PALETAS_RGB = Object.fromEntries(Object.entries(PALETAS).map(([nome, cores]) => [nome, cores.map(rgb)]))
const FORCA_DOS_RAIOS = [0.34, 0.42, 0.1, 0.2]

const valorNaHora = (valores, hora, mistura) => {
    const depois = Math.max(1, HORAS_DAS_PALETAS.findIndex((chave) => chave >= hora))
    const antes = depois - 1
    const quanto = limitar((hora - HORAS_DAS_PALETAS[antes]) / (HORAS_DAS_PALETAS[depois] - HORAS_DAS_PALETAS[antes]))
    return mistura(valores[antes], valores[depois], quanto)
}
const paletaNaHora = (hora) => ({
    ...Object.fromEntries(Object.entries(PALETAS_RGB).map(([nome, cores]) => [nome, valorNaHora(cores, hora, misturar)])),
    forcaDosRaios: valorNaHora(FORCA_DOS_RAIOS, hora, entre),
})

// pontilhado fino (degraus de cor menores que os do boot: mais "pixel art", menos 8 bits)
const PASSO_FINO = 12
const pontilharFino = (cor, x, y) => {
    const limiar = limiarDe(x, y) - 0.5
    return cor.map((canal) => limitar(Math.round(canal / PASSO_FINO + limiar) * PASSO_FINO, 0, 255))
}

// ---------- a tela de pixels ----------
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
    const ler = (x, y) => {
        const px = Math.min(largura - 1, Math.max(0, Math.round(x)))
        const py = Math.min(altura - 1, Math.max(0, Math.round(y)))
        const indice = (py * largura + px) * 4
        return [imagem.data[indice], imagem.data[indice + 1], imagem.data[indice + 2]]
    }
    // mistura uma cor por cima do que já está desenhado (luz, névoa, brilho)
    const clarear = (x, y, cor, quanto) => {
        if (quanto <= 0) return
        pixel(x, y, misturar(ler(x, y), cor, limitar(quanto)))
    }
    return { imagem, pixel, ler, clarear, largura, altura }
}

// tom de folhagem/pedra pela luz que bate (-1 a 1), pontilhado entre os 4 tons para a passagem não virar faixa
const tomPelaLuz = (luz, tons, x, y) => {
    const posicao = limitar((luz + 1) / 2) * (tons.length - 1)
    const indice = Math.min(tons.length - 1, Math.floor(posicao + limiarDe(x, y) - 0.25))
    return tons[Math.max(0, indice)]
}

// ---------- o cenário (o que não se mexe; refeito só quando a hora muda) ----------
const desenharCenario = (tela, hora) => {
    const { largura: L, altura: A, pixel, ler, clarear } = tela
    const p = paletaNaHora(hora)
    const chao = Math.round(A * 0.7)
    // de onde vem a luz (sol de manhã alto à direita, de tarde mais baixo, lua à noite)
    const direcaoDaLuz = hora < 0.6 ? [entre(0.55, 0.85, hora / 0.6), entre(-0.83, -0.5, hora / 0.6)] : [0.5, -0.85]
    const tonsDaFolha = [p.sombra, p.folhaEscura, p.folhaMedia, p.folhaClara]
    const tonsDaPedra = [p.sombra, p.pedra, p.pedra, p.pedraLuz]

    // céu
    for (let y = 0; y < A; y += 1) {
        const cor = misturar(p.ceuTopo, p.ceuBaixo, limitar(y / (A * 0.62)))
        for (let x = 0; x < L; x += 1) pixel(x, y, pontilharFino(cor, x, y))
    }

    // o sol (manhã/tarde, descendo e sumindo atrás das árvores) ou a lua (noite), com halo
    // a lua nasce de trás das árvores: no anoitecer está baixinha atrás das copas (só o halo aparece) e à noite sobe
    const astro = hora < 0.6
        ? { x: L * 0.78, y: entre(A * 0.14, A * 0.5, suave(limitar(hora / 0.6))), raio: 6, miolo: rgb('#fffbe0'), cor: p.luz, halo: 22, visivel: 1 - limitar((hora - 0.45) / 0.15) }
        : { x: L * 0.66, y: entre(A * 0.62, A * 0.2, suave(limitar((hora - 0.6) / 0.4))), raio: 9, miolo: rgb('#eaffd8'), cor: p.luz, halo: 26, visivel: limitar((hora - 0.6) / 0.15) }
    for (let y = Math.floor(astro.y - astro.halo); y <= astro.y + astro.halo; y += 1) {
        for (let x = Math.floor(astro.x - astro.halo); x <= astro.x + astro.halo; x += 1) {
            const distancia = Math.hypot(x - astro.x, y - astro.y)
            if (distancia <= astro.raio) {
                // a lua tem umas manchas
                const mancha = hora >= 0.6 && sorteioFixo(Math.floor(x / 2) * 31 + Math.floor(y / 2) * 7) > 0.72
                pixel(x, y, misturar(ler(x, y), mancha ? misturar(astro.miolo, p.ceuBaixo, 0.25) : astro.miolo, astro.visivel))
            } else {
                // limitado antes do quadrado: fora do halo o valor ficaria negativo e o quadrado o deixava positivo
                // de novo (clareava um quadrado inteiro em volta do astro)
                clarear(x, y, astro.cor, limitar(1 - (distancia - astro.raio) / (astro.halo - astro.raio)) ** 2 * 0.55 * astro.visivel)
            }
        }
    }

    // pinheiros ao longe, em duas faixas: quanto mais longe, mais da cor da névoa
    ;[{ base: A * 0.47, altura: 14, espaco: 6, nevoa: 0.78, semente: 1 }, { base: A * 0.56, altura: 18, espaco: 8, nevoa: 0.52, semente: 50 }].forEach((faixa) => {
        const cor = misturar(p.folhaMedia, p.nevoa, faixa.nevoa)
        const corEscura = misturar(p.folhaEscura, p.nevoa, faixa.nevoa)
        for (let x = 0; x < L; x += 1) {
            let topo = faixa.base + Math.sin(x * 0.07 + faixa.semente) * 3
            for (let k = Math.floor(x / faixa.espaco) - 2; k <= Math.floor(x / faixa.espaco) + 2; k += 1) {
                const centro = k * faixa.espaco + sorteioFixo(k + faixa.semente) * faixa.espaco
                const alturaDoPinheiro = faixa.altura * (0.55 + sorteioFixo(k * 3 + faixa.semente) * 0.45)
                topo = Math.min(topo, faixa.base - alturaDoPinheiro + Math.abs(x - centro) * 2.2)
            }
            // textura: pontinhos escuros espalhados ao acaso (um padrão regular virava listras de "chuva")
            for (let y = Math.floor(topo); y < A; y += 1) pixel(x, y, sorteioFixo(x * 13 + y * 71 + faixa.semente) > 0.8 ? corEscura : cor)
        }
    })

    // névoa entre o fundo e as árvores do meio (mais forte no anoitecer e à noite)
    const forcaDaNevoa = 0.18 + limitar((hora - 0.4) / 0.6) * 0.3
    for (let y = Math.floor(A * 0.4); y < chao + 4; y += 1) {
        const meio = 1 - Math.abs(y - A * 0.58) / (A * 0.2)
        for (let x = 0; x < L; x += 1) {
            if (meio * forcaDaNevoa > limiarDe(x, y) * 0.9) clarear(x, y, p.nevoa, 0.35)
        }
    }

    // o chão: grama escurecendo para baixo, com tufos
    for (let y = chao; y < A; y += 1) {
        const cor = misturar(p.grama, p.sombra, limitar((y - chao) / (A - chao)) * 0.55)
        for (let x = 0; x < L; x += 1) pixel(x, y, pontilharFino(cor, x, y))
    }
    for (let i = 0; i < L * 0.6; i += 1) {
        const x = Math.floor(sorteioFixo(i + 300) * L)
        const y = chao + Math.floor(sorteioFixo(i + 900) * (A - chao))
        const alturaDoTufo = 1 + Math.floor(sorteioFixo(i + 77) * 3)
        for (let dy = 0; dy < alturaDoTufo; dy += 1) pixel(x, y - dy, dy === alturaDoTufo - 1 ? p.folhaClara : p.folhaMedia)
    }

    // árvores do meio: troncos e depois as copas (bolas de folhas com luz e sombra), de trás para a frente
    const copas = Array.from({ length: Math.round(L / 16) }, (_, i) => ({
        x: (i + 0.5 + (sorteioFixo(i + 11) - 0.5) * 0.8) * 16,
        y: A * (0.3 + sorteioFixo(i + 23) * 0.22),
        raio: 9 + sorteioFixo(i + 37) * 8,
    })).filter((copa) => Math.abs(copa.x - L * 0.5) > L * 0.09).sort((a, b) => a.y - b.y)
    copas.forEach((copa, i) => {
        const largura = 2 + Math.round(sorteioFixo(i + 61) * 2)
        for (let y = Math.floor(copa.y); y < chao + 2; y += 1) {
            for (let dx = 0; dx < largura; dx += 1) pixel(copa.x - 1 + dx, y, dx === largura - 1 ? p.troncoLuz : p.tronco)
        }
    })
    copas.forEach((copa) => {
        for (let y = Math.floor(copa.y - copa.raio); y <= copa.y + copa.raio; y += 1) {
            for (let x = Math.floor(copa.x - copa.raio); x <= copa.x + copa.raio; x += 1) {
                const nx = (x - copa.x) / copa.raio
                const ny = (y - copa.y) / copa.raio
                const distancia = Math.hypot(nx, ny)
                // borda recortada: folhas, não um círculo liso
                if (distancia > 1 || (distancia > 0.85 && sorteioFixo(x * 13 + y * 7) > 0.55)) continue
                const luz = nx * direcaoDaLuz[0] + ny * direcaoDaLuz[1] + (sorteioFixo(x * 7 + y * 31) - 0.5) * 0.5
                pixel(x, y, tomPelaLuz(luz, tonsDaFolha, x, y))
            }
        }
    })

    // o riacho: sai do fundo, faz curva e alarga para baixo; a água mais funda nas beiras
    const topoDoRio = chao - 3
    const centroDoRio = (y) => L * 0.5 + Math.sin(y * 0.11) * L * 0.05
    const meiaLarguraDoRio = (y) => entre(2, L * 0.22, limitar((y - topoDoRio) / (A - topoDoRio)) ** 1.3)
    for (let y = topoDoRio; y < A; y += 1) {
        const centro = centroDoRio(y)
        const meia = meiaLarguraDoRio(y)
        for (let x = Math.floor(centro - meia); x <= centro + meia; x += 1) {
            const daBeira = 1 - Math.abs(x - centro) / Math.max(1, meia)
            pixel(x, y, daBeira < 0.25 ? p.aguaFunda : pontilharFino(misturar(p.aguaFunda, p.agua, limitar(daBeira * 1.4)), x, y))
        }
    }

    // a cachoeirinha lá atrás, descendo de um paredão de pedra
    const pe = { x: centroDoRio(topoDoRio), y: topoDoRio }
    for (let y = Math.floor(pe.y - 12); y <= pe.y + 1; y += 1) {
        for (let x = Math.floor(pe.x - 12); x <= pe.x + 12; x += 1) {
            const nx = (x - pe.x) / 12
            const ny = (y - pe.y + 2) / 10
            if (Math.hypot(nx, ny) > 1) continue
            pixel(x, y, tomPelaLuz(-nx * 0.4 - ny * 0.8 + (sorteioFixo(x * 3 + y * 17) - 0.5) * 0.4, tonsDaPedra, x, y))
        }
    }
    for (let y = Math.floor(pe.y - 11); y <= pe.y; y += 1) {
        for (let dx = -2; dx <= 2; dx += 1) pixel(pe.x + dx, y, Math.abs(dx) === 2 ? p.aguaFunda : p.agua)
    }

    // pedras na beira e no meio do rio, com a luz vindo de cima
    for (let i = 0; i < 11; i += 1) {
        const y = topoDoRio + 6 + sorteioFixo(i + 500) * (A - topoDoRio - 6)
        const lado = i % 3 === 0 ? 0 : i % 2 ? 1 : -1
        const x = centroDoRio(y) + lado * meiaLarguraDoRio(y) * (0.85 + sorteioFixo(i + 600) * 0.3) + (lado ? 0 : (sorteioFixo(i + 700) - 0.5) * 10)
        const escala = 0.5 + (y - topoDoRio) / (A - topoDoRio)
        const rx = (3 + sorteioFixo(i + 800) * 4) * escala
        const ry = rx * 0.6
        for (let py = Math.floor(y - ry); py <= y + ry; py += 1) {
            for (let px = Math.floor(x - rx); px <= x + rx; px += 1) {
                const nx = (px - x) / rx
                const ny = (py - y) / ry
                if (Math.hypot(nx, ny) > 1) continue
                pixel(px, py, tomPelaLuz(-ny * 0.8 - nx * 0.35 + (sorteioFixo(px * 11 + py * 5) - 0.5) * 0.3, tonsDaPedra, px, py))
            }
        }
        // espuma na base da pedra que está na água
        for (let px = Math.floor(x - rx); px <= x + rx; px += 1) {
            const beira = Math.abs(px - centroDoRio(y + ry)) <= meiaLarguraDoRio(y + ry)
            if (beira && sorteioFixo(px + i * 17) > 0.3) pixel(px, y + ry + 1, p.espuma)
        }
    }

    // três feixes de luz largos saindo do sol/lua em diagonal, mais fortes no meio e sumindo para baixo (listras
    // finas e repetidas pareciam chuva)
    if (p.forcaDosRaios > 0.02) {
        const direcao = [-0.6, 0.8]
        const feixes = [{ desvio: -26, largura: 16 }, { desvio: 0, largura: 9 }, { desvio: 24, largura: 20 }]
        for (let y = 0; y < chao + 12; y += 1) {
            for (let x = 0; x < L; x += 1) {
                const ao = (x - astro.x) * direcao[0] + (y - astro.y) * direcao[1]
                if (ao <= 0) continue
                const deLado = (x - astro.x) * direcao[1] - (y - astro.y) * direcao[0]
                const noFeixe = Math.max(...feixes.map((feixe) => 1 - Math.abs(deLado - feixe.desvio) / (feixe.largura / 2)))
                if (noFeixe <= 0) continue
                const forca = p.forcaDosRaios * noFeixe * limitar(1 - ao / (A * 1.1))
                if (forca * 1.7 > limiarDe(x, y)) clarear(x, y, p.luz, forca * 0.9)
            }
        }
    }

    // a moldura: troncos grandes nas bordas, folhas por cima e moitas embaixo (escuros, na contraluz)
    const tronco = (x0, largura, lado) => {
        for (let y = 0; y < A; y += 1) {
            const raiz = y > A * 0.78 ? (y - A * 0.78) * 0.7 : 0
            const meia = largura + Math.sin(y * 0.06) * 1.5 + raiz
            for (let dx = 0; dx <= meia; dx += 1) {
                const x = lado > 0 ? x0 + dx : x0 - dx
                const casca = sorteioFixo(Math.floor(x) * 13 + Math.floor(y / 3) * 7) > 0.7
                const naBeiraDaLuz = dx >= meia - 1 && lado > 0
                pixel(x, y, naBeiraDaLuz ? misturar(p.troncoLuz, p.sombra, 0.35) : casca ? p.sombra : misturar(p.tronco, p.sombra, 0.45))
            }
        }
    }
    tronco(0, L * 0.06, 1)
    tronco(L - 1, L * 0.04, -1)
    const moita = (cx, cy, raio, semente) => {
        for (let y = Math.floor(cy - raio); y <= cy + raio; y += 1) {
            for (let x = Math.floor(cx - raio); x <= cx + raio; x += 1) {
                const nx = (x - cx) / raio
                const ny = (y - cy) / raio
                const distancia = Math.hypot(nx, ny)
                if (distancia > 1 || (distancia > 0.8 && sorteioFixo(x * 5 + y * 23 + semente) > 0.5)) continue
                const luz = -ny * 0.6 + nx * 0.2 - 0.55 + (sorteioFixo(x * 19 + y * 3 + semente) - 0.5) * 0.9
                pixel(x, y, tomPelaLuz(luz, tonsDaFolha, x, y))
            }
        }
    }
    ;[[L * 0.08, -2, 16], [L * 0.24, -6, 12], [L * 0.92, -3, 15], [L * 0.78, -7, 10], [L * 0.02, A * 0.32, 10]].forEach(([x, y, raio], i) => moita(x, y, raio, i * 100))
    ;[[L * 0.06, A + 4, 18], [L * 0.22, A + 8, 12], [L * 0.95, A + 3, 17], [L * 0.8, A + 9, 11]].forEach(([x, y, raio], i) => moita(x, y, raio, 1000 + i * 100))
}

// ---------- o que se mexe (por cima do cenário, a cada passo) ----------
const desenharMovimento = (tela, hora, passo) => {
    const { largura: L, altura: A, pixel, clarear } = tela
    const p = paletaNaHora(hora)
    const chao = Math.round(A * 0.7)
    const topoDoRio = chao - 3
    const centroDoRio = (y) => L * 0.5 + Math.sin(y * 0.11) * L * 0.05
    const meiaLarguraDoRio = (y) => entre(2, L * 0.22, limitar((y - topoDoRio) / (A - topoDoRio)) ** 1.3)

    // tracinhos de espuma descendo o rio (mais rápidos perto, mais lentos longe) e a água caindo na cachoeira
    for (let y = topoDoRio + 1; y < A; y += 1) {
        const meia = meiaLarguraDoRio(y)
        const velocidade = 0.2 + (y - topoDoRio) / (A - topoDoRio)
        for (let x = Math.floor(centroDoRio(y) - meia + 1); x < centroDoRio(y) + meia - 1; x += 1) {
            const onda = (x * 3 + Math.floor(y * 7 - passo * velocidade * 2)) % 23
            if (onda === 0 || (onda === 1 && y % 2 === 0)) pixel(x, y, p.espuma)
        }
    }
    const pe = { x: Math.round(centroDoRio(topoDoRio)), y: topoDoRio }
    for (let y = pe.y - 11; y <= pe.y; y += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
            if ((y + passo + dx * 2) % 4 === 0) pixel(pe.x + dx, y, p.espuma)
        }
    }

    // de dia: poeirinha de luz flutuando; do anoitecer em diante: vagalumes piscando
    const vagalumes = Math.round(limitar((hora - 0.45) / 0.55) * 28)
    const poeiras = Math.round(limitar(1 - hora / 0.6) * 14)
    for (let i = 0; i < vagalumes; i += 1) {
        const x = L * (0.1 + sorteioFixo(i + 40) * 0.8) + Math.sin(passo * 0.05 + i) * 5
        const y = A * (0.3 + sorteioFixo(i + 90) * 0.62) + Math.cos(passo * 0.04 + i * 2) * 3
        const brilho = 0.5 + 0.5 * Math.sin(passo * 0.12 + i * 2.3)
        if (brilho < 0.25) continue
        ;[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => clarear(x + dx, y + dy, rgb('#c8ff6a'), 0.45 * brilho))
        pixel(x, y, misturar(rgb('#c8ff6a'), rgb('#fffbd0'), brilho))
    }
    for (let i = 0; i < poeiras; i += 1) {
        const x = (L * sorteioFixo(i + 140) + passo * 0.15 * (0.5 + sorteioFixo(i + 3))) % L
        const y = A * (0.15 + sorteioFixo(i + 190) * 0.55) + Math.sin(passo * 0.05 + i) * 2
        if ((passo + i * 5) % 30 < 22) clarear(x, y, p.luz, 0.8)
    }
}

// a hora da mata pelo relógio do tablet (bloqueio e login do PixelOS): manhã das 6h às 11h, tarde até as 16h,
// anoitecer até as 19h e noite no resto
export const horaDaMataPeloRelogio = (data) => {
    const horas = data.getHours()
    if (horas >= 6 && horas < 11) return 0
    if (horas >= 11 && horas < 16) return 0.35
    if (horas >= 16 && horas < 19) return 0.65
    return 1
}

// o sol do ícone do PixelOS (IconePixel) na mesma hora da mata: dia alto de manhã, janela escura à noite
export const diaDoIconePelaHoraDaMata = (hora) => 1 - hora * 0.88

const CenaMata = ({ hora, className = '' }) => {
    const canvasRef = useRef(null)
    const alvoRef = useRef(hora)

    useEffect(() => {
        alvoRef.current = hora
    }, [hora])

    useEffect(() => {
        const canvas = canvasRef.current
        const largura = Math.round(ALTURA * (canvas.clientWidth / canvas.clientHeight || 16 / 9))
        canvas.width = largura
        canvas.height = ALTURA
        const contexto = canvas.getContext('2d')
        const tela = criarTela(largura, ALTURA)
        // o cenário fica guardado e só é refeito quando a hora muda
        const cenario = new Uint8ClampedArray(tela.imagem.data.length)
        let horaDoCenario = null
        let horaAtual = alvoRef.current
        // a troca em andamento: de onde saiu, para onde vai e quando começou
        let troca = { de: horaAtual, para: horaAtual, inicio: 0 }
        let ultimoMovimento = 0
        let passo = 0
        let pedido = null

        const quadro = (agora) => {
            const alvo = alvoRef.current
            if (alvo !== troca.para) troca = { de: horaAtual, para: alvo, inicio: agora }
            horaAtual = entre(troca.de, troca.para, suave(limitar((agora - troca.inicio) / DURACAO_DA_TROCA_MS)))
            const mudouAHora = horaDoCenario === null || Math.abs(horaAtual - horaDoCenario) > 0.002
            if (mudouAHora || agora - ultimoMovimento >= INTERVALO_DO_MOVIMENTO_MS) {
                if (mudouAHora) {
                    desenharCenario(tela, horaAtual)
                    cenario.set(tela.imagem.data)
                    horaDoCenario = horaAtual
                } else {
                    tela.imagem.data.set(cenario)
                }
                if (agora - ultimoMovimento >= INTERVALO_DO_MOVIMENTO_MS) {
                    passo += 1
                    ultimoMovimento = agora
                }
                desenharMovimento(tela, horaAtual, passo)
                contexto.putImageData(tela.imagem, 0, 0)
            }
            pedido = requestAnimationFrame(quadro)
        }
        pedido = requestAnimationFrame(quadro)
        return () => cancelAnimationFrame(pedido)
    }, [])

    return <canvas ref={canvasRef} className={`cena-mata ${className}`} aria-hidden='true' />
}

export default CenaMata
