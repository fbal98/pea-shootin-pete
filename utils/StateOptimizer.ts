/**
 * State management optimization utilities for Zustand stores
 * Provides batching, debouncing, and selective update mechanisms
 */

export interface BatchedUpdate {
  storeId: string;
  updates: Record<string, any>;
  timestamp: number;
}

export interface UpdateBatch {
  updates: BatchedUpdate[];
  scheduledAt: number;
  executeAt: number;
}

export class StateOptimizer {
  private static instance: StateOptimizer;
  private pendingBatches = new Map<string, UpdateBatch>();
  private batchTimeout = 16; // ~1 frame at 60fps
  private debounceTimeout = 32; // ~2 frames at 60fps
  private maxBatchSize = 10;
  
  // Store handlers for React Native compatibility
  private updateHandlers = new Map<string, (updates: Record<string, any>) => void>();
  
  // Performance tracking
  private batchesProcessed = 0;
  private updatesDeferred = 0;
  private updatesSuppressed = 0;

  private constructor() {}

  static getInstance(): StateOptimizer {
    if (!StateOptimizer.instance) {
      StateOptimizer.instance = new StateOptimizer();
    }
    return StateOptimizer.instance;
  }

  /**
   * Batch multiple state updates to reduce React re-renders
   */
  batchUpdates<T extends Record<string, any>>(
    storeId: string,
    updates: T,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): void {
    const now = performance.now();
    
    // High priority updates execute immediately
    if (priority === 'high') {
      this.executeUpdates(storeId, updates);
      return;
    }
    
    // Get or create batch for this store
    let batch = this.pendingBatches.get(storeId);
    
    if (!batch) {
      const delay = priority === 'low' ? this.debounceTimeout * 2 : this.batchTimeout;
      batch = {
        updates: [],
        scheduledAt: now,
        executeAt: now + delay
      };
      this.pendingBatches.set(storeId, batch);
      
      // Schedule execution
      setTimeout(() => this.processBatch(storeId), delay);
    }
    
    // Add updates to batch
    batch.updates.push({
      storeId,
      updates,
      timestamp: now
    });
    
    this.updatesDeferred++;
    
    // If batch is getting too large, process immediately
    if (batch.updates.length >= this.maxBatchSize) {
      this.processBatch(storeId);
    }
  }

  /**
   * Debounce rapid state updates to prevent excessive re-renders
   */
  debounceUpdate<T extends Record<string, any>>(
    storeId: string,
    key: string,
    value: T[keyof T],
    delay: number = this.debounceTimeout
  ): void {
    const debounceKey = `${storeId}_${key}`;
    
    // Clear existing timeout
    if ((this as any)[`timeout_${debounceKey}`]) {
      clearTimeout((this as any)[`timeout_${debounceKey}`]);
      this.updatesSuppressed++;
    }
    
    // Set new timeout
    (this as any)[`timeout_${debounceKey}`] = setTimeout(() => {
      this.executeUpdates(storeId, { [key]: value } as T);
      delete (this as any)[`timeout_${debounceKey}`];
    }, delay);
  }

  /**
   * Create a throttled update function for high-frequency updates
   */
  createThrottledUpdate<T extends Record<string, any>>(
    storeId: string,
    updateFn: (updates: T) => void,
    interval: number = 16 // ~60fps
  ): (updates: T) => void {
    let lastUpdate = 0;
    let pendingUpdates: T | null = null;
    let timeoutId: any = null;
    
    return (updates: T) => {
      const now = performance.now();
      
      // Merge with pending updates
      if (pendingUpdates) {
        pendingUpdates = { ...pendingUpdates, ...updates };
      } else {
        pendingUpdates = updates;
      }
      
      // If enough time has passed, update immediately
      if (now - lastUpdate >= interval) {
        updateFn(pendingUpdates);
        lastUpdate = now;
        pendingUpdates = null;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      } else if (!timeoutId) {
        // Schedule next update
        const delay = interval - (now - lastUpdate);
        timeoutId = setTimeout(() => {
          if (pendingUpdates) {
            updateFn(pendingUpdates);
            lastUpdate = performance.now();
            pendingUpdates = null;
          }
          timeoutId = null;
        }, delay);
      }
    };
  }

