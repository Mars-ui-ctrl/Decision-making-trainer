import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrainingProvider } from './context/TrainingContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TrainingProvider>
      <App />
    </TrainingProvider>
  </StrictMode>,
)
