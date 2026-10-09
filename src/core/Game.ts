import type { GameState, GameConfig, Vec3 } from '@/types';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { Player } from '@/player/Player';
import { Weapon } from '@/weapon/Weapon';
import { WeaponRenderer } from '@/weapon/WeaponRenderer';
import { TargetManager, Target, PORTAL_POSITIONS } from '@/enemies/Target';
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
    jumpForce: 12.0,
    gravity: 25.0,
    groundFriction: 12.0,
    airControl: 0.85,
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
  private isPaused = false;
  
  // === СИСТЕМА ОЧКОВ ===
  /** Очки, которые игрок несёт (ещё не вброшены) */
  private carryingScore = 0;
  
  /** Алтари на краях карты */
  private altars = [
    { position: { x: 0, y: 0, z: 30 }, score: 0 },   // Северный алтарь
    { position: { x: 0, y: 0, z: -30 }, score: 0 },  // Южный алтарь
  ];
  
  /** Очки за разных врагов */
  private readonly SCORE_VALUES: Record<string, number> = {
    baneling: 10,
    phantom: 15,
    runner: 20,
    hopper: 25,
    spiker: 30,
    boss_green: 100,
    boss_black: 150,
    boss_blue: 200,
  };
  
  // === СИСТЕМА ДРОТИКОВ ===
  /** Количество дротиков */
  private darts = 50;
  
  /** Кулдаун стрельбы дротиками */
  private dartCooldown = 0;
  private readonly DART_FIRE_RATE = 0.08; // 12.5 выстрелов в секунду!
  private readonly DART_DAMAGE = 15;
  private readonly DARTS_PER_POINT = 2; // 2 дротика за 1 очко
  
  /** Летящие дротики */
  private flyingDarts: Array<{
    position: Vec3;
    velocity: Vec3;
    active: boolean;
  }> = [];
  
  // === ПОРТАЛ В ВОЙД ===
  /** Таймер появления портала */
  private voidPortalTimer = 10;
  /** Активен ли портал */
  private voidPortalActive = false;
  /** Время жизни портала */
  private voidPortalLifetime = 0;
  private readonly VOID_PORTAL_DURATION = 10; // Портал открыт 10 секунд
  private readonly VOID_PORTAL_COOLDOWN = 10; // Появляется каждые 10 секунд
  
  // === МОНЕТЫ КРОВИ (валюта войда) ===
  /** Собранные монеты крови */
  private bloodCoins = 0;
  /** Монеты в войде */
  private voidCoins: Array<{
    position: Vec3;
    active: boolean;
    phase: number;
  }> = [];
  
  // === ГРАНАТЫ (покупаются за монеты крови) ===
  /** Количество гранат у игрока */
  private grenadeCount = 5;
  /** Летящие гранаты */
  private grenades: Array<{
    position: Vec3;
    velocity: Vec3;
    active: boolean;
    lifetime: number;
  }> = [];
  /** Активные взрывы */
  private explosions: Array<{
    position: Vec3;
    progress: number; // 0-1
    active: boolean;
  }> = [];
  
  // === ЭФФЕКТЫ СМЕРТИ ВРАГОВ ===
  /** Активные эффекты смерти (до 8) */
  private deathEffects: Array<{
    position: Vec3;
    progress: number; // 0-1, затем удаляется
    active: boolean;
  }> = [];
  private readonly DEATH_EFFECT_DURATION = 0.5; // 0.5 сек
  
  private readonly GRENADE_SPEED = 25;
  private readonly GRENADE_GRAVITY = 15;
  private readonly GRENADE_FUSE = 1.5; // 1.5 сек до взрыва
  private readonly EXPLOSION_RADIUS = 8;
  private readonly EXPLOSION_DAMAGE = 50;
  private readonly EXPLOSION_DURATION = 0.5;
  private readonly GRENADE_COST = 3; // 3 монеты крови за гранату
  
  // === ВАРИАНТ ВОЙДА (разные каждый раз) ===
  private voidVariant = 0; // 0-3 разные цвета/стили
  
  private footstepTimer = 0;
  private wasGrounded = true;
  private screenShake = 0;
  private lastSliceTime = 0;
  private wasJumpPressed = false;
  
  /** Флаг: уже проверили попадание в текущем взмахе? */
  private attackHitChecked = false;
  private splashHitChecked = false;
  
  /** Текущая эпоха (1-3) для атмосферы */
  private currentEra = 1;

  /** Система комбо-убийств для адреналина */
  private killTimes: number[] = [];
  private readonly COMBO_WINDOW = 9.0; // 9 секунд
  private readonly COMBO_KILLS_NEEDED = 3; // 3 убийства для адреналина

  /** === VOID MODE - ECLIPSE (БЕРСЕРК) === */
  private isInVoid = false;
  private voidSpawnTimer = 0; // Таймер до следующего спавна фантома
  private savedPosition: Vec3 = vec3(0, 0, 0);
  private savedYaw = 0;
  private voidEnemyIds: number[] = []; // ID врагов в войде
  private voidFallOffset = 0; // Смещение для эффекта падения
  private savedEnemyIds: number[] = []; // ID врагов которые были активны до войда
  private savedWaveActive = false; // Была ли волна активна до войда
  private voidPhantomCooldown: Map<number, number> = new Map(); // Кулдаун урона от фантомов
  private portalPos: Vec3 = vec3(0, 0, 0); // Позиция портала выхода
  private readonly PORTAL_DISTANCE = 60; // Расстояние до портала
  private readonly PORTAL_RADIUS = 4; // Радиус для достижения портала
  private readonly VOID_SPAWN_INTERVAL = 3.0; // Интервал спавна фантомов

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

    // Враги (передаём систему коллизий для обхода препятствий)
    this.targetManager = new TargetManager(this.collision);
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
      
      // Создаём эффект смерти
      this.spawnDeathEffect(target.position);
      
      // === НАЧИСЛЕНИЕ ОЧКОВ ===
      const scoreValue = this.SCORE_VALUES[target.enemyType] || 10;
      this.carryingScore += scoreValue;
      this.hud.showMessage(`+${scoreValue}`, 'purple');
      
      // Шанс выпадения предмета (не в войде)
      if (!this.isInVoid) {
        this.pickupManager.spawnAfterKill(target.position);
      }
      
      // === СИСТЕМА КОМБО ДЛЯ АДРЕНАЛИНА ===
      // Добавляем время убийства
      this.killTimes.push(this.gameTime);
      
      // Удаляем старые убийства (старше 9 секунд)
      this.killTimes = this.killTimes.filter(t => this.gameTime - t < this.COMBO_WINDOW);
      
      // Проверяем комбо (3 убийства за 9 секунд)
      if (this.killTimes.length >= this.COMBO_KILLS_NEEDED && !this.player.rageMode) {
        this.activateComboAdrenaline();
      }
      
      // Показываем прогресс комбо
      if (this.killTimes.length > 0 && this.killTimes.length < this.COMBO_KILLS_NEEDED) {
        this.hud.showMessage(`🔥 КОМБО ${this.killTimes.length}/${this.COMBO_KILLS_NEEDED}`, 'orange');
      }
      
      // Сообщение при убийстве босса
      if (target.isBoss) {
        this.hud.showMessage('💀 БОСС ПОВЕРЖЕН! 💀', 'gold');
        // Босс роняет много аптечек
        for (let i = 0; i < 3; i++) {
          this.pickupManager.spawnAfterKill(target.position);
        }
        // Респавн заряда катаны после босса
        this.pickupManager.respawnChargeAfterBoss();
        
        // После первого босса (волна 5) - разблокируем тройной прыжок!
        if (this.targetManager.wave === 5 && this.player.maxAirJumps < 2) {
          this.player.unlockTripleJump();
          this.hud.showMessage('🦘 ТРОЙНОЙ ПРЫЖОК РАЗБЛОКИРОВАН! 🦘', 'cyan');
        }
      }
    };

    this.targetManager.onPlayerHit = (target) => {
      // Урон игроку (зависит от типа врага)
      this.player.takeDamage(target.damage);
      
      // Вскрик героя
      this.audio.playSFX('player_hurt');
      
      // Отталкивание от врага
      const playerPos = this.player.state.position;
      const knockbackDir = {
        x: playerPos.x - target.position.x,
        y: 0,
        z: playerPos.z - target.position.z
      };
      const knockDist = Math.sqrt(knockbackDir.x ** 2 + knockbackDir.z ** 2);
      if (knockDist > 0.1) {
        const knockForce = target.isBoss ? 12 : 6; // Боссы отталкивают сильнее
        this.player.state.velocity.x += (knockbackDir.x / knockDist) * knockForce;
        this.player.state.velocity.z += (knockbackDir.z / knockDist) * knockForce;
      }
      
      // Разные эффекты для разных врагов
      switch (target.enemyType) {
        case 'phantom':
          this.audio.playSFX('phantom_pass');
          this.screenShake = 0.3;
          this.hud.showDamage('purple');
          this.slowdownFactor = 0.3;
          this.slowdownTimer = 2.0;
          break;
        case 'runner':
          this.audio.playSFX('runner_hit');
          this.screenShake = 0.4;
          this.hud.showDamage('green');
          break;
        case 'hopper':
          this.audio.playSFX('hopper_hit');
          this.screenShake = 0.6;
          this.hud.showDamage('green');
          break;
        case 'boss_green':
          this.audio.playSFX('kill');
          this.screenShake = 1.0; // Очень сильная тряска
          this.hud.showDamage('green');
          this.hud.showMessage('💀 ТОКСИЧНЫЙ УДАР!', 'lime');
          break;
        case 'boss_black':
          // Владыка пустоты засасывает в ВОЙД!
          if (!this.isInVoid) {
            this.enterVoidMode();
            return; // Не наносим урон - вместо этого входим в войд
          }
          break;
        case 'boss_blue':
          this.audio.playSFX('hopper_hit');
          this.screenShake = 0.7;
          this.hud.showDamage('purple');
          this.hud.showMessage('⚡ ТЕЛЕПОРТ УДАР!', 'cyan');
          break;
        default:
          this.audio.playSFX('hit');
          this.screenShake = 0.5;
          this.hud.showDamage('green');
      }
    };

    this.targetManager.onWaveStart = (wave) => {
      this.hud.showWave(wave);
      
      // Обновляем эпоху для музыки и атмосферы
      this.audio.setEra(wave);
      this.currentEra = wave > 10 ? 3 : wave > 5 ? 2 : 1;
      
      // Эпичные заставки боссов!
      if (wave === 5) {
        this.isPaused = true; // Пауза на время заставки
        this.audio.playBossWarning();
        this.hud.showBossIntro('boss_green', () => {
          this.isPaused = false;
          this.audio.setBossMusic('boss_green');
        });
      } else if (wave === 10) {
        this.isPaused = true;
        this.audio.playBossWarning();
        this.hud.showBossIntro('boss_black', () => {
          this.isPaused = false;
          this.audio.setBossMusic('boss_black');
        });
      } else if (wave === 15) {
        this.isPaused = true;
        this.audio.playBossWarning();
        this.hud.showBossIntro('boss_blue', () => {
          this.isPaused = false;
          this.audio.setBossMusic('boss_blue');
        });
      }
      
      // Сообщения о смене эпохи
      if (wave === 6) {
        setTimeout(() => this.hud.showMessage('🌀 ЗОНА ЧЁРНОЙ ДЫРЫ 🌀', 'purple'), 1000);
      } else if (wave === 11) {
        setTimeout(() => this.hud.showMessage('🚀 КОСМИЧЕСКАЯ ЗОНА 🚀', 'cyan'), 1000);
      }
    };

    this.targetManager.onWaveComplete = (wave) => {
      this.hud.showWaveComplete(wave);
      
      // Сообщение войти в бассейн для следующей волны
      setTimeout(() => this.hud.showMessage('🏊 ВОЙДИ В БАССЕЙН! 🏊', 'cyan'), 2000);
      
      // Возврат к обычной музыке после босса
      if (wave === 5 || wave === 10 || wave === 15) {
        this.audio.setBossMusic(null);
        // Обновляем эпоху после босса
        this.audio.setEra(wave + 1);
      }
    };

    // Урон от токсичных луж
    this.targetManager.onPoolDamage = (damage) => {
      this.player.takeDamage(damage);
      this.hud.showDamage('green');
      this.screenShake = 0.2;
    };

    // Смена фазы босса
    this.targetManager.onBossPhaseChange = (bossType, phase) => {
      if (bossType === 'boss_green' && phase === 2) {
        // Зелёный босс перешёл во вторую фазу!
        this.audio.setBossGreenPhase2();
        this.hud.showMessage('☣️ ФАЗА 2: ЯРОСТЬ! ☣️', 'lime');
        this.screenShake = 1.5; // Сильная тряска
      }
    };

    // Вихрь чёрного босса (без звука вибро)
    this.targetManager.onBossVortexWarning = () => {
      this.hud.showMessage('⚠️ ВИХРЬ ПРИБЛИЖАЕТСЯ! ⚠️', 'yellow');
    };

    this.targetManager.onBossVortexStart = () => {
      this.hud.showMessage('🌀 ВИХРЬ! БЕГИ! 🌀', 'purple');
      this.screenShake = 1.0;
    };

    this.targetManager.onBossVortexEnd = () => {
      // Вихрь закончился
    };

    // Звук плевка кислотой
    this.targetManager.onAcidSpit = () => {
      this.audio.playSFX('acid_spit');
    };

    // Кислотный дождь приземлился
    this.targetManager.onAcidRain = (_pos) => {
      this.audio.playAcidSplash();
      this.screenShake = 0.3;
    };

    // Звук установки метки для кислотного дождя
    this.targetManager.onAcidRainMarkSound = () => {
      this.audio.playAcidRainMark();
      this.hud.showMessage('☢️ КИСЛОТНЫЙ ДОЖДЬ! УКРОЙСЯ! ☢️', 'lime');
    };

    // Кислотный дождь начался
    this.targetManager.onAcidRainStart = (_pos) => {
      this.audio.playAcidRainStart();
      this.screenShake = 0.5;
    };
    
    // === СПАВН ВРАГОВ ЧЕРЕЗ ПОРТАЛЫ ===
    this.targetManager.onEnemySpawn = (type, _portalSide) => {
      // Воспроизводим уникальный звук для каждого типа врага
      switch (type) {
        case 'baneling':
          this.audio.playBanelingSpawn();
          break;
        case 'phantom':
          this.audio.playPhantomSpawn();
          break;
        case 'runner':
          this.audio.playRunnerSpawn();
          break;
        case 'hopper':
          this.audio.playHopperSpawn();
          break;
        case 'spiker':
          this.audio.playSFX('spiker_scream'); // Вскрик при появлении
          break;
        case 'boss_green':
        case 'boss_black':
        case 'boss_blue':
          this.audio.playBossSpawn();
          break;
      }
    };
    
    // === АТАКА ИГОЛКАМИ СПАЙКЕРОВ ===
    this.targetManager.onSpikerScream = () => {
      this.audio.playSFX('spiker_scream');
    };
    
    this.targetManager.onSpikerAttack = () => {
      this.audio.playSFX('spiker_shoot');
    };
    
    // Попадание иголки в игрока
    this.targetManager.onSpikeHit = () => {
      this.player.takeDamage(10); // 10 урона от иголки
      this.audio.playSFX('player_hurt');
      this.hud.showDamage(); // Красный эффект по умолчанию
      this.screenShake = 0.3;
      this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
      
      if (this.player.isDead()) {
        this.gameOver();
      }
    };
    
    // === ПРЕДУПРЕЖДЕНИЕ О ВЗРЫВЕ БЕЙНЛИНГА ===
    this.targetManager.onBanelingAboutToExplode = () => {
      this.audio.playBanelingWarning();
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

    // === НАСТРОЙКИ ГРАФИКИ ===
    const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
    const shadowsToggle = document.getElementById('shadows-toggle') as HTMLInputElement;
    const postfxToggle = document.getElementById('postfx-toggle') as HTMLInputElement;
    const katanaToggle = document.getElementById('katana-toggle') as HTMLInputElement;

    // Синхронизируем UI с текущими значениями
    if (qualitySelect) qualitySelect.value = this.renderer.quality;
    if (shadowsToggle) shadowsToggle.checked = this.renderer.shadowsEnabled;
    if (postfxToggle) postfxToggle.checked = this.renderer.postfxEnabled;
    if (katanaToggle) katanaToggle.checked = this.renderer.katanaEnabled;

    qualitySelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.renderer.setQuality(qualitySelect.value as 'ultra_low' | 'low' | 'medium' | 'high');
    });

    shadowsToggle?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.renderer.shadowsEnabled = shadowsToggle.checked;
      this.renderer.saveSettings();
    });

    postfxToggle?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.renderer.postfxEnabled = postfxToggle.checked;
      this.renderer.saveSettings();
    });

    katanaToggle?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.renderer.katanaEnabled = katanaToggle.checked;
      this.renderer.saveSettings();
    });

    // Турбо режим
    const turboToggle = document.getElementById('turbo-toggle') as HTMLInputElement;
    if (turboToggle) turboToggle.checked = this.renderer.turboEnabled;
    
    turboToggle?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.renderer.turboEnabled = turboToggle.checked;
      this.renderer.saveSettings();
    });

    // Предотвращаем запуск игры при клике на слайдеры и кнопки
    document.getElementById('settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    document.getElementById('start-buttons')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Кнопка НАЧАТЬ
    document.getElementById('btn-start')?.addEventListener('click', () => this.start());
    
    // Кнопки боссов
    document.getElementById('btn-boss5')?.addEventListener('click', () => this.startFromWave(5));
    document.getElementById('btn-boss10')?.addEventListener('click', () => this.startFromWave(10));
    document.getElementById('btn-boss15')?.addEventListener('click', () => this.startFromWave(15));

    // Кнопки модалок
    document.getElementById('btn-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modal-settings')?.classList.add('active');
    });
    document.getElementById('btn-help')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modal-help')?.classList.add('active');
    });
    
    // Закрытие модалок
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modalId = (btn as HTMLElement).dataset.modal;
        if (modalId) {
          document.getElementById(modalId)?.classList.remove('active');
        }
      });
    });
    
    // Закрытие модалки при клике на фон
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
    
    // Предотвращаем закрытие при клике на контент модалки
    document.querySelectorAll('.modal-content').forEach(content => {
      content.addEventListener('click', (e) => e.stopPropagation());
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.audio.toggleMute();
      }
      if (e.code === 'KeyF') {
        this.toggleFullscreen();
      }
      // Любая клавиша снимает паузу
      if (this.state.isPaused && this.state.isRunning) {
        this.hidePauseOverlay();
      }
    });

    window.addEventListener('resize', () => this.handleResize());
    
    // === ОБРАБОТКА ПОТЕРИ ФОКУСА / POINTER LOCK ===
    // При потере pointer lock - показываем паузу (на таче захвата нет — пауза только кнопкой)
    document.addEventListener('pointerlockchange', () => {
      if (this.input.usesPointerLock && this.state.isRunning && document.pointerLockElement === null) {
        this.showPauseOverlay();
      }
    });
    
    // При сворачивании окна
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.isRunning) {
        this.showPauseOverlay();
      }
    });
    
    // Клик по pause overlay - возобновляем (делегирование)
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      const pauseOverlay = document.getElementById('pause-overlay');
      if (pauseOverlay && pauseOverlay.style.display !== 'none') {
        console.log('🎮 Клик по паузе, возобновляем...');
        e.preventDefault();
        e.stopPropagation();
        this.hidePauseOverlay();
      }
    });
  }
  
  /** Показать overlay паузы */
  private showPauseOverlay(): void {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay && this.state.isRunning) {
      pauseOverlay.style.display = 'flex';
      this.state.isPaused = true;
    }
  }
  
  /** Скрыть overlay паузы и продолжить */
  public hidePauseOverlay(): void {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay && pauseOverlay.style.display !== 'none') {
      console.log('🎮 hidePauseOverlay вызван');
      pauseOverlay.style.display = 'none';
      this.state.isPaused = false;
      // Запрашиваем pointer lock через Input (он обновит свой флаг isPointerLocked)
      this.input.requestPointerLock();
    }
  }

  /** Запуск игры */
  public start(): void {
    this.startFromWave(1);
  }

  /** Запуск с определённой волны (для боссов) */
  public startFromWave(wave: number): void {
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

    // Показываем HUD при старте игры
    this.hud.showHUD();

    this.input.requestPointerLock();
    this.audio.start();
    this.gameLoop.start();
    this.state.isRunning = true;

    // Начинаем с указанной волны
    this.targetManager.startGame(wave);
    
    // Сообщение - войти в бассейн для старта
    this.hud.showMessage('🏊 ВОЙДИ В БАССЕЙН! 🏊', 'cyan');
    
    // Сообщение о боссе (покажется после входа в бассейн)
    if (wave === 5) {
      setTimeout(() => this.hud.showMessage('⚠️ ЗЕЛЁНЫЙ БОСС! ⚠️', 'lime'), 100);
    } else if (wave === 10) {
      setTimeout(() => this.hud.showMessage('☠️ ЧЁРНЫЙ БОСС! ☠️', 'purple'), 100);
    } else if (wave === 15) {
      setTimeout(() => this.hud.showMessage('⚡ СИНИЙ БОСС! ⚡', 'cyan'), 100);
    }

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
    if (this.state.isPaused || this.isPaused) return;

    this.gameTime += dt;

    // Обновляем анимацию платформ (парение) - только если не в войде
    if (!this.isInVoid) {
      this.collision.updatePlatforms(this.gameTime);
    }

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

    // === VOID MODE (после player.update чтобы не ломать управление) ===
    if (this.isInVoid) {
      this.updateVoidMode(dt);
    }
    
    // === ПРОВЕРКА ПАДЕНИЯ В ВОЙД ===
    if (!this.isInVoid) {
      const playerPos = this.player.state.position;
      const distFromCenter = Math.sqrt(playerPos.x ** 2 + playerPos.z ** 2);
      const arenaRadius = 33.0;
      
      if (distFromCenter > arenaRadius) {
        this.hud.showMessage('💀 УПАЛ В БЕЗДНУ!', 'purple');
        this.audio.playSFX('kill');
        this.screenShake = 2.0;
        this.enterVoid();
      }
    }

    // Притяжение вихря чёрного босса
    const vortexPull = this.targetManager.getVortexPull(this.player.state.position);
    if (vortexPull.x !== 0 || vortexPull.z !== 0) {
      this.player.state.position.x += vortexPull.x * dt;
      this.player.state.position.z += vortexPull.z * dt;
      // Тряска экрана во время вихря
      this.screenShake = Math.max(this.screenShake, 0.3);
    }

    // Звуки движения
    this.updateMovementSounds(dt);

    // Обычная атака катаной (ЛКМ)
    if (this.input.state.fire) {
      if (this.weapon.tryAttack()) {
        this.audio.playSFX('katana_swing');
        this.attackHitChecked = false; // Сбросить флаг попадания для нового взмаха
        
        // Сразу определяем тип удара по позиции врага
        const [targetAngle, _] = this.getKatanaTargetData();
        // Враг слева → бьём справа (тип 0), враг справа → бьём слева (тип 1)
        this.weapon.attackType = targetAngle > 0 ? 1 : 0;
      }
    }
    
    // Проверка попадания ВО ВРЕМЯ взмаха (когда лезвие проходит через врага)
    if (this.weapon.isAttacking && !this.weapon.isSplashAttack && !this.attackHitChecked) {
      // Попадание в фазе удара (0.2 - 0.5)
      if (this.weapon.attackProgress >= 0.2 && this.weapon.attackProgress <= 0.5) {
        this.checkNormalAttack();
        this.attackHitChecked = true;
      }
    }

    // Сплеш-атака (ПКМ) - если есть заряды
    if (this.input.state.altFire) {
      if (this.weapon.trySplashAttack()) {
        this.audio.playSFX('splash_wave');
        this.splashHitChecked = false;
      }
    }
    
    // Проверка сплеш-попадания во время взмаха
    if (this.weapon.isAttacking && this.weapon.isSplashAttack && !this.splashHitChecked) {
      if (this.weapon.attackProgress >= 0.2 && this.weapon.attackProgress <= 0.5) {
        this.checkSplashAttack();
        this.splashHitChecked = true;
      }
    }
    
    // Стрельба дротиками (ПКМ зажата - автоматическая стрельба)
    this.dartCooldown -= dt;
    if (this.input.state.altFire && this.darts > 0 && this.dartCooldown <= 0) {
      this.fireDart();
      this.dartCooldown = this.DART_FIRE_RATE;
    }
    
    // Обновляем летящие дротики
    this.updateDarts(dt);
    
    // Бросок гранаты (колёсико мыши)
    if (this.input.state.throwGrenade && this.grenadeCount > 0) {
      this.throwGrenade();
      this.input.state.throwGrenade = false; // Сбрасываем сразу
    } else {
      this.input.state.throwGrenade = false; // Сбрасываем даже если нет гранат
    }
    
    // Обновляем гранаты и взрывы
    this.updateGrenades(dt);
    this.updateExplosions(dt);
    
    // Обновляем эффекты смерти
    this.updateDeathEffects(dt);
    
    // === ПОРТАЛ В ВОЙД ===
    this.updateVoidPortal(dt);

    // Обновляем катану
    const isMoving = this.input.state.forward || this.input.state.backward ||
                     this.input.state.left || this.input.state.right;
    this.weapon.update(dt, isMoving, this.input.state.run);

    // Синхронизируем анимацию с рендерером
    this.weaponRenderer.isAttacking = this.weapon.isAttacking;
    this.weaponRenderer.attackProgress = this.weapon.attackProgress;
    this.weaponRenderer.isSplashAttack = this.weapon.isSplashAttack;
    this.weaponRenderer.splashCharges = this.weapon.splashCharges;

    // Обновляем врагов
    const playerPos = this.player.getEyePosition();
    if (!this.isInVoid) {
      // Обычный режим - полное обновление
      this.targetManager.update(dt, playerPos, this.gameTime);
    } else {
      // В войде - обновляем врагов войда (движение + столкновения)
      // Уменьшаем кулдауны
      for (const [id, cd] of this.voidPhantomCooldown) {
        if (cd > 0) {
          this.voidPhantomCooldown.set(id, cd - dt);
        }
      }
      
      for (const target of this.targetManager.targets) {
        if (target.active && this.voidEnemyIds.includes(target.id)) {
          target.update(dt, playerPos, this.gameTime);
          
          // Проверяем столкновение фантома с игроком (с кулдауном!)
          const cooldown = this.voidPhantomCooldown.get(target.id) || 0;
          if (cooldown <= 0 && target.checkPlayerCollision(playerPos)) {
            // Фантом пролетел сквозь игрока - наносим урон
            this.player.takeDamage(8); // Уменьшенный урон
            this.voidPhantomCooldown.set(target.id, 1.5); // 1.5 сек кулдаун
            
            // Отталкивание от фантома
            const knockbackDir = {
              x: playerPos.x - target.position.x,
              y: 0,
              z: playerPos.z - target.position.z
            };
            const knockDist = Math.sqrt(knockbackDir.x ** 2 + knockbackDir.z ** 2);
            if (knockDist > 0.1) {
              const knockForce = 8; // Сила отталкивания
              this.player.state.velocity.x += (knockbackDir.x / knockDist) * knockForce;
              this.player.state.velocity.z += (knockbackDir.z / knockDist) * knockForce;
            }
            
            this.audio.playSFX('phantom_hit');
            this.audio.playSFX('player_hurt'); // Вскрик героя
            this.screenShake = 0.8;
            this.hud.showDamage('purple');
            this.hud.showMessage('💀 ФАНТОМ!', 'purple');
          }
        }
      }
    }

    // Звуки приближения врагов
    this.updateEnemyProximitySounds(playerPos);

    // Проверяем прицепившихся раннеров
    this.checkAttachedRunners();

    // Отслеживаем отпускание Space для двойного прыжка
    if (!this.input.state.jump && this.wasJumpPressed) {
      this.player.onJumpReleased();
    }
    this.wasJumpPressed = this.input.state.jump;

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

    // Общий proximity звук отключён - у каждого врага свой звук
    this.audio.updateProximitySound(0);

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
    this.hud.updateSplashCharges(this.weapon.splashCharges);
    this.hud.updateDoubleJump(this.player.getDoubleJumpCooldown(), this.player.isDoubleJumpReady());
    
    // Обновляем очки
    this.hud.updateCarryingScore(this.carryingScore);
    const totalAltarScore = this.altars.reduce((sum, a) => sum + a.score, 0);
    this.hud.updateAltarScore(totalAltarScore);
    this.hud.updateDarts(this.darts);
    
    // Проверка низкого HP для тревожной музыки (меньше 30%)
    const hpPercent = this.player.state.health / this.player.state.maxHealth;
    this.audio.setLowHpMode(hpPercent < 0.3 && hpPercent > 0);
    
    // Показываем HP босса если есть
    const boss = this.targetManager.getActiveBoss();
    if (boss) {
      this.hud.showBossHealth(boss.hp, boss.maxHp, boss.enemyType);
    } else {
      this.hud.hideBossHealth();
    }
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
    this.audio.playSFX('katana_swing');
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

  /** Перезапуск - полный сброс игры */
  private restart(): void {
    // Сброс игрока
    this.player.reset(vec3(0, 1.7, 12));
    this.player.state.health = 100;
    this.player.state.maxHealth = 100;
    
    // Сброс состояния игры
    this.state.frags = 0;
    this.state.isPaused = false;
    
    // Сброс режимов
    this.isInVoid = false;
    this.player.isInVoid = false;
    
    // Сброс очков
    this.carryingScore = 0;
    this.darts = 0;
    
    // Сброс алтарей
    this.altars.forEach(altar => { altar.score = 0; });
    
    // Сброс оружия
    this.weapon.splashCharges = 0;
    this.weapon.isAttacking = false;
    this.weapon.attackProgress = 0;
    
    // Сброс эффектов
    this.screenShake = 0;
    this.slowdownFactor = 1;
    this.slowdownTimer = 0;
    
    // Сброс врагов и пикапов - начинаем с волны 1!
    this.targetManager.startGame(1);
    this.pickupManager.pickups = [];
    
    // Обновить HUD
    this.hud.updateCarryingScore(0);
    this.hud.updateAltarScore(0);
    this.hud.updateDarts(0);
    this.hud.updateSplashCharges(0);
  }

  /** === VOID MODE === */

  /** Вход в войд - ECLIPSE (Берсерк) */
  private enterVoidMode(): void {
    this.isInVoid = true;
    this.player.isInVoid = true; // Отключаем collision для игрока
    this.voidEnemyIds = [];
    this.voidFallOffset = 0;
    this.voidPhantomCooldown.clear(); // Очищаем кулдауны

    // Включаем глубокий low pass фильтр
    this.audio.enterVoidAudio();

    // Сохраняем позицию для возврата
    this.savedPosition = { ...this.player.state.position };
    this.savedYaw = this.player.state.yaw;

    // Телепортируем игрока в центр войда
    this.player.state.position = vec3(0, 2, 0);
    this.player.state.velocity = vec3(0, 0, 0);
    this.player.state.grounded = true; // Может бежать!

    // Создаём портал выхода в случайном направлении
    const portalAngle = Math.random() * Math.PI * 2;
    this.portalPos = vec3(
      Math.cos(portalAngle) * this.PORTAL_DISTANCE,
      3, // Немного над землёй
      Math.sin(portalAngle) * this.PORTAL_DISTANCE
    );

    // Сохраняем состояние волны
    this.savedWaveActive = this.targetManager.waveActive;
    
    // Сохраняем и "замораживаем" всех врагов (не удаляем!)
    this.savedEnemyIds = [];
    for (const target of this.targetManager.targets) {
      if (target.active) {
        this.savedEnemyIds.push(target.id);
        target.active = false;
        // Устанавливаем большой таймер чтобы враги не удалились пока мы в войде
        target.removeTimer = 9999;
      }
    }

    // Эффекты входа
    this.hud.showVoidEnter();
    this.screenShake = 1.5;
    
    // Спавним первого фантома сразу
    this.voidSpawnTimer = 1.0;
    this.voidEnemyIds = [];
  }

  /** Обновление void mode - ECLIPSE */
  private updateVoidMode(dt: number): void {
    if (!this.isInVoid) return;

    // === ЭФФЕКТ ПАДЕНИЯ (визуальный) ===
    this.voidFallOffset += dt * 5.0;
    
    // Лёгкая тряска для атмосферы
    this.screenShake = Math.max(this.screenShake, 0.03);

    // Игрок может СВОБОДНО двигаться и бежать к порталу!
    const playerPos = this.player.state.position;
    
    // === ПРОВЕРКА ПАДЕНИЯ С ОСТРОВОВ И ОБЛОМКОВ ===
    // Главный остров (центр, радиус 10 - уменьшен!)
    const distToMainIsland = Math.sqrt(playerPos.x ** 2 + playerPos.z ** 2);
    const onMainIsland = distToMainIsland < 10;
    
    // Остров у портала (радиус 5 - уменьшен!)
    const distToPortalIsland = Math.sqrt(
      (playerPos.x - this.portalPos.x) ** 2 + 
      (playerPos.z - this.portalPos.z) ** 2
    );
    const onPortalIsland = distToPortalIsland < 5;
    
    // Обломки между островами (нужно прыгать!)
    const toPortalDir = { x: this.portalPos.x, z: this.portalPos.z };
    const portalDist = Math.sqrt(toPortalDir.x ** 2 + toPortalDir.z ** 2);
    if (portalDist > 0) {
      toPortalDir.x /= portalDist;
      toPortalDir.z /= portalDist;
    }
    
    // Проверяем все 8 обломков
    const bridgeLen = portalDist - 5.0 - 10.0; // Синхронизировано с шейдером
    let onFragment = false;
    let fragmentFloorY = -100;
    
    for (let i = 0; i < 8; i++) {
      // Позиция обломка (должна совпадать с шейдером!)
      const fragmentPos = 12.0 + i * (bridgeLen / 7.0);
      const randX = Math.sin(i * 73.1) * 2.0;
      const randZ = Math.cos(i * 47.3) * 2.0;
      const randY = Math.sin(i * 91.7) * 0.8 - 0.3;
      
      // Размер (2-4м) - используем такую же псевдослучайность как в шейдере
      const fract = (x: number) => x - Math.floor(x);
      const fragmentSize = 2.0 + fract(Math.sin(i * 127.3) * 43758.5) * 2.0;
      const sizeX = fragmentSize * (0.8 + fract(Math.sin(i * 31.7) * 100.0) * 0.4);
      const sizeZ = fragmentSize * (0.8 + fract(Math.sin(i * 57.3) * 100.0) * 0.4);
      
      // Центр обломка
      const fragCenterX = toPortalDir.x * fragmentPos + randX;
      const fragCenterZ = toPortalDir.z * fragmentPos + randZ;
      const fragY = randY + 0.5; // Высота поверхности
      
      // Проверяем XZ
      const rotAngle = i * 0.7;
      const localX = (playerPos.x - fragCenterX) * Math.cos(-rotAngle) - (playerPos.z - fragCenterZ) * Math.sin(-rotAngle);
      const localZ = (playerPos.x - fragCenterX) * Math.sin(-rotAngle) + (playerPos.z - fragCenterZ) * Math.cos(-rotAngle);
      
      if (Math.abs(localX) < sizeX && Math.abs(localZ) < sizeZ) {
        onFragment = true;
        fragmentFloorY = Math.max(fragmentFloorY, fragY + 1.8); // Высота глаз
      }
    }
    
    // Определяем высоту пола под игроком
    let floorY = -100; // Нет пола
    
    if (onMainIsland || onPortalIsland) {
      floorY = 2.0; // Высота островов
    } else if (onFragment) {
      floorY = fragmentFloorY;
    }
    
    // Упали в бездну?
    if (playerPos.y < -5) {
      this.fallFromVoid();
      return;
    }
    
    // Физика
    if (floorY > -50 && playerPos.y <= floorY) {
      // На твёрдой поверхности
      this.player.state.position.y = floorY;
      this.player.state.grounded = true;
      this.player.state.velocity.y = 0;
    } else {
      // В воздухе - гравитация!
      this.player.state.grounded = false;
      this.player.state.velocity.y -= 30 * dt; // Гравитация (усилил)
      this.player.state.position.y += this.player.state.velocity.y * dt;
    }
    
    // === МОНЕТЫ КРОВИ ===
    this.updateBloodCoins(dt);

    // === ПРОВЕРКА ДОСТИЖЕНИЯ ПОРТАЛА ===
    const dx = this.player.state.position.x - this.portalPos.x;
    const dz = this.player.state.position.z - this.portalPos.z;
    const distToPortal = Math.sqrt(dx * dx + dz * dz);

    if (distToPortal < this.PORTAL_RADIUS) {
      // Достигли портала - выход!
      this.exitVoidMode(true);
      return;
    }

    // === СПАВН ФАНТОМОВ-ОХОТНИКОВ ===
    this.voidSpawnTimer -= dt;
    if (this.voidSpawnTimer <= 0) {
      this.spawnVoidHunter();
      this.voidSpawnTimer = this.VOID_SPAWN_INTERVAL;
    }

    // Обновляем HUD с расстоянием до портала
    this.hud.showVoidMode(Math.floor(distToPortal), this.PORTAL_DISTANCE);

    // Проверяем смерть
    if (this.player.isDead()) {
      this.exitVoidMode(false);
    }
  }

  /** Спавн фантома-охотника в войде */
  private spawnVoidHunter(): void {
    const playerPos = this.player.state.position;
    
    // Спавним позади или сбоку от игрока (не перед ним)
    const playerYaw = this.player.state.yaw;
    const offsetAngle = (Math.random() - 0.5) * Math.PI + Math.PI; // Сзади ± 90°
    const angle = playerYaw + offsetAngle;
    const dist = 15 + Math.random() * 10; // 15-25 единиц

    const spawnPos = vec3(
      playerPos.x + Math.cos(angle) * dist,
      2.0,
      playerPos.z + Math.sin(angle) * dist
    );

    // Быстрый агрессивный фантом!
    const phantomId = Date.now() + Math.floor(Math.random() * 1000);
    const phantom = new Target(
      spawnPos,
      12.0 + Math.random() * 4, // Скорость 12-16
      phantomId,
      'phantom',
      this.collision
    );

    phantom.active = true;
    this.targetManager.targets.push(phantom);
    this.voidEnemyIds.push(phantomId);
    
    // Жуткий звук появления
    this.audio.playSFX('void_whistle');
  }

  /** Падение из войда в обычный мир */
  private fallFromVoid(): void {
    this.isInVoid = false;
    this.player.isInVoid = false;
    this.voidCoins = []; // Очищаем монеты
    
    // Убираем фильтр
    this.audio.exitVoidAudio();
    this.hud.hideVoidMode();
    
    // Выходим через случайный портал (как враги)
    const portal = Math.random() < 0.5 ? PORTAL_POSITIONS.left : PORTAL_POSITIONS.right;
    // Чуть впереди портала чтобы выйти из него
    const exitOffset = portal.x > 0 ? -3 : 3;
    
    this.player.state.position = { 
      x: portal.x + exitOffset, 
      y: portal.y, 
      z: portal.z 
    };
    this.player.state.velocity = { x: 0, y: 0, z: 0 };
    this.player.state.grounded = true;
    
    // Эффекты
    this.screenShake = 1.0;
    this.audio.playSFX('player_hurt');
    this.hud.showMessage('💀 ВЫШВЫРНУЛО ИЗ БЕЗДНЫ!', 'purple');
    
    // Небольшой урон за падение
    this.player.state.health -= 15;
    this.hud.showDamage();
    this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
    
    if (this.player.isDead()) {
      this.gameOver();
    }
  }
  
  /** Выход из войда */
  private exitVoidMode(success: boolean): void {
    this.isInVoid = false;
    this.player.isInVoid = false; // Включаем collision обратно
    this.hud.hideVoidMode();
    
    // Закрываем портал и сбрасываем таймер чтобы не попасть обратно
    this.voidPortalActive = false;
    this.voidPortalTimer = this.VOID_PORTAL_COOLDOWN + 3; // +3 секунды запаса
    this.voidCoins = []; // Очищаем монеты
    
    // Убираем фильтр - возвращаем нормальный звук
    this.audio.exitVoidAudio();

    // Убираем всех void-врагов (фантомов созданных в войде)
    for (const target of this.targetManager.targets) {
      if (this.voidEnemyIds.includes(target.id)) {
        target.active = false;
      }
    }
    this.voidEnemyIds = [];

    // ВОССТАНАВЛИВАЕМ врагов которые были активны до войда
    for (const target of this.targetManager.targets) {
      if (this.savedEnemyIds.includes(target.id)) {
        target.active = true;
        target.removeTimer = 0; // Сбрасываем таймер удаления
      }
    }
    this.savedEnemyIds = [];
    
    // Восстанавливаем состояние волны
    this.targetManager.waveActive = this.savedWaveActive;

    // Возвращаем игрока
    this.player.state.position = { ...this.savedPosition };
    this.player.state.yaw = this.savedYaw;
    this.player.state.velocity = vec3(0, 0, 0);
    this.player.state.grounded = true;

    // Эффекты выхода из войда
    this.screenShake = 0.5;

    if (success) {
      this.hud.showVoidExit(true);
      // Бонус за выживание
      this.state.frags += 500;
      this.hud.showMessage(`+500 БОНУС ЗА ВОЙД!`, 'cyan');
    } else {
      this.hud.showVoidExit(false);
      // Урон за провал
      this.player.takeDamage(50);
    }
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

  /** Звуки приближения врагов - у каждого свой звук */
  private updateEnemyProximitySounds(playerPos: Vec3): void {
    // В войде не играем звуки приближения (кроме свиста при спавне)
    if (this.isInVoid) return;

    for (const target of this.targetManager.targets) {
      if (!target.active) continue;

      const dx = target.position.x - playerPos.x;
      const dy = target.position.y - playerPos.y;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Каждый тип врага издаёт свой звук при приближении
      this.audio.playEnemyProximitySound(target.enemyType, dist);
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
      // Маленькая аптечка (в воде) - восстанавливает 20 HP
      const heal = 20;
      this.player.state.health = Math.min(
        this.player.state.maxHealth,
        this.player.state.health + heal
      );
      this.audio.playSFX('jump'); // Временный звук
      this.hud.showMessage('+' + heal + ' HP', 'lime');
      this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
    } else if (type === 'health_big') {
      // БОЛЬШАЯ аптечка (на краях) - восстанавливает 60 HP!
      const heal = 60;
      this.player.state.health = Math.min(
        this.player.state.maxHealth,
        this.player.state.health + heal
      );
      this.audio.playSFX('jump'); // Временный звук
      this.hud.showMessage('+' + heal + ' HP!', 'lime');
      this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
      
    } else if (type === 'stimpack') {
      // Стимпак - буйство!
      this.player.activateStimpack();
      this.audio.playSFX('kill'); // Временный звук
      this.hud.showMessage('🔥 БУЙСТВО! 🔥', 'red');
      this.hud.showRageOverlay(8.0);
      
    } else if (type === 'charge') {
      // Заряд катаны - 3 сплеш-удара!
      this.weapon.chargeKatana();
      this.audio.playSFX('charge_pickup');
      this.hud.showMessage('⚡ КАТАНА ЗАРЯЖЕНА! (ПКМ x3) ⚡', 'cyan');
      this.hud.updateSplashCharges(3);
      this.screenShake = 0.5;
    }
  }

  /** Проверка обычной атаки */
  private checkNormalAttack(): void {
    const playerPos = this.player.getEyePosition();
    
    // Определяем тип удара по позиции ближайшего врага
    const [targetAngle, _] = this.getKatanaTargetData();
    // Если враг слева (угол < 0) → бьём справа (тип 0)
    // Если враг справа (угол > 0) → бьём слева (тип 1)
    const smartAttackType = targetAngle > 0 ? 1 : 0;
    this.weapon.attackType = smartAttackType;
    
    const hit = this.targetManager.trySlice(
      playerPos,
      this.player.state.yaw,
      this.weapon.attackRange,
      this.weapon.attackAngle,
      this.player.state.grounded, // Передаём состояние - на земле ли игрок
      smartAttackType // Тип удара зависит от позиции врага
    );
    
    if (hit) {
      this.lastSliceTime = this.gameTime;
      this.weaponRenderer.showHitEffect();
      this.audio.playSFX('kill');
      // СМАЧНЫЙ удар - тряска экрана!
      this.screenShake = 0.4;
    }

    // Проверяем попадание по кристаллам (только на волне 10)
    if (this.targetManager.wave === 10) {
      const crystalHit = this.targetManager.trySliceCrystal(
        playerPos,
        this.player.state.yaw,
        this.weapon.attackRange
      );
      
      if (crystalHit) {
        this.weaponRenderer.showHitEffect();
        this.audio.playSFX('kill');
        const remaining = this.targetManager.powerCrystals.filter(c => c.active).length;
        
        if (remaining === 0) {
          this.hud.showMessage('💀 КРИСТАЛЛЫ УНИЧТОЖЕНЫ! БОСС ОСЛАБЛЕН! 💀', 'purple');
          this.screenShake = 2.0;
        } else {
          this.hud.showMessage(`🔮 КРИСТАЛЛ РАЗБИТ! (${remaining}/6)`, 'cyan');
        }
      }
    }
    
    // === ПРОВЕРКА ПОПАДАНИЯ ПО АЛТАРЮ ===
    const altarHit = this.checkAltarHit(playerPos);
    if (altarHit !== null) {
      // Приоритет 1: Монеты крови → Гранаты
      if (this.bloodCoins >= this.GRENADE_COST) {
        this.bloodCoins -= this.GRENADE_COST;
        this.grenadeCount += 1;
        this.altars[altarHit].score += this.GRENADE_COST;
        this.audio.playSFX('kill');
        this.hud.showMessage(`💣 +1 ГРАНАТА! (🩸${this.bloodCoins})`, 'purple');
        this.screenShake = 0.3;
      }
      // Приоритет 2: Очки → Дротики
      else if (this.carryingScore > 0) {
        const dartsEarned = this.carryingScore * this.DARTS_PER_POINT;
        this.darts += dartsEarned;
        this.altars[altarHit].score += this.carryingScore;
        this.audio.playSFX('kill');
        this.hud.showMessage(`🎯 +${dartsEarned} ДРОТИКОВ!`, 'cyan');
        this.carryingScore = 0;
        this.screenShake = 0.3;
      } else {
        // Нет ни монет ни очков
        this.hud.showMessage(`НУЖНЫ ОЧКИ ИЛИ 🩸${this.GRENADE_COST} МОНЕТ!`, 'purple');
      }
    }
  }
  
  /** Спавн монет крови в войде */
  private spawnBloodCoins(): void {
    this.voidCoins = [];
    
    // Направление к порталу
    const toPortalDir = { x: this.portalPos.x, z: this.portalPos.z };
    const portalDist = Math.sqrt(toPortalDir.x ** 2 + toPortalDir.z ** 2);
    if (portalDist > 0) {
      toPortalDir.x /= portalDist;
      toPortalDir.z /= portalDist;
    }
    const bridgeLen = portalDist - 6.0 - 12.0;
    
    // Монеты на обломках (одна на каждом)
    const fract = (x: number) => x - Math.floor(x);
    for (let i = 0; i < 8; i++) {
      const fragmentPos = 14.0 + i * (bridgeLen / 7.0);
      const randX = Math.sin(i * 73.1) * 2.0;
      const randZ = Math.cos(i * 47.3) * 2.0;
      const randY = Math.sin(i * 91.7) * 0.8 - 0.3 + 2.0; // На поверхности обломка
      
      const coinX = toPortalDir.x * fragmentPos + randX;
      const coinZ = toPortalDir.z * fragmentPos + randZ;
      
      this.voidCoins.push({
        position: { x: coinX, y: randY, z: coinZ },
        active: true,
        phase: Math.random() * Math.PI * 2,
      });
    }
    
    // Дополнительные монеты на островах
    const islandCoins = [
      { x: 8, z: 8 },
      { x: -8, z: 8 },
      { x: 8, z: -8 },
      { x: -8, z: -8 },
    ];
    
    for (const pos of islandCoins) {
      this.voidCoins.push({
        position: { x: pos.x, y: 2.0, z: pos.z },
        active: true,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  
  /** Обновление монет крови */
  private updateBloodCoins(dt: number): void {
    if (!this.isInVoid) return;
    
    const playerPos = this.player.state.position;
    
    for (const coin of this.voidCoins) {
      if (!coin.active) continue;
      
      // Анимация парения
      coin.position.y = 1.5 + Math.sin(this.gameTime * 3 + coin.phase) * 0.3;
      
      // Проверка подбора
      const dx = coin.position.x - playerPos.x;
      const dy = coin.position.y - playerPos.y;
      const dz = coin.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 2.0) {
        coin.active = false;
        this.bloodCoins++;
        this.audio.playSFX('kill');
        this.hud.showMessage(`🩸 +1 МОНЕТА КРОВИ (${this.bloodCoins})`, 'purple');
      }
    }
  }
  
  /** Обновление портала в войд */
  private updateVoidPortal(dt: number): void {
    // Не в войде и не на паузе
    if (this.isInVoid || this.isPaused) return;
    
    if (this.voidPortalActive) {
      // Портал открыт - уменьшаем время жизни
      this.voidPortalLifetime -= dt;
      
      // Проверяем вход игрока в портал
      const playerPos = this.player.state.position;
      const distToPortal = Math.sqrt(playerPos.x ** 2 + playerPos.z ** 2);
      
      if (distToPortal < 2.5) {
        // Игрок вошёл в портал!
        this.enterVoid();
        return;
      }
      
      if (this.voidPortalLifetime <= 0) {
        // Портал закрывается
        this.voidPortalActive = false;
        this.voidPortalTimer = this.VOID_PORTAL_COOLDOWN;
        this.hud.showMessage('⚫ ПОРТАЛ ЗАКРЫЛСЯ', 'purple');
      }
    } else {
      // Ждём появления портала
      this.voidPortalTimer -= dt;
      
      if (this.voidPortalTimer <= 0) {
        // Открываем портал!
        this.voidPortalActive = true;
        this.voidPortalLifetime = this.VOID_PORTAL_DURATION;
        this.audio.playSFX('kill'); // Звук открытия
        this.hud.showMessage('🌀 ПОРТАЛ В ВОЙД ОТКРЫЛСЯ!', 'purple');
        this.screenShake = 0.5;
      } else if (this.voidPortalTimer <= 5) {
        // Предупреждение за 5 секунд
        if (Math.floor(this.voidPortalTimer) !== Math.floor(this.voidPortalTimer + dt)) {
          this.hud.showMessage(`⚫ ПОРТАЛ ЧЕРЕЗ ${Math.ceil(this.voidPortalTimer)}...`, 'purple');
        }
      }
    }
  }
  
  /** Вход в войд через портал */
  private enterVoid(): void {
    this.isInVoid = true;
    this.player.isInVoid = true; // Включаем режим войда для игрока!
    this.voidPortalActive = false;
    this.voidEnemyIds = [];
    this.voidFallOffset = 0;
    
    // Случайный вариант войда (разные цвета/атмосфера)
    this.voidVariant = Math.floor(Math.random() * 4); // 0-3
    
    // Сохраняем позицию для возврата
    this.savedPosition = { ...this.player.state.position };
    this.savedYaw = this.player.state.yaw;
    
    const voidNames = ['БАГРОВЫЙ', 'ИЗУМРУДНЫЙ', 'ЗОЛОТОЙ', 'ЛЕДЯНОЙ'];
    this.hud.showMessage(`🌀 ${voidNames[this.voidVariant]} ВОЙД!`, 'purple');
    this.audio.playSFX('kill');
    this.screenShake = 1.0;
    
    // Включаем глубокий low pass фильтр
    this.audio.enterVoidAudio();
    
    // Телепортируем игрока на остров в войде
    this.player.state.position = { x: 0, y: 2, z: 0 };
    this.player.state.velocity = { x: 0, y: 0, z: 0 };
    this.player.state.grounded = true;
    
    // Устанавливаем позицию портала выхода (случайное направление, дальше!)
    const portalAngle = Math.random() * Math.PI * 2;
    this.portalPos = { 
      x: Math.cos(portalAngle) * 40, // Далеко - нужно прыгать по обломкам!
      y: 2, 
      z: Math.sin(portalAngle) * 40 
    };
    
    // Спавним монеты крови в войде!
    this.spawnBloodCoins();
    
    // Спавним фантомов
    this.voidSpawnTimer = 2.0;
  }
  
  /** Выстрел дротиком */
  private fireDart(): void {
    if (this.darts <= 0) return;
    
    this.darts--;
    this.audio.playSFX('jump'); // Звук выстрела (временный)
    
    const playerPos = this.player.getEyePosition();
    const yaw = this.player.state.yaw;
    const pitch = this.player.state.pitch;
    
    // Направление взгляда
    const dirX = Math.sin(yaw) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = -Math.cos(yaw) * Math.cos(pitch);
    
    // Небольшой разброс для реализма
    const spread = 0.03;
    const spreadX = (Math.random() - 0.5) * spread;
    const spreadY = (Math.random() - 0.5) * spread;
    const spreadZ = (Math.random() - 0.5) * spread;
    
    const speed = 60; // Очень быстрые дротики
    
    this.flyingDarts.push({
      position: { 
        x: playerPos.x + dirX * 0.5, // Смещение от камеры
        y: playerPos.y - 0.2,        // Немного ниже глаз
        z: playerPos.z + dirZ * 0.5 
      },
      velocity: {
        x: (dirX + spreadX) * speed,
        y: (dirY + spreadY) * speed,
        z: (dirZ + spreadZ) * speed,
      },
      active: true,
    });
  }
  
  /** Обновление летящих дротиков */
  private updateDarts(dt: number): void {
    for (const dart of this.flyingDarts) {
      if (!dart.active) continue;
      
      // Движение
      dart.position.x += dart.velocity.x * dt;
      dart.position.y += dart.velocity.y * dt;
      dart.position.z += dart.velocity.z * dt;
      
      // Гравитация (небольшая)
      dart.velocity.y -= 15 * dt;
      
      // Проверяем попадание по врагам
      for (const target of this.targetManager.targets) {
        if (!target.active) continue;
        
        const dx = dart.position.x - target.position.x;
        const dy = dart.position.y - target.position.y;
        const dz = dart.position.z - target.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < target.radius + 0.5) {
          // Попадание!
          dart.active = false;
          const killed = target.takeDamage(this.DART_DAMAGE);
          this.audio.playSFX('kill');
          this.hud.showHitmarker(false);
          
          // Убиваем если HP <= 0
          if (killed || target.hp <= 0) {
            const sliceDir = { x: dx / (dist || 1), y: 0, z: dz / (dist || 1) };
            target.slice(sliceDir);
            this.targetManager.onTargetDestroyed?.(target);
          }
          break;
        }
      }
      
      // Дезактивируем если улетел далеко или упал
      if (dart.position.y < -5 || 
          Math.abs(dart.position.x) > 50 || 
          Math.abs(dart.position.z) > 50) {
        dart.active = false;
      }
    }
    
    // Удаляем неактивные
    this.flyingDarts = this.flyingDarts.filter(d => d.active);
  }
  
  /** Бросок гранаты */
  private throwGrenade(): void {
    if (this.grenadeCount <= 0) return;
    
    this.grenadeCount--;
    this.audio.playSFX('jump'); // Звук броска
    
    const playerPos = this.player.getEyePosition();
    const yaw = this.player.state.yaw;
    const pitch = this.player.state.pitch;
    
    // Направление броска (по взгляду)
    const dirX = Math.sin(yaw) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = -Math.cos(yaw) * Math.cos(pitch);
    
    this.grenades.push({
      position: { 
        x: playerPos.x + dirX * 1.0,
        y: playerPos.y,
        z: playerPos.z + dirZ * 1.0
      },
      velocity: {
        x: dirX * this.GRENADE_SPEED,
        y: dirY * this.GRENADE_SPEED + 5, // Немного вверх
        z: dirZ * this.GRENADE_SPEED
      },
      active: true,
      lifetime: this.GRENADE_FUSE
    });
    
    this.hud.showMessage(`💣 ГРАНАТА! (осталось: ${this.grenadeCount})`, 'purple');
  }
  
  /** Обновление гранат */
  private updateGrenades(dt: number): void {
    for (const grenade of this.grenades) {
      if (!grenade.active) continue;
      
      // Движение
      grenade.position.x += grenade.velocity.x * dt;
      grenade.position.y += grenade.velocity.y * dt;
      grenade.position.z += grenade.velocity.z * dt;
      
      // Гравитация
      grenade.velocity.y -= this.GRENADE_GRAVITY * dt;
      
      // Отскок от земли
      if (grenade.position.y < 0.5) {
        grenade.position.y = 0.5;
        grenade.velocity.y = -grenade.velocity.y * 0.5; // Потеря энергии
        grenade.velocity.x *= 0.8;
        grenade.velocity.z *= 0.8;
      }
      
      // Таймер взрыва
      grenade.lifetime -= dt;
      if (grenade.lifetime <= 0) {
        this.explodeGrenade(grenade.position);
        grenade.active = false;
      }
    }
    
    // Удаляем неактивные
    this.grenades = this.grenades.filter(g => g.active);
  }
  
  /** Взрыв гранаты */
  private explodeGrenade(position: Vec3): void {
    // Создаём визуальный взрыв
    this.explosions.push({
      position: { ...position },
      progress: 0,
      active: true
    });
    
    // Звук взрыва (глитч-эффект)
    this.audio.playSFX('explosion');
    this.screenShake = 3.0;
    
    // Наносим урон врагам в радиусе
    for (const target of this.targetManager.targets) {
      if (!target.active) continue;
      
      const dx = position.x - target.position.x;
      const dy = position.y - target.position.y;
      const dz = position.z - target.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < this.EXPLOSION_RADIUS) {
        // Урон падает с расстоянием
        const damageMultiplier = 1 - (dist / this.EXPLOSION_RADIUS);
        const damage = this.EXPLOSION_DAMAGE * damageMultiplier;
        const killed = target.takeDamage(damage);
        this.hud.showHitmarker(false);
        
        // Убиваем если HP <= 0
        if (killed || target.hp <= 0) {
          const sliceDir = { x: dx / (dist || 1), y: 0, z: dz / (dist || 1) };
          target.slice(sliceDir);
          this.targetManager.onTargetDestroyed?.(target);
        }
      }
    }
    
    // Глитч-эффект: телепортация в радиусе взрыва
    const playerPos = this.player.state.position;
    const playerDist = Math.sqrt(
      (position.x - playerPos.x) ** 2 +
      (position.y - playerPos.y) ** 2 +
      (position.z - playerPos.z) ** 2
    );
    if (playerDist < this.EXPLOSION_RADIUS) {
      // Телепортируем игрока в случайное место в радиусе взрыва!
      const teleportAngle = Math.random() * Math.PI * 2;
      const teleportDist = Math.random() * this.EXPLOSION_RADIUS;
      const newX = position.x + Math.cos(teleportAngle) * teleportDist;
      const newZ = position.z + Math.sin(teleportAngle) * teleportDist;
      
      this.player.state.position.x = newX;
      this.player.state.position.z = newZ;
      
      // Небольшой урон за глитч
      const selfDamage = 10;
      this.player.state.health -= selfDamage;
      this.hud.showDamage();
      this.hud.updateHealth(this.player.state.health, this.player.state.maxHealth);
      this.hud.showMessage('⚡ GLITCH TELEPORT!', 'cyan');
      
      // Дополнительная тряска
      this.screenShake = 1.5;
      
      if (this.player.isDead()) {
        this.gameOver();
      }
    }
  }
  
  /** Обновление взрывов */
  private updateExplosions(dt: number): void {
    for (const exp of this.explosions) {
      if (!exp.active) continue;
      
      exp.progress += dt / this.EXPLOSION_DURATION;
      if (exp.progress >= 1) {
        exp.active = false;
      }
    }
    
    this.explosions = this.explosions.filter(e => e.active);
  }
  
  /** Проверка попадания по алтарю */
  private checkAltarHit(playerPos: Vec3): number | null {
    const range = this.weapon.attackRange + 1.5; // Немного больше радиус
    
    for (let i = 0; i < this.altars.length; i++) {
      const altar = this.altars[i];
      const dx = playerPos.x - altar.position.x;
      const dz = playerPos.z - altar.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < range) {
        // Проверяем направление взгляда
        const toAltarX = altar.position.x - playerPos.x;
        const toAltarZ = altar.position.z - playerPos.z;
        const toAltarLen = Math.sqrt(toAltarX * toAltarX + toAltarZ * toAltarZ);
        
        if (toAltarLen > 0.1) {
          const lookX = Math.sin(this.player.state.yaw);
          const lookZ = -Math.cos(this.player.state.yaw);
          const dot = (toAltarX / toAltarLen) * lookX + (toAltarZ / toAltarLen) * lookZ;
          
          // Если смотрим в сторону алтаря (угол < 60°)
          if (dot > 0.5) {
            return i;
          }
        }
      }
    }
    return null;
  }

  /** Проверка сплеш-атаки - горизонтальная волна */
  private checkSplashAttack(): void {
    const playerPos = this.player.getEyePosition();
    
    // Сплеш бьёт всех врагов в радиусе
    const hits = this.targetManager.trySplashWave(
      playerPos,
      this.player.state.yaw,
      this.weapon.splashRadius
    );
    
    if (hits > 0) {
      this.lastSliceTime = this.gameTime;
      this.weaponRenderer.showSplashWave(this.player.state.yaw);
      this.screenShake = 0.4;
      this.audio.playSFX('kill');
      
      // Показываем сколько убито
      this.hud.showMessage(`🌊 ВОЛНА x${hits}! 🌊`, 'cyan');
    }
    
    // Обновляем HUD с зарядами
    this.hud.updateSplashCharges(this.weapon.splashCharges);
  }

  /** Создать эффект смерти врага */
  private spawnDeathEffect(position: Vec3): void {
    // Ищем неактивный слот или создаём новый
    let effect = this.deathEffects.find(e => !e.active);
    if (!effect && this.deathEffects.length < 8) {
      effect = { position: { x: 0, y: 0, z: 0 }, progress: 0, active: false };
      this.deathEffects.push(effect);
    }
    
    if (effect) {
      effect.position = { ...position };
      effect.progress = 0.01; // Начинаем с малого значения
      effect.active = true;
    }
  }
  
  /** Обновить эффекты смерти */
  private updateDeathEffects(dt: number): void {
    for (const effect of this.deathEffects) {
      if (effect.active) {
        effect.progress += dt / this.DEATH_EFFECT_DURATION;
        if (effect.progress >= 1.0) {
          effect.active = false;
        }
      }
    }
  }
  
  /** Угол и расстояние до ближайшего врага для автонаведения катаны */
  private getKatanaTargetData(): [number, number] {
    const playerPos = this.player.getEyePosition();
    const playerYaw = this.player.state.yaw;
    
    let nearestAngle = -1; // -1 = нет врага поблизости
    let nearestDist = 100;
    
    const maxRange = 5.0; // Максимальная дистанция для автонаведения
    const maxAngle = Math.PI / 2; // 90 градусов в каждую сторону
    
    for (const target of this.targetManager.targets) {
      if (!target.active) continue;
      
      const dx = target.position.x - playerPos.x;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > maxRange) continue;
      
      // Угол к врагу относительно направления взгляда
      const angleToTarget = Math.atan2(dx, -dz);
      let angleDiff = angleToTarget - playerYaw;
      
      // Нормализуем угол
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Враг в поле зрения?
      if (Math.abs(angleDiff) > maxAngle) continue;
      
      // Ближе чем текущий?
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestAngle = angleDiff;
      }
    }
    
    return [nearestAngle, nearestDist];
  }
  
  /** Количество фрагментов для шейдера */
  private getFragmentCount(): number {
    let count = 0;
    for (const target of this.targetManager.targets) {
      count += target.fragments.length;
    }
    return count;
  }
  
  /** Данные эффектов смерти для шейдера */
  private getDeathEffectsData(): Float32Array {
    const data = new Float32Array(32); // 8 эффектов * 4 компонента
    for (let i = 0; i < Math.min(this.deathEffects.length, 8); i++) {
      const effect = this.deathEffects[i];
      if (effect.active) {
        data[i * 4 + 0] = effect.position.x;
        data[i * 4 + 1] = effect.position.y;
        data[i * 4 + 2] = effect.position.z;
        data[i * 4 + 3] = effect.progress;
      }
    }
    return data;
  }

  /** Активация адреналина за комбо-убийства */
  private activateComboAdrenaline(): void {
    // Сбрасываем счётчик комбо
    this.killTimes = [];
    
    // Активируем буйство
    this.player.activateStimpack();
    this.audio.playSFX('kill');
    this.hud.showMessage('🔥🔥🔥 КОМБО АДРЕНАЛИН! 🔥🔥🔥', 'red');
    this.hud.showRageOverlay(8.0);
    this.screenShake = 0.5;
  }

  /** Рендеринг */
  private render(): void {
    // Данные врагов для шейдера
    const targetsData = this.targetManager.getShaderData();
    const targetCount = this.targetManager.targets.length;

    // Данные луж для шейдера
    const poolsData = this.targetManager.getPoolsShaderData();
    const poolCount = this.targetManager.toxicPools.length;

    // Данные пикапов для шейдера
    const pickupsData = this.pickupManager.getShaderData();
    const pickupCount = this.pickupManager.pickups.length;

    // Тряска камеры
    let yaw = this.player.state.yaw;
    let pitch = this.player.state.pitch;
    
    if (this.screenShake > 0) {
      yaw += (Math.random() - 0.5) * this.screenShake * 0.1;
      pitch += (Math.random() - 0.5) * this.screenShake * 0.1;
    }

    // Вспышка при ударе
    const sliceFlash = Math.max(0, 0.3 - (this.gameTime - this.lastSliceTime)) * 3;

    // Данные кристаллов (для волны 10)
    const crystalsData = this.targetManager.getCrystalsData();

    // Данные летящих снарядов кислоты
    const acidProjectilesData = this.targetManager.getAcidProjectilesData();
    const acidProjectileCount = this.targetManager.acidProjectiles.length;

    // Данные лазеров спайкеров
    const spikesData = this.targetManager.getSpikesData();
    const spikeTargetsData = this.targetManager.getSpikeTargetsData();
    const spikeCount = Math.min(this.targetManager.spikes.length, 8);

    // Данные зон кислотного дождя
    const acidRainZonesData = this.targetManager.getAcidRainZonesData();
    const acidRainZoneCount = this.targetManager.acidRainZones.length;
    
    // Данные алтарей [x, y, z, score]
    const altarsData = new Float32Array(8);
    for (let i = 0; i < this.altars.length; i++) {
      altarsData[i * 4 + 0] = this.altars[i].position.x;
      altarsData[i * 4 + 1] = this.altars[i].position.y;
      altarsData[i * 4 + 2] = this.altars[i].position.z;
      altarsData[i * 4 + 3] = this.altars[i].score;
    }
    
    // Данные лучей [x, y, z, active] и направления [dx, dy, dz, speed]
    const dartsData = new Float32Array(64); // 16 лучей * 4
    const dartDirsData = new Float32Array(64); // 16 направлений * 4
    const dartCount = Math.min(this.flyingDarts.length, 16);
    for (let i = 0; i < dartCount; i++) {
      const dart = this.flyingDarts[i];
      dartsData[i * 4 + 0] = dart.position.x;
      dartsData[i * 4 + 1] = dart.position.y;
      dartsData[i * 4 + 2] = dart.position.z;
      dartsData[i * 4 + 3] = dart.active ? 1.0 : 0.0;
      
      // Нормализованное направление
      const speed = Math.sqrt(dart.velocity.x ** 2 + dart.velocity.y ** 2 + dart.velocity.z ** 2);
      dartDirsData[i * 4 + 0] = dart.velocity.x / (speed || 1);
      dartDirsData[i * 4 + 1] = dart.velocity.y / (speed || 1);
      dartDirsData[i * 4 + 2] = dart.velocity.z / (speed || 1);
      dartDirsData[i * 4 + 3] = speed;
    }

    // Рендерим сцену
    // Данные гранат для шейдера
    const grenadesData = this.getGrenadesData();
    const grenadeCount = this.grenades.filter(g => g.active).length;
    
    // Данные взрывов для шейдера
    const explosionsData = this.getExplosionsData();
    const explosionCount = this.explosions.filter(e => e.active).length;
    
    this.renderer.render(
      this.gameTime,
      this.player.getEyePosition(),
      yaw,
      pitch,
      targetsData,
      targetCount,
      sliceFlash,
      poolsData,
      poolCount,
      this.currentEra,
      this.targetManager.wave,
      pickupsData,
      pickupCount,
      crystalsData,
      acidProjectilesData,
      acidProjectileCount,
      spikesData,
      spikeTargetsData,
      spikeCount,
      acidRainZonesData,
      acidRainZoneCount,
      this.targetManager.greenBossPhase2,
      this.isInVoid,
      0, // voidProgress (не используется в Eclipse режиме)
      this.voidFallOffset,
      this.isInVoid ? this.portalPos : undefined, // Позиция портала
      altarsData,
      dartsData,
      dartDirsData,
      dartCount,
      this.voidPortalActive ? this.voidPortalLifetime : 0,
      this.getBloodCoinsData(),
      this.voidCoins.filter(c => c.active).length,
      grenadesData,
      grenadeCount,
      explosionsData,
      explosionCount,
      this.voidVariant,
      // Катана 3D
      this.weaponRenderer.attackProgress,
      this.weapon.state.bobPhase,
      this.weaponRenderer.splashCharges,
      ...this.getKatanaTargetData(), // targetAngle, targetDist
      this.weapon.attackType, // Тип удара (0=справа, 1=слева, 2=сплеш)
      // Эффекты смерти врагов
      this.getDeathEffectsData(),
      // Фрагменты врагов (разрубленные куски)
      this.targetManager.getAllFragmentsData(),
      Math.min(this.getFragmentCount(), 32)
    );

    // 2D эффекты оружия (частицы, вспышки) - катана теперь в 3D
    this.weaponRenderer.setSceneLighting(this.currentEra);
    this.weaponRenderer.render(this.weapon.state, this.gameTime);
  }
  
  /** Данные монет крови для шейдера */
  private getBloodCoinsData(): Float32Array {
    const data = new Float32Array(48); // 12 монет * 4
    const activeCoins = this.voidCoins.filter(c => c.active);
    for (let i = 0; i < Math.min(activeCoins.length, 12); i++) {
      const coin = activeCoins[i];
      data[i * 4 + 0] = coin.position.x;
      data[i * 4 + 1] = coin.position.y;
      data[i * 4 + 2] = coin.position.z;
      data[i * 4 + 3] = 1.0; // active
    }
    return data;
  }
  
  /** Данные гранат для шейдера */
  private getGrenadesData(): Float32Array {
    const data = new Float32Array(32); // 8 гранат * 4
    const activeGrenades = this.grenades.filter(g => g.active);
    for (let i = 0; i < Math.min(activeGrenades.length, 8); i++) {
      const g = activeGrenades[i];
      data[i * 4 + 0] = g.position.x;
      data[i * 4 + 1] = g.position.y;
      data[i * 4 + 2] = g.position.z;
      data[i * 4 + 3] = g.lifetime;
    }
    return data;
  }
  
  /** Данные взрывов для шейдера */
  private getExplosionsData(): Float32Array {
    const data = new Float32Array(32); // 8 взрывов * 4
    const activeExplosions = this.explosions.filter(e => e.active);
    for (let i = 0; i < Math.min(activeExplosions.length, 8); i++) {
      const e = activeExplosions[i];
      data[i * 4 + 0] = e.position.x;
      data[i * 4 + 1] = e.position.y;
      data[i * 4 + 2] = e.position.z;
      data[i * 4 + 3] = e.progress;
    }
    return data;
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
