import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Compass from './compass/Compass';
import './compass/compass.css';

// The site is the Twelve-Point Compass for now. The games and effects that used
// to live on the shelf are still in the repository (src/App.tsx and its imports)
// and can be brought back by rendering <App /> here again.
const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

createRoot(root).render(
  <StrictMode>
    <Compass />
  </StrictMode>,
);
