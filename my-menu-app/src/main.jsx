import React from 'react'
import ReactDOM from 'react-dom/client'
import { flushSync } from 'react-dom'
import App from './App.jsx'
import './index.css'

function isJulyFourthThemeActive(date = new Date()) {
  return date.getMonth() === 6 && date.getDate() === 4
}

function isDrinkFlowDemoRoute() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const params = new URLSearchParams(window.location.search)
  return path === '/demo' || path.startsWith('/demo/') || params.get('demo') === 'training' || window.location.hash === '#demo'
}

const drinkFlowDemo = isDrinkFlowDemoRoute()

if (drinkFlowDemo) {
  document.documentElement.classList.add('drinkflow-demo')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#3157c8')
  document.title = 'DrinkFlow KDS Interactive Sample'
} else if (isJulyFourthThemeActive()) {
  document.documentElement.classList.add('goldies-july-four')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#123c8c')
}

const fallback = document.getElementById('startup-fallback')
const rootElement = document.getElementById('root')
if (fallback) {
  document.documentElement.classList.add('app-loading')
  const titleNode = fallback.querySelector('strong')
  const messageNode = fallback.querySelector('span')
  if (titleNode) titleNode.textContent = drinkFlowDemo ? 'DrinkFlow KDS' : "Goldie's KDS"
  if (messageNode) {
    messageNode.textContent = drinkFlowDemo
      ? 'Loading the interactive DrinkFlow sample.'
      : "Loading the kitchen display. If this screen stays here, refresh once after clearing site data for goldieskds.com."
  }
}

class StartupErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Goldies KDS startup failed', error)
  }

  render() {
    if (this.state.error) {
      const demoMode = isDrinkFlowDemoRoute()
      return (
        <div className="min-h-screen bg-[#EEE0C5] text-[#0F4036] flex items-center justify-center px-4 text-center">
          <div className="max-w-md rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] p-6 shadow-sm">
            <div className="text-2xl font-black">{demoMode ? 'DrinkFlow KDS' : "Goldie's KDS"}</div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5a4f3e]">
              {demoMode
                ? 'The interactive sample had trouble opening. Refresh once and try again.'
                : "The kitchen display had trouble opening. Refresh once. If it stays here, clear site data for goldieskds.com and open it again."}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const root = ReactDOM.createRoot(rootElement)
flushSync(() => {
  root.render(
    <React.StrictMode>
      <StartupErrorBoundary>
        <App />
      </StartupErrorBoundary>
    </React.StrictMode>,
  )
})

if (fallback && rootElement?.hasChildNodes()) {
  document.documentElement.classList.add('app-ready')
  document.documentElement.classList.remove('app-loading')
}
