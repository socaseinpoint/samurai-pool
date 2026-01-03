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
    poolCount?: number
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

