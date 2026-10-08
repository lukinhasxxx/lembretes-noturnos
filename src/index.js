import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/scrollbar.css';
import App from './App';
import { IdiomaProvider } from './shared/i18n/Idioma';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    {/* idioma do site (pt-BR / en): qualquer componente usa com useIdioma() */}
    <IdiomaProvider>
      <App />
    </IdiomaProvider>
  </React.StrictMode>
);
