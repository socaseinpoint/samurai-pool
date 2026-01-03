import type { Vec3 } from '@/types';
import { vec3, distanceVec3 } from '@/utils/math';

/** Тип предмета */
export type PickupType = 'health' | 'stimpack' | 'charge';

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
  public lifetime: number;

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
    // type: 0 = неактивен, 9 = health, 10 = stimpack, 11 = charge
    let w = 0;
    if (this.active) {
      if (this.type === 'health') w = 9;
      else if (this.type === 'stimpack') w = 10;
      else if (this.type === 'charge') w = 11;
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

  /** Таймер спавна на возвышенности */
  private platformSpawnTimer = 30;

  /** Позиции возвышенностей */
  private platformPositions = [
    { x: -20, y: 2.5, z: 0 },  // Левая платформа
    { x: 20, y: 2.5, z: 0 },   // Правая платформа
  ];

  /** Текущая платформа для спавна */
  private currentPlatform = 0;

  /** Максимум предметов на карте */
  private maxPickups = 5;

  /** Заряд катаны на балконе */
  private chargeOnBalcony: Pickup | null = null;
  
  /** Таймер респавна заряда */
  private chargeRespawnTimer = 0;

  constructor() {
    // Спавним заряд на балконе сразу
    this.spawnChargeOnBalcony();
  }

  /** Обновление */
  public update(dt: number, time: number, playerPos: Vec3): PickupType | null {
    // Обновляем существующие
    for (const pickup of this.pickups) {
      pickup.update(dt, time);
    }

    // Удаляем неактивные
    this.pickups = this.pickups.filter(p => p.active);

    // Спавним новые случайные
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.pickups.length < this.maxPickups) {
      this.spawnRandom();
      this.spawnTimer = 8 + Math.random() * 7; // 8-15 сек между спавнами
    }

    // Спавн аптечки на возвышенности каждые 30 секунд
    this.platformSpawnTimer -= dt;
    if (this.platformSpawnTimer <= 0) {
      this.spawnOnPlatform();
      this.platformSpawnTimer = 30;
    }

    // Обновляем респавн заряда
    this.updateChargeRespawn(dt);

    // Проверяем подбор заряда (только на балконе)
    if (this.checkChargePickup(playerPos)) {
      return 'charge';
    }

    // Проверяем подбор обычных предметов
    for (const pickup of this.pickups) {
      // Пропускаем заряд, он уже проверен выше
      if (pickup.type === 'charge') continue;
      
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

    // Только аптечки (стимпаки за быстрые убийства)
    this.pickups.push(new Pickup(pos, 'health'));
  }

  /** Спавн аптечки на возвышенности */
  private spawnOnPlatform(): void {
    // Чередуем платформы
    const platform = this.platformPositions[this.currentPlatform];
    this.currentPlatform = (this.currentPlatform + 1) % this.platformPositions.length;

    const pos = vec3(
      platform.x + (Math.random() - 0.5) * 4, // Небольшой разброс по X
      platform.y,
      platform.z + (Math.random() - 0.5) * 8  // Разброс по Z
    );

    // На платформе всегда аптечка
    this.pickups.push(new Pickup(pos, 'health'));
  }

  /** Принудительный спавн после убийства */
  public spawnAfterKill(position: Vec3): void {
    // 25% шанс выпадения аптечки (стимпаки за быстрые убийства)
    if (Math.random() < 0.25) {
      const pos = vec3(
        position.x + (Math.random() - 0.5) * 2,
        1.0,
        position.z + (Math.random() - 0.5) * 2
      );
      this.pickups.push(new Pickup(pos, 'health'));
    }
  }

  /** Спавн заряда катаны на верхней платформе */
  private spawnChargeOnBalcony(): void {
    // Позиция на верхней круглой платформе (центр, высота 9)
    const pos = vec3(0, 9.8, 0);
    this.chargeOnBalcony = new Pickup(pos, 'charge');
    this.chargeOnBalcony.lifetime = 999999; // Не исчезает
    this.pickups.push(this.chargeOnBalcony);
  }

  /** Проверка подбора заряда (только на балконе!) */
  public checkChargePickup(playerPos: Vec3): boolean {
    if (!this.chargeOnBalcony || !this.chargeOnBalcony.active) return false;
    
    // Заряд можно подобрать только если игрок на верхнем балконе (высота > 11)
    if (playerPos.y < 11.0) return false;
    
    if (this.chargeOnBalcony.checkPickup(playerPos)) {
      this.chargeOnBalcony = null;
      this.chargeRespawnTimer = 60; // Респавн через 60 секунд
      return true;
    }
    return false;
  }

  /** Обновление респавна заряда */
  public updateChargeRespawn(dt: number): void {
    if (this.chargeOnBalcony === null && this.chargeRespawnTimer > 0) {
      this.chargeRespawnTimer -= dt;
      if (this.chargeRespawnTimer <= 0) {
        this.spawnChargeOnBalcony();
      }
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

