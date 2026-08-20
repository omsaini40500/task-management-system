import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean

  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2>Oops, there was an error!</h2>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",

              padding: "0.5rem 1rem",

              background: "#4f46e5",

              color: "white",

              border: "none",

              borderRadius: "0.375rem",

              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
