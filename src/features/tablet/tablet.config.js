// Configurações do sistema do tablet. Trocar aqui muda em todo lugar.

// nome provisório do sistema e do usuário (nomes próprios: não são traduzidos)
export const SISTEMA = {
    nome: 'CyberOS',
    usuario: 'Visitor',
}

// por onde o tablet passa: desligado → ligando (boot) → boasVindas → areaDeTrabalho
export const ESTADOS_SISTEMA = {
    desligado: 'desligado',
    ligando: 'ligando',
    boasVindas: 'boasVindas',
    areaDeTrabalho: 'areaDeTrabalho',
}

// tempos de cada tela (as animações do CSS acompanham esses valores)
export const DURACAO_BOOT_MS = 3500
// depois que a animação do boot termina, a barrinha continua "carregando" por um tempo sorteado
// entre o mínimo e o máximo: cada vez que liga demora um pouco diferente, como um carregamento de verdade.
// A barrinha já aparece ~0,75s antes do fim da animação, então ela fica na tela entre ~1,25s e ~2s.
export const DURACAO_BOOT_EXTRA_MINIMA_MS = 500
export const DURACAO_BOOT_EXTRA_MAXIMA_MS = 1250
export const DURACAO_BOAS_VINDAS_MS = 2500
