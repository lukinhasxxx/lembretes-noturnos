import './CarregandoApp.css'

// "Abrindo..." no lugar da janela enquanto o arquivo de um app ainda está baixando (os jogos são carregados só
// quando a pessoa abre pela primeira vez). Ocupa o espaço da janela e aparece na hora, então a área de trabalho
// não fica vazia; o ModalTablet segura ele um tempo mínimo na tela para não ser só um "pisco".
const CarregandoApp = ({ app }) => (
    <div className='carregando-app' role='status' aria-live='polite'>
        <div className='carregando-app-cartao'>
            {app?.icone && <img src={process.env.PUBLIC_URL + app.icone} alt='' />}
            <span>Abrindo {app?.nome ?? 'app'}…</span>
            <div className='carregando-app-barra' />
        </div>
    </div>
)

export default CarregandoApp
