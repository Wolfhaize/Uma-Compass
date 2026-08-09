import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { DraftProvider } from './context/DraftContext.jsx'
import { TournamentProvider } from './context/TournamentContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DraftProvider>
        <TournamentProvider>
          <App />
        </TournamentProvider>
      </DraftProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
