/**
 * Игровой цикл с фиксированным временным шагом
 */
export class GameLoop {
  /** Функция обновления логики */
  private updateFn: (dt: number) => void;

  /** Функция рендеринга */
  private renderFn: (interpolation: number) => void;

  /** Время последнего кадра */
  private lastTime = 0;

  /** Накопленное время */
  private accumulator = 0;

  /** Фиксированный временной шаг (60 FPS) */
  public readonly fixedDeltaTime = 1 / 60;

  /** ID запроса анимации */
  private animationFrameId: number | null = null;

  /** Цикл запущен */
  public isRunning = false;

  /** Текущий FPS */
  public fps = 0;

  /** Счётчик кадров для FPS */
  private frameCount = 0;

  /** Время последнего замера FPS */
  private fpsTime = 0;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (interpolation: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  /** Запустить цикл */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.frameCount = 0;
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
  }

  /** Остановить цикл */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Один тик игрового цикла */
  private tick(currentTime: number): void {
    if (!this.isRunning) return;

    // Вычисляем дельту времени
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Обновляем FPS
    this.frameCount++;
    if (currentTime - this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = currentTime;
    }

    // Накапливаем время для фиксированного шага
    this.accumulator += deltaTime;

    // Выполняем обновления с фиксированным шагом
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateFn(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // Рендерим с интерполяцией
    const interpolation = this.accumulator / this.fixedDeltaTime;
    this.renderFn(interpolation);

    // Следующий кадр
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
  }
}




