import { Component, type ReactNode } from 'react';

interface Props { onError?: (error: Error) => void; fallback: (error: Error, reset: () => void) => ReactNode; children: ReactNode; resetKey?: unknown }
interface State { error: Error | null }

/** Fängt Renderfehler eines einzelnen Moduls ab, Nachbarmodule laufen weiter. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { this.props.onError?.(error); }
  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }
  reset = () => this.setState({ error: null });
  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children;
  }
}
