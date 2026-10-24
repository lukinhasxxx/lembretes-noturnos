import { useEffect, useState } from 'react'

// valor de quando o navegador não conta (Safari e Firefox escondem várias coisas por privacidade)
export const NAO_INFORMADO = null

// taxas de atualização comuns: a medida pelo requestAnimationFrame "arredonda" para a mais próxima
const TAXAS_COMUNS_HZ = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360]
const DURACAO_MEDICAO_HZ_MS = 1000

// "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 vs_5_0 ps_5_0, D3D11)" → "NVIDIA GeForce RTX 3060"
const limparNomeGpu = (nome) => {
    const dentroDoAngle = nome.match(/^ANGLE \((.*)\)$/)
    const partes = dentroDoAngle ? dentroDoAngle[1].split(', ') : [nome]
    const modelo = partes.length > 1 ? partes[1] : partes[0]
    return modelo
        .replace(/\s*\(0x[0-9a-f]+\)/i, '')
        .replace(/\s+(Direct3D|OpenGL|Vulkan|Metal).*$/i, '')
        .trim()
}

// placa de vídeo pelo WebGL: nome "de verdade" quando o navegador libera a extensão de depuração
const lerGpu = () => {
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        if (!gl) return { modelo: NAO_INFORMADO, fabricante: NAO_INFORMADO, api: NAO_INFORMADO }
        const depuracao = gl.getExtension('WEBGL_debug_renderer_info')
        const modelo = depuracao ? gl.getParameter(depuracao.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        const fabricante = depuracao ? gl.getParameter(depuracao.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)
        const api = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0'
        gl.getExtension('WEBGL_lose_context')?.loseContext()
        // "Google Inc. (NVIDIA)": o Google é o do ANGLE (a camada do Chrome); o fabricante de verdade está nos parênteses
        const fabricanteLimpo = fabricante?.match(/\(([^)]+)\)/)?.[1] ?? fabricante
        return { modelo: modelo ? limparNomeGpu(modelo) : NAO_INFORMADO, fabricante: fabricanteLimpo || NAO_INFORMADO, api }
    } catch {
        return { modelo: NAO_INFORMADO, fabricante: NAO_INFORMADO, api: NAO_INFORMADO }
    }
}

// navegador e sistema pelo userAgent (o jeito antigo, para quem não tem userAgentData)
const lerPeloUserAgent = () => {
    const ua = navigator.userAgent
    const navegador =
        (ua.match(/Edg\/(\d+)/) && `Microsoft Edge ${ua.match(/Edg\/(\d+)/)[1]}`) ||
        (ua.match(/OPR\/(\d+)/) && `Opera ${ua.match(/OPR\/(\d+)/)[1]}`) ||
        (ua.match(/Firefox\/(\d+)/) && `Firefox ${ua.match(/Firefox\/(\d+)/)[1]}`) ||
        (ua.match(/Chrome\/(\d+)/) && `Chrome ${ua.match(/Chrome\/(\d+)/)[1]}`) ||
        (ua.match(/Version\/([\d.]+).*Safari/) && `Safari ${ua.match(/Version\/([\d.]+).*Safari/)[1]}`) ||
        NAO_INFORMADO
    const sistema =
        (/iPhone|iPad/.test(ua) && `iOS ${(ua.match(/OS (\d+)_(\d+)/) || []).slice(1).join('.')}`.trim()) ||
        (ua.match(/Android ([\d.]+)/) && `Android ${ua.match(/Android ([\d.]+)/)[1]}`) ||
        (/Windows/.test(ua) && 'Windows') ||
        (/Mac OS X/.test(ua) && 'macOS') ||
        (/Linux/.test(ua) && 'Linux') ||
        NAO_INFORMADO
    return { navegador, sistema, arquitetura: NAO_INFORMADO, modelo: NAO_INFORMADO }
}

