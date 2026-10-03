import {createContext, useState } from "react"

export const VisibilidadePainelContext = createContext(); //o contexto literalmente

const VisibilidadePainelProvider = ({children}) => { //aqui tamo criando o provider

const [mostrarPainel,setMostrarPainel] = useState(true);
const [textoBotao,setTextoBotao] = useState('Esconder Painel')

const alterarVisibilidadePainel = () => {
    setMostrarPainel(visivel => !visivel);
    setTextoBotao(textoAtual =>textoAtual ==='Mostrar painel'?'Esconder painel':'Mostrar painel')
}

return (
    <VisibilidadePainelContext.Provider value ={{mostrarPainel, textoBotao, alterarVisibilidadePainel}}>
        {children}
    </VisibilidadePainelContext.Provider> //aqui eh onde vai encapsular onde as funcoes foram escritas
    );
}
export default VisibilidadePainelProvider