
import { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, GameState, ObstacleType, ObstacleEntity } from '../types';
import {
  GRAVITY,
  JUMP_FORCE,
  BASE_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  GAME_HEIGHT,
  CAT_SIZE,
  CAT_X_POSITION,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  HOUSE_WIDTH,
  HOUSE_HEIGHT,
  OBSTACLE_SPAWN_MIN_INTERVAL,
  OBSTACLE_SPAWN_MAX_INTERVAL
} from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useGameLoop = () => {
  // Game state ref for logic updates (avoids stale closures)
  const stateRef = useRef<GameState>({
    status: GameStatus.START,
    score: 0,
    level: 1,
    highScore: parseInt(localStorage.getItem('cat-run-highscore') || '0', 10),
    gameSpeed: BASE_SPEED,
    catY: 0,
    catVelocity: 0,
    obstacles: [],
    isJumping: false,
  });

  // State for React rendering
  const [gameState, setGameState] = useState<GameState>(stateRef.current);
  
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const nextSpawnFrameRef = useRef<number>(OBSTACLE_SPAWN_MIN_INTERVAL);

  const spawnObstacle = useCallback(() => {
    const types = [ObstacleType.WATER, ObstacleType.VACUUM, ObstacleType.CATCHER];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const spawnX = 1000;

    const newObstacle: ObstacleEntity = {
      id: generateId(),
      x: spawnX,
      y: 0, // Ground level
      width: OBSTACLE_WIDTH,
      height: OBSTACLE_HEIGHT,
      type: randomType,
      speedMultiplier: 1
    };

    stateRef.current.obstacles.push(newObstacle);
  }, []);

  const spawnHouse = useCallback(() => {
    const spawnX = 1000;
    
    const house: ObstacleEntity = {
        id: generateId(),
        x: spawnX,
        y: 0,
        width: HOUSE_WIDTH,
        height: HOUSE_HEIGHT,
        type: ObstacleType.HOUSE,
        speedMultiplier: 1 // Moves at same speed as world
    };
    
    stateRef.current.obstacles.push(house);
  }, []);

  const update = useCallback(() => {
    if (stateRef.current.status !== GameStatus.PLAYING) {
        return; 
    }

    const state = stateRef.current;
    
    // 1. Physics
    state.catVelocity += GRAVITY;
    state.catY += state.catVelocity;

    if (state.catY <= 0) {
      state.catY = 0;
      state.catVelocity = 0;
      state.isJumping = false;
    }

    // 2. Level Logic
    // Level up every 100 points
    const calculatedLevel = Math.floor(state.score / 100) + 1;
    if (calculatedLevel > state.level) {
        state.level = calculatedLevel;
        spawnHouse();
    }

    // 3. Spawning
    if (frameCountRef.current >= nextSpawnFrameRef.current) {
      spawnObstacle();
      frameCountRef.current = 0;
      
      const baseRandom = Math.floor(
        Math.random() * (OBSTACLE_SPAWN_MAX_INTERVAL - OBSTACLE_SPAWN_MIN_INTERVAL + 1)
      ) + OBSTACLE_SPAWN_MIN_INTERVAL;
      
      const speedFactor = state.gameSpeed / BASE_SPEED;
      nextSpawnFrameRef.current = Math.max(40, Math.floor(baseRandom / speedFactor));
    }

    // Move Obstacles
    state.obstacles.forEach(obs => {
      obs.x -= state.gameSpeed * obs.speedMultiplier;
    });

    // Clean up off-screen
    state.obstacles = state.obstacles.filter(obs => obs.x > -200); // Increased buffer for wider house

    // 4. Collision Detection
    const collision = state.obstacles.some(obs => {
      // Ignore decorative objects like Houses
      if (obs.type === ObstacleType.HOUSE) return false;

      const padding = 8;
      const catLeft = CAT_X_POSITION + padding; 
      const catRight = CAT_X_POSITION + CAT_SIZE - padding;
      const catBottom = state.catY; 
      const catTop = state.catY + CAT_SIZE - padding;

      const obsLeft = obs.x + padding;
      const obsRight = obs.x + obs.width - padding;
      const obsBottom = obs.y;
      const obsTop = obs.y + obs.height - padding;

      return (
        catLeft < obsRight &&
        catRight > obsLeft &&
        catBottom < obsTop &&
        catTop > obsBottom
      );
    });

    if (collision) {
      state.status = GameStatus.GAME_OVER;
      if (state.score > state.highScore) {
        state.highScore = Math.floor(state.score);
        localStorage.setItem('cat-run-highscore', state.highScore.toString());
      }
    } else {
      // 5. Score & Difficulty
      state.score += 0.1 * (state.gameSpeed / BASE_SPEED);
      state.gameSpeed = Math.min(MAX_SPEED, state.gameSpeed + SPEED_INCREMENT);
      frameCountRef.current++;
    }

    setGameState({ ...state });
    
    if (state.status === GameStatus.PLAYING) {
        requestRef.current = requestAnimationFrame(update);
    }
  }, [spawnObstacle, spawnHouse]);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
        requestRef.current = requestAnimationFrame(update);
    }
    return () => {
       cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.status, update]);

  const resetGame = useCallback(() => {
    stateRef.current = {
      ...stateRef.current,
      status: GameStatus.PLAYING,
      score: 0,
      level: 1,
      gameSpeed: BASE_SPEED,
      catY: 0,
      catVelocity: 0,
      obstacles: [],
      isJumping: false,
    };
    
    frameCountRef.current = 0;
    nextSpawnFrameRef.current = OBSTACLE_SPAWN_MIN_INTERVAL;
    
    setGameState({ ...stateRef.current });
  }, []);

  const jump = useCallback((): boolean => {
    if (stateRef.current.status !== GameStatus.PLAYING) {
       return false;
    }

    if (stateRef.current.catY <= 5) {
      stateRef.current.catVelocity = JUMP_FORCE;
      stateRef.current.isJumping = true;
      setGameState({ ...stateRef.current });
      return true;
    }
    return false;
  }, []);

  return {
    gameState,
    jump,
    resetGame
  };
};