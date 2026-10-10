// Configurações do sistema do tablet. Trocar aqui muda em todo lugar.

// nome provisório do sistema e do usuário (nomes próprios: não são traduzidos)
export const SISTEMA = {
    nome: 'CyberOS',
    usuario: 'Visitor',
}

// por onde o tablet passa: desligado → ligando (boot) → boasVindas → areaDeTrabalho
// bloquear (menu iniciar): areaDeTrabalho → bloqueado → (arrastar/clicar) login → (Entrar) entrando → areaDeTrabalho
// desligar (menu iniciar): areaDeTrabalho → desligando → apagado → desligado (o modal fecha)
// reiniciar (menu iniciar): areaDeTrabalho → reiniciando → apagado → ligando → (segue como o boot)
export const ESTADOS_SISTEMA = {
    desligado: 'desligado',
    ligando: 'ligando',
    boasVindas: 'boasVindas',
    areaDeTrabalho: 'areaDeTrabalho',
    bloqueado: 'bloqueado',
    login: 'login',
    entrando: 'entrando',
    desligando: 'desligando',
    reiniciando: 'reiniciando',
    apagado: 'apagado',
}

// tempos de cada tela (as animações do CSS acompanham esses valores)
export const DURACAO_BOOT_MS = 3500
// depois que a animação do boot termina, a barrinha continua "carregando" por um tempo sorteado
// entre o mínimo e o máximo: cada vez que liga demora um pouco diferente, como um carregamento de verdade.
// A barrinha já aparece ~0,75s antes do fim da animação, então ela fica na tela entre ~1,25s e ~2s.
export const DURACAO_BOOT_EXTRA_MINIMA_MS = 500
export const DURACAO_BOOT_EXTRA_MAXIMA_MS = 1250
export const DURACAO_BOAS_VINDAS_MS = 2500
// depois do "Entrar" na tela de login: spinner com "Aguarde..." até voltar para a área de trabalho
export const DURACAO_ENTRANDO_MS = 1500
// "Desligando..." / "Reiniciando...": spinner na tela (o conteúdo apaga no fim, ver DURACAO_SUMINDO_MS)
export const DURACAO_ENCERRANDO_MS = 2500
// fim do "Desligando..."/"Reiniciando...": o conteúdo apaga até sobrar só o preto (faz parte da duração acima)
export const DURACAO_SUMINDO_MS = 500
// tela preta entre desligar e fechar o modal / entre reiniciar e o boot
export const DURACAO_TELA_APAGADA_MS = 800

// ---------- espelho no tablet da mesa ----------

// tamanho real da imagem do tablet da mesa (public/imagens/tabletPNG.png)
export const IMAGEM_TABLET_MESA = { largura: 974, altura: 443 }

// cantos da tela (o "vidro") dentro dessa imagem, em px da imagem, medidos no Paint.
// O tablet está deitado em perspectiva, então a tela é um quadrilátero torto, não um retângulo.
export const CANTOS_TELA_TABLET_MESA = {
    cimaEsquerda: [331, 47],
    cimaDireita: [875, 172],
    baixoDireita: [669, 361],
    baixoEsquerda: [92, 187],
}

// resolução "interna" do espelho, a mesma da tela do modal: o espelho é desenhado nesse tamanho
// e depois entortado (corner pin) para caber nos cantos acima
export const TELA_ESPELHO = { largura: 666, altura: 389 }