// navegador e sistema com mais detalhe (Chrome/Edge): versão do Windows (10 ou 11), arquitetura, modelo do celular
const lerPlataforma = async () => {
    const dados = navigator.userAgentData
    if (!dados?.getHighEntropyValues) return lerPeloUserAgent()
    try {
        const extra = await dados.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'fullVersionList'])
        const marca = (extra.fullVersionList || dados.brands)
            .find(({ brand }) => !/Not.?A.?Brand|Chromium/i.test(brand))
            ?? dados.brands.find(({ brand }) => /Chromium/i.test(brand))
        const navegador = marca ? `${marca.brand} ${marca.version.split('.')[0]}` : NAO_INFORMADO

        let sistema = dados.platform || NAO_INFORMADO
        // no Windows, a versão de plataforma 13 ou mais é o Windows 11
        if (dados.platform === 'Windows' && extra.platformVersion) {
            sistema = Number(extra.platformVersion.split('.')[0]) >= 13 ? 'Windows 11' : 'Windows 10'
        } else if (extra.platformVersion && dados.platform !== 'Windows') {
            sistema = `${dados.platform} ${extra.platformVersion}`
        }

        const arquitetura = extra.architecture
            ? `${extra.architecture === 'x86' && extra.bitness === '64' ? 'x64' : extra.architecture}`
            : NAO_INFORMADO
        return { navegador, sistema, arquitetura, modelo: extra.model || NAO_INFORMADO }
    } catch {
        return lerPeloUserAgent()
    }
}

// taxa de atualização da tela: conta quantos quadros o navegador desenha em 1 s
const medirTaxaDeAtualizacao = () => new Promise((resolver) => {
    let quadros = 0
    let inicio = null
    const contar = (agora) => {
        if (inicio === null) inicio = agora
        quadros += 1
        if (agora - inicio < DURACAO_MEDICAO_HZ_MS) return requestAnimationFrame(contar)
        const medida = (quadros - 1) / ((agora - inicio) / 1000)
        resolver(TAXAS_COMUNS_HZ.reduce((maisPerto, taxa) => (Math.abs(taxa - medida) < Math.abs(maisPerto - medida) ? taxa : maisPerto)))
    }
    requestAnimationFrame(contar)
})

const lerFixos = () => {
    return {
        threads: navigator.hardwareConcurrency || NAO_INFORMADO,
        // o Chrome arredonda e trava em 8 GB (privacidade): "8" quer dizer "8 GB ou mais"
        memoriaGb: navigator.deviceMemory || NAO_INFORMADO,
        gpu: lerGpu(),
        tela: {
            largura: window.screen.width,
            altura: window.screen.height,
            densidade: window.devicePixelRatio || 1,
            profundidadeCor: window.screen.colorDepth,
        },
        idiomaNavegador: navigator.language || NAO_INFORMADO,
        fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone || NAO_INFORMADO,
        toque: navigator.maxTouchPoints > 0,
    }
}

// Especificações reais do aparelho de quem está visitando, lidas do navegador (nada sai daqui: é só leitura local).
// Só o que é do aparelho de verdade (nada de estimativa). O que é rápido vem na hora; plataforma detalhada e
// taxa de atualização chegam logo depois. A memória do JavaScript (só Chrome/Edge) é relida a cada segundo.
export const useEspecificacoesAparelho = () => {
    const [fixos] = useState(lerFixos)
    const [plataforma, setPlataforma] = useState(lerPeloUserAgent)
    const [taxaHz, setTaxaHz] = useState(NAO_INFORMADO)
    const [memoriaJsMb, setMemoriaJsMb] = useState(NAO_INFORMADO)

    useEffect(() => {
        let ativo = true
        lerPlataforma().then((valor) => ativo && setPlataforma(valor))
        medirTaxaDeAtualizacao().then((valor) => ativo && setTaxaHz(valor))

        const lerMemoriaJs = () => {
            const memoria = performance.memory
            if (memoria) setMemoriaJsMb(Math.round(memoria.usedJSHeapSize / 1048576))
        }
        lerMemoriaJs()
        const intervalo = setInterval(lerMemoriaJs, 1000)

        return () => {
            ativo = false
            clearInterval(intervalo)
        }
    }, [])

    return { ...fixos, plataforma, taxaHz, memoriaJsMb }
}
