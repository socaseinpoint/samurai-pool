import type { Vec3, ICollisionSystem } from '@/types';

/**
 * Система коллизий для круглой арены с бассейнами
 * Круглые платформы по центру для паркура с двойным прыжком
 */
export class CollisionSystem implements ICollisionSystem {
  /** Радиус игрока */
  private playerRadius = 0.4;

  // Размеры круглой арены
  private arenaRadius = 28.0;
  
  // Центральный бассейн
  private poolRadius = 8.0;
  
  // Боковые платформы (левая и правая)
  private platformHeight = 2.0;
  private platformX = 20.0;
  
  // Мосты
  private bridgeWidth = 3.5;
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (по центру) ===
  // Платформа 1: низкая - обычный прыжок с земли
  private plat1 = { x: 0, z: 12, height: 2.5, radius: 2.0 };
  // Платформа 2: средняя - нужен двойной прыжок
  private plat2 = { x: 0, z: 6, height: 5.5, radius: 1.8 };
  // Платформа 3: верхняя с бафом - нужен двойной прыжок
  private plat3 = { x: 0, z: 0, height: 9.0, radius: 3.0 };

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

    // Бассейн теперь проходим - можно ходить по воде

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

  /** Проверить, находится ли точка над круглой платформой */
  private isOverCirclePlatform(pos: Vec3, plat: { x: number; z: number; height: number; radius: number }): boolean {
    const dx = pos.x - plat.x;
    const dz = pos.z - plat.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Игрок должен быть над платформой (не снизу!) и в радиусе
    return dist < plat.radius && pos.y >= plat.height - 0.5;
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
    const leftStairStartX = -16.0;
    const leftStairEndX = -17.0;
    const leftPlatformEnd = -23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      if (pos.x >= leftStairEndX && pos.x <= leftStairStartX) {
        const progress = (leftStairStartX - pos.x) / (leftStairStartX - leftStairEndX);
        return progress * this.platformHeight;
      }
      if (pos.x < leftStairEndX && pos.x > leftPlatformEnd) {
        return this.platformHeight;
      }
    }

    // === ПРАВАЯ ПЛАТФОРМА И ЛЕСТНИЦА ===
    const rightStairStartX = 16.0;
    const rightStairEndX = 17.0;
    const rightPlatformEnd = 23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      if (pos.x >= rightStairStartX && pos.x <= rightStairEndX) {
        const progress = (pos.x - rightStairStartX) / (rightStairEndX - rightStairStartX);
        return progress * this.platformHeight;
      }
      if (pos.x > rightStairEndX && pos.x < rightPlatformEnd) {
        return this.platformHeight;
      }
    }

    // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (по центру) ===
    // Проверяем сверху вниз (сначала высшие платформы)
    
    // Платформа 3 (верхняя с бафом) - высота 9м
    if (this.isOverCirclePlatform(pos, this.plat3)) {
      return this.plat3.height;
    }
    
    // Платформа 2 (средняя) - высота 5.5м
    if (this.isOverCirclePlatform(pos, this.plat2)) {
      return this.plat2.height;
    }
    
    // Платформа 1 (низкая) - высота 2.5м
    if (this.isOverCirclePlatform(pos, this.plat1)) {
      return this.plat1.height;
    }

    // Основной пол
    return 0.0;
  }

  /** Получить высоту потолка */
  public getCeilingHeight(pos: Vec3): number {
    // Проверяем, не находимся ли мы под платформой (блокируем прыжок снизу)
    const platforms = [this.plat1, this.plat2, this.plat3];
    
    for (const plat of platforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Если под платформой - потолок = низ платформы
      if (dist < plat.radius && pos.y < plat.height - 0.5) {
        return plat.height - 0.3; // Низ платформы
      }
    }
    
    return 18.0; // Общий потолок
  }

  /** Проверить коллизию для врага (упрощённая версия без перил) */
  public checkEnemyCollision(pos: Vec3, radius: number): boolean {
    // Круглые стены арены
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (distFromCenter > this.arenaRadius - radius) return true;

    // Центральная колонна (фонтан)
    if (distFromCenter < 2.0 + radius) return true;

    // Колонны по периметру
    const columnPositions = [
      { x: 22, z: 0 },
      { x: -22, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
    ];
    
    for (const col of columnPositions) {
      const dx = pos.x - col.x;
      const dz = pos.z - col.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.7 + radius) return true;
    }

    // Круглые платформы - враги не могут пройти сквозь них
    const platforms = [this.plat1, this.plat2, this.plat3];
    for (const plat of platforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Если враг на уровне платформы или ниже - блокируем
      if (dist < plat.radius + radius && pos.y < plat.height + 0.5) {
        return true;
      }
    }

    return false;
  }

  /** Получить высоту препятствия перед врагом (для прыжков) */
  public getObstacleHeight(pos: Vec3, dirX: number, dirZ: number, checkDist: number = 1.5): number {
    // Точка проверки перед врагом
    const checkX = pos.x + dirX * checkDist;
    const checkZ = pos.z + dirZ * checkDist;
    
    // Проверяем круглые платформы
    const platforms = [this.plat1, this.plat2, this.plat3];
    for (const plat of platforms) {
      const dx = checkX - plat.x;
      const dz = checkZ - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Если точка проверки внутри платформы
      if (dist < plat.radius && pos.y < plat.height) {
        return plat.height;
      }
    }
    
    return 0;
  }
}
