import './LuaIniciar.css'

// mesma foto real da lua do botão de tema do Config
const FOTO_LUA = '/imagens/windows/temas/lua.jpg'

// Logo do botão iniciar: lua minguante que fica cheia enquanto o menu abre (e volta a minguar ao fechar).
// A parte "apagada" é um recorte (máscara), não uma sombra preta: o fundo da barra aparece através dela.
// cheia: menu iniciar aberto
const LuaIniciar = ({ cheia }) => (
    <span
        className={`lua-iniciar ${cheia ? 'cheia' : ''}`}
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL + FOTO_LUA})` }}
        aria-hidden='true'
    />
)

export default LuaIniciar
