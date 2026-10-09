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
  return isTouchDevice() || isSmallScreen();
}

/** Адрес хаба игр: игра лежит в подпапке Midnight (/samurai-pool/), хаб — ../launch.html */
export const HUB_URL = '../launch.html';

/** Вернуться в хаб */
export function goToHub(): void {
  window.location.href = new URL(HUB_URL, window.location.href).href;
}
