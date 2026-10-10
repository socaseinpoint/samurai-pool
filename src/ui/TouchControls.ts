import type { InputAction } from '@/types';
import type { Input } from '@/core/Input';
import { goToHub, hubAria, hubLabel, type StudioControls } from '@/core/Platform';
import layouts from './hub-touch/layouts.json';
// Бренд студии (токены --studio-*, локальные Oswald / JetBrains Mono) — копия studio-games/brand
import './studio-brand/fonts.css';
import './studio-brand/studio-brand.css';
import './hub-touch/touch.css';
import './touch-samurai.css';

/** Контрол из layouts.json (мир samurai) */
interface TouchControl {
  id: string;
  zone?: string;
  pos?: number;
  slot?: string;
  label: string;
  icon?: string;
  pad: string;
  key: string;
}

/** Иконки — из touch-demo.html дизайнера (+ пауза) */
const ICON: Record<string, string> = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  run: '<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',
  attack: '<path d="M5 19L19 5M14 5h5v5"/>',
  wave: '<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>',
  jump: '<path d="M12 20V8M7 12l5-5 5 5M6 4h12"/>',
  grenade: '<circle cx="12" cy="14" r="6"/><path d="M12 8V5h3"/>',
  swipe: '<path d="M4 9h48M4 9l6-6M4 9l6 6M52 9l-6-6M52 9l-6 6"/>',
  rotate: '<rect x="2" y="8" width="16" height="10" rx="2"/><path d="M15 3a6 6 0 0 1 6 5M21 4v4h-4"/>',
};

const svg = (k: string, cls = ''): string =>
  `<svg viewBox="0 0 ${k === 'swipe' ? '56 18' : '24 24'}"${cls ? ` class="${cls}"` : ''}>${ICON[k] ?? ''}</svg>`;
const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const badges = (c: TouchControl): string =>
  `<span class="tc-badges"><b class="tc-pad" data-g="${esc(c.pad)}">${esc(c.pad)}</b>` +
  `<b class="tc-key" data-k="${esc(c.key)}">${esc(c.key)}</b></span>`;

/** Через сколько после старта гаснут подсказки на тач-кнопках, мс */
const HINTS_MS = 4000;

/** Режим оверлея: меню (только «в хаб»), игра, пауза (полоса без стика и кнопок) */
export type TouchMode = 'menu' | 'play' | 'paused';

/**
 * Тач-управление (SOC-129): левый плавающий стик — ход, правая половина — свайп-обзор,
 * дуга кнопок справа, верхняя полоса «← в хаб» и пауза. Вёрстка — touch.css дизайнера хаба,
 * раскладка — мир samurai из layouts.json. Всё пишет в Input.virtual.
 */
export class TouchControls {
  private root: HTMLDivElement;
  private stick!: HTMLElement;
  private mode: TouchMode = 'menu';
  /** Таймер гашения подсказок (плашка обзора, подпись стика, бейджи клавиш и пада) после первого старта */
  private hintsTimer: number | null = null;

  /** Палец на стике: id, точка касания, радиус хода */
  private stickPointer: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  /** Пальцы на свайп-обзоре: id → последняя точка */
  private lookPointers = new Map<number, { x: number; y: number }>();

  constructor(private input: Input, private onPause: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'tc tc--touch sp-tc';
    this.root.innerHTML = this.markup();
    document.body.appendChild(this.root);
    document.body.classList.add('sp-touch');
    this.stick = this.root.querySelector('.tc-stick') as HTMLElement;
    this.bindStick();
    this.bindLook();
    this.bindButtons();
    this.blockBrowserGestures();
    this.setMode('menu');
  }

  /** Открыто меню студии (там свой скролл — жесты не глушим) */
  public menuOpen: () => boolean = () => false;

  /** Шестерёнка единого меню студии (SOC-176) — в правый край верхней полосы, пауза остаётся слева от неё */
  public mountGear(g: { mountGear(container: HTMLElement, opts?: Record<string, unknown>): unknown; isOpen(): boolean }): void {
    const right = this.root.querySelector('.tc-top-r') as HTMLElement | null;
    if (!right) return;
    this.menuOpen = () => {
      try { return g.isOpen(); } catch { return false; }
    };
    try {
      g.mountGear(right, { fixed: false, label: 'Settings' });
      this.root.classList.add('sp-has-gear');
      document.body.classList.add('sp-has-gear');
    } catch (e) {
      console.warn('Шестерёнка студии не встала', e);
    }
  }

  /** Общие настройки студии: размер и плотность кнопок, левша */
  public applyStudio(c: StudioControls): void {
    this.root.style.setProperty('--tc-scale', String(c.touchSize / 100));
    this.root.style.setProperty('--tc-alpha', String(c.touchOpacity / 100));
    this.root.classList.toggle('tc--mirror', c.leftHanded);
    document.body.classList.toggle('sp-lefty', c.leftHanded);
  }

  /** Переключить режим (меню / игра / пауза) */
  public setMode(mode: TouchMode): void {
    this.mode = mode;
    this.root.dataset.mode = mode;
    if (mode !== 'play') this.releaseAll();
    // Подсказки нужны только в начале: через HINTS_MS игры гаснут и больше не возвращаются
    if (mode === 'play' && this.hintsTimer === null) {
      this.hintsTimer = window.setTimeout(() => this.root.classList.add('sp-hints-off'), HINTS_MS);
    }
  }

  /** Отпустить все пальцы (пауза, потеря фокуса) */
  private releaseAll(): void {
    this.stickPointer = null;
    this.lookPointers.clear();
    this.resetStick();
    this.root.querySelectorAll('.tc-btn.on').forEach((b) => b.classList.remove('on'));
    this.input.virtual.clear();
  }