  /**
   * Create a selective update function that only updates when values actually change
   */
  createSelectiveUpdate<T extends Record<string, any>>(
    updateFn: (updates: Partial<T>) => void,
    compareFn?: (a: any, b: any) => boolean
  ): (updates: Partial<T>) => void {
    let lastValues: Partial<T> = {};
    const defaultCompare = (a: any, b: any) => a !== b;
    const compare = compareFn || defaultCompare;
    
    return (updates: Partial<T>) => {
      const changedUpdates: Partial<T> = {};
      let hasChanges = false;
      
      for (const [key, value] of Object.entries(updates)) {
        const lastValue = lastValues[key as keyof T];
        
        if (compare(value, lastValue)) {
          changedUpdates[key as keyof T] = value;
          lastValues[key as keyof T] = value;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        updateFn(changedUpdates);
      } else {
        this.updatesSuppressed++;
      }
    };
  }

  /**
   * Process a batch of updates for a specific store
   */
  private processBatch(storeId: string): void {
    const batch = this.pendingBatches.get(storeId);
    if (!batch || batch.updates.length === 0) {
      return;
    }
    
    // Merge all updates in the batch
    const mergedUpdates: Record<string, any> = {};
    for (const update of batch.updates) {
      Object.assign(mergedUpdates, update.updates);
    }
    
    // Execute the merged updates
    this.executeUpdates(storeId, mergedUpdates);
    
    // Clean up
    this.pendingBatches.delete(storeId);
    this.batchesProcessed++;
  }

  /**
   * Execute updates immediately using registered handlers
   */
  private executeUpdates(storeId: string, updates: Record<string, any>): void {
    const handler = this.updateHandlers.get(storeId);
    if (handler) {
      handler(updates);
    }
  }

  /**
   * Register an update handler for a specific store
   */
  registerUpdateHandler(storeId: string, handler: (updates: Record<string, any>) => void): void {
    this.updateHandlers.set(storeId, handler);
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    batchesProcessed: number;
    updatesDeferred: number;
    updatesSuppressed: number;
    activeBatches: number;
    optimizationRatio: number;
  } {
    const totalUpdates = this.batchesProcessed + this.updatesDeferred + this.updatesSuppressed;
    const optimizationRatio = totalUpdates > 0 
      ? ((this.updatesDeferred + this.updatesSuppressed) / totalUpdates) * 100
      : 0;
      
    return {
      batchesProcessed: this.batchesProcessed,
      updatesDeferred: this.updatesDeferred,
      updatesSuppressed: this.updatesSuppressed,
      activeBatches: this.pendingBatches.size,
      optimizationRatio
    };
  }

  /**
   * Reset optimization statistics
   */
  resetStats(): void {
    this.batchesProcessed = 0;
    this.updatesDeferred = 0;
    this.updatesSuppressed = 0;
  }

  /**
   * Clear all pending batches and timeouts
   */
  clear(): void {
    // Clear all pending batches
    for (const [storeId] of this.pendingBatches) {
      this.pendingBatches.delete(storeId);
    }
    
    // Clear update handlers
    this.updateHandlers.clear();
    
    // Clear all debounce timeouts
    for (const prop in this) {
      if (prop.startsWith('timeout_')) {
        clearTimeout((this as any)[prop]);
        delete (this as any)[prop];
      }
    }
    
    this.resetStats();
  }
}

// Singleton instance for global access
export const stateOptimizer = StateOptimizer.getInstance();

/**
 * React hook for optimized state updates
 */
export function useOptimizedUpdates<T extends Record<string, any>>(
  storeId: string,
  updateFn: (updates: Partial<T>) => void,
  options: {
    batching?: boolean;
    debouncing?: boolean;
    throttling?: boolean;
    selective?: boolean;
    batchDelay?: number;
    debounceDelay?: number;
    throttleInterval?: number;
  } = {}
): (updates: T) => void {
  const {
    batching = true,
    debouncing = false,
    throttling = false,
    selective = true,
    batchDelay = 16,
    debounceDelay = 32,
    throttleInterval = 16
  } = options;

  // Create optimized update function
  let optimizedUpdate: (updates: Partial<T>) => void = updateFn;

  // Apply selective updates
  if (selective) {
    optimizedUpdate = stateOptimizer.createSelectiveUpdate(optimizedUpdate);
  }

  // Apply throttling
  if (throttling) {
    optimizedUpdate = stateOptimizer.createThrottledUpdate(storeId, optimizedUpdate as any, throttleInterval);
  }

  // Return the final optimized update function
  return (updates: Partial<T>) => {
    if (batching) {
      stateOptimizer.batchUpdates(storeId, updates);
    } else if (debouncing) {
      // For debouncing, we need to handle each key separately
      for (const [key, value] of Object.entries(updates)) {
        stateOptimizer.debounceUpdate(storeId, key, value, debounceDelay);
      }
    } else {
      optimizedUpdate(updates);
    }
  };
}