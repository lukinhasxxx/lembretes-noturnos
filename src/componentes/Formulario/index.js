import './formulario.css'
import CampoTexto from '../CampoTexto'
import ListaSuspesa from '../ListaSuspensa'
import Botao from '../Botao'
import { useState } from 'react'
import BotaoUpload from '../BotaoUpload'

const Formulario = ({aoSubmeter}) => {


    const [nome, setNome] = useState('')



    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
        console.log('submeteu')
}


    return (
        <section className='formulario'>
            
            <form onSubmit={aoSalvar}>
                <h2>Deixe seu lembrete para ser incluído no painel.</h2>

                {/* <CampoTexto 
                    obrigatorio = {true}
                    placeholder="Digite sua mensagem" 
                    value = {nome}
                    aoAlterado ={evento =>setNome(evento.target.value)}
                /> */}
                <textarea
                    required={true}
                    placeholder='Digite sua mensagem'
                    value= {nome}
                    onChange={evento => setNome(evento.target.value)}
                    name='mensagem'
                    >
                </textarea>


                {/* <BotaoUpload/>
                <ListaSuspesa
                    obrigatorio = {true}
                    label = "Time"
                    itens = {times}
                    valor = {time}
                    aoAlterado = {valor =>setTime(valor)}
                 /> */}
                <Botao>Enviar lembrete</Botao>
            </form>





        </section>
    )
}

export default Formulario