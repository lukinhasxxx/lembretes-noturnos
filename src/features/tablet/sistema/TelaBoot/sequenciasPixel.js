import { DURACAO_BOOT_MS, DURACAO_BOOT_PIXEL_MS } from '../../tablet.config'

// As passagens de/para o PixelOS (ver PassagemPixel.js). Separado do componente para o useEstadoSistema saber
// quanto o boot demora sem importar a tela de boot.

// a resolução de 16 bits: ~240 linhas na altura da tela do tablet e 8 tons por canal de cor
export const LINHAS_DO_PIXELADO = 240
const TONS_DO_PIXELADO = 8
// a volta da saída: de 8 tons até quase o normal, em degraus pequenos para não dar tranco
const TONS_DA_VOLTA = [9, 10, 11, 12, 14, 16, 20, 24, 32, 48]
// o fim da entrada: blocos cada vez maiores (pixels da tela) até emendar no boot do PixelOS, que já começa em
// blocos grandes
const BLOCOS_DA_ENTRADA = [3, 5, 8, 12, 18, 26, 38, 54, 76, 100]
const BLOCOS_COMECAM_MS = 1000
const PASSO_DOS_BLOCOS_MS = 110

// cada passo começa `em` ms, com o tamanho do bloco ('base' = a resolução de 16 bits, medida na tela) e os tons.
// pixelOSEm: quando entra o boot do PixelOS (sem = não entra)
export const SEQUENCIAS_PIXEL = {
    // o 1º boot depois de entrar no PixelOS: o boot do tema de antes vai para 16 bits rápido mas aos poucos (as
    // cores vão diminuindo; cortar direto para 8 tons "piscava") e logo sai em blocos crescendo até o do PixelOS
    entrada: {
        passos: [
            { em: 0, bloco: 1 },
            ...[32, 20, 14, 10, TONS_DO_PIXELADO].map((tons, indice) => ({ em: 150 + indice * 100, bloco: 'base', tons })),
            ...BLOCOS_DA_ENTRADA.map((bloco, indice) => ({ em: BLOCOS_COMECAM_MS + indice * PASSO_DOS_BLOCOS_MS, bloco, tons: TONS_DO_PIXELADO })),
        ],
        pixelOSEm: BLOCOS_COMECAM_MS + BLOCOS_DA_ENTRADA.length * PASSO_DOS_BLOCOS_MS,
    },
    // o 1º boot depois de sair do PixelOS: o boot do tema novo começa em 16 bits e a partir de 0,8 s volta aos
    // poucos ao normal (as cores sobem em degraus pequenos) até ficar nítido em 3 s; daí segue como o boot dele
    saida: {
        passos: [
            { em: 0, bloco: 'base', tons: TONS_DO_PIXELADO },
            ...TONS_DA_VOLTA.map((tons, indice) => ({ em: 800 + indice * 200, bloco: 'base', tons })),
            { em: 800 + TONS_DA_VOLTA.length * 200, bloco: 1 },
        ],
    },
}

// quanto a animação da passagem dura (o boot do sistema espera isso antes das boas-vindas)
export const duracaoDaPassagem = (tipo) => {
    const { pixelOSEm } = SEQUENCIAS_PIXEL[tipo]
    return pixelOSEm ? pixelOSEm + DURACAO_BOOT_PIXEL_MS : DURACAO_BOOT_MS
}
