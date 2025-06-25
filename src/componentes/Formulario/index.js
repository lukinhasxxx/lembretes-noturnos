import './formulario.css'
import CampoTexto from '../CampoTexto'
import ListaSuspesa from '../ListaSuspensa'
import Botao from '../Botao'
import { useState } from 'react'

const Formulario = (props) => {


    const [time, setTime] = useState('')
    const [nome, setNome] = useState('')
    const [cargo, setCargo] = useState('')
    const [imagem, setImagem] = useState('')


    const aoSalvar = (evento) => {
        evento.preventDefault()
        props.aoColaboradorCadastrado({
            nome,
            cargo,
            imagem,
            time
        })
        setNome('')
        setCargo('')
        setImagem('')
        setTime('')
}


    return (
        <section className='formulario'>
            
            <form onSubmit={aoSalvar}>
                <h2>Preencha os dados para crair o card do colaborador.</h2>

                <CampoTexto 
                    obrigatorio = {true}
                    label="Nome" 
                    placeholder="Digite seu nome" 
                    valor = {nome}
                    aoAlterado ={valor =>setNome(valor)}
                />

                <CampoTexto 
                    obrigatorio = {true}  
                    label="Cargo" 
                    placeholder="Digite seu cargo"
                    valor = {cargo}
                    aoAlterado = {valor =>setCargo(valor)}
                />

                <CampoTexto 
                    label="Imagem" 
                    placeholder="Digite o endereço da imagem"
                    valor={imagem}
                    aoAlterado = {valor => setImagem(valor)}
                />
                <ListaSuspesa
                    obrigatorio = {true}
                    label = "Time"
                    itens = {props.times}
                    valor = {time}
                    aoAlterado = {valor =>setTime(valor)}
                 />
                <Botao>Criar card </Botao>
            </form>
        </section>
    )
}

export default Formulario