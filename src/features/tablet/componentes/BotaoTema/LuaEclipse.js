// Ideia 1 — eclipse ao contrário, com a foto real da lua. Parada, só aparece um fio de lua (o resto fica
// na sombra, bem fraquinho); com o mouse em cima a sombra desliza em ~2 s até a lua cheia, com uns cortes
// de glitch no caminho. Ao tirar o mouse, volta sozinha.
const FOTO_LUA = '/imagens/windows/temas/lua.jpg'

const LuaEclipse = () => (
    <div className='lua-eclipse' style={{ backgroundImage: `url(${process.env.PUBLIC_URL + FOTO_LUA})` }}>
        <div className='lua-eclipse-sombra' />
    </div>
)

export default LuaEclipse
