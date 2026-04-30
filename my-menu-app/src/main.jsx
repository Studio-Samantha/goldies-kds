import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const fallback = document.getElementById('startup-fallback')
if (fallback) {
  document.documentElement.classList.add('app-loading')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (fallback) {
  document.documentElement.classList.add('app-ready')
  document.documentElement.classList.remove('app-loading')
}
