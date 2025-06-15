/**
 * Game renderer with viewport culling
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import Pete from './Pete';
import Enemy from './Enemy';
import Projectile from './Projectile';
import ViewportCuller from '../optimized/ViewportCuller';
import { RenderableGameObject } from '@/types/GameTypes';

interface GameRendererProps {
  // Game objects
  pete: { x: number; y: number; color: string };
  enemies: RenderableGameObject[];
  projectiles: RenderableGameObject[];
  mysteryBalloons: RenderableGameObject[];
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Colors and theme
  enemyColor: string;
  projectileColor: string;
  mysteryBalloonColor: string;
  
  // Performance settings
  enableViewportCulling?: boolean;
  maxVisibleEnemies?: number;
  maxVisibleProjectiles?: number;
  
  // Game state for prioritization
  isPlaying?: boolean;
  isPaused?: boolean;
  
  // Enhanced game state for visual effects
  gameState?: {
    combo?: number;
    recentlyHit?: boolean;
    peteVelocity?: { x: number; y: number };
    lastShotTime?: number;
  };
}

const GameRendererComponent: React.FC<GameRendererProps> = ({
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
  maxVisibleEnemies = 50,
  maxVisibleProjectiles = 30,
  isPlaying: _isPlaying = true,
  isPaused: _isPaused = false,
  gameState
}) => {
  
  // Priority center for LOD (Level of Detail) - usually Pete's position
  const priorityCenter = useMemo(() => ({
    x: pete.x + 15, // Assuming Pete size is ~30px
    y: pete.y + 15
  }), [pete.x, pete.y]);
  
  // Render Pete (always visible, highest priority)
  const renderPete = useCallback(() => {
    // Calculate if Pete is moving based on position changes
    const isMoving = !gameState?.peteVelocity ? false :
      Math.abs(gameState.peteVelocity.x) > 0.1 || Math.abs(gameState.peteVelocity.y) > 0.1;

    return (
      <Pete
        x={pete.x}
        y={pete.y}
        color={pete.color}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        isVisible={true}
        gameState={{
          isMoving,
          recentlyHit: gameState?.recentlyHit || false,
          combo: gameState?.combo || 0,
        }}
      />
    );
  }, [pete, screenWidth, screenHeight, gameState]);
  
  // Render individual enemy with enhanced data
  const renderEnemy = useCallback((enemy: RenderableGameObject, index: number, isVisible: boolean) => {
    return (
      <Enemy
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
        // Enhanced enemy properties
        velocity={enemy.velocity || { x: 0, y: 0 }}
        health={enemy.health || 100}
        maxHealth={enemy.maxHealth || 100}
      />
    );
  }, [enemyColor, screenWidth, screenHeight]);
  
  // Render individual projectile with enhanced data
  const renderProjectile = useCallback((projectile: RenderableGameObject, index: number, isVisible: boolean) => (
    <Projectile
      key={projectile.id}
      id={projectile.id}
      x={projectile.x}
      y={projectile.y}
      color={projectileColor}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      isVisible={isVisible}
      // Enhanced projectile properties
      velocity={projectile.velocity}
      powerUpType={projectile.powerUpType}
      age={projectile.age}
      penetration={projectile.penetration}
      explosion={projectile.explosion}
    />
  ), [projectileColor, screenWidth, screenHeight]);
  
  // Render individual mystery balloon
  const renderMysteryBalloon = useCallback((balloon: RenderableGameObject, index: number, isVisible: boolean) => (
    <Enemy
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
    />
  ), [mysteryBalloonColor, screenWidth, screenHeight]);
  
  
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
      
      {/* Mystery balloons - always rendered */}
      {mysteryBalloons.map((balloon, index) => renderMysteryBalloon(balloon, index, true))}
    </View>
  );
};

// Memoize the entire renderer to prevent unnecessary re-renders
const GameRenderer = memo(GameRendererComponent, (prevProps, nextProps) => {
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
    prevProps.isPlaying !== nextProps.isPlaying ||
    prevProps.isPaused !== nextProps.isPaused
  );
  
  // Only re-render if something actually changed
  return !peteChanged && !objectsChanged && !settingsChanged;
});

GameRenderer.displayName = 'GameRenderer';

export default GameRenderer;