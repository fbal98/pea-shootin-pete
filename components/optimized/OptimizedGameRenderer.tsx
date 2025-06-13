/**
 * Optimized game renderer with dynamic quality adjustment and viewport culling
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import OptimizedPete from './OptimizedPete';
import OptimizedEnemy from './OptimizedEnemy';
import OptimizedProjectile from './OptimizedProjectile';
import ViewportCuller from './ViewportCuller';

interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  sizeLevel?: number;
}

interface OptimizedGameRendererProps {
  // Game objects
  pete: { x: number; y: number; color: string };
  enemies: GameObject[];
  projectiles: GameObject[];
  mysteryBalloons: GameObject[];
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Colors and theme
  enemyColor: string;
  projectileColor: string;
  mysteryBalloonColor: string;
  
  // Performance settings
  enableViewportCulling?: boolean;
  enableDynamicQuality?: boolean;
  maxVisibleEnemies?: number;
  maxVisibleProjectiles?: number;
  
  // Game state for prioritization
  isPlaying?: boolean;
  isPaused?: boolean;
}

const OptimizedGameRendererComponent: React.FC<OptimizedGameRendererProps> = ({
  pete,
  enemies,
  projectiles,
  mysteryBalloons,
  screenWidth,
  screenHeight,
  enemyColor,
  projectileColor,
  mysteryBalloonColor,
  enableViewportCulling = true,
  enableDynamicQuality = true,
  maxVisibleEnemies = 50,
  maxVisibleProjectiles = 30,
  isPlaying = true,
  isPaused = false
}) => {
  // Get current performance metrics for dynamic quality adjustment
  const performanceMonitor = PerformanceMonitor.getInstance();
  const performanceMetrics = performanceMonitor.getMetrics();
  
  // Calculate dynamic quality based on performance
  const renderQuality = useMemo((): 'high' | 'medium' | 'low' => {
    if (!enableDynamicQuality) return 'high';
    
    const fps = performanceMetrics.fps;
    const memoryPressure = performanceMetrics.memoryPressure || 'low';
    
    // Adjust quality based on performance
    if (fps < 30 || memoryPressure === 'high') {
      return 'low';
    } else if (fps < 45 || memoryPressure === 'medium') {
      return 'medium';
    } else {
      return 'high';
    }
  }, [enableDynamicQuality, performanceMetrics.fps, performanceMetrics.memoryPressure]);
  
  // Priority center for LOD (Level of Detail) - usually Pete's position
  const priorityCenter = useMemo(() => ({
    x: pete.x + 15, // Assuming Pete size is ~30px
    y: pete.y + 15
  }), [pete.x, pete.y]);
  
  // Render Pete (always visible, highest priority)
  const renderPete = useCallback(() => (
    <OptimizedPete
      x={pete.x}
      y={pete.y}
      color={pete.color}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      isVisible={true}
      quality={renderQuality}
    />
  ), [pete, screenWidth, screenHeight, renderQuality]);
  
  // Render individual enemy
  const renderEnemy = useCallback((enemy: GameObject, index: number, isVisible: boolean) => {
    // Calculate distance for LOD
    const distance = Math.sqrt(
      Math.pow(enemy.x - priorityCenter.x, 2) + 
      Math.pow(enemy.y - priorityCenter.y, 2)
    );
    
    return (
      <OptimizedEnemy
        key={enemy.id}
        id={enemy.id}
        x={enemy.x}
        y={enemy.y}
        width={enemy.width}
        height={enemy.height}
        color={enemyColor}
        type={enemy.type as any || 'basic'}
        sizeLevel={enemy.sizeLevel || 1}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        isVisible={isVisible}
        quality={renderQuality}
        distanceFromCenter={distance}
      />
    );
  }, [enemyColor, screenWidth, screenHeight, renderQuality, priorityCenter]);
  
  // Render individual projectile
  const renderProjectile = useCallback((projectile: GameObject, index: number, isVisible: boolean) => (
    <OptimizedProjectile
      key={projectile.id}
      id={projectile.id}
      x={projectile.x}
      y={projectile.y}
      color={projectileColor}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      isVisible={isVisible}
      quality={renderQuality}
    />
  ), [projectileColor, screenWidth, screenHeight, renderQuality]);
  
  // Render individual mystery balloon
  const renderMysteryBalloon = useCallback((balloon: GameObject, index: number, isVisible: boolean) => (
    <OptimizedEnemy
      key={balloon.id}
      id={balloon.id}
      x={balloon.x}
      y={balloon.y}
      width={balloon.width}
      height={balloon.height}
      color={mysteryBalloonColor}
      type="basic"
      sizeLevel={1}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      isVisible={isVisible}
      quality={renderQuality}
      distanceFromCenter={0} // Mystery balloons are always high priority
    />
  ), [mysteryBalloonColor, screenWidth, screenHeight, renderQuality]);
  
  // Don't render anything if game is paused and quality is low (performance mode)
  if (isPaused && renderQuality === 'low') {
    return (
      <View style={{ 
        position: 'absolute', 
        width: screenWidth, 
        height: screenHeight,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {renderPete()}
      </View>
    );
  }
  
  return (
    <View style={{ 
      position: 'absolute', 
      width: screenWidth, 
      height: screenHeight 
    }}>
      {/* Pete - always rendered */}
      {renderPete()}
      
      {/* Enemies with viewport culling */}
      {enableViewportCulling ? (
        <ViewportCuller
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          cullMargin={50}
          objects={enemies}
          renderObject={renderEnemy}
          maxVisibleObjects={maxVisibleEnemies}
          priorityCenter={priorityCenter}
        />
      ) : (
        enemies.map((enemy, index) => renderEnemy(enemy, index, true))
      )}
      
      {/* Projectiles with viewport culling */}
      {enableViewportCulling ? (
        <ViewportCuller
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          cullMargin={20} // Smaller margin for fast-moving projectiles
          objects={projectiles}
          renderObject={renderProjectile}
          maxVisibleObjects={maxVisibleProjectiles}
          priorityCenter={priorityCenter}
        />
      ) : (
        projectiles.map((projectile, index) => renderProjectile(projectile, index, true))
      )}
      
      {/* Mystery balloons - always rendered (high priority) */}
      {mysteryBalloons.map((balloon, index) => renderMysteryBalloon(balloon, index, true))}
      
      {/* Performance indicator in development */}
      {__DEV__ && (
        <View style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: 5,
          borderRadius: 5,
        }}>
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: 
              renderQuality === 'high' ? '#00ff00' :
              renderQuality === 'medium' ? '#ffff00' : '#ff0000'
          }} />
        </View>
      )}
    </View>
  );
};

// Memoize the entire renderer to prevent unnecessary re-renders
const OptimizedGameRenderer = memo(OptimizedGameRendererComponent, (prevProps, nextProps) => {
  // Check if any props have actually changed
  const peteChanged = (
    prevProps.pete.x !== nextProps.pete.x ||
    prevProps.pete.y !== nextProps.pete.y ||
    prevProps.pete.color !== nextProps.pete.color
  );
  
  const objectsChanged = (
    prevProps.enemies !== nextProps.enemies ||
    prevProps.projectiles !== nextProps.projectiles ||
    prevProps.mysteryBalloons !== nextProps.mysteryBalloons
  );
  
  const settingsChanged = (
    prevProps.screenWidth !== nextProps.screenWidth ||
    prevProps.screenHeight !== nextProps.screenHeight ||
    prevProps.enemyColor !== nextProps.enemyColor ||
    prevProps.projectileColor !== nextProps.projectileColor ||
    prevProps.mysteryBalloonColor !== nextProps.mysteryBalloonColor ||
    prevProps.enableViewportCulling !== nextProps.enableViewportCulling ||
    prevProps.enableDynamicQuality !== nextProps.enableDynamicQuality ||
    prevProps.isPlaying !== nextProps.isPlaying ||
    prevProps.isPaused !== nextProps.isPaused
  );
  
  // Only re-render if something actually changed
  return !peteChanged && !objectsChanged && !settingsChanged;
});

OptimizedGameRenderer.displayName = 'OptimizedGameRenderer';

export default OptimizedGameRenderer;