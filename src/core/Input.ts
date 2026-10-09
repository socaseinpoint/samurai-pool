import type { InputAction, InputState } from '@/types';
import { isTouchDevice } from './Platform';

/** Кнопки стандартного геймпада (Gamepad API, standard mapping — раскладка Xbox) */
export const PAD = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11,
} as const;

/** Действие → кнопки пада (граната — по нажатию, остальные — пока зажато) */
const PAD_BINDINGS: Record<InputAction, number[]> = {
  fire: [PAD.RT],          // как ЛКМ — удар
  altFire: [PAD.LT],       // как ПКМ — волна / дротики
  jump: [PAD.A],
  run: [PAD.LB, PAD.B],    // как Shift
  throwGrenade: [PAD.RB],  // как колёсико
  reload: [PAD.X],         // как R
};

/** Действия, которые держатся, пока зажата кнопка (граната — разовое нажатие) */
const HELD_ACTIONS: InputAction[] = ['run', 'jump', 'fire', 'altFire', 'reload'];

/** Порог нажатия курков LT/RT (аналоговые 0..1) */
const TRIGGER_THRESHOLD = 0.35;

/** Скорость обзора правым стиком при полном отклонении, рад/с (при чувствительности по умолчанию) */
const PAD_LOOK_SPEED = 2.6;

/** Чувствительность мыши по умолчанию — от неё считается масштаб для пада */
const DEFAULT_SENSITIVITY = 0.005;

const noActions = (): Record<InputAction, boolean> => ({
  run: false, jump: false, fire: false, altFire: false, reload: false, throwGrenade: false,
});

