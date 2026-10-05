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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals


