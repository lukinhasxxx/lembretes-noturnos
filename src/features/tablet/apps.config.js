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
        tamanhoIconeBarra: 25,
    },
    app_config: {
        id: 'app_config',
        nome: 'Config',
        icone: '/imagens/windows/ledIcone.png',
        telas: ['config.exe'],
        telaInicial: 'config.exe',
        tamanhoIconeBarra: 30,
    },
    app_2048: {
        id: 'app_2048',
        nome: '2048',
        icone: '/imagens/windows/jogos/icone2048.svg',
        telas: ['2048.exe'],
        telaInicial: '2048.exe',
        tamanhoIconeBarra: 26,
    },
    app_sudoku: {
        id: 'app_sudoku',
        nome: 'Sudoku',
        icone: '/imagens/windows/jogos/iconeSudoku.svg',
        telas: ['sudoku.exe'],
        telaInicial: 'sudoku.exe',
        tamanhoIconeBarra: 26,
    },
    app_xadrez: {
        id: 'app_xadrez',
        nome: 'Xadrez',
        icone: '/imagens/windows/jogos/iconeXadrez.svg',
        telas: ['xadrez.exe'],
        telaInicial: 'xadrez.exe',
        tamanhoIconeBarra: 26,
    },
}

// id do app dono de uma tela ('desktop' e telas do sistema não têm dono → undefined)
export const appDaTela = (tela) => Object.values(APPS).find(app => app.telas.includes(tela))?.id
