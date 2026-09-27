import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (!sessionStorage.getItem('hasSeenIntro') && window.location.pathname === '/') {
  sessionStorage.setItem('hasSeenIntro', 'true');
  window.location.href = '/intro.html';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
