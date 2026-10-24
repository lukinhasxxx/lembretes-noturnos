// Ícones do menu do Config: traço fino em currentColor (a cor e o brilho vêm do CSS, então acompanham o tema)
const Icone = ({ children }) => (
    <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='1.6'
        strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        {children}
    </svg>
)

// pincel
export const IconePersonalizacao = () => (
    <Icone>
        <path d='M14.5 4.5l5 5-8.2 8.2a2 2 0 0 1-1.4.6H7.5v-2.4a2 2 0 0 1 .6-1.4z' />
        <path d='M12.5 6.5l5 5' />
        <path d='M4 20c1.5 0 3.5-.5 3.5-1.7' />
    </Icone>
)

// rádio
export const IconeCena = () => (
    <Icone>
        <rect x='3' y='8' width='18' height='12' rx='2' />
        <path d='M7 8l9-4' />
        <circle cx='15.5' cy='14' r='2.6' />
        <path d='M6.5 12.5h4M6.5 15.5h4' />
    </Icone>
)

// engrenagem
export const IconeSistema = () => (
    <Icone>
        <circle cx='12' cy='12' r='3' />
        <path d='M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7' />
        <circle cx='12' cy='12' r='6.2' />
    </Icone>
)

// "i"
export const IconeSobre = () => (
    <Icone>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 11v5.5' />
        <circle cx='12' cy='7.8' r='0.6' fill='currentColor' />
    </Icone>
)
