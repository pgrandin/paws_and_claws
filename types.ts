export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum ObstacleType {
  WATER = 'WATER',
  VACUUM = 'VACUUM',
  CATCHER = 'CATCHER',
  HOUSE = 'HOUSE'
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObstacleEntity extends Entity {
  type: ObstacleType;
  speedMultiplier: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  level: number;
  highScore: number;
  gameSpeed: number;
  catY: number;
  catVelocity: number;
  obstacles: ObstacleEntity[];
  isJumping: boolean;
}