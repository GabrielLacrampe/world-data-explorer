import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0a0e1a] gap-4">
          <p className="text-red-400 text-sm">Something went wrong. Please reload the page.</p>
          <p className="text-[#374151] text-xs font-mono">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[#3b82f6] text-sm hover:underline"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