  /** Разметка из layouts.json */
  private markup(): string {
    const world = layouts.worlds.samurai;
    const controls = world.controls as TouchControl[];
    const hub = layouts.common['top-bar'][0] as TouchControl;
    const stick = controls.find((c) => c.zone === 'left-stick')!;
    const look = controls.find((c) => c.zone === 'right-look-swipe')!;
    const pause = controls.find((c) => c.zone === 'top-bar' && c.slot === 'right')!;
    const arc = controls.filter((c) => c.zone === 'right-arc').sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));

    return `
      <div class="tc-top">
        <button class="tc-hub" data-act="hub" aria-label="${esc(hubAria(hub.label))}"><i class="tc-plate">${svg(hub.icon ?? 'back')}${esc(hubLabel(hub.label))}</i></button>
        <span class="tc-top-r">
          <button class="tc-gear sp-pause" data-act="${pause.id}" aria-label="${esc(pause.label)}"><i class="tc-plate">${svg(pause.icon ?? 'pause')}</i></button>
        </span>
      </div>
      <div class="sp-stickzone"></div>
      <div class="tc-stick tc-plate" data-act="${stick.id}" data-axes="xy">
        <span class="tc-knob"></span>
        <span class="tc-cap tc-plate"><span class="tc-lbl">${esc(stick.label)}</span>${badges(stick)}</span>
      </div>
      <div class="tc-look" data-act="${look.id}">
        <span class="tc-cap tc-plate">${svg('swipe', 'tc-swipe')}<span class="tc-lbl">${esc(look.label)}</span>${badges(look)}</span>
      </div>
      <div class="tc-arc" data-n="${arc.length}">${arc.map((c) => `
        <button class="tc-btn tc-plate" data-act="${c.id}" data-pos="${c.pos}" aria-label="${esc(c.label)}">
          ${svg(c.icon ?? '')}<span class="tc-lbl">${esc(c.label)}</span>${badges(c)}</button>`).join('')}
      </div>
      <div class="tc-rotate tc-plate">${svg('rotate')}<div><b>Поверни телефон</b><span>Играть удобнее горизонтально — стик слева, кнопки справа</span></div></div>`;
  }

  /** Левый плавающий стик: центр там, где коснулся палец */
  private bindStick(): void {
    const zone = this.root.querySelector('.sp-stickzone') as HTMLElement;
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.mode !== 'play' || this.stickPointer !== null) return;
      this.stickPointer = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.stickOrigin = { x: e.clientX, y: e.clientY };
      const d = this.stick.offsetWidth;
      this.stick.style.left = `${e.clientX - d / 2}px`;
      this.stick.style.bottom = `${window.innerHeight - e.clientY - d / 2}px`;
      this.stick.classList.add('live');
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickPointer) return;
      const d = this.stick.offsetWidth;
      const radius = d * 0.4; // полный ход — 40% диаметра
      let dx = e.clientX - this.stickOrigin.x;
      let dy = e.clientY - this.stickOrigin.y;
      const len = Math.hypot(dx, dy);
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      const knob = d * 0.28 / radius; // ручка не выходит за кольцо
      this.stick.style.setProperty('--kx', `${dx * knob}px`);
      this.stick.style.setProperty('--ky', `${dy * knob}px`);
      this.input.virtual.setMove(dx / radius, -dy / radius); // вверх по экрану = вперёд
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.resetStick();
      this.input.virtual.setMove(0, 0);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  /** Стик в покое — на месте по умолчанию */
  private resetStick(): void {
    this.stick.classList.remove('live');
    this.stick.style.removeProperty('left');
    this.stick.style.removeProperty('bottom');
    this.stick.style.setProperty('--kx', '0px');
    this.stick.style.setProperty('--ky', '0px');
  }

  /** Правая половина: свайп = обзор (несколько пальцев складываются) */
  private bindLook(): void {
    const look = this.root.querySelector('.tc-look') as HTMLElement;
    look.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.mode !== 'play') return;
      look.setPointerCapture(e.pointerId);
      this.lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    look.addEventListener('pointermove', (e) => {
      const last = this.lookPointers.get(e.pointerId);
      if (!last) return;
      this.input.virtual.addLook(e.clientX - last.x, e.clientY - last.y);
      last.x = e.clientX;
      last.y = e.clientY;
      look.classList.add('used');
    });
    const end = (e: PointerEvent) => this.lookPointers.delete(e.pointerId);
    look.addEventListener('pointerup', end);
    look.addEventListener('pointercancel', end);
  }

  /** Кнопки дуги (зажатие) и верхней полосы (тап) */
  private bindButtons(): void {
    this.root.querySelectorAll<HTMLButtonElement>('.tc-btn').forEach((btn) => {
      const action = btn.dataset.act as InputAction;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // без синтетических mousedown (иначе ЛКМ-удар)
        if (this.mode !== 'play') return;
        btn.setPointerCapture(e.pointerId);
        btn.classList.add('on');
        this.input.virtual.set(action, true);
      });
      const up = () => {
        if (!btn.classList.contains('on')) return;
        btn.classList.remove('on');
        this.input.virtual.set(action, false);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    });

    const hub = this.root.querySelector('[data-act="hub"]') as HTMLElement;
    hub.addEventListener('click', () => goToHub());
    const pause = this.root.querySelector('.sp-pause') as HTMLElement;
    pause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onPause();
    });
  }

  /** Без скролла, зума щипком и двойного тапа во время игры */
  private blockBrowserGestures(): void {
    document.addEventListener('touchmove', (e) => {
      if (this.mode !== 'menu' && !this.menuOpen()) e.preventDefault();
    }, { passive: false });
    // iOS Safari: щипок-зум
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.releaseAll());
  }
}
