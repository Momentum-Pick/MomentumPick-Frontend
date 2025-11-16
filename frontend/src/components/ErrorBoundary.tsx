import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 로그를 콘솔에 찍어서 개발자 도구에서 확인할 수 있게 함
    console.error('React render error caught by ErrorBoundary:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#b91c1c' }}>앱에서 오류가 발생했습니다.</h2>
          <p>개발자 도구(콘솔)를 열어 상세 오류를 확인하세요.</p>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => location.reload()}
              style={{ padding: '8px 12px', borderRadius: 6, background: '#111827', color: '#fff' }}
            >
              새로고침
            </button>
          </div>
          {this.state.error && (
            <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', background: '#111827', color: '#f3f4f6', padding: 12, borderRadius: 6 }}>
              {this.state.error?.stack || String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
