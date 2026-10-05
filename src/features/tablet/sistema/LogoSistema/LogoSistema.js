// Logo PROVISÓRIO do sistema: 4 "vidraças" em perspectiva (lembra uma janela, sem copiar a marca do Windows).
// Quando o nome/logo definitivo estiver decidido, troca só este componente.
// O brilho neon vem do CSS de quem usa (filter: drop-shadow).
const LogoSistema = ({ className }) => (
    <svg className={className} viewBox='0 0 100 100' aria-hidden='true'>
        <defs>
            <linearGradient id='logo-sistema-gradiente' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#6ef0ff' />
                <stop offset='100%' stopColor='#b98cff' />
            </linearGradient>
        </defs>
        <g fill='url(#logo-sistema-gradiente)' fillOpacity='0.85' stroke='#d6fbff' strokeWidth='1'>
            {/* coluna da esquerda menor que a da direita: dá a impressão de perspectiva.
                className em cada quadrado: o boot anima um por um */}
            <polygon className='logo-sistema-vidraca' points='12,24 45,19 45,47 12,47' />
            <polygon className='logo-sistema-vidraca' points='50,18 90,11 90,47 50,47' />
            <polygon className='logo-sistema-vidraca' points='12,52 45,52 45,80 12,75' />
            <polygon className='logo-sistema-vidraca' points='50,52 90,52 90,88 50,81' />
        </g>
    </svg>
)

export default LogoSistema
