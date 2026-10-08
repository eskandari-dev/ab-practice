import { Component } from 'react'
import { LangContext } from '../lang-context.js'

class ErrorBoundary extends Component {
  static contextType = LangContext

  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    const t = this.context.t.crash
    return (
      <div className="page">
        <div className="exam-card exam-start not-found">
          <span className="not-found-code">:(</span>
          <h1>{t.title}</h1>
          <p className="muted">{t.text}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>{t.reload}</button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
