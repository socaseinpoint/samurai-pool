/**
 * Единое меню настроек студии Glint (SOC-176): модуль /studio/glint-settings.js (window.GlintSettings).
 * Подгружается только на сайте студии (/games/...); вне студии и без модуля игра работает как раньше (своя модалка).
 * Общие настройки — localStorage 'studio.controls.v1', настройки Samurai — 'studio.game.samurai.v1'.
 */
import { inStudio, normalizeStudioControls, type StudioControls } from './Platform';

export const GLINT_GAME_ID = 'samurai';
export const GLINT_GAME_KEY = 'studio.game.' + GLINT_GAME_ID + '.v1';
const GLINT_SRC = '/studio/glint-settings.js';
/** Старый ключ настроек графики (до SOC-176), на общем origin без префикса */
const LEGACY_KEY = 'gameSettings';

/** Пункт блока GAME в меню */
export interface GlintItem {
  key: string;
  label: string;
  type: 'range' | 'toggle' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  def: unknown;
  hint?: string;
}

/** Кнопка в схеме управления */
export interface GlintButton {
  action: string;
  pad?: string;
  keys?: string;
  touch?: string;
}

export interface GlintRegistration {
  gameId: string;
  title: string;
  items: GlintItem[];
  buttons: GlintButton[];
  onOpen?: () => void;
  onClose?: () => void;
  onGameChange?: (values: Record<string, unknown>) => void;
}

/** API модуля (контракт SOC-176) */
export interface GlintSettingsApi {
  get(): Record<string, unknown>;
  set(patch: Record<string, unknown>): void;
  getGame(id: string): Record<string, unknown>;
  setGame(id: string, patch: Record<string, unknown>): void;
  on(fn: (settings: Record<string, unknown>, changedKeys: string[]) => void): () => void;
  register(cfg: GlintRegistration): void;
  open(tab?: string): void;
  close(): void;
  isOpen(): boolean;
  mountGear(container: HTMLElement, opts?: Record<string, unknown>): unknown;
}

/** Модуль на странице (после loadGlintSettings) или null */
export function glint(): GlintSettingsApi | null {
  const g = (window as unknown as { GlintSettings?: GlintSettingsApi }).GlintSettings;
  return g && typeof g.register === 'function' ? g : null;
}

/** Меню студии сейчас открыто */
export function glintOpen(): boolean {
  try {
    return !!glint()?.isOpen();
  } catch {
    return false;
  }
}

/** Подгрузить модуль: только на сайте студии; нет файла, ошибка или таймаут — null, игра живёт без него */
export function loadGlintSettings(timeoutMs = 8000): Promise<GlintSettingsApi | null> {
  if (!inStudio()) return Promise.resolve(null);
  const ready = glint();
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(glint());
    };
    const s = document.createElement('script');
    s.src = GLINT_SRC;
    s.async = true;
    s.onload = finish;
    s.onerror = finish;
    window.setTimeout(finish, timeoutMs);
    document.head.appendChild(s);
  });
}

/** Общие настройки из модуля (с клампом), при ошибке модуля — null */
export function glintControls(g: GlintSettingsApi): StudioControls | null {
  try {
    return normalizeStudioControls(g.get());
  } catch {
    return null;
  }
}

/** Настройки Samurai в студии: тени, постэффекты, катана 3D, турбо */
export interface SamuraiGameSettings {
  shadows: boolean;
  postfx: boolean;
  katana: boolean;
  turbo: boolean;
}

export const SAMURAI_GAME_DEFAULTS: SamuraiGameSettings = { shadows: true, postfx: true, katana: true, turbo: false };

const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);

export function normalizeGameSettings(raw: Record<string, unknown> | null | undefined): SamuraiGameSettings {
  const r = raw && typeof raw === 'object' ? raw : {};
  const d = SAMURAI_GAME_DEFAULTS;
  return {
    shadows: bool(r.shadows, d.shadows),
    postfx: bool(r.postfx, d.postfx),
    katana: bool(r.katana, d.katana),
    turbo: bool(r.turbo, d.turbo),
  };
}

const readJson = (key: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
};

/**
 * Настройки Samurai из 'studio.game.samurai.v1' (синхронно, до загрузки модуля — чтобы рендерер стартовал сразу с ними).
 * Миграция: ключа ещё нет, а старый 'gameSettings' есть — переносим тени/постэффекты/катану/турбо в новый ключ.
 * Качество в новый ключ не переносится: оно общее для студии (studio.controls.v1 quality).
 */
export function readGameSettings(): SamuraiGameSettings {
  const cur = readJson(GLINT_GAME_KEY);
  if (cur) return normalizeGameSettings(cur);
  const legacy = readJson(LEGACY_KEY);
  const migrated = normalizeGameSettings(legacy);
  if (legacy) {
    try {
      window.localStorage.setItem(GLINT_GAME_KEY, JSON.stringify(migrated));
    } catch {
      // нет доступа к localStorage — просто дефолты из старого ключа на эту сессию
    }
  }
  return migrated;
}
