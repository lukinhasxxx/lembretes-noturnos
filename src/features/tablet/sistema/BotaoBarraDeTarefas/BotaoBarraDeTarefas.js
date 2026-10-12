import './BotaoBarraDeTarefas.css'

// Botão padrão da barra de tarefas: centraliza o conteúdo e tem o mesmo hover em todos.
// icone: caminho da imagem em /public; tamanhoIcone: altura dela em px.
// children: para botões de texto (idioma, relógio).
// ativo: deixa o botão destacado (ex.: iniciar com o menu aberto).
// outrasProps: vão direto para o <button> (ex.: data-app, para a janela saber onde fica o ícone dela)
const BotaoBarraDeTarefas = ({ icone, alt, tamanhoIcone = 20, largura, aoClicar, ativo = false, className = '', children, ...outrasProps }) => (
    <button
        type='button'
        className={`botao-barra-de-tarefas ${ativo ? 'ativo' : ''} ${className}`}
        style={largura ? { width: largura } : undefined}
        onClick={aoClicar}
        {...outrasProps}
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
