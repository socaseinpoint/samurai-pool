import type { Vec3, ICollisionSystem } from '@/types';

/**
 * Система коллизий для круглой арены с бассейнами
 * Исправленная версия с правильными лестницами и защитой от падения в воду
 */
export class CollisionSystem implements ICollisionSystem {
  /** Радиус игрока */
  private playerRadius = 0.4;

  // Размеры круглой арены
  private arenaRadius = 28.0;
  
  // Центральный бассейн
  private poolRadius = 8.0;
  
  // Платформы (левая и правая)
  private platformHeight = 2.0;
  private platformX = 20.0;
  
  // Мосты
  private bridgeWidth = 3.5;

  /** Проверить коллизию в точке */
  public checkCollision(pos: Vec3): boolean {
    const r = this.playerRadius;

    // Круглые стены арены
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (distFromCenter > this.arenaRadius - r) return true;

    // Центральная колонна (фонтан)
    if (distFromCenter < 2.0 + r) return true;

    // Колонны по периметру (4 основные)
    const columnPositions = [
      { x: 22, z: 0 },
      { x: -22, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
    ];
    
    for (const col of columnPositions) {
      const dx = pos.x - col.x;
      const dz = pos.z - col.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.7 + r) return true;
    }

    // Бортики центрального бассейна - нельзя войти в воду!
    const onBridgeX = Math.abs(pos.z) < this.bridgeWidth / 2;
    const onBridgeZ = Math.abs(pos.x) < this.bridgeWidth / 2;
    const onBridge = onBridgeX || onBridgeZ;
    
    // Если не на мосту и пытаемся войти в бассейн - блокируем
    if (!onBridge && distFromCenter > 2.0 && distFromCenter < this.poolRadius + r) {
      return true;
    }

    // Края платформ (перила)
    // Левая платформа
    if (pos.x < -this.platformX + 3.5 && pos.x > -this.platformX - 3.5 &&
        Math.abs(pos.z) < 6.5 && pos.y > this.platformHeight - 0.5) {
      // Перила на краю
      if (pos.x > -this.platformX + 2.8 && Math.abs(pos.z) < 6.0) {
        return true;
      }
    }
    
    // Правая платформа
    if (pos.x > this.platformX - 3.5 && pos.x < this.platformX + 3.5 &&
        Math.abs(pos.z) < 6.5 && pos.y > this.platformHeight - 0.5) {
      if (pos.x < this.platformX - 2.8 && Math.abs(pos.z) < 6.0) {
        return true;
      }
    }

    return false;
  }

  /** Получить высоту пола в точке */
  public getFloorHeight(pos: Vec3): number {
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    // === МОСТЫ (приоритет - они над бассейном) ===
    const onBridgeX = Math.abs(pos.z) < this.bridgeWidth / 2 && 
                      Math.abs(pos.x) < this.poolRadius + 1;
    const onBridgeZ = Math.abs(pos.x) < this.bridgeWidth / 2 && 
                      Math.abs(pos.z) < this.poolRadius + 1;
    
    if ((onBridgeX || onBridgeZ) && distFromCenter > 2.0) {
      return 0.3; // Высота моста
    }

    // === ЛЕВАЯ ПЛАТФОРМА И ЛЕСТНИЦА ===
    // Лестница идёт от X=-16 до X=-17 (справа от платформы)
    const leftStairStartX = -16.0; // Начало лестницы (низ)
    const leftStairEndX = -17.0;   // Конец лестницы (верх платформы)
    const leftPlatformEnd = -23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      // На лестнице
      if (pos.x >= leftStairEndX && pos.x <= leftStairStartX) {
        const progress = (leftStairStartX - pos.x) / (leftStairStartX - leftStairEndX);
        return progress * this.platformHeight;
      }
      // На платформе
      if (pos.x < leftStairEndX && pos.x > leftPlatformEnd) {
        return this.platformHeight;
      }
    }

    // === ПРАВАЯ ПЛАТФОРМА И ЛЕСТНИЦА ===
    const rightStairStartX = 16.0; // Начало лестницы (низ)
    const rightStairEndX = 17.0;   // Конец лестницы (верх)
    const rightPlatformEnd = 23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      // На лестнице
      if (pos.x >= rightStairStartX && pos.x <= rightStairEndX) {
        const progress = (pos.x - rightStairStartX) / (rightStairEndX - rightStairStartX);
        return progress * this.platformHeight;
      }
      // На платформе
      if (pos.x > rightStairEndX && pos.x < rightPlatformEnd) {
        return this.platformHeight;
      }
    }

    // Основной пол
    return 0.0;
  }

  /** Получить высоту потолка */
  public getCeilingHeight(_pos: Vec3): number {
    return 12.0;
  }
}
