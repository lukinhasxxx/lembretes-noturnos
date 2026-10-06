import './BotaoBarraDeTarefas.css'

// Botão padrão da barra de tarefas: centraliza o conteúdo e tem o mesmo hover em todos.
// icone: caminho da imagem em /public; tamanhoIcone: altura dela em px.
// children: para botões de texto (idioma, relógio).
// ativo: deixa o botão destacado (ex.: iniciar com o menu aberto).
const BotaoBarraDeTarefas = ({ icone, alt, tamanhoIcone = 20, largura, aoClicar, ativo = false, className = '', children }) => (
    <button
        type='button'
        className={`botao-barra-de-tarefas ${ativo ? 'ativo' : ''} ${className}`}
        style={largura ? { width: largura } : undefined}
        onClick={aoClicar}
    >
        {icone && (
            <img
                src={process.env.PUBLIC_URL + icone}
                alt={alt}
                style={{ height: tamanhoIcone }}
                draggable={false}
            />
        )}
        {children}
    </button>
)

export default BotaoBarraDeTarefas
