import {createContext, useState } from "react"

export const VisibilidadePainelContext = createContext(); //o contexto literalmente

const VisibilidadePainel = ({children}) => { //aqui tamo criando o provider

const [mostrarPainel,setMostrarPainel] = useState(true);

return (

    <VisibilidadePainelContext.Provider value ={{mostrarPainel,setMostrarPainel}}>
        {children}
    </VisibilidadePainelContext.Provider> //aqui eh onde vai encapsular onde as funcoes foram escritas
    );
}
export default VisibilidadePainel