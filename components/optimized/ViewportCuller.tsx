/**
 * Viewport culling utility for optimizing rendering performance
 * Only renders children that are within the visible viewport
 */

import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CullableObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewportCullerProps {
  screenWidth: number;
  screenHeight: number;
  cullMargin?: number;
  objects: CullableObject[];
  renderObject: (object: CullableObject, index: number, isVisible: boolean) => React.ReactNode;
  maxVisibleObjects?: number;
  priorityCenter?: { x: number; y: number }; // Prioritize objects near this point
}

const ViewportCullerComponent: React.FC<ViewportCullerProps> = ({
  screenWidth,
  screenHeight,
  cullMargin = 50,
  objects,
  renderObject,
  maxVisibleObjects = Infinity,
  priorityCenter
}) => {
  // Calculate viewport bounds with margin
  const viewportBounds: ViewportBounds = useMemo(() => ({
    left: -cullMargin,
    top: -cullMargin,
    right: screenWidth + cullMargin,
    bottom: screenHeight + cullMargin
  }), [screenWidth, screenHeight, cullMargin]);

  // Check if object is within viewport
  const isInViewport = (obj: CullableObject): boolean => {
    return (
      obj.x + obj.width >= viewportBounds.left &&
      obj.x <= viewportBounds.right &&
      obj.y + obj.height >= viewportBounds.top &&
      obj.y <= viewportBounds.bottom
    );
  };

  // Calculate distance from priority center (for LOD)
  const getDistanceFromCenter = (obj: CullableObject): number => {
    if (!priorityCenter) return 0;
    
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;
    
    return Math.sqrt(
      Math.pow(objCenterX - priorityCenter.x, 2) +
      Math.pow(objCenterY - priorityCenter.y, 2)
    );
  };

  // Process objects for culling and prioritization
  const processedObjects = useMemo(() => {
    // First pass: determine visibility
    const visibleObjects = objects.filter(isInViewport);
    const invisibleObjects = objects.filter(obj => !isInViewport(obj));
    
    // If we have too many visible objects, prioritize by distance
    let finalVisibleObjects = visibleObjects;
    if (visibleObjects.length > maxVisibleObjects && priorityCenter) {
      finalVisibleObjects = visibleObjects
        .map(obj => ({
          ...obj,
          distance: getDistanceFromCenter(obj)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxVisibleObjects);
    } else if (visibleObjects.length > maxVisibleObjects) {
      // No priority center, just take first N objects
      finalVisibleObjects = visibleObjects.slice(0, maxVisibleObjects);
    }
    
    return {
      visible: finalVisibleObjects,
      invisible: invisibleObjects,
      totalCulled: objects.length - finalVisibleObjects.length
    };
  }, [objects, viewportBounds, maxVisibleObjects, priorityCenter]);

  // Render visible objects
  const visibleElements = processedObjects.visible.map((obj, index) => {
    const distance = priorityCenter ? getDistanceFromCenter(obj) : 0;
    return (
      <React.Fragment key={obj.id}>
        {renderObject(obj, index, true)}
      </React.Fragment>
    );
  });

  // In development, show culling statistics
  if (__DEV__ && processedObjects.totalCulled > 0) {
    console.log(`Viewport culler: ${processedObjects.totalCulled}/${objects.length} objects culled`);
  }

  return <>{visibleElements}</>;
};

// Memoize the viewport culler to prevent unnecessary recalculations
const ViewportCuller = memo(ViewportCullerComponent, (prevProps, nextProps) => {
  // Only re-render if screen dimensions, objects array, or cull margin changes
  return (
    prevProps.screenWidth === nextProps.screenWidth &&
    prevProps.screenHeight === nextProps.screenHeight &&
    prevProps.cullMargin === nextProps.cullMargin &&
    prevProps.objects === nextProps.objects && // Reference equality check
    prevProps.maxVisibleObjects === nextProps.maxVisibleObjects &&
    prevProps.priorityCenter === nextProps.priorityCenter
  );
});

ViewportCuller.displayName = 'ViewportCuller';

export default ViewportCuller;

/**
 * Hook for calculating object visibility and distance
 */
export const useViewportCulling = (
  screenWidth: number,
  screenHeight: number,
  cullMargin: number = 50
) => {
  const viewportBounds = useMemo(() => ({
    left: -cullMargin,
    top: -cullMargin,
    right: screenWidth + cullMargin,
    bottom: screenHeight + cullMargin
  }), [screenWidth, screenHeight, cullMargin]);

  const isObjectVisible = useMemo(() => (obj: CullableObject): boolean => {
    return (
      obj.x + obj.width >= viewportBounds.left &&
      obj.x <= viewportBounds.right &&
      obj.y + obj.height >= viewportBounds.top &&
      obj.y <= viewportBounds.bottom
    );
  }, [viewportBounds]);

  const getObjectDistance = useMemo(() => (
    obj: CullableObject, 
    center: { x: number; y: number }
  ): number => {
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;
    
    return Math.sqrt(
      Math.pow(objCenterX - center.x, 2) +
      Math.pow(objCenterY - center.y, 2)
    );
  }, []);

  return {
    viewportBounds,
    isObjectVisible,
    getObjectDistance
  };
};