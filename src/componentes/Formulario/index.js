import './formulario.css'
import CampoTexto from '../CampoTexto'
import ListaSuspesa from '../ListaSuspensa'
import Botao from '../Botao'
import { useState } from 'react'
import BotaoUpload from '../BotaoUpload'

const Formulario = ({cadastrarTime, times, aoColaboradorCadastrado}) => {


    const [time, setTime] = useState('')
    const [nome, setNome] = useState('')
    const [cargo, setCargo] = useState('')
    const [imagem, setImagem] = useState('')
    const [corTime, setCorTime] = useState('')
    const [nomeTime, setNomeTime] = useState('')


    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoColaboradorCadastrado({
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
                <h2>Preencha os dados para criar o card do colaborador.</h2>

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
                {/* <BotaoUpload/>
                <ListaSuspesa
                    obrigatorio = {true}
                    label = "Time"
                    itens = {times}
                    valor = {time}
                    aoAlterado = {valor =>setTime(valor)}
                 /> */}
                <Botao>Criar card </Botao>
            </form>





            <form onSubmit={(evento) => {
                evento.preventDefault()
                cadastrarTime({ nome:nomeTime, cor:corTime  })
                
                }}>
                <h2>Preencha os dados para criar um time novo.</h2>

                <CampoTexto 
                    obrigatorio
                    label="Nome" 
                    placeholder="Digite o nome do seu time" 
                    valor = {nomeTime}
                    aoAlterado ={valor =>setNomeTime(valor)}
                />

                <CampoTexto 
                    type = 'color'
                    obrigatorio
                    label="Cor" 
                    placeholder="Digite a cor do time"
                    valor = {corTime}
                    aoAlterado = {valor =>setCorTime(valor)}
                />
                <Botao>Criar um novo time</Botao>
            </form>
        </section>
    )
}

export default Formulario