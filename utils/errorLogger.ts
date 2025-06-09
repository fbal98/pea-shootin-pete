/**
 * Enhanced error logging utility for game errors
 */

interface ErrorContext {
  component?: string;
  action?: string;
  gameState?: any;
  timestamp?: number;
  userAgent?: string;
  errorInfo?: string;
}

export class ErrorLogger {
  private static logs: Array<{ error: Error; context: ErrorContext }> = [];
  private static maxLogs = 100;

  /**
   * Log an error with context information
   */
  static logError(error: Error, context: ErrorContext = {}): void {
    const enrichedContext: ErrorContext = {
      ...context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // Add to internal log store
    this.logs.unshift({ error, context: enrichedContext });

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging with enriched information
    console.error('Game Error:', {
      message: error.message,
      stack: error.stack,
      context: enrichedContext,
    });

    // In production, you might want to send to crash reporting service
    // Example: Sentry.captureException(error, { extra: enrichedContext });
  }

  /**
   * Log haptic feedback errors specifically
   */
  static logHapticError(error: Error, hapticType: string): void {
    this.logError(error, {
      component: 'HapticFeedback',
      action: `haptic_${hapticType}`,
    });
  }

  /**
   * Log animation errors
   */
  static logAnimationError(error: Error, component: string, animationType: string): void {
    this.logError(error, {
      component,
      action: `animation_${animationType}`,
    });
  }

  /**
   * Log game logic errors
   */
  static logGameLogicError(error: Error, action: string, gameState?: any): void {
    this.logError(error, {
      component: 'GameLogic',
      action,
      gameState: gameState ? this.sanitizeGameState(gameState) : undefined,
    });
  }

  /**
   * Get recent error logs for debugging
   */
  static getRecentLogs(count: number = 10): Array<{ error: Error; context: ErrorContext }> {
    return this.logs.slice(0, count);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Create a safe version of game state for logging (remove sensitive data)
   */
  private static sanitizeGameState(gameState: any): any {
    try {
      return {
        score: gameState.score,
        level: gameState.level,
        gameOver: gameState.gameOver,
        isPlaying: gameState.isPlaying,
        enemyCount: gameState.enemies?.length,
        projectileCount: gameState.projectiles?.length,
        petePosition: gameState.pete ? { x: gameState.pete.x, y: gameState.pete.y } : null,
      };
    } catch (sanitizeError) {
      return { error: 'Failed to sanitize game state' };
    }
  }
}

/**
 * Helper function for safe haptic feedback with error logging
 */
export const safeHapticFeedback = async (
  hapticFunction: () => Promise<void>,
  hapticType: string = 'unknown'
): Promise<void> => {
  try {
    await hapticFunction();
  } catch (error) {
    ErrorLogger.logHapticError(
      error instanceof Error ? error : new Error(String(error)),
      hapticType
    );
  }
};

/**
 * Helper function for safe animation execution
 */
export const safeAnimation = (
  animationFunction: () => void,
  component: string,
  animationType: string
): void => {
  try {
    animationFunction();
  } catch (error) {
    ErrorLogger.logAnimationError(
      error instanceof Error ? error : new Error(String(error)),
      component,
      animationType
    );
  }
};
