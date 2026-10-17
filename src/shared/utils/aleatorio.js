// Número aleatório entre min e max (com casas decimais). Usado para tempos que variam a cada vez,
// como um sistema de verdade (ex.: sincronizar a hora demora um pouco diferente cada vez).
export const aleatorioEntre = (min, max) => min + Math.random() * (max - min)
