import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('no #root — the desk has nowhere to stand');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
