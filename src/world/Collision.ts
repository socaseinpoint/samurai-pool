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
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль по кругу) ===
  // 6 платформ по кругу с радиусом 10м, высота растёт по спирали
  private jumpPlatforms = [
    { x: 10.0, z: 0.0, height: 1.8, radius: 1.5 },   // 1 - старт (0°)
    { x: 5.0, z: 8.66, height: 3.0, radius: 1.4 },   // 2 - (60°)
    { x: -5.0, z: 8.66, height: 4.2, radius: 1.4 },  // 3 - (120°)
    { x: -10.0, z: 0.0, height: 5.4, radius: 1.3 },  // 4 - (180°)
    { x: -5.0, z: -8.66, height: 6.6, radius: 1.3 }, // 5 - (240°)
    { x: 5.0, z: -8.66, height: 7.8, radius: 1.2 },  // 6 - (300°)
  ];
  // Верхняя платформа с бафом - в центре над фонтаном
  private topPlatform = { x: 0, z: 0, height: 9.5, radius: 2.5 };

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

    // Коллизия с круглыми платформами (сбоку)
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const feetY = pos.y - 1.7;
      
      // Если игрок на уровне платформы или ниже - блокируем вход в радиус
      if (dist < plat.radius + r && feetY < plat.height - 0.1) {
        return true;
      }
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

  /** Проверить, находится ли точка над круглой платформой */
  private isOverCirclePlatform(pos: Vec3, plat: { x: number; z: number; height: number; radius: number }): boolean {
    const dx = pos.x - plat.x;
    const dz = pos.z - plat.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Игрок должен быть СТРОГО выше платформы (минимум на уровне верха) и в радиусе
    // pos.y - это позиция глаз, eyeHeight = 1.7, значит ноги на pos.y - 1.7
    // Ноги должны быть выше или на уровне платформы
    const feetY = pos.y - 1.7;
    return dist < plat.radius && feetY >= plat.height - 0.1;
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

    // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль) ===
    // Верхняя платформа с бафом
    if (this.isOverCirclePlatform(pos, this.topPlatform)) {
      return this.topPlatform.height;
    }
    
    // 6 платформ по кругу (проверяем сверху вниз)
    for (let i = this.jumpPlatforms.length - 1; i >= 0; i--) {
      if (this.isOverCirclePlatform(pos, this.jumpPlatforms[i])) {
        return this.jumpPlatforms[i].height;
      }
    }

    // Основной пол
    return 0.0;
  }

  /** Получить высоту потолка */
  public getCeilingHeight(pos: Vec3): number {
    // Проверяем все платформы
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Если под платформой - потолок = низ платформы
      if (dist < plat.radius && pos.y < plat.height - 0.5) {
        return plat.height - 0.3;
      }
    }
    
    return 18.0;
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

    // Все платформы
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < plat.radius + radius && pos.y < plat.height + 0.5) {
        return true;
      }
    }

    return false;
  }

  /** Получить высоту препятствия перед врагом (для прыжков) */
  public getObstacleHeight(pos: Vec3, dirX: number, dirZ: number, checkDist: number = 1.5): number {
    const checkX = pos.x + dirX * checkDist;
    const checkZ = pos.z + dirZ * checkDist;
    
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = checkX - plat.x;
      const dz = checkZ - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < plat.radius && pos.y < plat.height) {
        return plat.height;
      }
    }
    
    return 0;
  }
}
