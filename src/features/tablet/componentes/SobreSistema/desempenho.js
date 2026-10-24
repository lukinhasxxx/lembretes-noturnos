import { ehCelular } from '../../../../shared/hooks/useDispositivo'

// Teste de desempenho do Sobre: roda os testes do desempenho.worker.js e dá uma nota.
// Por dentro a nota é medida contra o PC do Lucas (1000 = ele; 2000 = duas vezes mais rápido; 500 = metade),
// mas na tela só aparece a nota e a classificação (Muito bom, Bom...), com a régua do tipo de aparelho.

// quanto tempo cada teste roda
const DURACAO_TESTE_MS = 800
// limite de workers no teste multi-thread (aparelho com muitos núcleos não abre dezenas de uma vez)
const MAXIMO_THREADS = 32

export const TESTES_DESEMPENHO = [
    { id: 'inteiros', nome: 'Inteiros', descricao: 'Contas com números inteiros (primos)' },
    { id: 'flutuante', nome: 'Ponto flutuante', descricao: 'Contas com vírgula (fractal)' },
    { id: 'memoria', nome: 'Memória', descricao: 'Encher e ordenar uma lista grande' },
    { id: 'multi', nome: 'Multi-thread', descricao: 'Todos os núcleos ao mesmo tempo' },
]

// a base da nota (nota 1000): o PC do Lucas (Ryzen 5 5600X, 12 threads), em execuções por segundo de cada teste,
// a mediana de 5 rodadas no Edge 155 (22/10/2026). Medir de novo se os testes do desempenho.worker.js mudarem
const BASE_POR_SEGUNDO = { inteiros: 11870, flutuante: 4633, memoria: 502, multi: 66102 }

const novoWorker = () => new Worker(new URL('./desempenho.worker.js', import.meta.url))

const rodarNoWorker = (worker, teste) => new Promise((resolver, rejeitar) => {
    worker.onmessage = ({ data }) => resolver(data.porSegundo)
    worker.onerror = rejeitar
    worker.postMessage({ teste, duracaoMs: DURACAO_TESTE_MS })
})

// roda tudo (uns 3,5 s) e devolve { inteiros, flutuante, memoria, multi } em execuções por segundo.
// aoProgredir(fracao, idDoTeste): para a barra de progresso
export const medirDesempenho = async (aoProgredir) => {
    const resultado = {}
    const sozinho = novoWorker()
    try {
        for (const [indice, { id }] of TESTES_DESEMPENHO.slice(0, 3).entries()) {
            aoProgredir(indice / TESTES_DESEMPENHO.length, id)
            resultado[id] = await rodarNoWorker(sozinho, id)
        }
    } finally {
        sozinho.terminate()
    }

    // multi-thread: um worker por núcleo, todos com o teste de inteiros ao mesmo tempo; a nota é a soma
    aoProgredir(3 / TESTES_DESEMPENHO.length, 'multi')
    const threads = Math.min(navigator.hardwareConcurrency || 1, MAXIMO_THREADS)
    const workers = Array.from({ length: threads }, novoWorker)
    try {
        const taxas = await Promise.all(workers.map((worker) => rodarNoWorker(worker, 'inteiros')))
        resultado.multi = taxas.reduce((soma, taxa) => soma + taxa, 0)
    } finally {
        workers.forEach((worker) => worker.terminate())
    }
    aoProgredir(1, null)
    return resultado
}

// celular/tablet ou computador? Dois sinais independentes; basta um dizer "móvel":
// - o sistema: o Chrome conta direto (userAgentData.mobile); nos outros, o nome do aparelho no userAgent
//   (Android, iPhone, iPad... e o iPad novo, que se diz "Macintosh" mas tem tela de toque)
// - a tela: toque com o dedo e nenhum mouse (ehCelular, o mesmo do resto do site)
// Notebook com tela de toque continua "computador" (tem touchpad/mouse e o sistema não diz que é móvel)
export const tipoDeAparelho = () => {
    const agente = navigator.userAgent
    const sistemaDizMovel = navigator.userAgentData?.mobile === true
        || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(agente)
        || (/Macintosh/.test(agente) && navigator.maxTouchPoints > 1)
    return sistemaDizMovel || ehCelular() ? 'movel' : 'computador'
}

export const NOME_DO_TIPO = { movel: 'celular/tablet', computador: 'computador' }

// a base da nota, para o botão de informação (o teste mede processador e memória)
export const BASE_DA_NOTA = { processador: 'Ryzen 5 5600X (12 threads)', memoria: '32 GB', placaDeVideo: 'RTX 3060 Ti' }

// o que a nota quer dizer (da mais alta para a mais baixa; abaixo da última faixa é "Lento"). Celular e tablet
// têm a régua um pouco mais baixa: o mesmo número num celular é mais impressionante que num PC
const FAIXAS = {
    computador: { 'muito-bom': 1000, bom: 700, ok: 500, razoavel: 350, basico: 200 },
    movel: { 'muito-bom': 750, bom: 500, ok: 350, razoavel: 250, basico: 140 },
}
const CLASSES = [
    { id: 'muito-bom', nome: 'Muito bom' },
    { id: 'bom', nome: 'Bom' },
    { id: 'ok', nome: 'Ok' },
    { id: 'razoavel', nome: 'Razoável' },
    { id: 'basico', nome: 'Básico' },
    { id: 'lento', nome: 'Lento' },
]

export const classeDaNota = (nota, tipo) => CLASSES.find(({ id }) => nota >= (FAIXAS[tipo][id] ?? 0))

// single-thread: a média dos três testes que rodam num núcleo só (inteiros, ponto flutuante e memória)
export const notaSingleThread = (porSegundo) => Math.round(
    TESTES_DESEMPENHO.filter(({ id }) => id !== 'multi').reduce((soma, { id }) => soma + notaDe(id, porSegundo[id]), 0) / 3,
)

export const notaDe = (id, porSegundo) => Math.round((porSegundo / BASE_POR_SEGUNDO[id]) * 1000)

// nota geral: a média das notas dos testes
export const notaGeral = (porSegundo) => Math.round(
    TESTES_DESEMPENHO.reduce((soma, { id }) => soma + notaDe(id, porSegundo[id]), 0) / TESTES_DESEMPENHO.length,
)
