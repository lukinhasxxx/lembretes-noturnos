// Escala das janelas do HUD (interface por cima da cena), calculada pela janela do navegador.
// Os valores reproduzem os antigos breakpoints do modal (~40% da largura da tela):
// escala = menor entre (largura / larguraReferencia), (altura / alturaReferencia) e maxima.
export const ESCALA_HUD = {
    larguraReferencia: 1800,
    alturaReferencia: 800,
    maxima: 1,
}

// No celular a regra do PC (~40% da tela) deixa o tablet pequeno demais para o dedo: lá a escala é a maior que
// faz o modal do tablet caber nesta fração da largura e da altura da tela (em pé fica quase da largura toda;
// deitado, quase da altura toda — com uma folguinha para ainda dar para tocar no tablet da mesa embaixo).
// O mini player usa a mesma escala.
export const ESCALA_HUD_CELULAR = {
    fracaoLargura: 0.96,
    fracaoAltura: 0.87,
    maxima: 1.2,
}

// Tamanho base (escala 1) do modal do tablet, o mesmo do .secao-tablet-modal.
export const MODAL_TABLET = {
    largura: 760,
    altura: 482,
}

// Resolução do tablet (escolhida no Config): multiplica a escala normal do modal do tablet.
// Nunca passa do que cabe na tela (FRACAO_MAXIMA_TELA); opção que não cabe aparece desativada.
export const RESOLUCOES_TABLET = [
    { id: 'menor', fator: 0.85, rotulo: '15% menor' },
    { id: 'padrao', fator: 1, rotulo: 'Recomendado' },
    { id: 'maior', fator: 1.15, rotulo: '15% maior' },
    { id: 'muitoMaior', fator: 1.4, rotulo: '40% maior' },
    // 10% acima da "40% maior" (1,4 × 1,1)
    { id: 'enorme', fator: 1.54, rotulo: '54% maior' },
]

export const RESOLUCAO_PADRAO = 'padrao'

// fração máxima da tela que uma janela do HUD pode ocupar quando a pessoa aumenta o tamanho dela
export const FRACAO_MAXIMA_TELA = {
    largura: 0.98,
    altura: 0.96,
}

// Tamanho base (escala 1) do mini player com a área de pegar (.draggable-wrapper):
// player 347x183 + 16px de padding em cada lado.
export const MINI_PLAYER = {
    largura: 379,
    altura: 215,
}
