// ========== БАЗОВЫЕ ТИПЫ ==========

/** 3D вектор */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 2D вектор */
export interface Vec2 {
  x: number;
  y: number;
}

// ========== ИГРОК ==========

/** Состояние игрока */
export interface PlayerState {
  /** Позиция в мире */
  position: Vec3;
  /** Скорость движения */
  velocity: Vec3;
  /** Угол поворота по горизонтали (рад) */
  yaw: number;
  /** Угол наклона по вертикали (рад) */
  pitch: number;
  /** Стоит на земле */
  grounded: boolean;
  /** Высота глаз над полом */
  eyeHeight: number;
  /** Здоровье */
  health: number;
  /** Максимальное здоровье */
  maxHealth: number;
}

/** Настройки движения */
export interface MovementConfig {
  /** Скорость ходьбы */
  walkSpeed: number;
  /** Скорость бега */
  runSpeed: number;
  /** Сила прыжка */
  jumpForce: number;
  /** Гравитация */
  gravity: number;
  /** Трение на земле */
  groundFriction: number;
  /** Контроль в воздухе (0-1) */
  airControl: number;
  /** Чувствительность мыши */
  mouseSensitivity: number;
}

// ========== ОРУЖИЕ ==========

/** Состояние оружия */
export interface WeaponState {
  /** Текущие патроны в магазине */
  ammo: number;
  /** Патроны в запасе */
  reserveAmmo: number;
  /** Размер магазина */
  magazineSize: number;
  /** Идёт перезарядка */
  isReloading: boolean;
  /** Время до конца перезарядки */
  reloadTimeLeft: number;
  /** Отдача X */
  recoilX: number;
  /** Отдача Y */
  recoilY: number;
  /** Отдача назад */
  recoilBack: number;
  /** Интенсивность вспышки */
  muzzleFlash: number;
  /** Покачивание при ходьбе */
  bobPhase: number;
}

/** Конфигурация оружия */
export interface WeaponConfig {
  /** Название */
  name: string;
  /** Урон */
  damage: number;
  /** Скорострельность (выстрелов/сек) */
  fireRate: number;
  /** Размер магазина */
  magazineSize: number;
  /** Время перезарядки (сек) */
  reloadTime: number;
  /** Разброс */
  spread: number;
  /** Автоматическое оружие */
  automatic: boolean;
}

// ========== СНАРЯДЫ ==========

/** Снаряд */
export interface Projectile {
  /** Позиция */
  position: Vec3;
  /** Направление */
  velocity: Vec3;
  /** Время жизни */
  lifetime: number;
  /** Урон */
  damage: number;
}

// ========== ВРАГИ ==========

/** Состояние мишени/врага */
export interface TargetState {
  /** Позиция */
  position: Vec3;
  /** Здоровье */
  health: number;
  /** Максимальное здоровье */
  maxHealth: number;
  /** Активен (не уничтожен) */
  active: boolean;
  /** Время до респавна */
  respawnTimer: number;
  /** Интенсивность огня внутри */
  fireIntensity: number;
}

// ========== ВВОД ==========

/** Состояние клавиш */
export interface InputState {
  /** Движение вперёд */
  forward: boolean;
  /** Движение назад */
  backward: boolean;
  /** Движение влево */
  left: boolean;
  /** Движение вправо */
  right: boolean;
  /** Бег */
  run: boolean;
  /** Прыжок */
  jump: boolean;
  /** Стрельба */
  fire: boolean;
  /** Перезарядка */
  reload: boolean;
}

// ========== АУДИО ==========

/** Тип звукового эффекта */
export type SFXType = 
  | 'gunshot'
  | 'reload'
  | 'footstep'
  | 'jump'
  | 'land'
  | 'hit'
  | 'kill'
  | 'ambient'
  | 'phantom_pass'
  | 'runner_hit'
  | 'hopper_hit';

// ========== РЕНДЕРИНГ ==========

/** Uniform-переменные для шейдера */
export interface ShaderUniforms {
  /** Разрешение экрана */
  resolution: WebGLUniformLocation | null;
  /** Время */
  time: WebGLUniformLocation | null;
  /** Позиция камеры */
  cameraPos: WebGLUniformLocation | null;
  /** Направление камеры */
  cameraDir: WebGLUniformLocation | null;
  /** Yaw камеры */
  cameraYaw: WebGLUniformLocation | null;
  /** Pitch камеры */
  cameraPitch: WebGLUniformLocation | null;
  /** Позиции мишеней */
  targets: WebGLUniformLocation | null;
  /** Количество активных мишеней */
  targetCount: WebGLUniformLocation | null;
  /** Вспышка от выстрела */
  muzzleFlash: WebGLUniformLocation | null;
}

// ========== КОЛЛИЗИИ ==========

/** Интерфейс системы коллизий */
export interface ICollisionSystem {
  /** Проверить коллизию в точке */
  checkCollision(pos: Vec3): boolean;
  /** Получить высоту пола в точке */
  getFloorHeight(pos: Vec3): number;
  /** Получить высоту потолка в точке */
  getCeilingHeight(pos: Vec3): number;
}

// ========== ИГРА ==========

/** Общее состояние игры */
export interface GameState {
  /** Игра запущена */
  isRunning: boolean;
  /** Игра на паузе */
  isPaused: boolean;
  /** Счёт фрагов */
  frags: number;
  /** Время игры */
  gameTime: number;
  /** Звук включён */
  soundEnabled: boolean;
}

/** Конфигурация игры */
export interface GameConfig {
  /** Ширина canvas */
  width: number;
  /** Высота canvas */
  height: number;
  /** Разрешение рендеринга (0-1) */
  renderScale: number;
  /** Настройки движения */
  movement: MovementConfig;
  /** Конфигурация оружия */
  weapon: WeaponConfig;
}

