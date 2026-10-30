import './TelaBootPixel.css'

const ID_DO_FILTRO = 'filtro-pixelar-tela'

// até este tamanho, cada ponto é espalhado com cópias deslocadas (exato); acima, com feMorphology (mais barato,
// mas a janela dele é sempre ímpar: num bloco par o ponto vaza 1 pixel no vizinho, o que só aparece em bloco pequeno)
const MAIOR_BLOCO_EXATO = 6

// Pixela o que estiver dentro em blocos de `bloco` pixels da tela, com um filtro SVG (funciona com qualquer coisa:
// animações, vídeo...): pega 1 ponto de cada bloco (feFlood + feTile), apaga o resto e espalha cada ponto pelo bloco
// todo. bloco <= 1 = sem filtro. Só um por vez na tela (o id é fixo).
// niveis (opcional): quantos tons por canal de cor sobram (feComponentTransfer discreto) — os degradês viram faixas,
// como num console antigo
const PixelarTela = ({ bloco, niveis, children }) => {
    const pixelando = bloco > 1
    const exato = bloco <= MAIOR_BLOCO_EXATO
    // no exato o ponto é o canto de cima/esquerda do bloco e as cópias vão para a direita e para baixo; no outro é o
    // meio do bloco, que a dilatação espalha para todos os lados
    const ponto = exato ? 0 : Math.floor(bloco / 2)
    const deslocamentos = exato ? Array.from({ length: bloco }, (_, indice) => indice) : []
    const tons = niveis && Array.from({ length: niveis }, (_, indice) => (indice / (niveis - 1)).toFixed(3)).join(' ')

    return (
        <>
            {/* a sobra da tela que não fecha um bloco inteiro (embaixo e à direita) sai transparente do filtro:
                o fundo preto não deixa o que está por baixo aparecer ali */}
            {pixelando && <div className='pixelar-tela pixelar-tela-fundo' />}
            {pixelando && (
                <svg className='pixelar-tela-filtro' aria-hidden='true'>
                    {/* sRGB: o padrão (linearRGB) faz as cores escuras valerem quase zero, e com poucos tons o fundo
                        azul-escuro dos boots virava preto */}
                    <filter id={ID_DO_FILTRO} x='0' y='0' width='100%' height='100%' colorInterpolationFilters='sRGB'>
                        <feFlood x={ponto} y={ponto} width='1' height='1' />
                        <feComposite width={bloco} height={bloco} />
                        <feTile result='pontos' />
                        {/* no exato, o ponto leva a média do bloco (soma do bloco à direita/abaixo dele ÷ tamanho²) em vez
                            da cor de 1 pixel: senão um padrão fino (as listrinhas de tubo do boot, a cada 2 px) cai sempre
                            na mesma listra e a tela fica da cor dela */}
                        {exato && (
                            <feConvolveMatrix
                                in='SourceGraphic'
                                order={bloco}
                                kernelMatrix={Array(bloco * bloco).fill(1).join(' ')}
                                divisor={bloco * bloco}
                                targetX='0'
                                targetY='0'
                                edgeMode='duplicate'
                                preserveAlpha='true'
                                result='media'
                            />
                        )}
                        <feComposite in={exato ? 'media' : 'SourceGraphic'} in2='pontos' operator='in' result='amostras' />
                        {exato ? (
                            <>
                                {deslocamentos.map((dx) => <feOffset key={dx} in='amostras' dx={dx} result={`direita-${dx}`} />)}
                                <feMerge result='faixas'>
                                    {deslocamentos.map((dx) => <feMergeNode key={dx} in={`direita-${dx}`} />)}
                                </feMerge>
                                {deslocamentos.map((dy) => <feOffset key={dy} in='faixas' dy={dy} result={`abaixo-${dy}`} />)}
                                <feMerge>
                                    {deslocamentos.map((dy) => <feMergeNode key={dy} in={`abaixo-${dy}`} />)}
                                </feMerge>
                            </>
                        ) : (
                            <feMorphology operator='dilate' radius={ponto} />
                        )}
                        {tons && (
                            <feComponentTransfer>
                                <feFuncR type='discrete' tableValues={tons} />
                                <feFuncG type='discrete' tableValues={tons} />
                                <feFuncB type='discrete' tableValues={tons} />
                            </feComponentTransfer>
                        )}
                    </filter>
                </svg>
            )}
            <div className='pixelar-tela' style={pixelando ? { filter: `url(#${ID_DO_FILTRO})` } : undefined}>
                {children}
            </div>
        </>
    )
}

export default PixelarTela
