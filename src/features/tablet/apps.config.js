// Registro dos apps do sistema do tablet. Barra de tarefas, menu iniciar (e depois a área de trabalho)
// desenham os apps a partir daqui: app novo = uma entrada nova nesta lista.
// telas: todas as telas que pertencem ao app (para saber qual app está na frente)
// telaInicial: tela que abre quando o app é aberto pelo menu iniciar
// tamanhoIconeBarra: altura do ícone na barra de tarefas, em px (cada imagem tem uma margem interna diferente)
export const APPS = {
    app_lembretes: {
        id: 'app_lembretes',
        nome: 'Lembretes',
        icone: '/imagens/windows/lembretesIcone.png',
        telas: ['about.exe', 'lembretes.exe'],
        telaInicial: 'about.exe',
        tamanhoIconeBarra: 28,
    },
    app_config: {
        id: 'app_config',
        nome: 'Config',
        icone: '/imagens/windows/ledIcone.png',
        telas: ['config.exe'],
        telaInicial: 'config.exe',
        tamanhoIconeBarra: 35,
    },
}

// id do app dono de uma tela ('desktop' e telas do sistema não têm dono → undefined)
export const appDaTela = (tela) => Object.values(APPS).find(app => app.telas.includes(tela))?.id
