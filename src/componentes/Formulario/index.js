import './formulario.css'
import CampoTexto from '../CampoTexto'
import ListaSuspesa from '../ListaSuspensa'
import Botao from '../Botao'
import { useState } from 'react'


const Formulario = ({aoSubmeter, validarLigadoDesligado}) => {
    const [nome, setNome] = useState('')
    const [telaAtiva, setTelaAtiva] = useState('desktop')


    const aoSalvar = (evento) => {
        evento.preventDefault()
        aoSubmeter(nome)
        setNome('')
        console.log('submeteu')
}
//renderizacao da tela do tablet - windows
    return (
    <div>
            <div className='tablet-tela'  > 
            <div className='area-de-trabalho' style={{backgroundImage:"url('/imagens/windows/windowsWallpaper.jpg')",backgroundRepeat:"no-repeat"}}  >
                {telaAtiva === 'desktop' && (<div className='icone-lembretes'
                   onClick={() => setTelaAtiva('lembretes') }>
                    <img src='/imagens/windows/iconeLembretes.png'
                    alt='abrir lembretes' />
                    <span>Lembretes.exe</span>
                </div>)}
                { telaAtiva === 'lembretes' && (
                    <form onSubmit={aoSalvar}>
                    <h2>Deixe seu lembrete para ser incluído no painel.</h2>
                    <textarea
                        required={true}
                        placeholder='Digite sua mensagem'
                        value= {nome}
                        onChange={evento => setNome(evento.target.value)}
                        name='mensagem'
                        >
                    </textarea>
                
                    <Botao>Enviar lembrete</Botao>
                </form>
                )}
            </div>

    <div className="barra-de-tarefas">
      {
        <div className="seta-voltar" onClick={() => setTelaAtiva('desktop')}>
          <img src="/imagens/windows/setaVoltar.png" alt="Voltar para o Desktop" />
        </div>
      }
    
    </div>

        </div>

            <section className='formulario'>
                <img className='tablet-modal' src='/imagens/tabletModal.png'
                style={{display: validarLigadoDesligado ? "" : " none" }}
                alt='Modal do tablet'
            />
            </section>

    </div>
    )
}

export default Formulario