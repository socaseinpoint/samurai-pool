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
  /** Стрельба (ЛКМ) */
  fire: boolean;
  /** Альт. стрельба (ПКМ) - сплеш */
  altFire: boolean;
  /** Перезарядка */
  reload: boolean;
  /** Бросок гранаты (колёсико) */
  throwGrenade: boolean;
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
  | 'hopper_hit'
  | 'katana_swing'
  | 'splash_wave'
  | 'charge_pickup'
  | 'acid_spit'
  | 'void_whistle'
  | 'phantom_hit'
  | 'player_hurt'
  | 'spiker_scream'
  | 'spiker_shoot'
  | 'explosion';

// ========== РЕНДЕРИНГ ==========

/** Uniform-переменные для шейдера */
export interface ShaderUniforms {
  /** Разрешение экрана */
  resolution: WebGLUniformLocation | null;
  /** Время */
  time: WebGLUniformLocation | null;
  /** Турбо режим */
  turboMode: WebGLUniformLocation | null;
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
  /** Токсичные лужи */
  pools: WebGLUniformLocation | null;
  /** Количество луж */
  poolCount: WebGLUniformLocation | null;
  /** Летящие снаряды кислоты */
  acidProjectiles: WebGLUniformLocation | null;
  /** Количество снарядов */
  acidProjectileCount: WebGLUniformLocation | null;
  /** Начальные точки лазеров спайкеров */
  spikes: WebGLUniformLocation | null;
  /** Конечные точки лазеров */
  spikeTargets: WebGLUniformLocation | null;
  /** Количество лазеров */
  spikeCount: WebGLUniformLocation | null;
  /** Зоны кислотного дождя */
  acidRainZones: WebGLUniformLocation | null;
  /** Количество зон дождя */
  acidRainZoneCount: WebGLUniformLocation | null;
  /** Текущая эпоха (1-3) */
  era: WebGLUniformLocation | null;
  /** Текущая волна (для эффектов) */
  wave: WebGLUniformLocation | null;
  /** Фаза 2 зелёного босса */
  greenBossPhase2: WebGLUniformLocation | null;
  /** Пикапы */
  pickups: WebGLUniformLocation | null;
  /** Количество пикапов */
  pickupCount: WebGLUniformLocation | null;
  /** Кристаллы силы (для чёрного босса) */
  crystals: WebGLUniformLocation | null;
  /** Количество кристаллов */
  crystalCount: WebGLUniformLocation | null;
  /** Режим войда (засосан Владыкой пустоты) */
  voidMode: WebGLUniformLocation | null;
  /** Прогресс войда (0-1) */
  voidProgress: WebGLUniformLocation | null;
  /** Смещение падения в войде */
  voidFallOffset: WebGLUniformLocation | null;
  /** Позиция портала выхода в войде */
  portalPos: WebGLUniformLocation | null;
  /** Алтари [x, y, z, score] */
  altars: WebGLUniformLocation | null;
  /** Летящие лучи */
  darts: WebGLUniformLocation | null;
  /** Направления лучей */
  dartDirs: WebGLUniformLocation | null;
  /** Количество лучей */
  dartCount: WebGLUniformLocation | null;
  /** Портал в войд активен */
  voidPortalActive: WebGLUniformLocation | null;
  /** Монеты крови */
  bloodCoins: WebGLUniformLocation | null;
  /** Количество монет крови */
  bloodCoinCount: WebGLUniformLocation | null;
  /** Гранаты [x, y, z, lifetime] */
  grenades: WebGLUniformLocation | null;
  /** Количество гранат */
  grenadeCount: WebGLUniformLocation | null;
  /** Взрывы [x, y, z, progress] */
  explosions: WebGLUniformLocation | null;
  /** Количество взрывов */
  explosionCount: WebGLUniformLocation | null;
  /** Вариант войда (0-3 разные цветовые схемы) */
  voidVariant: WebGLUniformLocation | null;
  /** Атака катаной (0-1) */
  katanaAttack: WebGLUniformLocation | null;
  /** Покачивание катаны */
  katanaBob: WebGLUniformLocation | null;
  /** Заряды катаны */
  katanaCharges: WebGLUniformLocation | null;
  /** Угол к цели */
  katanaTargetAngle: WebGLUniformLocation | null;
  /** Расстояние до цели */
  katanaTargetDist: WebGLUniformLocation | null;
  /** Тип атаки (0 - обычная, 1 - сплеш) */
  katanaAttackType: WebGLUniformLocation | null;
  /** Эффекты смерти [x, y, z, progress] */
  deathEffects: WebGLUniformLocation | null;
  /** Фрагменты врагов */
  fragments: WebGLUniformLocation | null;
  /** Количество фрагментов */
  fragmentCount: WebGLUniformLocation | null;
  /** Тени включены (0 или 1) */
  shadowsEnabled: WebGLUniformLocation | null;
  /** Постэффекты включены (0 или 1) */
  postfxEnabled: WebGLUniformLocation | null;
  /** Катана 3D включена (0 или 1) */
  katanaEnabled: WebGLUniformLocation | null;
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
  /** Проверить коллизию для врага */
  checkEnemyCollision?(pos: Vec3, radius: number): boolean;
  /** Получить высоту препятствия перед врагом */
  getObstacleHeight?(pos: Vec3, dirX: number, dirZ: number, checkDist?: number): number;
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

