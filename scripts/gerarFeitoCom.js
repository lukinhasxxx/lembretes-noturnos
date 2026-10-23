// "Feito com" do Sobre (Config → Sobre): lê o package.json e as versões instaladas (node_modules) e gera
// src/features/tablet/componentes/SobreSistema/feitoCom.gerado.json. Roda sozinho antes do start e do build.
// Só entram os pacotes da lista PERMITIDOS (de propósito: nada que não esteja nela aparece no site, mesmo que
// alguém adicione uma dependência nova). O CRA não deixa o código importar arquivos de fora do src/, por isso
// o arquivo é gerado aqui.
const fs = require('fs')
const path = require('path')

const RAIZ = path.join(__dirname, '..')
const SAIDA = path.join(RAIZ, 'src/features/tablet/componentes/SobreSistema/feitoCom.gerado.json')

// pacote → como aparece no Sobre
const PERMITIDOS = {
    react: { nome: 'React', papel: 'A interface inteira' },
    'react-dom': { nome: 'React DOM', papel: 'Desenha o React na página' },
    'react-scripts': { nome: 'Create React App', papel: 'Build e servidor de desenvolvimento' },
    'framer-motion': { nome: 'Framer Motion', papel: 'Animações' },
    'react-draggable': { nome: 'React Draggable', papel: 'Arrastar o tablet e o player' },
    'react-icons': { nome: 'React Icons', papel: 'Ícones' },
    '@emotion/react': { nome: 'Emotion', papel: 'Estilos em JS' },
    'chess.js': { nome: 'chess.js', papel: 'Regras do xadrez' },
    uuid: { nome: 'uuid', papel: 'Identificador dos lembretes' },
}

const pacote = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'))
const dependencias = { ...pacote.dependencies, ...pacote.devDependencies }

const versaoInstalada = (nome) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(RAIZ, 'node_modules', nome, 'package.json'), 'utf8')).version
    } catch {
        return null
    }
}

const tecnologias = Object.entries(PERMITIDOS)
    .filter(([id]) => dependencias[id])
    .map(([id, info]) => ({ id, ...info, pedida: dependencias[id], versao: versaoInstalada(id) ?? dependencias[id].replace(/^[\^~]/, '') }))

fs.writeFileSync(SAIDA, `${JSON.stringify({ projeto: pacote.name, versaoProjeto: pacote.version, tecnologias }, null, 2)}\n`)
console.log(`Feito com: ${tecnologias.length} tecnologias → ${path.relative(RAIZ, SAIDA)}`)
