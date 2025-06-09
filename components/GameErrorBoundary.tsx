import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ErrorLogger } from '@/utils/errorLogger';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class GameErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    ErrorLogger.logError(error, {
      component: 'GameErrorBoundary',
      action: 'component_error',
      errorInfo: errorInfo.componentStack || undefined,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });

      // Call the onRetry callback if provided
      this.props.onRetry?.();
    }
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback component is provided, use it
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>The game encountered an unexpected error</Text>

            {__DEV__ && (
              <>
                <Text style={styles.errorText}>{this.state.error?.message}</Text>
                <Text style={styles.stackText}>{this.state.error?.stack}</Text>
              </>
            )}

            <View style={styles.buttonContainer}>
              {this.state.retryCount < this.maxRetries && (
                <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                  <Text style={styles.retryButtonText}>
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Text>
                </TouchableOpacity>
              )}

              {this.state.retryCount >= this.maxRetries && (
                <Text style={styles.maxRetriesText}>
                  Maximum retries reached. Please restart the app.
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 30,
    maxWidth: '90%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff9999',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: '#cccccc',
    marginBottom: 20,
    textAlign: 'left',
    fontFamily: 'monospace',
    maxHeight: 100,
    overflow: 'hidden',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  maxRetriesText: {
    color: '#ff9999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
