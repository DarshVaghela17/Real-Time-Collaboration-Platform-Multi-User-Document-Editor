import React, { ReactNode, ErrorInfo } from 'react';
import { Box, Alert, Button, Typography, Container } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 * Prevents entire app from crashing due to component errors
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Container maxWidth="sm">
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                Error details have been logged to the console.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={this.handleReset}
                  size="small"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => (window.location.href = '/')}
                  size="small"
                >
                  Go to Home
                </Button>
              </Box>
            </Alert>
            <Box
              sx={{
                backgroundColor: 'white',
                p: 2,
                borderRadius: 1,
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.stack}
            </Box>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
