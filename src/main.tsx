import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Saga from './saga/Saga';

// The site currently shows only the Ramayana scroll (src/saga). Nothing was
// removed: to bring back the Twelve-Point Compass render <Compass /> from
// './compass/Compass' with './compass/compass.css'; for the games and effects
// render <App /> from './App' with './styles/global.css'.
const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

createRoot(root).render(
  <StrictMode>
    <Saga />
  </StrictMode>,
);
