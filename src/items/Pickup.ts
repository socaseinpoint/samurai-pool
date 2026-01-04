import type { Vec3 } from '@/types';
import { vec3, distanceVec3 } from '@/utils/math';

/** Тип предмета */
export type PickupType = 'health' | 'health_big' | 'stimpack' | 'charge';

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
    // type: 0 = неактивен, 9 = health, 10 = stimpack, 11 = charge, 12 = health_big
    let w = 0;
    if (this.active) {
      if (this.type === 'health') w = 9;
      else if (this.type === 'stimpack') w = 10;
      else if (this.type === 'charge') w = 11;
      else if (this.type === 'health_big') w = 12;
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

  /** 2 позиции рядом с алтарями (большие аптечки) */
  private edgePositions = [
    { x: 5, y: 1.0, z: 28 },   // Рядом с северным алтарём
    { x: -5, y: 1.0, z: -28 }, // Рядом с южным алтарём
  ];
  
  /** Таймер спавна на краях */
  private edgeSpawnTimer = 30;

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

    // Спавн БОЛЬШИХ аптечек чаще (вместо маленьких в воде)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.pickups.length < this.maxPickups) {
      this.spawnOnEdges();
      this.spawnTimer = 15 + Math.random() * 10; // 15-25 сек между спавнами
    }
    
    // Спавн БОЛЬШИХ аптечек на дальних краях каждые 30 секунд
    this.edgeSpawnTimer -= dt;
    if (this.edgeSpawnTimer <= 0) {
      this.spawnOnEdges();
      this.edgeSpawnTimer = 30;
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

  /** Спавн БОЛЬШИХ аптечек на краях карты */
  private spawnOnEdges(): void {
    // Спавним на обоих краях
    for (const spot of this.edgePositions) {
      const pos = vec3(spot.x, spot.y, spot.z);
      
      // Проверяем что там ещё нет аптечки
      const existing = this.pickups.find(p => 
        p.active && 
        (p.type === 'health' || p.type === 'health_big') && 
        Math.abs(p.position.x - pos.x) < 3 && 
        Math.abs(p.position.z - pos.z) < 3
      );
      
      if (!existing) {
        this.pickups.push(new Pickup(pos, 'health_big')); // Большая на краю!
      }
    }
  }

  /** Принудительный спавн после убийства - не используется */
  public spawnAfterKill(_position: Vec3): void {
    // Убрано - розовые аптечки в воде удалены
  }

  /** Спавн заряда катаны на верхней платформе */
  private spawnChargeOnBalcony(): void {
    // Позиция на верхней круглой платформе (центр, высота 9.5)
    const pos = vec3(0, 10.3, 0);
    this.chargeOnBalcony = new Pickup(pos, 'charge');
    this.chargeOnBalcony.lifetime = 999999; // Не исчезает
    this.pickups.push(this.chargeOnBalcony);
  }

  /** Проверка подбора заряда (только на верхней платформе!) */
  public checkChargePickup(playerPos: Vec3): boolean {
    if (!this.chargeOnBalcony || !this.chargeOnBalcony.active) return false;
    
    // Заряд можно подобрать только если игрок на верхней платформе (высота 9.5 + eyeHeight 1.7 ≈ 11+)
    if (playerPos.y < 10.5) return false;
    
    if (this.chargeOnBalcony.checkPickup(playerPos)) {
      this.chargeOnBalcony = null;
      this.chargeRespawnTimer = 60; // Респавн через 60 секунд
      return true;
    }
    return false;
  }

  /** Респавн заряда после убийства босса */
  public respawnChargeAfterBoss(): void {
    // Если заряда нет - спавним сразу
    if (!this.chargeOnBalcony || !this.chargeOnBalcony.active) {
      // Удаляем старый из списка если есть
      this.pickups = this.pickups.filter(p => p !== this.chargeOnBalcony);
      this.chargeOnBalcony = null;
      this.chargeRespawnTimer = 0;
      this.spawnChargeOnBalcony();
    }
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

