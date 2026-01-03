import type { Vec3 } from '@/types';
import { vec3, distanceVec3 } from '@/utils/math';

/** Тип предмета */
export type PickupType = 'health' | 'stimpack';

/**
 * Предмет для подбора
 */
export class Pickup {
  /** Позиция */
  public position: Vec3;

  /** Тип предмета */
  public type: PickupType;

  /** Радиус подбора */
  public radius = 1.0;

  /** Активен? */
  public active = true;

  /** Время жизни */
  private lifetime: number;

  /** Фаза анимации */
  private phase: number;

  /** Базовая высота */
  private baseY: number;

  constructor(position: Vec3, type: PickupType) {
    this.position = { ...position };
    this.type = type;
    this.phase = Math.random() * Math.PI * 2;
    this.baseY = position.y;
    this.lifetime = 30; // 30 секунд жизни
  }

  /** Обновление */
  public update(dt: number, time: number): void {
    if (!this.active) return;

    // Парящий эффект
    this.position.y = this.baseY + Math.sin(time * 3 + this.phase) * 0.2;

    // Уменьшение времени жизни
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  /** Проверка подбора */
  public checkPickup(playerPos: Vec3): boolean {
    if (!this.active) return false;

    const dist = distanceVec3(this.position, playerPos);
    if (dist < this.radius + 0.5) {
      this.active = false;
      return true;
    }
    return false;
  }

  /** Данные для шейдера [x, y, z, type] */
  public getShaderData(): [number, number, number, number] {
    // type: 0 = неактивен, 9 = health, 10 = stimpack
    let w = 0;
    if (this.active) {
      w = this.type === 'health' ? 9 : 10;
    }
    return [this.position.x, this.position.y, this.position.z, w];
  }
}

/**
 * Менеджер предметов
 */
export class PickupManager {
  /** Все предметы */
  public pickups: Pickup[] = [];

  /** Время между спавнами */
  private spawnTimer = 10;

  /** Максимум предметов на карте */
  private maxPickups = 5;

  constructor() {}

  /** Обновление */
  public update(dt: number, time: number, playerPos: Vec3): PickupType | null {
    // Обновляем существующие
    for (const pickup of this.pickups) {
      pickup.update(dt, time);
    }

    // Удаляем неактивные
    this.pickups = this.pickups.filter(p => p.active);

    // Спавним новые
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.pickups.length < this.maxPickups) {
      this.spawnRandom();
      this.spawnTimer = 8 + Math.random() * 7; // 8-15 сек между спавнами
    }

    // Проверяем подбор
    for (const pickup of this.pickups) {
      if (pickup.checkPickup(playerPos)) {
        return pickup.type;
      }
    }

    return null;
  }

  /** Спавн случайного предмета */
  private spawnRandom(): void {
    const spawnRadius = 15;
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * spawnRadius;
    
    const pos = vec3(
      Math.cos(angle) * dist,
      1.0,
      Math.sin(angle) * dist
    );

    // 70% аптечки, 30% стимпаки
    const type: PickupType = Math.random() < 0.7 ? 'health' : 'stimpack';
    
    this.pickups.push(new Pickup(pos, type));
  }

  /** Принудительный спавн после убийства */
  public spawnAfterKill(position: Vec3): void {
    // 30% шанс выпадения предмета
    if (Math.random() < 0.3) {
      const type: PickupType = Math.random() < 0.6 ? 'health' : 'stimpack';
      const pos = vec3(
        position.x + (Math.random() - 0.5) * 2,
        1.0,
        position.z + (Math.random() - 0.5) * 2
      );
      this.pickups.push(new Pickup(pos, type));
    }
  }

  /** Данные для шейдера */
  public getShaderData(): Float32Array {
    const data = new Float32Array(this.pickups.length * 4);
    for (let i = 0; i < this.pickups.length; i++) {
      const [x, y, z, w] = this.pickups[i].getShaderData();
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = w;
    }
    return data;
  }
}

