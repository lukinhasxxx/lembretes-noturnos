// Escala das janelas do HUD (interface por cima da cena), calculada pela janela do navegador.
// Os valores reproduzem os antigos breakpoints do modal (~40% da largura da tela):
// escala = menor entre (largura / larguraReferencia), (altura / alturaReferencia) e maxima.
export const ESCALA_HUD = {
    larguraReferencia: 1800,
    alturaReferencia: 800,
    maxima: 1,
}

// Tamanho base (escala 1) do modal do tablet, o mesmo do .secao-tablet-modal.
export const MODAL_TABLET = {
    largura: 760,
    altura: 482,
}
