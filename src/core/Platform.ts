/**
 * Платформа: тач/телефон и параметры из адресной строки
 * ?touch=1|0 — принудительно включить/выключить тач-управление
 * ?quality=phone|ultra_low|low|medium|high — профиль графики, ?scale=0.3..1 — масштаб рендера в phone
 */

const params = new URLSearchParams(window.location.search);

/** Тач-устройство: грубый указатель (телефон, планшет) или явный ?touch=1 */
export function isTouchDevice(): boolean {
  const forced = params.get('touch');
  if (forced === '1') return true;
  if (forced === '0') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  return coarse || (navigator.maxTouchPoints > 0 && !fine);
}

/** Маленький экран (телефон в любой ориентации) */
export function isSmallScreen(): boolean {
  return Math.min(window.screen.width, window.screen.height) <= 540;
}

/** Профили графики */
export type QualityName = 'phone' | 'ultra_low' | 'low' | 'medium' | 'high';

/** Профиль из ?quality= (null — не задан или неизвестен) */
export function getQualityParam(): QualityName | null {
  const q = params.get('quality');
  return q === 'phone' || q === 'ultra_low' || q === 'low' || q === 'medium' || q === 'high' ? q : null;
}

/** Масштаб рендера phone-профиля от CSS-пикселей: ?scale= или 0.55 */
export function getPhoneScale(): number {
  const s = parseFloat(params.get('scale') ?? '');
  return Number.isFinite(s) ? Math.max(0.3, Math.min(1, s)) : 0.55;
}

/** Нужен ли облегчённый профиль: явный ?quality=phone или тач/маленький экран без ?quality= */
export function wantsPhoneProfile(): boolean {
  const q = getQualityParam();
  if (q) return q === 'phone';
  // Общая настройка студии: low — всегда облегчённо, high — никогда
  const studio = readStudioControls().quality;
  if (studio === 'low') return true;
  if (studio === 'high') return false;
  return isTouchDevice() || isSmallScreen();
}

/**
 * Адрес хаба: на сайте студии игры лежат под /games/<id>/ — хаб в корне "/";
 * в Midnight игра в /samurai-pool/ — хаб ../launch.html
 */
export function hubUrl(): string {
  return window.location.pathname.startsWith('/games/') ? '/' : '../launch.html';
}

/** Подпись кнопки возврата: на сайте студии — имя студии «Glint» (как в Езде, Полёте и Офисе), в Midnight — из раскладки («в хаб») */
export function hubLabel(fallback: string): string {
  return window.location.pathname.startsWith('/games/') ? 'Glint' : fallback;
}

/** aria-label кнопки возврата: на сайте студии — «Вернуться в студию Glint» */
export function hubAria(fallback: string): string {
  return window.location.pathname.startsWith('/games/') ? 'Вернуться в студию Glint' : 'Вернуться: ' + fallback;
}

/** Вернуться в хаб */
export function goToHub(): void {
  window.location.href = new URL(hubUrl(), window.location.href).href;
}

/** Общие настройки управления студии (localStorage, общий origin с сайтом студии) */
export interface StudioControls {
  lookSens: number;      // 0.2–3, чувствительность обзора / свайпа
  invertY: boolean;      // инверсия вертикали
  touchSize: number;     // %, 70–150, размер тач-кнопок
  touchOpacity: number;  // %, 20–100
  leftHanded: boolean;   // стик справа, кнопки слева
  vibration: boolean;
  quality: 'auto' | 'low' | 'high';
  volume: number;        // 0–100
}

export const STUDIO_CONTROLS_KEY = 'studio.controls.v1';

const STUDIO_DEFAULTS: StudioControls = {
  lookSens: 1, invertY: false, touchSize: 100, touchOpacity: 70,
  leftHanded: false, vibration: true, quality: 'auto', volume: 80,
};

const num = (v: unknown, def: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def;

/** Прочитать настройки студии с дефолтами; битый или чужой формат — дефолты, без ошибок */
export function readStudioControls(): StudioControls {
  let raw: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDIO_CONTROLS_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object') raw = parsed;
  } catch {
    // нет доступа к localStorage или не JSON — дефолты
  }
  const d = STUDIO_DEFAULTS;
  return {
    lookSens: num(raw.lookSens, d.lookSens, 0.2, 3),
    invertY: typeof raw.invertY === 'boolean' ? raw.invertY : d.invertY,
    touchSize: num(raw.touchSize, d.touchSize, 70, 150),
    touchOpacity: num(raw.touchOpacity, d.touchOpacity, 20, 100),
    leftHanded: typeof raw.leftHanded === 'boolean' ? raw.leftHanded : d.leftHanded,
    vibration: typeof raw.vibration === 'boolean' ? raw.vibration : d.vibration,
    quality: raw.quality === 'low' || raw.quality === 'high' ? raw.quality : 'auto',
    volume: num(raw.volume, d.volume, 0, 100),
  };
}

/** Подписка на изменение настроек студии в другой вкладке (событие storage) */
export function onStudioControlsChange(cb: (c: StudioControls) => void): void {
  window.addEventListener('storage', (e) => {
    if (e.key === STUDIO_CONTROLS_KEY) cb(readStudioControls());
  });
}
