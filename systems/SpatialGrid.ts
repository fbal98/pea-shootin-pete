/**
 * High-performance spatial partitioning system for collision detection optimization
 * Reduces collision checks from O(n×m) to O(n×k) where k is average objects per cell
 */

export interface SpatialObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridCell {
  objects: SpatialObject[];
  lastUpdated: number;
}

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, GridCell>;
  private gridWidth: number;
  private gridHeight: number;
  private screenWidth: number;
  private screenHeight: number;
  
  // Performance tracking
  private totalQueries = 0;
  private totalObjectsChecked = 0;
  private lastPerformanceReset = 0;

  constructor(screenWidth: number, screenHeight: number, cellSize: number = 100) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(screenWidth / cellSize);
    this.gridHeight = Math.ceil(screenHeight / cellSize);
    this.grid = new Map();
    this.lastPerformanceReset = Date.now();
  }

  /**
   * Get cell key for given coordinates
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Get all cell keys that an object spans across
   */
  private getObjectCellKeys(obj: SpatialObject): string[] {
    const minX = Math.floor(obj.x / this.cellSize);
    const maxX = Math.floor((obj.x + obj.width) / this.cellSize);
    const minY = Math.floor(obj.y / this.cellSize);
    const maxY = Math.floor((obj.y + obj.height) / this.cellSize);
    
    const keys: string[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  /**
   * Clear all objects from the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Insert object into appropriate grid cells
   */
  insertObject(obj: SpatialObject): void {
    const cellKeys = this.getObjectCellKeys(obj);
    const timestamp = Date.now();
    
    for (const key of cellKeys) {
      if (!this.grid.has(key)) {
        this.grid.set(key, {
          objects: [],
          lastUpdated: timestamp
        });
      }
      
      const cell = this.grid.get(key)!;
      cell.objects.push(obj);
      cell.lastUpdated = timestamp;
    }
  }

  /**
   * Get nearby objects for collision detection
   * Returns objects in the same and adjacent cells
   */
  getNearbyObjects(obj: SpatialObject): SpatialObject[] {
    this.totalQueries++;
    
    const cellKeys = this.getObjectCellKeys(obj);
    const nearbyObjects: SpatialObject[] = [];
    const seenIds = new Set<string>();
    
    for (const key of cellKeys) {
      const cell = this.grid.get(key);
      if (!cell) continue;
      
      for (const nearbyObj of cell.objects) {
        if (nearbyObj.id !== obj.id && !seenIds.has(nearbyObj.id)) {
          nearbyObjects.push(nearbyObj);
          seenIds.add(nearbyObj.id);
          this.totalObjectsChecked++;
        }
      }
    }
    
    return nearbyObjects;
  }

  /**
   * Get objects in a specific rectangular area
   */
  getObjectsInArea(x: number, y: number, width: number, height: number): SpatialObject[] {
    const minCellX = Math.floor(x / this.cellSize);
    const maxCellX = Math.floor((x + width) / this.cellSize);
    const minCellY = Math.floor(y / this.cellSize);
    const maxCellY = Math.floor((y + height) / this.cellSize);
    
    const objects: SpatialObject[] = [];
    const seenIds = new Set<string>();
    
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (!cell) continue;
        
        for (const obj of cell.objects) {
          if (!seenIds.has(obj.id)) {
            // Check if object actually intersects with the area
            if (obj.x < x + width && obj.x + obj.width > x &&
                obj.y < y + height && obj.y + obj.height > y) {
              objects.push(obj);
              seenIds.add(obj.id);
            }
          }
        }
      }
    }
    
    return objects;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageObjectsPerQuery: number;
    gridUtilization: number;
    activeCells: number;
    totalCells: number;
    queriesPerSecond: number;
  } {
    const now = Date.now();
    const timeDiff = (now - this.lastPerformanceReset) / 1000;
    const queriesPerSecond = timeDiff > 0 ? this.totalQueries / timeDiff : 0;
    
    return {
      totalQueries: this.totalQueries,
      averageObjectsPerQuery: this.totalQueries > 0 ? this.totalObjectsChecked / this.totalQueries : 0,
      gridUtilization: this.grid.size / (this.gridWidth * this.gridHeight),
      activeCells: this.grid.size,
      totalCells: this.gridWidth * this.gridHeight,
      queriesPerSecond
    };
  }

  /**
   * Reset performance counters
   */
  resetPerformanceStats(): void {
    this.totalQueries = 0;
    this.totalObjectsChecked = 0;
    this.lastPerformanceReset = Date.now();
  }

  /**
   * Debug: Visualize grid structure
   */
  getGridVisualization(): { key: string; objectCount: number; bounds: { x: number; y: number; width: number; height: number } }[] {
    const visualization: { key: string; objectCount: number; bounds: { x: number; y: number; width: number; height: number } }[] = [];
    
    for (const [key, cell] of this.grid) {
      const [cellX, cellY] = key.split(',').map(Number);
      visualization.push({
        key,
        objectCount: cell.objects.length,
        bounds: {
          x: cellX * this.cellSize,
          y: cellY * this.cellSize,
          width: this.cellSize,
          height: this.cellSize
        }
      });
    }
    
    return visualization;
  }
}

// Singleton instance for global access
let spatialGridInstance: SpatialGrid | null = null;

export const getSpatialGrid = (screenWidth?: number, screenHeight?: number): SpatialGrid => {
  if (!spatialGridInstance && screenWidth && screenHeight) {
    spatialGridInstance = new SpatialGrid(screenWidth, screenHeight);
  }
  if (!spatialGridInstance) {
    throw new Error('SpatialGrid must be initialized with screen dimensions');
  }
  return spatialGridInstance;
};

export const resetSpatialGrid = (): void => {
  spatialGridInstance = null;
};