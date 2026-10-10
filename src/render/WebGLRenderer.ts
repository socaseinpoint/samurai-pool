import { VERTEX_SHADER, FRAGMENT_SHADER, COMPOSITE_SHADER } from './Shaders';
import type { ShaderUniforms, Vec3 } from '@/types';
import { getPhoneScale, getQualityParam, inStudio, isPhoneLike, readStudioControls, wantsPhoneProfile, type StudioControls } from '@/core/Platform';
import { readGameSettings } from '@/core/GlintSettings';

/** Шагов ray marching в phone-профиле (в шейдере по умолчанию 40) */
const PHONE_MAX_STEPS = 28;

/**
 * WebGL2 рендерер
 * Ray marching через фрагментный шейдер
 * Two-pass rendering: geometry (1/2 разрешения) + composite (полное)
 */
export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private uniforms: ShaderUniforms;
  private vao: WebGLVertexArrayObject | null = null;

  // === TWO-PASS RENDERING ===
  private geometryFBO: WebGLFramebuffer | null = null;
  private geometryTexture: WebGLTexture | null = null;
  private geometryWidth = 320;  // targetWidth / 2
  private geometryHeight = 180; // targetHeight / 2
  private compositeProgram: WebGLProgram | null = null;
  private compositeUniforms: Record<string, WebGLUniformLocation | null> = {};

  /** Масштаб рендеринга (0-1) - меньше = быстрее */
  public renderScale = 0.6;
  /** Тени включены */
  public shadowsEnabled = true;
  /** Постэффекты включены */
  public postfxEnabled = true;
  /** 3D катана включена */
  public katanaEnabled = true;
  /** Турбо режим (минимум геометрии) */
  public turboEnabled = false;
  /** FPS счётчик */
  private frameCount = 0;
  private lastFpsUpdate = 0;
  public currentFps = 60;

  /** Пресеты качества */
  public static readonly QUALITY_PRESETS = {
    ultra_low: { width: 426, height: 240 },  // 240p - для слабых ПК
    low: { width: 640, height: 360 },         // 360p
    medium: { width: 854, height: 480 },      // 480p
    high: { width: 1280, height: 720 }        // 720p - максимум
  };
  
  /** Текущее качество */
  public quality: 'ultra_low' | 'low' | 'medium' | 'high' = 'low';
  
  /** Целевое разрешение рендеринга */
  private targetWidth = 640;
  private targetHeight = 360;

  /**
   * Phone-профиль: масштаб рендера от CSS-пикселей окна (DPR 1), 0 — выключен.
   * Включается сам на тач/маленьком экране или через ?quality=phone (?scale= — масштаб)
   */
  public phoneScale = 0;
  /** Phone-профиль активен (в т.ч. для 2D-канваса оружия — DPR 1) */
  public get isPhoneProfile(): boolean {
    return this.phoneScale > 0;
  }

  /**
   * Сайт студии: тени/постэффекты/катана/турбо — из 'studio.game.samurai.v1', качество — из общего studio.controls.v1;
   * старый ключ 'gameSettings' в студии не пишется (вне студии — как раньше)
   */
  public readonly studio = inStudio();
  /** Облегчённый шейдер (меньше шагов): phone-профиль или телефон в студии при любом качестве */
  private lightShader = false;
  /** Общее качество студии (auto — адаптив, авто-понижение только в памяти сессии) */
  private studioQuality: StudioControls['quality'] = 'auto';

  constructor(private canvas: HTMLCanvasElement) {
    // Загружаем настройки из localStorage
    this.loadSettings();
    this.applyProfile();
    if (this.studio) this.applyStudioQuality(readStudioControls().quality);
    this.lightShader = this.isPhoneProfile || (this.studio && isPhoneLike());
    console.log(`🖥️ Экран: ${window.screen.width}×${window.screen.height}, качество: ${this.quality.toUpperCase()}`);
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 не поддерживается');
    }
    this.gl = gl;

    this.uniforms = {
      resolution: null,
      time: null,
      turboMode: null,
      cameraPos: null,
      cameraDir: null,
      cameraYaw: null,
      cameraPitch: null,
      targets: null,
      targetCount: null,
      muzzleFlash: null,
      pools: null,
      poolCount: null,
      acidProjectiles: null,
      acidProjectileCount: null,
      spikes: null,
      spikeTargets: null,
      spikeCount: null,
      acidRainZones: null,
      acidRainZoneCount: null,
      era: null,
      altars: null,
      darts: null,
      dartDirs: null,
      dartCount: null,
      voidPortalActive: null,
      bloodCoins: null,
      bloodCoinCount: null,
      wave: null,
      greenBossPhase2: null,
      pickups: null,
      pickupCount: null,
      crystals: null,
      crystalCount: null,
      voidMode: null,
      voidProgress: null,
      voidFallOffset: null,
      portalPos: null,
      grenades: null,
      grenadeCount: null,
      explosions: null,
      explosionCount: null,
      voidVariant: null,
      katanaAttack: null,
      katanaBob: null,
      katanaCharges: null,
      katanaTargetAngle: null,
      katanaTargetDist: null,
      katanaAttackType: null,
      deathEffects: null,
      fragments: null,
      fragmentCount: null,
      shadowsEnabled: null,
      postfxEnabled: null,
      katanaEnabled: null,
    };

    this.init();
  }

  /** Инициализация WebGL */
  private init(): void {
    const gl = this.gl;

    // Компилируем шейдеры
    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    // Phone: меньше шагов ray marching
    const fragSource = this.lightShader
      ? FRAGMENT_SHADER.replace('#define MAX_STEPS 40', `#define MAX_STEPS ${PHONE_MAX_STEPS}`)
      : FRAGMENT_SHADER;
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragSource);

    if (!vertShader || !fragShader) {
      throw new Error('Ошибка компиляции шейдеров');
    }

    // Создаём программу
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Ошибка линковки: ' + gl.getProgramInfoLog(this.program));
    }

    // Создаём composite shader для второго прохода
    this.createCompositeProgram();
    
    // Создаём framebuffer для geometry pass
    this.createGeometryFBO();

    // Получаем uniform locations
    this.uniforms.resolution = gl.getUniformLocation(this.program, 'u_resolution');
    this.uniforms.time = gl.getUniformLocation(this.program, 'u_time');
    this.uniforms.turboMode = gl.getUniformLocation(this.program, 'u_turboMode');
    this.uniforms.cameraPos = gl.getUniformLocation(this.program, 'u_cameraPos');
    this.uniforms.cameraYaw = gl.getUniformLocation(this.program, 'u_cameraYaw');
    this.uniforms.cameraPitch = gl.getUniformLocation(this.program, 'u_cameraPitch');
    this.uniforms.targets = gl.getUniformLocation(this.program, 'u_targets');
    this.uniforms.targetCount = gl.getUniformLocation(this.program, 'u_targetCount');
    this.uniforms.muzzleFlash = gl.getUniformLocation(this.program, 'u_muzzleFlash');
    this.uniforms.pools = gl.getUniformLocation(this.program, 'u_pools');
    this.uniforms.poolCount = gl.getUniformLocation(this.program, 'u_poolCount');
    this.uniforms.acidProjectiles = gl.getUniformLocation(this.program, 'u_acidProjectiles');
    this.uniforms.acidProjectileCount = gl.getUniformLocation(this.program, 'u_acidProjectileCount');
    this.uniforms.spikes = gl.getUniformLocation(this.program, 'u_spikes');
    this.uniforms.spikeTargets = gl.getUniformLocation(this.program, 'u_spikeTargets');
    this.uniforms.spikeCount = gl.getUniformLocation(this.program, 'u_spikeCount');
    this.uniforms.acidRainZones = gl.getUniformLocation(this.program, 'u_acidRainZones');
    this.uniforms.acidRainZoneCount = gl.getUniformLocation(this.program, 'u_acidRainZoneCount');
    this.uniforms.era = gl.getUniformLocation(this.program, 'u_era');
    this.uniforms.altars = gl.getUniformLocation(this.program, 'u_altars');
    this.uniforms.darts = gl.getUniformLocation(this.program, 'u_darts');
    this.uniforms.dartDirs = gl.getUniformLocation(this.program, 'u_dartDirs');
    this.uniforms.dartCount = gl.getUniformLocation(this.program, 'u_dartCount');
    this.uniforms.voidPortalActive = gl.getUniformLocation(this.program, 'u_voidPortalActive');
    this.uniforms.bloodCoins = gl.getUniformLocation(this.program, 'u_bloodCoins');
    this.uniforms.bloodCoinCount = gl.getUniformLocation(this.program, 'u_bloodCoinCount');
    this.uniforms.wave = gl.getUniformLocation(this.program, 'u_wave');
    this.uniforms.greenBossPhase2 = gl.getUniformLocation(this.program, 'u_greenBossPhase2');
    this.uniforms.pickups = gl.getUniformLocation(this.program, 'u_pickups');
    this.uniforms.pickupCount = gl.getUniformLocation(this.program, 'u_pickupCount');
    this.uniforms.crystals = gl.getUniformLocation(this.program, 'u_crystals');
    this.uniforms.voidMode = gl.getUniformLocation(this.program, 'u_voidMode');
    this.uniforms.voidProgress = gl.getUniformLocation(this.program, 'u_voidProgress');
    this.uniforms.voidFallOffset = gl.getUniformLocation(this.program, 'u_voidFallOffset');
    this.uniforms.portalPos = gl.getUniformLocation(this.program, 'u_portalPos');
    this.uniforms.grenades = gl.getUniformLocation(this.program, 'u_grenades');
    this.uniforms.grenadeCount = gl.getUniformLocation(this.program, 'u_grenadeCount');
    this.uniforms.explosions = gl.getUniformLocation(this.program, 'u_explosions');
    this.uniforms.explosionCount = gl.getUniformLocation(this.program, 'u_explosionCount');
    this.uniforms.voidVariant = gl.getUniformLocation(this.program, 'u_voidVariant');
    
    // Катана 3D
    this.uniforms.katanaAttack = gl.getUniformLocation(this.program, 'u_katanaAttack');
    this.uniforms.katanaBob = gl.getUniformLocation(this.program, 'u_katanaBob');
    this.uniforms.katanaCharges = gl.getUniformLocation(this.program, 'u_katanaCharges');
    this.uniforms.katanaTargetAngle = gl.getUniformLocation(this.program, 'u_katanaTargetAngle');
    this.uniforms.katanaTargetDist = gl.getUniformLocation(this.program, 'u_katanaTargetDist');
    this.uniforms.katanaAttackType = gl.getUniformLocation(this.program, 'u_katanaAttackType');
    
    // Эффекты смерти врагов
    this.uniforms.deathEffects = gl.getUniformLocation(this.program, 'u_deathEffects');
    
    // Фрагменты врагов
    this.uniforms.fragments = gl.getUniformLocation(this.program, 'u_fragments');
    this.uniforms.fragmentCount = gl.getUniformLocation(this.program, 'u_fragmentCount');
    
    // Настройки графики
    this.uniforms.shadowsEnabled = gl.getUniformLocation(this.program, 'u_shadowsEnabled');
    this.uniforms.postfxEnabled = gl.getUniformLocation(this.program, 'u_postfxEnabled');
    this.uniforms.katanaEnabled = gl.getUniformLocation(this.program, 'u_katanaEnabled');

    // Создаём fullscreen quad
    this.createQuad();
  }

  /** Компиляция шейдера */
  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Ошибка шейдера:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /** Создание fullscreen quad */
  private createQuad(): void {
    const gl = this.gl;

    // Вершины квада (-1 до 1)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    // VAO
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // VBO
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Атрибут позиции
    const posLoc = gl.getAttribLocation(this.program!, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  /** Создание framebuffer для geometry pass (сниженное разрешение) */
  private createGeometryFBO(): void {
    const gl = this.gl;
    
    // Размеры geometry pass (3/4 от target для баланса качества и производительности)
    // 1/2 слишком мыльно, 3/4 - хороший компромисс
    this.geometryWidth = Math.floor(this.targetWidth * 0.75);
    this.geometryHeight = Math.floor(this.targetHeight * 0.75);
    
    // Проверяем поддержку float текстур для FBO
    const ext = gl.getExtension('EXT_color_buffer_float');
    const useFloat = !!ext;
    
    // Текстура для geometry pass
    this.geometryTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.geometryTexture);
    
    if (useFloat) {
      // HDR текстура с float (если поддерживается)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA16F,
        this.geometryWidth, this.geometryHeight,
        0, gl.RGBA, gl.FLOAT, null
      );
    } else {
      // Fallback на RGBA8 (LDR)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        this.geometryWidth, this.geometryHeight,
        0, gl.RGBA, gl.UNSIGNED_BYTE, null
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Framebuffer
    this.geometryFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.geometryFBO);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.geometryTexture, 0
    );
    
    // Проверка статуса
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('❌ Geometry FBO incomplete:', status);
    } else {
      const format = useFloat ? 'RGBA16F' : 'RGBA8';
      console.log(`✅ Geometry FBO: ${this.geometryWidth}×${this.geometryHeight} (${format})`);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  
  /** Создание composite shader программы */
  private createCompositeProgram(): void {
    const gl = this.gl;
    
    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, COMPOSITE_SHADER);
    
    if (!vertShader || !fragShader) {
      console.error('❌ Ошибка компиляции composite shader');
      return;
    }
    
    this.compositeProgram = gl.createProgram()!;
    gl.attachShader(this.compositeProgram, vertShader);
    gl.attachShader(this.compositeProgram, fragShader);
    gl.linkProgram(this.compositeProgram);
    
    if (!gl.getProgramParameter(this.compositeProgram, gl.LINK_STATUS)) {
      console.error('❌ Ошибка линковки composite:', gl.getProgramInfoLog(this.compositeProgram));
      return;
    }
    
    // Uniform locations для composite shader
    this.compositeUniforms = {
      geometryTex: gl.getUniformLocation(this.compositeProgram, 'u_geometryTex'),
      resolution: gl.getUniformLocation(this.compositeProgram, 'u_resolution'),
      time: gl.getUniformLocation(this.compositeProgram, 'u_time'),
      cameraPos: gl.getUniformLocation(this.compositeProgram, 'u_cameraPos'),
      cameraYaw: gl.getUniformLocation(this.compositeProgram, 'u_cameraYaw'),
      cameraPitch: gl.getUniformLocation(this.compositeProgram, 'u_cameraPitch'),
      katanaAttack: gl.getUniformLocation(this.compositeProgram, 'u_katanaAttack'),
      katanaBob: gl.getUniformLocation(this.compositeProgram, 'u_katanaBob'),
      katanaCharges: gl.getUniformLocation(this.compositeProgram, 'u_katanaCharges'),
      katanaTargetAngle: gl.getUniformLocation(this.compositeProgram, 'u_katanaTargetAngle'),
      katanaTargetDist: gl.getUniformLocation(this.compositeProgram, 'u_katanaTargetDist'),
      katanaAttackType: gl.getUniformLocation(this.compositeProgram, 'u_katanaAttackType'),
      katanaEnabled: gl.getUniformLocation(this.compositeProgram, 'u_katanaEnabled'),
      postfxEnabled: gl.getUniformLocation(this.compositeProgram, 'u_postfxEnabled'),
      era: gl.getUniformLocation(this.compositeProgram, 'u_era'),
    };
    
    console.log('✅ Composite shader создан');
  }
  
  /** Пересоздание geometry FBO при смене разрешения */
  private recreateGeometryFBO(): void {
    const gl = this.gl;
    
    // Удаляем старые ресурсы
    if (this.geometryFBO) gl.deleteFramebuffer(this.geometryFBO);
    if (this.geometryTexture) gl.deleteTexture(this.geometryTexture);
    
    // Создаём заново
    this.createGeometryFBO();
  }

  /** Профиль из адресной строки и устройства (поверх сохранённых настроек, сам не сохраняется) */
  private applyProfile(): void {
    const q = getQualityParam();
    if (q && q !== 'phone') {
      this.quality = q;
      const preset = WebGLRenderer.QUALITY_PRESETS[q];
      this.targetWidth = preset.width;
      this.targetHeight = preset.height;
    }
    if (wantsPhoneProfile()) {
      this.phoneScale = getPhoneScale();
      // В студии выбор игрока хранится как есть, тени гасятся при отрисовке (см. render: phone-профиль без теней)
      if (!this.studio) this.shadowsEnabled = false;
      this.updatePhoneTarget();
      console.log(`📱 Phone-профиль: рендер ×${this.phoneScale} от окна (${this.targetWidth}×${this.targetHeight}), без теней, MAX_STEPS ${PHONE_MAX_STEPS}`);
    }
  }

  /** Phone: цель рендера = окно в CSS-пикселях × масштаб; true — размер поменялся */
  private updatePhoneTarget(): boolean {
    const w = Math.max(160, Math.round(window.innerWidth * this.phoneScale));
    const h = Math.max(90, Math.round(window.innerHeight * this.phoneScale));
    if (w === this.targetWidth && h === this.targetHeight) return false;
    this.targetWidth = w;
    this.targetHeight = h;
    return true;
  }

  /** Обновить размер canvas */
  public resize(): void {
    // Phone: следим за окном (поворот телефона)
    if (this.isPhoneProfile && this.geometryFBO && this.updatePhoneTarget()) {
      this.recreateGeometryFBO();
    }
    // Используем целевое разрешение напрямую
    const width = this.targetWidth;
    const height = this.targetHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }
  
  /** Установить качество (persist=false — только на эту сессию: авто-понижение, общее меню студии) */
  public setQuality(quality: 'ultra_low' | 'low' | 'medium' | 'high', persist = true): void {
    this.quality = quality;
    this.phoneScale = 0; // ручной выбор качества отключает phone-профиль
    const preset = WebGLRenderer.QUALITY_PRESETS[quality];
    this.targetWidth = preset.width;
    this.targetHeight = preset.height;
    
    // Пересоздаём geometry FBO с новым размером
    if (this.geometryFBO) this.recreateGeometryFBO();
    
    if (persist) this.saveSettings();
    console.log(`📐 Качество: ${quality.toUpperCase()} (${preset.width}×${preset.height}, geometry: ${this.geometryWidth}×${this.geometryHeight})`);
  }

  /**
   * Общее качество студии (studio.controls.v1 quality): low — 240p на телефоне / 360p на компьютере,
   * medium — 480p, high — 720p, auto — адаптив: телефон — окно × масштаб, компьютер — 360p с авто-понижением.
   * Ничего не сохраняет (настройка живёт в общем ключе). ?quality= в адресе главнее (отладка).
   */
  public applyStudioQuality(q: StudioControls['quality']): void {
    this.studioQuality = q;
    if (getQualityParam()) return;
    if (q === 'auto') {
      if (isPhoneLike()) {
        this.phoneScale = getPhoneScale();
        this.updatePhoneTarget();
        if (this.geometryFBO) this.recreateGeometryFBO();
        if (this.gl) this.resize();
        console.log(`📐 Качество: AUTO (телефон, окно ×${this.phoneScale}: ${this.targetWidth}×${this.targetHeight})`);
      } else {
        this.setQuality('low', false);
        if (this.gl) this.resize();
      }
      return;
    }
    const preset = q === 'low' ? (isPhoneLike() ? 'ultra_low' : 'low') : q;
    this.setQuality(preset, false);
    if (this.gl) this.resize();
  }
  
  /** Сохранить настройки в localStorage (в студии — нет: там их хранит общий модуль) */
  public saveSettings(): void {
    if (this.studio) return;
    const settings = {
      quality: this.quality,
      shadows: this.shadowsEnabled,
      postfx: this.postfxEnabled,
      katana: this.katanaEnabled,
      turbo: this.turboEnabled
    };
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }
  
  /** Загрузить настройки из localStorage */
  private loadSettings(): void {
    if (this.studio) {
      const g = readGameSettings();
      this.shadowsEnabled = g.shadows;
      this.postfxEnabled = g.postfx;
      this.katanaEnabled = g.katana;
      this.turboEnabled = g.turbo;
      return;
    }
    try {
      const saved = localStorage.getItem('gameSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.quality && WebGLRenderer.QUALITY_PRESETS[settings.quality as keyof typeof WebGLRenderer.QUALITY_PRESETS]) {
          this.quality = settings.quality;
          const preset = WebGLRenderer.QUALITY_PRESETS[this.quality];
          this.targetWidth = preset.width;
          this.targetHeight = preset.height;
        }
        if (typeof settings.shadows === 'boolean') this.shadowsEnabled = settings.shadows;
        if (typeof settings.postfx === 'boolean') this.postfxEnabled = settings.postfx;
        if (typeof settings.katana === 'boolean') this.katanaEnabled = settings.katana;
        if (typeof settings.turbo === 'boolean') this.turboEnabled = settings.turbo;
        console.log('💾 Настройки загружены из localStorage');
      }
    } catch (e) {
      console.warn('⚠️ Не удалось загрузить настройки:', e);
    }
  }
  
  /** Получить текущее разрешение рендеринга */
  public getRenderResolution(): { width: number; height: number } {
    return { width: this.targetWidth, height: this.targetHeight };
  }

  /** Рендеринг кадра */
  public render(
    time: number,
    cameraPos: Vec3,
    cameraYaw: number,
    cameraPitch: number,
    targetsData: Float32Array,
    targetCount: number,
    muzzleFlash: number,
    poolsData?: Float32Array,
    poolCount?: number,
    era?: number,
    wave?: number,
    pickupsData?: Float32Array,
    pickupCount?: number,
    crystalsData?: Float32Array,
    acidProjectilesData?: Float32Array,
    acidProjectileCount?: number,
    spikesData?: Float32Array,
    spikeTargetsData?: Float32Array,
    spikeCount?: number,
    acidRainZonesData?: Float32Array,
    acidRainZoneCount?: number,
    greenBossPhase2?: boolean,
    voidMode?: boolean,
    voidProgress?: number,
    voidFallOffset?: number,
    portalPos?: { x: number; y: number; z: number },
    altarsData?: Float32Array,
    dartsData?: Float32Array,
    dartDirsData?: Float32Array,
    dartCount?: number,
    voidPortalActive?: number,
    bloodCoinsData?: Float32Array,
    bloodCoinCount?: number,
    grenadesData?: Float32Array,
    grenadeCount?: number,
    explosionsData?: Float32Array,
    explosionCount?: number,
    voidVariant?: number,
    katanaAttack?: number,
    katanaBob?: number,
    katanaCharges?: number,
    katanaTargetAngle?: number,
    katanaTargetDist?: number,
    katanaAttackType?: number,
    deathEffectsData?: Float32Array,
    fragmentsData?: Float32Array,
    fragmentCount?: number
  ): void {
    const gl = this.gl;

    this.resize();

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Устанавливаем uniforms
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1i(this.uniforms.turboMode, this.turboEnabled ? 1 : 0);
    gl.uniform3f(this.uniforms.cameraPos, cameraPos.x, cameraPos.y, cameraPos.z);
    gl.uniform1f(this.uniforms.cameraYaw, cameraYaw);
    gl.uniform1f(this.uniforms.cameraPitch, cameraPitch);
    gl.uniform4fv(this.uniforms.targets, targetsData);
    gl.uniform1i(this.uniforms.targetCount, targetCount);
    gl.uniform1f(this.uniforms.muzzleFlash, muzzleFlash);
    
    // Лужи
    if (poolsData && poolCount !== undefined) {
      gl.uniform4fv(this.uniforms.pools, poolsData);
      gl.uniform1i(this.uniforms.poolCount, poolCount);
    } else {
      gl.uniform1i(this.uniforms.poolCount, 0);
    }

    // Снаряды кислоты
    if (acidProjectilesData && acidProjectileCount !== undefined && acidProjectileCount > 0) {
      gl.uniform4fv(this.uniforms.acidProjectiles, acidProjectilesData);
      gl.uniform1i(this.uniforms.acidProjectileCount, acidProjectileCount);
    } else {
      gl.uniform1i(this.uniforms.acidProjectileCount, 0);
    }

    // Лазеры спайкеров
    if (spikesData && spikeTargetsData && spikeCount !== undefined && spikeCount > 0) {
      gl.uniform4fv(this.uniforms.spikes, spikesData);
      gl.uniform4fv(this.uniforms.spikeTargets, spikeTargetsData);
      gl.uniform1i(this.uniforms.spikeCount, spikeCount);
    } else {
      gl.uniform1i(this.uniforms.spikeCount, 0);
    }

    // Зоны кислотного дождя
    if (acidRainZonesData && acidRainZoneCount !== undefined && acidRainZoneCount > 0) {
      gl.uniform4fv(this.uniforms.acidRainZones, acidRainZonesData);
      gl.uniform1i(this.uniforms.acidRainZoneCount, acidRainZoneCount);
    } else {
      gl.uniform1i(this.uniforms.acidRainZoneCount, 0);
    }
    
    // Эпоха (1-3)
    gl.uniform1i(this.uniforms.era, era || 1);
    
    // Волна (для дождя на 15+)
    gl.uniform1i(this.uniforms.wave, wave || 1);
    
    // Фаза 2 зелёного босса (зелёное небо)
    gl.uniform1i(this.uniforms.greenBossPhase2, greenBossPhase2 ? 1 : 0);
    
    // Пикапы
    if (pickupsData && pickupCount !== undefined) {
      gl.uniform4fv(this.uniforms.pickups, pickupsData);
      gl.uniform1i(this.uniforms.pickupCount, pickupCount);
    } else {
      gl.uniform1i(this.uniforms.pickupCount, 0);
    }

    // Кристаллы силы
    if (crystalsData) {
      gl.uniform4fv(this.uniforms.crystals, crystalsData);
    }

    // Режим войда
    gl.uniform1i(this.uniforms.voidMode, voidMode ? 1 : 0);
    gl.uniform1f(this.uniforms.voidProgress, voidProgress || 0.0);
    gl.uniform1f(this.uniforms.voidFallOffset, voidFallOffset || 0.0);
    gl.uniform3f(
      this.uniforms.portalPos,
      portalPos?.x || 0.0,
      portalPos?.y || 0.0,
      portalPos?.z || 0.0
    );
    
    // Алтари
    if (altarsData) {
      gl.uniform4fv(this.uniforms.altars, altarsData);
    }
    
    // Энергетические лучи
    if (dartsData && dartDirsData && dartCount !== undefined && dartCount > 0) {
      gl.uniform4fv(this.uniforms.darts, dartsData);
      gl.uniform4fv(this.uniforms.dartDirs, dartDirsData);
      gl.uniform1i(this.uniforms.dartCount, dartCount);
    } else {
      gl.uniform1i(this.uniforms.dartCount, 0);
    }
    
    // Портал в войд
    gl.uniform1f(this.uniforms.voidPortalActive, voidPortalActive || 0.0);
    
    // Монеты крови
    if (bloodCoinsData && bloodCoinCount !== undefined && bloodCoinCount > 0) {
      gl.uniform4fv(this.uniforms.bloodCoins, bloodCoinsData);
      gl.uniform1i(this.uniforms.bloodCoinCount, bloodCoinCount);
    } else {
      gl.uniform1i(this.uniforms.bloodCoinCount, 0);
    }
    
    // Гранаты
    if (grenadesData && grenadeCount !== undefined && grenadeCount > 0) {
      gl.uniform4fv(this.uniforms.grenades, grenadesData);
      gl.uniform1i(this.uniforms.grenadeCount, grenadeCount);
    } else {
      gl.uniform1i(this.uniforms.grenadeCount, 0);
    }
    
    // Взрывы
    if (explosionsData && explosionCount !== undefined && explosionCount > 0) {
      gl.uniform4fv(this.uniforms.explosions, explosionsData);
      gl.uniform1i(this.uniforms.explosionCount, explosionCount);
    } else {
      gl.uniform1i(this.uniforms.explosionCount, 0);
    }
    
    // Вариант войда
    gl.uniform1i(this.uniforms.voidVariant, voidVariant || 0);
    
    // Катана 3D
    gl.uniform1f(this.uniforms.katanaAttack, katanaAttack || 0);
    gl.uniform1f(this.uniforms.katanaBob, katanaBob || 0);
    gl.uniform1i(this.uniforms.katanaCharges, katanaCharges || 0);
    gl.uniform1f(this.uniforms.katanaTargetAngle, katanaTargetAngle !== undefined ? katanaTargetAngle : -1);
    gl.uniform1f(this.uniforms.katanaTargetDist, katanaTargetDist || 100);
    gl.uniform1i(this.uniforms.katanaAttackType, katanaAttackType || 0);
    
    // Эффекты смерти врагов
    if (deathEffectsData) {
      gl.uniform4fv(this.uniforms.deathEffects, deathEffectsData);
    } else {
      gl.uniform4fv(this.uniforms.deathEffects, new Float32Array(32)); // 8 * 4
    }
    
    // Фрагменты врагов
    if (fragmentsData && fragmentsData.length > 0) {
      // Расширяем массив до 128 элементов (32 фрагмента * 4 компонента)
      const paddedData = new Float32Array(128);
      paddedData.set(fragmentsData.subarray(0, Math.min(fragmentsData.length, 128)));
      gl.uniform4fv(this.uniforms.fragments, paddedData);
      gl.uniform1i(this.uniforms.fragmentCount, Math.min(fragmentCount || 0, 32));
    } else {
      gl.uniform4fv(this.uniforms.fragments, new Float32Array(128)); // 32 * 4
      gl.uniform1i(this.uniforms.fragmentCount, 0);
    }

    // Настройки графики
    gl.uniform1i(this.uniforms.shadowsEnabled, this.shadowsEnabled && !this.isPhoneProfile ? 1 : 0);
    gl.uniform1i(this.uniforms.postfxEnabled, 0); // Постэффекты в composite pass
    gl.uniform1i(this.uniforms.katanaEnabled, this.katanaEnabled ? 1 : 0); // Катана в geometry pass (временно)

    // === PASS 1: Geometry (низкое разрешение) ===
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.geometryFBO);
    gl.viewport(0, 0, this.geometryWidth, this.geometryHeight);
    gl.uniform2f(this.uniforms.resolution, this.geometryWidth, this.geometryHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // === PASS 2: Composite (полное разрешение) ===
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.compositeProgram) {
      gl.useProgram(this.compositeProgram);
      gl.bindVertexArray(this.vao);  // VAO нужен для обоих проходов
      
      // Привязываем текстуру geometry pass
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.geometryTexture);
      gl.uniform1i(this.compositeUniforms.geometryTex, 0);
      
      // Composite uniforms - используем targetWidth/Height (рендер разрешение)
      gl.uniform2f(this.compositeUniforms.resolution, this.targetWidth, this.targetHeight);
      gl.uniform1f(this.compositeUniforms.time, time);
      gl.uniform3f(this.compositeUniforms.cameraPos, cameraPos.x, cameraPos.y, cameraPos.z);
      gl.uniform1f(this.compositeUniforms.cameraYaw, cameraYaw);
      gl.uniform1f(this.compositeUniforms.cameraPitch, cameraPitch);
      gl.uniform1f(this.compositeUniforms.katanaAttack, katanaAttack || 0);
      gl.uniform1f(this.compositeUniforms.katanaBob, katanaBob || 0);
      gl.uniform1i(this.compositeUniforms.katanaCharges, katanaCharges || 0);
      gl.uniform1f(this.compositeUniforms.katanaTargetAngle, katanaTargetAngle !== undefined ? katanaTargetAngle : -1);
      gl.uniform1f(this.compositeUniforms.katanaTargetDist, katanaTargetDist || 100);
      gl.uniform1i(this.compositeUniforms.katanaAttackType, katanaAttackType || 0);
      gl.uniform1i(this.compositeUniforms.katanaEnabled, 0); // Катана в geometry pass
      gl.uniform1i(this.compositeUniforms.postfxEnabled, this.postfxEnabled ? 1 : 0);
      gl.uniform1i(this.compositeUniforms.era, era || 1);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    // FPS counter + адаптивное качество
    this.frameCount++;
    if (time - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = time;
      
      // Обновляем FPS в настройках и на экране
      const fpsEl = document.getElementById('fps-value');
      const fpsLive = document.getElementById('fps-live');
      if (fpsEl) fpsEl.textContent = String(this.currentFps);
      if (fpsLive) {
        fpsLive.textContent = String(this.currentFps);
        // Цвет в зависимости от FPS
        fpsLive.style.color = this.currentFps >= 55 ? '#00ff88' : 
                              this.currentFps >= 30 ? '#ffcc00' : '#ff4444';
      }
      
      // Автоматическое снижение качества при низком FPS
      if (this.isPhoneProfile) {
        if (this.currentFps < 25 && this.phoneScale > 0.35) {
          this.phoneScale = Math.max(0.35, this.phoneScale - 0.1);
          console.warn(`⚠️ Низкий FPS (${this.currentFps}) - масштаб рендера ${this.phoneScale.toFixed(2)}`);
        }
      } else if (this.currentFps < 25 && this.quality !== 'ultra_low' && (!this.studio || this.studioQuality === 'auto')) {
        // В студии понижаем только в «авто» (выбор игрока не трогаем); понижение — в памяти сессии, не в настройках
        const qualities: Array<'ultra_low' | 'low' | 'medium' | 'high'> = ['ultra_low', 'low', 'medium', 'high'];
        const currentIdx = qualities.indexOf(this.quality);
        if (currentIdx > 0) {
          this.setQuality(qualities[currentIdx - 1], false);
          console.warn(`⚠️ Низкий FPS (${this.currentFps}) - качество снижено до ${this.quality}`);
        }
      }
    }
  }

  /** Уничтожить рендерер */
  public destroy(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

