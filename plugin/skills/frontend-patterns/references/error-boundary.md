# Error Boundary Pattern

React Error Boundaries catch rendering errors in the component subtree, preventing a broken subtree
from crashing the entire application. They must be class components (no Hook equivalent exists yet).

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to an error reporting service (e.g., Sentry)
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Guidelines

- Place boundaries at natural UI boundaries (route segments, widgets) — not at every leaf component.
- Always log errors in `componentDidCatch` to an observability tool (Sentry, Datadog, etc.).
- Provide a "Try again" reset button so users are not permanently stuck.
- For Next.js App Router, use the `error.tsx` file convention instead of manual class boundaries
  (Next.js wraps it automatically).
- Consider **react-error-boundary** (`npm install react-error-boundary`) for a hook-friendly wrapper
  that avoids writing class components manually.
