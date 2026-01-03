import type { GameState, GameConfig } from '@/types';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { Player } from '@/player/Player';
import { Weapon } from '@/weapon/Weapon';
import { WeaponRenderer } from '@/weapon/WeaponRenderer';
import { TargetManager } from '@/enemies/Target';
import { PickupManager } from '@/items/Pickup';
import { AudioManager } from '@/audio/AudioManager';
import { WebGLRenderer } from '@/render/WebGLRenderer';
import { HUD } from '@/render/HUD';
import { CollisionSystem } from '@/world/Collision';
import { vec3 } from '@/utils/math';

/** Конфигурация по умолчанию */
const DEFAULT_CONFIG: GameConfig = {
  width: 1280,
  height: 720,
  renderScale: 0.4,
  movement: {
    walkSpeed: 9.0,
    runSpeed: 16.0,
    jumpForce: 8.0,
    gravity: 25.0,
    groundFriction: 12.0,
    airControl: 0.3,
    mouseSensitivity: 0.002,
  },
  weapon: {
    name: 'Katana',
    damage: 100,
    fireRate: 2.5,
    magazineSize: 999,
    reloadTime: 0,
    spread: 0,
    automatic: false,
  },
};

/**
 * Samurai Pool Arena
 * Руби врагов катаной пока они не долетели до тебя!
 */
export class Game {
  // === СОСТОЯНИЕ ===
  public state: GameState = {
    isRunning: false,
    isPaused: false,
    frags: 0,
    gameTime: 0,
    soundEnabled: true,
  };

  // === КОНФИГУРАЦИЯ ===
  public config: GameConfig;

  // === СИСТЕМЫ ===
  private gameLoop: GameLoop;
  private input: Input;
  private player: Player;
  private weapon: Weapon;
  private weaponRenderer: WeaponRenderer;
  private targetManager: TargetManager;
  private pickupManager: PickupManager;
  private audio: AudioManager;
  private renderer: WebGLRenderer;
  private hud: HUD;
  private collision: CollisionSystem;

  // === CANVAS ===
  private weaponCanvas: HTMLCanvasElement;

  // === UI ===
  private startScreen: HTMLElement | null;

  // === ВРЕМЯ ===
  private gameTime = 0;

