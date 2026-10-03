// Janela do HUD que encolhe/cresce inteira (como uma imagem) conforme a escala recebida.
// Caixa de fora: tamanho já escalado, é ela que o <Draggable> move e usa para calcular os limites.
// Caixa de dentro: tamanho base (escala 1), escalada via transform; o conteúdo não precisa saber da escala.
// O ...resto repassa o que o <Draggable> injeta (className, style com translate, eventos do mouse).
const JanelaHud = ({ nodeRef, largura, altura, escala, style, children, ...resto }) => {
    return (
        <div
            ref={nodeRef}
            {...resto}
            // bloqueia o drag nativo do navegador (imagem/seleção "fantasma"): ele engole o mouseup
            // e faz a janela ficar grudada no mouse
            onDragStart={(evento) => evento.preventDefault()}
            style={{ ...style, width: largura * escala, height: altura * escala }}
        >
            <div
                style={{
                    width: largura,
                    height: altura,
                    transform: `scale(${escala})`,
                    transformOrigin: 'top left',
                }}
            >
                {children}
            </div>
        </div>
    )
}

export default JanelaHud
