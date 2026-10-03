import React, { useState, useEffect} from 'react'
import './Relogio.css'

const Relogio = () => {

const [dataAtual,setDataAtual] = useState(new Date())

useEffect(() => {
    const timer = setInterval(() => {
            setDataAtual(new Date());
        },1000);

return () => {
    clearInterval(timer)
};

},[])

    return (
    <div style={{display:'flex'}}>
        <div className='relogio-tablet'>
            <span>{dataAtual.toLocaleTimeString('pt-BR',{ hour: '2-digit',minute: '2-digit'})}</span>
            <span>{dataAtual.toLocaleDateString('pt-BR')}</span>
        </div>
    </div>
    )

}

export default Relogio
