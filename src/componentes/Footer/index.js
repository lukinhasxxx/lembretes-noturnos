import './footer.css'

const Footer = () => {
    return (
            <footer>
                <section className='itens-rodape'>
                    <div className='rede-social'>
                        <a href = 'www.facebook.com' >
                            <img src='/imagens/fb.png' alt = 'logo do facebook'/>
                        </a>
                        <a href = 'www.x.com'> 
                            <img src='/imagens/tw.png' alt = 'logo do facebook'/>
                        </a>
                        <a href = 'www.instagram.com'> 
                            <img src='/imagens/ig.png' alt = 'logo do facebook'/>
                        </a>
                    </div>
                    <div>
                            <img src='/imagens/logo-organo.png' alt = "logo-nome-organo"/>
                    </div>
                    <div className='texto-rodape'>
                        <h3>Desenvolvido por Lucas.</h3>
                    </div>


                </section>
            </footer>
    )
}

export default Footer