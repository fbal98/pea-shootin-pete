/**
 * ViewportCuller - Performance optimization component that only renders objects within the viewport
 * 
 * Filters objects by screen bounds and optionally limits the number of rendered objects
 * using distance-based prioritization from a priority center (usually Pete's position).
 */

import React, { useMemo } from 'react';
import { RenderableGameObject } from '@/types/GameTypes';

interface ViewportCullerProps {
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Culling configuration
  cullMargin?: number; // Extra margin around screen bounds (default: 50px)
  
  // Objects to cull
  objects: RenderableGameObject[];
  
  // Render function for visible objects
  renderObject: (object: RenderableGameObject, index: number, isVisible: boolean) => React.ReactElement;
  
  // Performance limits
  maxVisibleObjects?: number; // Maximum objects to render (default: unlimited)
  
  // Priority center for distance-based culling (usually Pete's position)
  priorityCenter?: { x: number; y: number };
  
  // Enable distance-based sorting (default: true when priorityCenter is provided)
  enableDistanceSorting?: boolean;
}

const ViewportCuller: React.FC<ViewportCullerProps> = ({
  screenWidth,
  screenHeight,
  cullMargin = 50,
  objects,
  renderObject,
  maxVisibleObjects,
  priorityCenter,
  enableDistanceSorting = true
}) => {
  
  // Calculate visible bounds with margin
  const visibleBounds = useMemo(() => ({
    left: -cullMargin,
    right: screenWidth + cullMargin,
    top: -cullMargin,
    bottom: screenHeight + cullMargin
  }), [screenWidth, screenHeight, cullMargin]);
  
  // Filter and sort objects for optimal performance
  const visibleObjects = useMemo(() => {
    // Step 1: Filter objects within viewport bounds
    const inBounds = objects.filter(obj => {
      const objRight = obj.x + (obj.width || 0);
      const objBottom = obj.y + (obj.height || 0);
      
      return (
        objRight >= visibleBounds.left &&
        obj.x <= visibleBounds.right &&
        objBottom >= visibleBounds.top &&
        obj.y <= visibleBounds.bottom
      );
    });
    
    // Step 2: Sort by distance from priority center if enabled
    let sortedObjects = inBounds;
    if (enableDistanceSorting && priorityCenter) {
      sortedObjects = [...inBounds].sort((a, b) => {
        const aDistance = Math.sqrt(
          Math.pow(a.x + (a.width || 0) / 2 - priorityCenter.x, 2) +
          Math.pow(a.y + (a.height || 0) / 2 - priorityCenter.y, 2)
        );
        const bDistance = Math.sqrt(
          Math.pow(b.x + (b.width || 0) / 2 - priorityCenter.x, 2) +
          Math.pow(b.y + (b.height || 0) / 2 - priorityCenter.y, 2)
        );
        return aDistance - bDistance; // Closest first
      });
    }
    
    // Step 3: Limit number of visible objects
    if (maxVisibleObjects && sortedObjects.length > maxVisibleObjects) {
      sortedObjects = sortedObjects.slice(0, maxVisibleObjects);
    }
    
    return sortedObjects;
  }, [objects, visibleBounds, enableDistanceSorting, priorityCenter, maxVisibleObjects]);
  
  // Render visible objects
  return (
    <>
      {visibleObjects.map((obj, index) => renderObject(obj, index, true))}
    </>
  );
};

export default ViewportCuller;