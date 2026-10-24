// API pública da feature hud: quem está fora importa daqui, não das pastas internas.
export { default as JanelaArrastavel } from './JanelaArrastavel/JanelaArrastavel'
export { MINI_PLAYER, MODAL_TABLET, RESOLUCOES_TABLET, RESOLUCAO_PADRAO } from './hud.config'
export { useEscalaHud, calcularEscala, escalaQueCabe } from './hooks/useEscalaHud'
