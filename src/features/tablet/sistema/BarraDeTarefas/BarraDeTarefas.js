import './BarraDeTarefas.css'
import BotaoBarraDeTarefas from '../BotaoBarraDeTarefas/BotaoBarraDeTarefas'
import Relogio from '../Relogio/Relogio'
import { APPS } from '../../apps.config'

// Barra de tarefas do sistema: à esquerda iniciar, voltar e apps abertos; à direita a bandeja (ícones de status,
// idioma, relógio e notificações). A bandeja vai para a direita sozinha (margin-left: auto), sem medida fixa.
// appsAbertos: ids do apps.config.js, na ordem em que foram abertos
const BarraDeTarefas = ({ appsAbertos, aoClicarNoApp, aoVoltarParaAreaDeTrabalho }) => (
    <div className='barra-de-tarefas'>
        <BotaoBarraDeTarefas icone='/imagens/windows/menuIniciar.png' alt='Menu iniciar' tamanhoIcone={18} />
        <BotaoBarraDeTarefas
            icone='/imagens/windows/setaVoltar.png'
            alt='Voltar para a área de trabalho'
            tamanhoIcone={20}
            largura={45}
            aoClicar={aoVoltarParaAreaDeTrabalho}
        />

        <div className='barra-de-tarefas-apps-abertos'>
            {appsAbertos.map(idDoApp => (
                <BotaoBarraDeTarefas
                    key={idDoApp}
                    icone={APPS[idDoApp].icone}
                    alt={`Abrir ${APPS[idDoApp].nome}`}
                    tamanhoIcone={APPS[idDoApp].tamanhoIconeBarra}
                    aoClicar={() => aoClicarNoApp(idDoApp)}
                />
            ))}
        </div>

        <div className='barra-de-tarefas-bandeja'>
            <BotaoBarraDeTarefas icone='/imagens/windows/bateriaIcone.png' alt='Bateria carregando' tamanhoIcone={12} largura={24} />
            <BotaoBarraDeTarefas icone='/imagens/windows/wifiIcone.png' alt='Wi-Fi' tamanhoIcone={15} largura={20} />
            <BotaoBarraDeTarefas icone='/imagens/windows/semSomIcone.png' alt='Sem som' tamanhoIcone={26} largura={26} />
            <BotaoBarraDeTarefas largura={35}>
                <span>POR</span>
                <span>PTB2</span>
            </BotaoBarraDeTarefas>
            <BotaoBarraDeTarefas largura={86}>
                <Relogio />
            </BotaoBarraDeTarefas>
            <BotaoBarraDeTarefas
                className='botao-notificacoes'
                icone='/imagens/windows/iconeNotificacoes.png'
                alt='Notificações'
                tamanhoIcone={20}
                largura={34}
            />
        </div>
    </div>
)

export default BarraDeTarefas
