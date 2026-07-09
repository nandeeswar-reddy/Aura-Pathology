import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'));
window.__REACT_HERO_ROOT__ = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