  // === СОСТОЯНИЕ ===
  private footstepTimer = 0;
  private wasGrounded = true;
  private screenShake = 0;
  private lastSliceTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    weaponCanvas: HTMLCanvasElement,
    config: Partial<GameConfig> = {}
  ) {
    this.weaponCanvas = weaponCanvas;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Инициализируем системы
    this.collision = new CollisionSystem();
    this.input = new Input(canvas);
    this.audio = new AudioManager();
    this.hud = new HUD();

    // Игрок на мосту (безопасная позиция)
    this.player = new Player(
      vec3(0, 1.7, 12),
      this.config.movement,
      this.collision
    );

    // Катана
    this.weapon = new Weapon();
    this.weapon.onSlice = () => this.onKatanaSlice();

    // Рендереры
    this.renderer = new WebGLRenderer(canvas);
    this.renderer.renderScale = this.config.renderScale;
    this.weaponRenderer = new WeaponRenderer(weaponCanvas);

    // Враги
    this.targetManager = new TargetManager();
    this.setupTargetCallbacks();

    // Предметы
    this.pickupManager = new PickupManager();

    // Игровой цикл
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );

    // UI
    this.startScreen = document.getElementById('click-to-start');

    // Обработчики
    this.setupEventHandlers();
  }

  /** Настройка callbacks для врагов */
  private setupTargetCallbacks(): void {
    this.targetManager.onTargetDestroyed = (target) => {
      this.state.frags++;
      this.audio.playSFX('kill');
      this.hud.showHitmarker(true);
      
      // Шанс выпадения предмета
      this.pickupManager.spawnAfterKill(target.position);
    };

    this.targetManager.onPlayerHit = (target) => {
      // Урон игроку (зависит от типа врага)
      this.player.takeDamage(target.damage);
      
      // Разные эффекты для разных врагов
      switch (target.enemyType) {
        case 'phantom':
          this.audio.playSFX('phantom_pass');
          this.screenShake = 0.3;
          this.hud.showDamage('purple');
          // ЗАМЕДЛЕНИЕ! Фантом как чёрная дыра
          this.slowdownFactor = 0.3;
          this.slowdownTimer = 2.0; // 2 секунды
          break;
        case 'runner':
          this.audio.playSFX('runner_hit');
          this.screenShake = 0.4;
          this.hud.showDamage('green');
          break;
        case 'hopper':
          this.audio.playSFX('hopper_hit');
          this.screenShake = 0.6; // Сильная тряска - прыгнул сверху!
          this.hud.showDamage('green');
          break;
        default:
          this.audio.playSFX('hit');
          this.screenShake = 0.5;
          this.hud.showDamage('green');
      }
    };

    this.targetManager.onWaveStart = (wave) => {
      this.hud.showWave(wave);
    };

    this.targetManager.onWaveComplete = (wave) => {
      this.hud.showWaveComplete(wave);
    };
  }

  /** Замедление от фантомов */
  private slowdownFactor = 1.0;
  private slowdownTimer = 0;

  /** Настройка обработчиков событий */
  private setupEventHandlers(): void {
    // Обработчики слайдеров
    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value');
    const sensSlider = document.getElementById('sens-slider') as HTMLInputElement;
    const sensValue = document.getElementById('sens-value');

    volumeSlider?.addEventListener('input', (e) => {
      e.stopPropagation(); // Не запускаем игру при клике на слайдер
      const value = parseInt(volumeSlider.value);
      if (volumeValue) volumeValue.textContent = `${value}%`;
      this.audio.setVolume(value / 100);
    });

    sensSlider?.addEventListener('input', (e) => {
      e.stopPropagation();
      const value = parseInt(sensSlider.value);
      if (sensValue) sensValue.textContent = `${value}%`;
      // Чувствительность от 0.001 до 0.01
      this.input.setSensitivity(0.001 + (value / 100) * 0.009);
    });

    // Предотвращаем запуск игры при клике на слайдеры
    document.getElementById('settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.startScreen?.addEventListener('click', () => this.start());

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.audio.toggleMute();
      }
      if (e.code === 'KeyF') {
        this.toggleFullscreen();
      }
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  /** Запуск игры */
  public start(): void {
    if (this.state.isRunning) return;

    // Читаем настройки
    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const sensSlider = document.getElementById('sens-slider') as HTMLInputElement;
    
    if (volumeSlider) {
      this.audio.setVolume(parseInt(volumeSlider.value) / 100);
    }
    if (sensSlider) {
      this.input.setSensitivity(0.001 + (parseInt(sensSlider.value) / 100) * 0.009);
    }

    if (this.startScreen) {
      this.startScreen.style.display = 'none';
    }

    this.input.requestPointerLock();
    this.audio.start();
    this.gameLoop.start();
    this.state.isRunning = true;

    // Начинаем первую волну
    this.targetManager.startGame();

    this.handleResize();
  }

  /** Остановка игры */
  public stop(): void {
    this.gameLoop.stop();
    this.state.isRunning = false;
    this.input.exitPointerLock();
  }

  /** Обновление игры */
  private update(dt: number): void {
    if (this.state.isPaused) return;

    this.gameTime += dt;

    // Обновляем таймер замедления
    if (this.slowdownTimer > 0) {
      this.slowdownTimer -= dt;
      if (this.slowdownTimer <= 0) {
        this.slowdownFactor = 1.0;
      }
    }

    // Обновляем игрока с учётом замедления
    const effectiveDt = dt * this.slowdownFactor;
    this.player.update(effectiveDt, this.input.state, {
      x: this.input.mouseDelta.x * this.slowdownFactor,
      y: this.input.mouseDelta.y * this.slowdownFactor
    });
    this.input.resetMouseDelta();

    // Звуки движения
    this.updateMovementSounds(dt);

    // Атака катаной (ЛКМ)
    if (this.input.state.fire) {
      if (this.weapon.tryAttack()) {
        // Проверяем попадание
        const playerPos = this.player.getEyePosition();
        const hit = this.targetManager.trySlice(
          playerPos,
          this.player.state.yaw,
          this.weapon.attackRange,
          this.weapon.attackAngle
        );
        
        if (hit) {
          this.lastSliceTime = this.gameTime;
          // Эффект попадания на катане
          this.weaponRenderer.showHitEffect();
          this.audio.playSFX('kill');
        }
      }
    }

    // Обновляем катану
    const isMoving = this.input.state.forward || this.input.state.backward ||
                     this.input.state.left || this.input.state.right;
    this.weapon.update(dt, isMoving, this.input.state.run);

    // Синхронизируем анимацию с рендерером
    this.weaponRenderer.isAttacking = this.weapon.isAttacking;
    this.weaponRenderer.attackProgress = this.weapon.attackProgress;

    // Обновляем врагов
    const playerPos = this.player.getEyePosition();
    this.targetManager.update(dt, playerPos, this.gameTime);

    // Проверяем прицепившихся раннеров
    this.checkAttachedRunners();

    // Двойной прыжок для скидывания раннера
    if (this.input.state.jump && !this.player.state.grounded) {
      if (this.player.tryDoubleJump()) {
        // Пробуем скинуть раннеров
        this.detachRunners();
        this.audio.playSFX('jump');
      }
    }

    // Обновляем предметы
    const pickedUp = this.pickupManager.update(dt, this.gameTime, playerPos);
    if (pickedUp) {
      this.onPickup(pickedUp);
    }

    // Звук приближения ближайшего врага
    const closestDist = this.targetManager.getClosestEnemyDistance(playerPos);
    if (closestDist < 15) {
      const proximity = Math.max(0, 1 - closestDist / 15);
      this.audio.updateProximitySound(proximity);
    } else {
      this.audio.updateProximitySound(0);
    }

    // Тряска экрана
    if (this.screenShake > 0) {
      this.screenShake -= dt * 2;
    }

    // Проверка смерти
    if (this.player.isDead()) {
      this.gameOver();
    }

    // Обновляем HUD
    this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
    this.hud.updateAmmo(this.targetManager.wave, this.targetManager.getActiveCount());
    this.hud.updateFrags(this.state.frags);
  }

  /** Звуки движения */
  private updateMovementSounds(dt: number): void {
    const isMoving = this.input.state.forward || this.input.state.backward ||
                     this.input.state.left || this.input.state.right;

    if (isMoving && this.player.state.grounded) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.audio.playSFX('footstep');
        this.footstepTimer = this.input.state.run ? 0.25 : 0.4;
      }
    }

    if (this.player.state.grounded && !this.wasGrounded) {
      this.audio.playSFX('land');
    }
    this.wasGrounded = this.player.state.grounded;
  }

  /** Callback при взмахе катаной */
  private onKatanaSlice(): void {
    this.audio.playSFX('gunshot'); // Заменим на звук взмаха
  }

  /** Game Over */
  private gameOver(): void {
    this.state.isPaused = true;
    this.hud.showGameOver(this.state.frags, this.targetManager.wave);
    
    // Перезапуск через 3 секунды
    setTimeout(() => {
      this.restart();
    }, 3000);
  }

  /** Перезапуск */
  private restart(): void {
    this.player.reset(vec3(0, 1.7, 12));
    this.player.state.health = 100;
    this.state.frags = 0;
    this.state.isPaused = false;
    this.targetManager.startGame();
    this.pickupManager.pickups = [];
  }

  /** Проверка прицепившихся раннеров */
  private checkAttachedRunners(): void {
    for (const target of this.targetManager.targets) {
      if (target.enemyType === 'runner' && target.isAttached) {
        // Раннер прицепился - урон когда время выйдет
        if (target.attachTimer <= 0 && target.active === false) {
          this.player.takeDamage(target.damage);
          this.audio.playSFX('runner_hit');
          this.screenShake = 0.6;
          this.hud.showDamage('green');
          this.hud.showMessage('⚠️ РАННЕР УКУСИЛ!', 'orange');
        }
      }
    }
  }

  /** Скинуть раннеров двойным прыжком */
  private detachRunners(): void {
    let detached = false;
    for (const target of this.targetManager.targets) {
      if (target.enemyType === 'runner' && target.isAttached) {
        target.detachRunner();
        detached = true;
      }
    }
    if (detached) {
      this.hud.showMessage('✓ РАННЕР СБРОШЕН!', 'cyan');
    }
  }

  /** Подбор предмета */
  private onPickup(type: string): void {
    if (type === 'health') {
      // Аптечка - восстанавливает HP
      const heal = 30;
      this.player.state.health = Math.min(
        this.player.state.maxHealth,
        this.player.state.health + heal
      );
      this.audio.playSFX('jump'); // Временный звук
      this.hud.showMessage('+' + heal + ' HP', 'lime');
      this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
      
    } else if (type === 'stimpack') {
      // Стимпак - буйство!
      this.player.activateStimpack();
      this.audio.playSFX('kill'); // Временный звук
      this.hud.showMessage('🔥 БУЙСТВО! 🔥', 'red');
      this.hud.showRageOverlay(8.0);
    }
  }

  /** Рендеринг */
  private render(): void {
    // Данные врагов для шейдера
    const targetsData = this.targetManager.getShaderData();
    const targetCount = this.targetManager.targets.length;

    // Тряска камеры
    let yaw = this.player.state.yaw;
    let pitch = this.player.state.pitch;
    
    if (this.screenShake > 0) {
      yaw += (Math.random() - 0.5) * this.screenShake * 0.1;
      pitch += (Math.random() - 0.5) * this.screenShake * 0.1;
    }

    // Вспышка при ударе
    const sliceFlash = Math.max(0, 0.3 - (this.gameTime - this.lastSliceTime)) * 3;

    // Рендерим сцену
    this.renderer.render(
      this.gameTime,
      this.player.getEyePosition(),
      yaw,
      pitch,
      targetsData,
      targetCount,
      sliceFlash
    );

    // Рендерим катану
    this.weaponRenderer.render(this.weapon.state, this.gameTime);
  }

  /** Обработка resize */
  private handleResize(): void {
    const dpr = window.devicePixelRatio || 1;

    this.weaponCanvas.width = window.innerWidth * dpr;
    this.weaponCanvas.height = window.innerHeight * dpr;
    this.weaponCanvas.style.width = window.innerWidth + 'px';
    this.weaponCanvas.style.height = window.innerHeight + 'px';

    this.weaponRenderer.resize(this.weaponCanvas.width, this.weaponCanvas.height);
  }

  /** Полноэкранный режим */
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  /** Уничтожить игру */
  public destroy(): void {
    this.stop();
    this.input.destroy();
    this.audio.stop();
    this.renderer.destroy();
  }
}
