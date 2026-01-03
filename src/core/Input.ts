import type { InputState } from '@/types';

/**
 * Менеджер ввода
 * Обрабатывает клавиатуру и мышь
 */
export class Input {
  /** Текущее состояние ввода */
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    fire: false,
    reload: false,
  };

  /** Движение мыши за кадр */
  public mouseDelta = { x: 0, y: 0 };

  /** Pointer Lock активен */
  public isPointerLocked = false;

  /** Чувствительность мыши (выше = быстрее) */
  public sensitivity = 0.006;

  /** Инвертировать ось X */
  public invertX = true;

  /** Инвертировать ось Y */
  public invertY = true;

  private canvas: HTMLCanvasElement;
  private onPointerLockChange?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  /** Настройка обработчиков событий */
  private setupListeners(): void {
    // Клавиатура
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Мышь
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Pointer Lock
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }

  /** Запросить Pointer Lock */
  public requestPointerLock(onLockChange?: () => void): void {
    this.onPointerLockChange = onLockChange;
    this.canvas.requestPointerLock();
  }

  /** Выйти из Pointer Lock */
  public exitPointerLock(): void {
    document.exitPointerLock();
  }

  /** Сбросить дельту мыши (вызывать в конце кадра) */
  public resetMouseDelta(): void {
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  /** Обработка нажатия клавиши */
  private handleKeyDown(e: KeyboardEvent): void {
    this.updateKeyState(e.code, true);
  }

  /** Обработка отпускания клавиши */
  private handleKeyUp(e: KeyboardEvent): void {
    this.updateKeyState(e.code, false);
  }

  /** Обновление состояния клавиши */
  private updateKeyState(code: string, pressed: boolean): void {
    switch (code) {
      case 'KeyW':
        this.state.forward = pressed;
        break;
      case 'KeyS':
        this.state.backward = pressed;
        break;
      case 'KeyA':
        this.state.left = pressed;
        break;
      case 'KeyD':
        this.state.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.run = pressed;
        break;
      case 'Space':
        this.state.jump = pressed;
        break;
      case 'KeyR':
        this.state.reload = pressed;
        break;
    }
  }

  /** Обработка движения мыши */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked) return;

    // Инверсия осей как в оригинале
    const dx = this.invertX ? -e.movementX : e.movementX;
    const dy = this.invertY ? -e.movementY : e.movementY;

    this.mouseDelta.x += dx * this.sensitivity;
    this.mouseDelta.y += dy * this.sensitivity;
  }

  /** Обработка нажатия кнопки мыши */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.fire = true;
    }
  }

  /** Обработка отпускания кнопки мыши */
  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.fire = false;
    }
  }

  /** Обработка изменения Pointer Lock */
  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    this.onPointerLockChange?.();
  }

  /** Удалить обработчики */
  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
}

