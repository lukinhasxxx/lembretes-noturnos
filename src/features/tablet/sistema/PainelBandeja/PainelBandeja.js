import './PainelBandeja.css'

// Pop-up que sobe da bandeja da barra de tarefas (wi-fi, volume, idioma, notificações), colado à direita como
// o calendário e no mesmo vidro escuro com borda neon.
// fechando: toca a animação de fechar; aoTerminarDeFechar: chamado no fim dela, para desmontar
const PainelBandeja = ({ fechando, aoTerminarDeFechar, className = '', children }) => (
    <div
        className={`painel-bandeja ${fechando ? 'fechando' : ''} ${className}`}
        onAnimationEnd={(evento) => {
            if (fechando && evento.target === evento.currentTarget) aoTerminarDeFechar()
        }}
    >
        {children}
    </div>
)

export default PainelBandeja
