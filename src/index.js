import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/scrollbar.css';
import App from './App';
import { IdiomaProvider } from './shared/i18n/Idioma';
import { SistemaTabletProvider } from './features/tablet';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    {/* idioma do site (pt-BR / en): qualquer componente usa com useIdioma() */}
    <IdiomaProvider>
      {/* sistema do tablet (ligado/bloqueado, tela aberta, apps, wallpaper): o modal e o tablet da mesa leem daqui */}
      <SistemaTabletProvider>
        <App />
      </SistemaTabletProvider>
    </IdiomaProvider>
  </React.StrictMode>
);
