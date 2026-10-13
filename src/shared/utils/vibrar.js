import { ehCelular } from '../hooks/useDispositivo'

// Vibraçãozinha de resposta ao toque, só no celular. Só o Android vibra: no iPhone (e em navegador sem
// suporte) não acontece nada. ms: duração (curta = mais leve).
export const vibrar = (ms = 12) => {
    if (!ehCelular() || typeof navigator.vibrate !== 'function') return
    navigator.vibrate(ms)
}
