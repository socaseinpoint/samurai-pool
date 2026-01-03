import type { GameState, GameConfig, Vec3 } from '@/types';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { Player } from '@/player/Player';
import { Weapon } from '@/weapon/Weapon';
import { WeaponRenderer } from '@/weapon/WeaponRenderer';
import { TargetManager, Target } from '@/enemies/Target';
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
  private audio: AudioManager;
  private renderer: WebGLRenderer;
  private hud: HUD;
  private collision: CollisionSystem;

  // === CANVAS ===
  private canvas: HTMLCanvasElement;
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
    this.canvas = canvas;
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
    };

    this.targetManager.onPlayerHit = (target) => {
      // Урон игроку
      this.player.takeDamage(25);
      this.audio.playSFX('hit');
      this.screenShake = 0.5;
      
      // Красная вспышка
      this.hud.showDamage();
    };

    this.targetManager.onWaveStart = (wave) => {
      this.hud.showWave(wave);
    };

    this.targetManager.onWaveComplete = (wave) => {
      this.hud.showWaveComplete(wave);
    };
  }

  /** Настройка обработчиков событий */
  private setupEventHandlers(): void {
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

    // Обновляем игрока
    this.player.update(dt, this.input.state, this.input.mouseDelta);
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

    // Звук приближения ближайшего врага
    const closestDist = this.targetManager.getClosestEnemyDistance(playerPos);
    if (closestDist < 15) {
      // proximity от 0 (далеко) до 1 (очень близко)
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