/**
 * Менеджер ввода
 * Источники: клавиатура + мышь, геймпад (опрос в poll), виртуальный (тач-оверлей).
 * Итог — state (кнопки + аналоговый вектор moveX/moveY) и mouseDelta (обзор за кадр, радианы).
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
    altFire: false, // ПКМ для сплеш-атаки
    reload: false,
    throwGrenade: false, // Колёсико для гранаты
    moveX: 0,
    moveY: 0,
  };

  /** Движение мыши за кадр */
  public mouseDelta = { x: 0, y: 0 };

  /** Pointer Lock активен */
  public isPointerLocked = false;

  /** Обзор мышью через Pointer Lock (нет на тач-устройствах и в iOS Safari) */
  public readonly usesPointerLock: boolean;

  /** Чувствительность мыши (выше = быстрее) */
  public sensitivity = 0.005;

  /** Установить чувствительность */
  public setSensitivity(value: number): void {
    this.sensitivity = Math.max(0.001, Math.min(0.015, value));
  }

  /** Инвертировать ось X */
  public invertX = true;

  /** Инвертировать ось Y */
  public invertY = true;

  private canvas: HTMLCanvasElement;
  private onPointerLockChange?: () => void;

  /** Мёртвая зона стиков (радиальная, 0..1) */
  public deadzone = 0.15;

  /** Множитель обзора правым стиком (поверх чувствительности) */
  public padLookScale = 1;

  /** Множитель обзора свайпом (поверх чувствительности) */
  public touchLookScale = 1;

  /** Инверсия вертикали для свайпа и стика (общая настройка студии invertY) */
  public invertPadTouchY = false;

  /** Геймпад подключён */
  public padConnected = false;

  /** Нажатие кнопки пада (фронт) — для паузы, выхода в хаб, старта из меню */
  public onPadButton?: (button: number) => void;

  /** Клавиши движения */
  private keys = { forward: false, backward: false, left: false, right: false };
  /** Действия с клавиатуры и мыши */
  private keyHeld = noActions();
  /** Действия с пада */
  private padHeld = noActions();
  private padButtons: boolean[] = [];
  private padBias: number[] | null = null;
  private padMove = { x: 0, y: 0 };
  /** Виртуальный источник (тач): зажатые действия, короткие тапы, стик */
  private virtualHeld = noActions();
  private virtualPulse = noActions();
  private virtualMove = { x: 0, y: 0 };

  /** Виртуальный источник ввода — для тач-оверлея и тестов */
  public readonly virtual = {
    /** Стик: x вправо +, y вперёд +, -1..1 */
    setMove: (x: number, y: number): void => {
      this.virtualMove.x = x || 0;
      this.virtualMove.y = y || 0;
      this.combine();
    },
    /** Свайп обзора в CSS-пикселях */
    addLook: (dx: number, dy: number): void => {
      this.addLookPixels(dx, this.invertPadTouchY ? -dy : dy, this.touchLookScale);
    },
    /** Зажать / отпустить действие (тап короче кадра не теряется) */
    set: (action: InputAction, pressed: boolean): void => {
      if (action === 'throwGrenade') {
        if (pressed) this.state.throwGrenade = true;
        return;
      }
      if (pressed && !this.virtualHeld[action]) this.virtualPulse[action] = true;
      this.virtualHeld[action] = pressed;
      this.combine();
    },
    /** Отпустить всё (потеря фокуса, пауза) */
    clear: (): void => {
      this.virtualHeld = noActions();
      this.virtualMove.x = this.virtualMove.y = 0;
      this.combine();
    },
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.usesPointerLock = typeof canvas.requestPointerLock === 'function' && !isTouchDevice();
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
    document.addEventListener('wheel', this.handleWheel.bind(this));

    // Отключаем контекстное меню для ПКМ
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Pointer Lock
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));

    // Геймпад: опрос в poll(), события — только для статуса
    window.addEventListener('gamepadconnected', (e) => {
      console.log(`🎮 Геймпад: ${(e as GamepadEvent).gamepad.id}`);
      this.padConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.padConnected = false;
    });
  }

  /** Запросить Pointer Lock (на таче и без API — ничего не делаем) */
  public requestPointerLock(onLockChange?: () => void): void {
    this.onPointerLockChange = onLockChange;
    if (!this.usesPointerLock) return;
    try {
      // В новых браузерах возвращает Promise — отказ не должен ронять игру
      const result = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      result?.catch?.(() => {});
    } catch {
      // Браузер отказал (нет жеста пользователя, iframe и т.п.)
    }
  }

  /** Выйти из Pointer Lock */
  public exitPointerLock(): void {
    if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
      document.exitPointerLock();
    }
  }

  /** Сбросить дельту мыши (вызывать в конце кадра) */
  public resetMouseDelta(): void {
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  /** Есть ли движение (клавиши, стик или тач) */
  public isMoving(): boolean {
    return Math.abs(this.state.moveX) + Math.abs(this.state.moveY) > 0.1;
  }

  /**
   * Опрос геймпада и сборка состояния — раз за шаг обновления, до чтения state.
   * dt — шаг в секундах (обзор правым стиком идёт в рад/с).
   */
  public poll(dt: number): void {
    this.pollGamepad(dt);
    this.combine();
    this.virtualPulse = noActions();
  }

  /** Опрос первого подключённого геймпада (standard mapping) */
  private pollGamepad(dt: number): void {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    let pad: Gamepad | null = null;
    for (const p of pads) {
      if (p && p.connected !== false) { pad = p; break; }
    }

    if (!pad) {
      if (this.padBias) {
        // Пад отвалился — без залипших кнопок
        this.padBias = null;
        this.padButtons = [];
        this.padHeld = noActions();
        this.padMove.x = this.padMove.y = 0;
      }
      return;
    }
    this.padConnected = true;

    // Калибровка покоя: у многих падов стики в покое не в нуле — снимаем ноль при появлении
    if (!this.padBias) {
      this.padBias = Array.from(pad.axes, (v) => (Math.abs(v) < 0.25 ? v : 0));
    }

    // Кнопки и фронты нажатий
    const now = pad.buttons.map((b, i) =>
      i === PAD.LT || i === PAD.RT ? b.value > TRIGGER_THRESHOLD || b.pressed : b.pressed
    );
    for (let i = 0; i < now.length; i++) {
      if (now[i] && !this.padButtons[i]) {
        if (i === PAD_BINDINGS.throwGrenade[0]) this.state.throwGrenade = true;
        this.onPadButton?.(i);
      }
    }
    this.padButtons = now;
    for (const action of HELD_ACTIONS) {
      this.padHeld[action] = PAD_BINDINGS[action].some((i) => !!now[i]);
    }

    // Левый стик — ход (вверх по стику = вперёд)
    const [lx, ly] = this.stick(pad, 0, 1);
    this.padMove.x = lx;
    this.padMove.y = -ly;

    // Правый стик — обзор: кривая v·|v| для точного прицеливания, скорость растёт с чувствительностью
    const [rx, ry] = this.stick(pad, 2, 3);
    const speed = PAD_LOOK_SPEED * this.padLookScale * (this.sensitivity / DEFAULT_SENSITIVITY) * dt;
    this.mouseDelta.x += (this.invertX ? -1 : 1) * rx * Math.abs(rx) * speed;
    this.mouseDelta.y += (this.invertY !== this.invertPadTouchY ? -1 : 1) * ry * Math.abs(ry) * speed;
  }

  /** Стик с калибровкой и радиальной мёртвой зоной → [x, y] в -1..1 */
  private stick(pad: Gamepad, ix: number, iy: number): [number, number] {
    const bias = this.padBias ?? [];
    const x = Math.max(-1, Math.min(1, (pad.axes[ix] ?? 0) - (bias[ix] ?? 0)));
    const y = Math.max(-1, Math.min(1, (pad.axes[iy] ?? 0) - (bias[iy] ?? 0)));
    const len = Math.hypot(x, y);
    if (len < this.deadzone) return [0, 0];
    const k = Math.min(1, (len - this.deadzone) / (1 - this.deadzone)) / len;
    return [x * k, y * k];
  }

  /** Свести источники в state: действия — «или», движение — сумма с ограничением длины 1 */
  private combine(): void {
    const s = this.state;
    for (const action of HELD_ACTIONS) {
      s[action] = this.keyHeld[action] || this.padHeld[action] ||
        this.virtualHeld[action] || this.virtualPulse[action];
    }

    let x = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0) + this.padMove.x + this.virtualMove.x;
    let y = (this.keys.forward ? 1 : 0) - (this.keys.backward ? 1 : 0) + this.padMove.y + this.virtualMove.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    s.moveX = x;
    s.moveY = y;
    // Булевы направления — для старого кода (звук шагов, покачивание катаны)
    s.forward = y > 0.25;
    s.backward = y < -0.25;
    s.right = x > 0.25;
    s.left = x < -0.25;
  }

  /** Обзор в пикселях (мышь, свайп) → радианы, с инверсией как у мыши */
  private addLookPixels(dx: number, dy: number, scale: number): void {
    const x = this.invertX ? -dx : dx;
    const y = this.invertY ? -dy : dy;
    this.mouseDelta.x += x * this.sensitivity * scale;
    this.mouseDelta.y += y * this.sensitivity * scale;
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
        this.keys.forward = pressed;
        break;
      case 'KeyS':
        this.keys.backward = pressed;
        break;
      case 'KeyA':
        this.keys.left = pressed;
        break;
      case 'KeyD':
        this.keys.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keyHeld.run = pressed;
        break;
      case 'Space':
        this.keyHeld.jump = pressed;
        break;
      case 'KeyR':
        this.keyHeld.reload = pressed;
        break;
      default:
        return;
    }
    this.combine();
  }

  /** Обработка движения мыши */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked) return;

    // Инверсия осей как в оригинале
    this.addLookPixels(e.movementX, e.movementY, 1);
  }

  /** Обработка нажатия кнопки мыши */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.keyHeld.fire = true;
    } else if (e.button === 1) {
      // Средняя кнопка (нажатие на колёсико) - граната
      e.preventDefault();
      this.state.throwGrenade = true;
    } else if (e.button === 2) {
      e.preventDefault();
      this.keyHeld.altFire = true;
    }
    this.combine();
  }

  /** Обработка отпускания кнопки мыши */
  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.keyHeld.fire = false;
    } else if (e.button === 2) {
      this.keyHeld.altFire = false;
    }
    this.combine();
  }

  /** Обработка колёсика мыши (бросок гранаты) */
  private handleWheel(e: WheelEvent): void {
    if (!this.isPointerLocked) return;
    e.preventDefault();
    // Любое движение колёсика - бросок гранаты
    this.state.throwGrenade = true;
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
