import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.log('ERROR BOUNDARY CAUGHT ERROR:', error);
    Alert.alert('Game Error', `Caught error: ${error.message}`);
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('ERROR BOUNDARY - componentDidCatch:', error, errorInfo);
    Alert.alert(
      'Game Crashed',
      `Error: ${error.message}\nStack: ${error.stack}\nComponent Stack: ${errorInfo.componentStack}`
    );
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Game Crashed!</Text>
          <Text style={styles.errorText}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <Text style={styles.stackText}>
            {this.state.error && this.state.error.stack}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>Reload Game</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#ff0000',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  stackText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 30,
    textAlign: 'left',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});