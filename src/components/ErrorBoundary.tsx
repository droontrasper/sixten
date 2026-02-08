/**
 * Error Boundary som fångar rendering-fel och visar ett vänligt meddelande.
 * Förhindrar att hela appen kraschar vid oväntade fel.
 */
import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-200 max-w-md text-center">
            <p className="text-4xl mb-4">😵</p>
            <h1 className="text-xl font-semibold text-stone-800 mb-2">
              Något gick fel
            </h1>
            <p className="text-stone-600 mb-6">
              Ett oväntat fel inträffade. Ladda om sidan för att försöka igen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 transition-colors"
            >
              Ladda om
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
