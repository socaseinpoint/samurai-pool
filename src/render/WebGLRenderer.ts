import { VERTEX_SHADER, FRAGMENT_SHADER } from './Shaders';
import type { ShaderUniforms, Vec3 } from '@/types';

/**
 * WebGL2 рендерер
 * Ray marching через фрагментный шейдер
 */
export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private uniforms: ShaderUniforms;
  private vao: WebGLVertexArrayObject | null = null;

  /** Масштаб рендеринга (0-1) */
  public renderScale = 0.75;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 не поддерживается');
    }
    this.gl = gl;

    this.uniforms = {
      resolution: null,
      time: null,
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
    };

    this.init();
  }

  /** Инициализация WebGL */
  private init(): void {
    const gl = this.gl;

    // Компилируем шейдеры
    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

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

    // Получаем uniform locations
    this.uniforms.resolution = gl.getUniformLocation(this.program, 'u_resolution');
    this.uniforms.time = gl.getUniformLocation(this.program, 'u_time');
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

  /** Обновить размер canvas */
  public resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(this.canvas.clientWidth * dpr * this.renderScale);
    const height = Math.floor(this.canvas.clientHeight * dpr * this.renderScale);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
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

    // Рисуем
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Уничтожить рендерер */
  public destroy(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

