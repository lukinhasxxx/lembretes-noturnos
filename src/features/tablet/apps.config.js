// Registro dos apps do sistema do tablet. Barra de tarefas, menu iniciar (e depois a área de trabalho)
// desenham os apps a partir daqui: app novo = uma entrada nova nesta lista.
// telaInicial: tela que abre quando o app é aberto pelo menu iniciar
// tamanhoIconeBarra: altura do ícone na barra de tarefas, em px (cada imagem tem uma margem interna diferente)
export const APPS = {
    app_lembretes: {
        id: 'app_lembretes',
        nome: 'Lembretes',
        icone: '/imagens/windows/lembretesIcone.png',
        telaInicial: 'about.exe',
        tamanhoIconeBarra: 28,
    },
    app_config: {
        id: 'app_config',
        nome: 'Config',
        icone: '/imagens/windows/ledIcone.png',
        telaInicial: 'config.exe',
        tamanhoIconeBarra: 35,
    },
}
