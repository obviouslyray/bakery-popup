// #app shell - entry point, this is where react starts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { initAppUpdates } from './lib/appUpdate.js'
import { initInstallPrompt } from './lib/install.js'
import './styles/global.css'

initInstallPrompt() // #install page - start listening for android's install popup early
initAppUpdates() // #app updates - reload when a new version gets deployed

// HashRouter so urls look like /#/menu (github pages can't do normal routes)
// AuthProvider wraps everything so any screen can check if an owner is logged in
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
