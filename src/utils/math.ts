import type { Vec3, Vec2 } from '@/types';

// ========== СОЗДАНИЕ ВЕКТОРОВ ==========

/** Создать Vec3 */
export function vec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
  return { x, y, z };
}

/** Создать Vec2 */
export function vec2(x: number = 0, y: number = 0): Vec2 {
  return { x, y };
}

// ========== ОПЕРАЦИИ С VEC3 ==========

/** Сложение векторов */
export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** Вычитание векторов */
export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Умножение на скаляр */
export function mulVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/** Длина вектора */
export function lengthVec3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Длина XZ компоненты */
export function lengthXZ(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.z * v.z);
}

/** Нормализация вектора */
export function normalizeVec3(v: Vec3): Vec3 {
  const len = lengthVec3(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Скалярное произведение */
export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Векторное произведение */
export function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Линейная интерполяция */
export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/** Расстояние между точками */
export function distanceVec3(a: Vec3, b: Vec3): number {
  return lengthVec3(subVec3(a, b));
}

// ========== УТИЛИТЫ ==========

/** Ограничить значение */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Линейная интерполяция чисел */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Плавный переход (smoothstep) */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Градусы в радианы */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Радианы в градусы */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/** Случайное число в диапазоне */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Случайный Vec3 в сфере */
export function randomInSphere(radius: number): Vec3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * Math.cbrt(Math.random());
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  };
}

