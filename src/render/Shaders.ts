/** Вершинный шейдер */
export const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/** Фрагментный шейдер - Circular Arena with Pools */
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform int u_turboMode;  // Турбо режим - минимум геометрии
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec4 u_targets[16];
uniform int u_targetCount;
uniform float u_muzzleFlash;
uniform vec4 u_pools[8]; // Токсичные лужи [x, z, radius, lifetime]
uniform int u_poolCount;
uniform vec4 u_acidProjectiles[4]; // Летящие снаряды кислоты [x, y, z, progress]
uniform int u_acidProjectileCount;
uniform vec4 u_spikes[8]; // Лазеры спайкеров [startX, startY, startZ, lifetime]
uniform vec4 u_spikeTargets[8]; // Конечные точки лазеров [endX, endY, endZ, intensity]
uniform int u_spikeCount;
uniform vec4 u_acidRainZones[4]; // Зоны кислотного дождя [x, z, radius, state]
uniform int u_acidRainZoneCount;
uniform int u_era; // Эпоха: 1=кислотная, 2=чёрная дыра, 3=космическая
uniform vec4 u_altars[2]; // Алтари [x, y, z, score]
uniform vec4 u_darts[16]; // Летящие лучи [x, y, z, active]
uniform vec4 u_dartDirs[16]; // Направления лучей [dx, dy, dz, speed]
uniform int u_dartCount;
uniform float u_voidPortalActive; // Активен ли портал в войд (0 или время жизни)
uniform vec4 u_bloodCoins[12]; // Монеты крови в войде [x, y, z, active]
uniform int u_bloodCoinCount;
uniform int u_wave; // Текущая волна (для эффекта дождя на 15+)
uniform int u_greenBossPhase2; // Фаза 2 зелёного босса - зелёное небо!
uniform vec4 u_pickups[8]; // Пикапы [x, y, z, type] type: 9=health, 10=stimpack, 11=charge
uniform int u_pickupCount;
uniform vec4 u_crystals[6]; // Кристаллы силы [x, z, height, active]
uniform int u_voidMode; // Режим войда (засосан Владыкой пустоты)
uniform float u_voidProgress; // Прогресс войда (0-1, для анимации выхода)
uniform float u_voidFallOffset; // Смещение падения для визуального эффекта
uniform vec3 u_portalPos; // Позиция портала выхода в войде
uniform vec4 u_grenades[8]; // Гранаты [x, y, z, lifetime]
uniform int u_grenadeCount;
uniform vec4 u_explosions[8]; // Взрывы [x, y, z, progress]
uniform int u_explosionCount;
uniform int u_voidVariant; // Вариант войда (0-3: багровый, изумрудный, золотой, ледяной)

// === КАТАНА (3D viewmodel) ===
uniform float u_katanaAttack; // Прогресс атаки 0-1
uniform float u_katanaBob; // Фаза покачивания
uniform int u_katanaCharges; // Заряды сплеша (0-3)
uniform float u_katanaTargetAngle; // Угол к ближайшему врагу (-1 = нет врага)
uniform float u_katanaTargetDist; // Расстояние до ближайшего врага
uniform int u_katanaAttackType; // Тип удара: 0=справа сверху, 1=слева локтевой, 2=сплеш

// === ЭФФЕКТЫ СМЕРТИ ВРАГОВ ===
uniform vec4 u_deathEffects[8]; // [x, y, z, progress] - до 8 одновременных смертей

// === ФРАГМЕНТЫ ВРАГОВ (разрубленные куски) ===
uniform vec4 u_fragments[32]; // [x, y, z, size] - до 32 фрагментов
uniform int u_fragmentCount;

// === НАСТРОЙКИ ГРАФИКИ ===
uniform int u_shadowsEnabled;  // 0 или 1
uniform int u_postfxEnabled;   // 0 или 1
uniform int u_katanaEnabled;   // 0 или 1

in vec2 v_uv;
out vec4 fragColor;

// === ПАРАМЕТРЫ РЕЙТРЕЙСИНГА ===
#define MAX_STEPS 40
#define MAX_DIST 150.0
#define SURF_DIST 0.035
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 38.0
#define DOME_HEIGHT 22.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0
// Площадки за порталами
#define BACK_PLATFORM_RADIUS 8.0
#define BACK_PLATFORM_X 30.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// === GLITCH DISSOLVE ЭФФЕКТ СМЕРТИ ===
// Возвращает: x = dissolve factor (0=живой, 1=растворён), y = glitch offset
vec2 getDeathEffect(vec3 worldPos) {
  float totalDissolve = 0.0;
  float totalGlitch = 0.0;
  
  for (int i = 0; i < 2; i++) { // Оптимизация: было 4
    vec4 death = u_deathEffects[i];
    if (death.w > 0.01) {
      float dist = length(worldPos - death.xyz);
      float progress = death.w;
      
      // Волна растворения распространяется от центра
      float waveRadius = progress * 3.0;
      float waveFront = smoothstep(waveRadius + 0.5, waveRadius - 0.5, dist);
      
      // Шумовой dissolve
      float noiseVal = hash3(worldPos * 10.0 + progress * 5.0);
      float dissolve = waveFront * step(noiseVal, progress * 1.5);
      
      // Glitch distortion
      float glitch = 0.0;
      if (progress > 0.1 && progress < 0.9) {
        float glitchNoise = hash3(worldPos * 50.0 + vec3(progress * 20.0));
        if (glitchNoise > 0.92) {
          glitch = (glitchNoise - 0.92) * 2.0 * sin(progress * 50.0);
        }
      }
      
      totalDissolve = max(totalDissolve, dissolve);
      totalGlitch = max(totalGlitch, glitch * waveFront);
    }
  }
  
  return vec2(totalDissolve, totalGlitch);
}

// Цвет распада - яркие частицы
vec3 getDeathColor(vec3 worldPos, vec3 baseColor, float progress) {
  // Яркие искры на границе распада
  float sparkle = hash3(worldPos * 30.0 + progress * 10.0);
  if (sparkle > 0.95) {
    return vec3(1.0, 0.5, 0.0) * 3.0; // Оранжевые искры
  }
  
  // Энергетическое свечение
  float glow = sin(progress * 20.0 + length(worldPos) * 5.0) * 0.5 + 0.5;
  vec3 energyColor = mix(vec3(1.0, 0.3, 0.0), vec3(0.0, 1.0, 0.5), glow);
  
  return mix(baseColor, energyColor, progress * 2.0);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Улучшенная интерполяция (quintic)
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
}

// Быстрый фрактальный шум (3 октавы вместо 5)
float fbm(vec2 p) {
  float value = 0.0;
  value += 0.5 * noise(p);
  value += 0.25 * noise(p * 2.0);
  value += 0.125 * noise(p * 4.0);
  return value;
}

// Острый шум для трещин и швов
float sharpNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Без сглаживания - резкие границы
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, step(0.5, f.x)), mix(c, d, step(0.5, f.x)), step(0.5, f.y));
}

float waterWaves(vec2 p, float t) {
  float wave = 0.0;
  wave += sin(p.x * 0.5 + t * 0.8) * 0.08;
  wave += sin(p.y * 0.4 + t * 0.6) * 0.06;
  wave += sin((p.x + p.y) * 0.7 + t) * 0.04;
  return wave;
}

// === SDF ПРИМИТИВЫ ===
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// Октаэдр (кристалл)
float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// Плавное объединение
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// === МАТЕРИАЛ ===
// 0 = стены/пол, 1 = вода, 2 = растения, 3 = металл, 4 = свечение
int materialId = 0;

// === ПАЛЬМА ===
float sdPalm(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  // Горшок
  float pot = sdCappedCone(lp - vec3(0.0, 0.3, 0.0), 0.3, 0.5, 0.4);
  d = min(d, pot);
  
  // Ствол
  float trunk = sdCylinder(lp - vec3(0.0, 1.5, 0.0), 0.12, 1.2);
  d = min(d, trunk);
  
  // Крона (несколько сфер)
  float crown = sdSphere(lp - vec3(0.0, 3.0, 0.0), 1.0);
  crown = min(crown, sdSphere(lp - vec3(0.5, 2.8, 0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(-0.5, 2.8, -0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(0.3, 2.9, -0.5), 0.6));
  crown = min(crown, sdSphere(lp - vec3(-0.3, 2.9, 0.5), 0.6));
  d = min(d, crown);
  
  return d;
}

// === КУСТ ===
float sdBush(vec3 p, vec3 pos, float size) {
  vec3 lp = p - pos;
  float d = sdSphere(lp, size);
  // Добавляем неровности
  d += sin(lp.x * 8.0) * sin(lp.y * 8.0) * sin(lp.z * 8.0) * 0.05 * size;
  return d;
}

// === ФАКЕЛ ===
float sdTorch(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float holder = sdCylinder(lp, 0.08, 0.3);
  float bowl = sdCappedCone(lp - vec3(0.0, 0.35, 0.0), 0.15, 0.05, 0.15);
  return min(holder, bowl);
}

// === ЛЕСТНИЦА ===
float sdStairs(vec3 p, vec3 pos, float width, float height, float depth, int steps) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  float stepH = height / float(steps);
  float stepD = depth / float(steps);
  
  for (int i = 0; i < steps; i++) {
    if (i >= 10) break; // Ограничение для производительности
    float y = float(i) * stepH;
    float z = float(i) * stepD;
    float step = sdBox(lp - vec3(0.0, y + stepH * 0.5, z + stepD * 0.5), 
                       vec3(width * 0.5, stepH * 0.5, stepD * 0.5));
    d = min(d, step);
  }
  
  return d;
}

// === ТУРБО MAP (минимум геометрии + основные элементы) ===
float mapTurbo(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  // Пол
  float floor_d = p.y;
  if (floor_d < d) {
    d = floor_d;
    materialId = 55;
  }
  
  // Центральный фонтан (просто цилиндр)
  float fountainDist = length(p.xz);
  if (fountainDist < 5.0) {
    float fountain = max(fountainDist - 3.0, abs(p.y - 1.5) - 1.5);
    if (fountain < d) {
      d = fountain;
      materialId = 50;
    }
  }
  
  // Порталы (простые боксы)
  // Левый
  vec3 lp = p - vec3(-22.0, 3.0, 0.0);
  float leftPortal = max(max(abs(lp.x) - 1.5, abs(lp.y) - 3.0), abs(lp.z) - 0.5);
  if (leftPortal < d) { d = leftPortal; materialId = 23; }
  
  // Правый
  vec3 rp = p - vec3(22.0, 3.0, 0.0);
  float rightPortal = max(max(abs(rp.x) - 1.5, abs(rp.y) - 3.0), abs(rp.z) - 0.5);
  if (rightPortal < d) { d = rightPortal; materialId = 23; }
  
  // Враги (сферы)
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 8) break; // Максимум 8
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 enemyPos = vec3(target.x, 1.0, target.y);
      float enemyD = length(p - enemyPos) - 0.8;
      if (enemyD < d) {
        d = enemyD;
        materialId = 10;
      }
    }
  }
  
  // Стены (цилиндр)
  float wallDist = -(length(p.xz) - 38.0);
  if (wallDist < d && p.y < 8.0) {
    d = wallDist;
    materialId = 12;
  }
  
  // Бассейн (кольцо вокруг фонтана)
  float poolDist = abs(length(p.xz) - 8.0) - 5.0;
  if (poolDist < 2.0 && p.y < -0.3) {
    float pool = max(poolDist, -p.y - 0.5);
    if (pool < d) {
      d = pool;
      materialId = 49; // Вода
    }
  }
  
  return d;
}

// === СЦЕНА ===
float map(vec3 p) {
  // Турбо режим - минимальная геометрия
  if (u_turboMode == 1) {
    return mapTurbo(p);
  }
  
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  float distFromCam = length(p - u_cameraPos);
  
  // LOD: на большом расстоянии пропускаем детали
  bool isNear = distFromCam < 40.0;
  bool isMedium = distFromCam < 80.0;
  
  // === ПРОСТОЙ КРАЙ АРЕНЫ ===
  float arenaRadius = ARENA_RADIUS - 5.0;
  float arenaEdge = length(p.xz) - arenaRadius;
  
  // === ПОЛ (ДЕТАЛИЗИРОВАННЫЙ) ===
  float floor_d = p.y;
  if (arenaEdge < 0.0) {
    // Основной пол
    if (floor_d < d) {
      d = floor_d;
      
      // Определяем зону пола для разных материалов
      float centerDist = length(p.xz);
      
      if (centerDist < 4.0) {
        materialId = 53; // Мозаика в центре
      } else if (centerDist < 8.0) {
        materialId = 54; // Декоративное кольцо
      } else {
        materialId = 55; // Основной пол - каменная плитка
      }
    }
  }
  
  // === ТОКСИЧНЫЕ ЛУЖИ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_poolCount; i++) {
      if (i >= 4) break; // Уменьшено с 8 до 4
      vec4 pool = u_pools[i];
      if (pool.w > 0.0 && p.y < 0.15 && p.y > -0.1) {
        float distToPool = length(p.xz - pool.xy);
        if (distToPool < pool.z) {
          float poolSurface = p.y - 0.08;
          if (poolSurface < d) {
            d = poolSurface;
            materialId = 13;
          }
        }
      }
    }
  }
  
  // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ (distance culled) ===
  if (distFromCam < 60.0) {
    for (int i = 0; i < u_acidRainZoneCount; i++) {
      if (i >= 2) break; // Уменьшено с 4 до 2
      vec4 zone = u_acidRainZones[i];
      float state = zone.w;
      float distToZone = length(p.xz - zone.xy);
      float zoneRadius = zone.z;
      
      if (state < 1.0) {
        if (p.y < 0.1 && p.y > -0.05) {
          float markRadius = zoneRadius * (0.3 + state * 1.4);
          if (distToZone < markRadius) {
            float ring = smoothstep(0.2, 0.0, abs(distToZone - markRadius * 0.85));
            if (ring > 0.3) {
              d = p.y - 0.02;
              materialId = 20;
            }
          }
        }
      } else {
        if (p.y < 0.15 && p.y > -0.05 && distToZone < zoneRadius) {
          d = p.y - 0.03;
          materialId = 21;
        }
      }
    }
  }
  
  // === ЛЕТЯЩИЕ СНАРЯДЫ КИСЛОТЫ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_acidProjectileCount; i++) {
      if (i >= 2) break; // Уменьшено с 4 до 2
      vec4 proj = u_acidProjectiles[i];
      vec3 projPos = proj.xyz;
      float progress = proj.w;
      
      if (progress > 0.0 && progress < 1.0) {
        float projSphere = length(p - projPos) - 0.5;
        if (projSphere < d) {
          d = projSphere;
          materialId = 19;
        }
      }
    }
  }
  
  // === ЭНЕРГЕТИЧЕСКИЕ ЛУЧИ (упрощённые, distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_dartCount; i++) {
      if (i >= 4) break;
      vec4 dart = u_darts[i];
      if (dart.w > 0.5) {
        vec3 dartPos = dart.xyz;
        float dartD = length(p - dartPos) - 0.2;
        if (dartD < d) {
          d = dartD;
          materialId = 35;
        }
      }
    }
  }
  
  // === ЛАЗЕРЫ СПАЙКЕРОВ (distance culled) ===
  if (distFromCam < 50.0) {
  for (int i = 0; i < u_spikeCount; i++) {
    if (i >= 4) break; // Уменьшено с 8 до 4
    vec4 spike = u_spikes[i];
    vec4 spikeTarget = u_spikeTargets[i];
    vec3 laserStart = spike.xyz;
    vec3 laserEnd = spikeTarget.xyz;
    float lifetime = spike.w;
    float intensity = spikeTarget.w;
    
    if (lifetime > 0.0 && intensity > 0.0) {
      // Вектор луча
      vec3 laserDir = laserEnd - laserStart;
      float laserLen = length(laserDir);
      if (laserLen > 0.1) {
        laserDir /= laserLen;
        
        // Расстояние до линии лазера
        vec3 toPoint = p - laserStart;
        float proj = clamp(dot(toPoint, laserDir), 0.0, laserLen);
        vec3 closestPoint = laserStart + laserDir * proj;
        float distToLaser = length(p - closestPoint);
        
        // Толщина луча зависит от интенсивности
        float beamRadius = 0.08 + intensity * 0.05;
        float laserD = distToLaser - beamRadius;
        
        // Свечение вокруг луча
        float glow = max(0.0, 0.3 - distToLaser) * intensity * 2.0;
        
        if (laserD < d) {
          d = laserD;
          materialId = 27; // Лазер
        }
      }
    }
  }
  } // end distance culling for spikes
  
  // === ГРАНАТЫ (distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_grenadeCount; i++) {
      if (i >= 4) break; // Уменьшено
      vec4 grenade = u_grenades[i];
      vec3 grenadePos = grenade.xyz;
      float grenadeD = length(p - grenadePos) - 0.3;
      if (grenadeD < d) {
        d = grenadeD;
        materialId = 41;
      }
    }
  }
  
  // === ВЗРЫВЫ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_explosionCount; i++) {
      if (i >= 2) break; // Уменьшено
      vec4 explosion = u_explosions[i];
      vec3 expPos = explosion.xyz;
      float progress = explosion.w;
      float expRadius = progress * 8.0;
      float expD = length(p - expPos) - expRadius;
      if (expD < d && progress < 1.0) {
        d = expD;
        materialId = 43;
      }
    }
  }
  
  // === ПИКАПЫ (упрощённые, distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_pickupCount; i++) {
      if (i >= 4) break; // Уменьшено
      vec4 pickup = u_pickups[i];
      float pType = pickup.w;
      
      if (pType > 0.0) {
        vec3 pickupPos = pickup.xyz;
        float bob = sin(u_time * 2.0 + pickupPos.x) * 0.1;
        
        // Упрощённые пикапы - просто сферы
        float pickupD = length(p - pickupPos - vec3(0, bob, 0)) - 0.3;
        if (pickupD < d) {
          d = pickupD;
          if (pType == 9.0) materialId = 14; // Красный (хил)
          else if (pType == 10.0) materialId = 15; // Жёлтый (баф)
          else if (pType == 11.0) materialId = 17; // Заряд
          else materialId = 31; // Белый
        }
      }
    }
  } // end distance culling for pickups
  
  // === ОБРЫВ ПО КРАЯМ ===
  // Бортик края - тор вокруг арены
  float rimTorus = sdTorus(p - vec3(0.0, 0.0, 0.0), vec2(33.0, 0.4));
  if (rimTorus < d) {
    d = rimTorus;
    materialId = 46;
  }
  
  // За краем - бездна (простой пол далеко внизу)
  if (arenaEdge > 0.5) {
    float voidFloor = p.y + 10.0;
    if (voidFloor < d) {
      d = voidFloor;
      materialId = 44;
    }
  }
  
  // === ЦЕНТРАЛЬНЫЙ ФОНТАН СО СТАТУЕЙ АНГЕЛА ===
  // Анимация трансформации: статуя уезжает вниз, появляется портал
  float portalProgress = clamp(u_voidPortalActive, 0.0, 1.0);
  float angelOffset = portalProgress * 5.0; // Статуя уезжает вниз на 5 единиц
  
  { // Основание фонтана (всегда видно)
    float fountBase = sdCylinder(p - vec3(0.0, 0.15, 0.0), 3.0, 0.15);
    if (fountBase < d) { d = fountBase; materialId = 75; }
    
    // Нижняя чаша
    float bowl1 = sdTorus(p - vec3(0.0, 0.6, 0.0), vec2(2.0, 0.25));
    if (bowl1 < d) { d = bowl1; materialId = 51; }
    
    // === СТАТУЯ (классическая колонна с чашей - уезжает вниз при активации портала) ===
    if (portalProgress < 0.95) {
      vec3 statuePos = vec3(0.0, 0.7 - angelOffset, 0.0);
      
      // Центральная колонна
      float pillar = sdCylinder(p - statuePos, 0.35, 1.8);
      if (pillar < d) { d = pillar; materialId = 51; }
      
      // База колонны (расширение внизу)
      float pillarBase = sdCylinder(p - statuePos + vec3(0.0, 1.6, 0.0), 0.5, 0.25);
      if (pillarBase < d) { d = pillarBase; materialId = 51; }
      
      // Верхняя чаша
      float topBowl = sdTorus(p - statuePos - vec3(0.0, 1.8, 0.0), vec2(0.6, 0.15));
      if (topBowl < d) { d = topBowl; materialId = 51; }
      
      // Декоративные кольца на колонне
      float ring1 = sdTorus(p - statuePos - vec3(0.0, 0.6, 0.0), vec2(0.38, 0.04));
      float ring2 = sdTorus(p - statuePos - vec3(0.0, 1.2, 0.0), vec2(0.38, 0.04));
      if (ring1 < d) { d = ring1; materialId = 52; } // Бронза
      if (ring2 < d) { d = ring2; materialId = 52; }
      
      // Сфера на вершине (оранжевая как луна)
      float topOrb = sdSphere(p - statuePos - vec3(0.0, 2.2, 0.0), 0.3);
      if (topOrb < d) { d = topOrb; materialId = 78; } // Оранжевый шар
    }
    
    // === ПОРТАЛ (появляется при активации) ===
    if (portalProgress > 0.05) {
      vec3 portalPos = vec3(0.0, 2.7, 0.0);
      
      // Каменная рамка - тор
      float portalRing = sdTorus(p - portalPos, vec2(1.0, 0.15));
      if (portalRing < d) { d = portalRing; materialId = 68; }
      
      // Бронзовый внутренний обод
      float innerRing = sdTorus(p - portalPos, vec2(0.8, 0.06));
      if (innerRing < d) { d = innerRing; materialId = 52; }
      
      // Огненная сфера внутри портала (как у боковых)
      float energyCore = sdSphere(p - portalPos, 0.7 * portalProgress);
      if (energyCore < d) { d = energyCore; materialId = 38; }
    }
  }
  
  // === ЦЕНТРАЛЬНЫЙ БАССЕЙН ===
  float poolDist = distFromCenter;
  
  // Бортик бассейна (детализированный)
  if (poolDist < POOL_RADIUS + 0.5 && poolDist > POOL_RADIUS - 0.8) {
    // Внешний край бортика
    float rimOuter = sdTorus(p - vec3(0.0, 0.2, 0.0), vec2(POOL_RADIUS + 0.1, 0.25));
    if (rimOuter < d) { d = rimOuter; materialId = 75; }
    
    // Верхняя плоскость бортика
    float rimTop = sdCylinder(p - vec3(0.0, 0.35, 0.0), POOL_RADIUS + 0.3, 0.1);
    rimTop = max(rimTop, -(length(p.xz) - POOL_RADIUS + 0.5));
    if (rimTop < d) { d = rimTop; materialId = 75; }
  }
  
  // Дно бассейна
  if (poolDist < POOL_RADIUS - 0.3 && p.y < 0.3 && p.y > -POOL_DEPTH - 0.1) {
    float poolBottom = p.y + POOL_DEPTH;
    if (poolBottom < d) { d = poolBottom; materialId = 77; } // Дно бассейна (мозаика)
  }
  
  // === МОСТЫ ЧЕРЕЗ БАССЕЙН ===
  // Мост по X
  float bridgeX = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(POOL_RADIUS + 1.0, 0.2, BRIDGE_WIDTH * 0.5));
  // Вырезаем центр для колонны
  bridgeX = max(bridgeX, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeX);
  
  // Мост по Z
  float bridgeZ = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(BRIDGE_WIDTH * 0.5, 0.2, POOL_RADIUS + 1.0));
  bridgeZ = max(bridgeZ, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeZ);
  
  // === ПОДХОДЫ К ПОРТАЛАМ (рампы) ===
  // Левая рампа к порталу
  float rampL = sdBox(p - vec3(-19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampL);
  
  // Правая рампа к порталу
  float rampR = sdBox(p - vec3(19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampR);
  
  // === ПОРТАЛЫ (ТОРИИ-СТИЛЬ) - ОПТИМИЗИРОВАНО ===
  // Левый портал (всегда видно)
  {
    vec3 pp = p - vec3(-22.0, 0.0, 0.0);
    
    // Платформа (одна объединённая)
    float platform = sdBox(pp - vec3(0.0, 0.25, 0.0), vec3(3.5, 0.25, 3.5));
    if (platform < d) { d = platform; materialId = 68; }
    
    // Колонны (упрощённые - без сужения)
    float colL = sdBox(pp - vec3(0.0, 2.5, -2.0), vec3(0.4, 2.0, 0.4));
    float colR = sdBox(pp - vec3(0.0, 2.5, 2.0), vec3(0.4, 2.0, 0.4));
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    // Верхняя перекладина
    float kasagi = sdBox(pp - vec3(0.0, 5.0, 0.0), vec3(0.4, 0.2, 2.8));
    if (kasagi < d) { d = kasagi; materialId = 23; }
    
    // Нижняя перекладина
    float nuki = sdBox(pp - vec3(0.0, 3.8, 0.0), vec3(0.25, 0.12, 2.3));
    if (nuki < d) { d = nuki; materialId = 23; }
    
    // Энергия портала
    vec3 portalCenter = pp - vec3(0.0, 2.8, 0.0);
    float portalDist = length(portalCenter.yz);
    float energyCore = portalDist - 1.3;
    energyCore = max(energyCore, abs(portalCenter.x) - 0.3);
    if (energyCore < d) { d = energyCore; materialId = 24; }
  }
  
  // Правый портал (всегда видно)
  {
    vec3 pp = p - vec3(22.0, 0.0, 0.0);
    
    float platform = sdBox(pp - vec3(0.0, 0.25, 0.0), vec3(3.5, 0.25, 3.5));
    if (platform < d) { d = platform; materialId = 68; }
    
    float colL = sdBox(pp - vec3(0.0, 2.5, -2.0), vec3(0.4, 2.0, 0.4));
    float colR = sdBox(pp - vec3(0.0, 2.5, 2.0), vec3(0.4, 2.0, 0.4));
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    float kasagi = sdBox(pp - vec3(0.0, 5.0, 0.0), vec3(0.4, 0.2, 2.8));
    if (kasagi < d) { d = kasagi; materialId = 23; }
    
    float nuki = sdBox(pp - vec3(0.0, 3.8, 0.0), vec3(0.25, 0.12, 2.3));
    if (nuki < d) { d = nuki; materialId = 23; }
    
    vec3 portalCenter = pp - vec3(0.0, 2.8, 0.0);
    float portalDist = length(portalCenter.yz);
    float energyCore = portalDist - 1.3;
    energyCore = max(energyCore, abs(portalCenter.x) - 0.3);
    if (energyCore < d) { d = energyCore; materialId = 24; }
  }
  
  // === КРУГЛЫЕ ПЛОЩАДКИ ЗА ПОРТАЛАМИ (ОПТИМИЗИРОВАНО) ===
  // Левая площадка (всегда видно)
  {
    vec3 lp = p - vec3(-BACK_PLATFORM_X, 0.0, 0.0);
    float lpDist = length(lp.xz);
    
    // Одна платформа вместо трёх ступеней
    float platform = sdCylinder(lp - vec3(0.0, 0.2, 0.0), BACK_PLATFORM_RADIUS, 0.2);
    if (platform < d) { d = platform; materialId = 71; }
    
    // Бортик (упрощённый)
    float rim = sdTorus(lp - vec3(0.0, 0.35, 0.0), vec2(BACK_PLATFORM_RADIUS, 0.15));
    if (rim < d) { d = rim; materialId = 72; }
    
    // 4 столбика вместо 8 (только по осям)
    float pillar1 = sdBox(lp - vec3(BACK_PLATFORM_RADIUS - 0.3, 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar2 = sdBox(lp - vec3(-(BACK_PLATFORM_RADIUS - 0.3), 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar3 = sdBox(lp - vec3(0.0, 0.6, BACK_PLATFORM_RADIUS - 0.3), vec3(0.2, 0.5, 0.2));
    float pillar4 = sdBox(lp - vec3(0.0, 0.6, -(BACK_PLATFORM_RADIUS - 0.3)), vec3(0.2, 0.5, 0.2));
    float pillars = min(min(pillar1, pillar2), min(pillar3, pillar4));
    if (pillars < d) { d = pillars; materialId = 72; }
  }
  
  // Правая площадка (всегда видно)
  {
    vec3 lp = p - vec3(BACK_PLATFORM_X, 0.0, 0.0);
    float lpDist = length(lp.xz);
    
    float platform = sdCylinder(lp - vec3(0.0, 0.2, 0.0), BACK_PLATFORM_RADIUS, 0.2);
    if (platform < d) { d = platform; materialId = 71; }
    
    float rim = sdTorus(lp - vec3(0.0, 0.35, 0.0), vec2(BACK_PLATFORM_RADIUS, 0.15));
    if (rim < d) { d = rim; materialId = 72; }
    
    float pillar1 = sdBox(lp - vec3(BACK_PLATFORM_RADIUS - 0.3, 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar2 = sdBox(lp - vec3(-(BACK_PLATFORM_RADIUS - 0.3), 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar3 = sdBox(lp - vec3(0.0, 0.6, BACK_PLATFORM_RADIUS - 0.3), vec3(0.2, 0.5, 0.2));
    float pillar4 = sdBox(lp - vec3(0.0, 0.6, -(BACK_PLATFORM_RADIUS - 0.3)), vec3(0.2, 0.5, 0.2));
    float pillars = min(min(pillar1, pillar2), min(pillar3, pillar4));
    if (pillars < d) { d = pillars; materialId = 72; }
  }
  
  // === МОСТЫ К ПЛОЩАДКАМ ЗА ПОРТАЛАМИ ===
  // Левый мост (от портала к площадке)
  float bridgeLeft = sdBox(p - vec3(-26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeLeft < d) {
    d = bridgeLeft;
    materialId = 0;
  }
  
  // Правый мост
  float bridgeRight = sdBox(p - vec3(26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeRight < d) {
    d = bridgeRight;
    materialId = 0;
  }
  
  
  // === ЛЕТАЮЩИЕ ПЛАТФОРМЫ (каменные с бронзовым ободком) ===
  float bob1 = sin(u_time * 1.5) * 0.3;
  float bob2 = sin(u_time * 1.5 + 0.8) * 0.3;
  float bob3 = sin(u_time * 1.5 + 1.6) * 0.3;
  float bob4 = sin(u_time * 1.5 + 2.4) * 0.3;
  float bob5 = sin(u_time * 1.5 + 3.2) * 0.3;
  float bob6 = sin(u_time * 1.5 + 4.0) * 0.3;
  
  // Позиции платформ
  vec3 plat1Pos = vec3(10.0, 1.8 + bob1, 0.0);
  vec3 plat2Pos = vec3(5.0, 3.0 + bob2, 8.66);
  vec3 plat3Pos = vec3(-5.0, 4.2 + bob3, 8.66);
  vec3 plat4Pos = vec3(-10.0, 5.4 + bob4, 0.0);
  vec3 plat5Pos = vec3(-5.0, 6.6 + bob5, -8.66);
  vec3 plat6Pos = vec3(5.0, 7.8 + bob6, -8.66);
  
  // Каменные основания платформ
  float jp1 = sdCylinder(p - plat1Pos, 1.5, 0.2);
  float jp2 = sdCylinder(p - plat2Pos, 1.4, 0.2);
  float jp3 = sdCylinder(p - plat3Pos, 1.4, 0.2);
  float jp4 = sdCylinder(p - plat4Pos, 1.3, 0.2);
  float jp5 = sdCylinder(p - plat5Pos, 1.3, 0.2);
  float jp6 = sdCylinder(p - plat6Pos, 1.2, 0.2);
  
  float jumpPlats = min(jp1, min(jp2, min(jp3, min(jp4, min(jp5, jp6)))));
  if (jumpPlats < d) {
    d = jumpPlats;
    materialId = 71; // Каменная платформа (как площадки порталов)
  }
  
  // Бронзовые ободки платформ
  float rim1 = sdTorus(p - plat1Pos + vec3(0.0, 0.15, 0.0), vec2(1.5, 0.08));
  float rim2 = sdTorus(p - plat2Pos + vec3(0.0, 0.15, 0.0), vec2(1.4, 0.08));
  float rim3 = sdTorus(p - plat3Pos + vec3(0.0, 0.15, 0.0), vec2(1.4, 0.08));
  float rim4 = sdTorus(p - plat4Pos + vec3(0.0, 0.15, 0.0), vec2(1.3, 0.08));
  float rim5 = sdTorus(p - plat5Pos + vec3(0.0, 0.15, 0.0), vec2(1.3, 0.08));
  float rim6 = sdTorus(p - plat6Pos + vec3(0.0, 0.15, 0.0), vec2(1.2, 0.08));
  
  float rims = min(rim1, min(rim2, min(rim3, min(rim4, min(rim5, rim6)))));
  if (rims < d) {
    d = rims;
    materialId = 72; // Бронзовый ободок
  }
  
  // === ВЕРХНЯЯ ПЛАТФОРМА (главная, над фонтаном) ===
  float topBob = sin(u_time * 1.0) * 0.2;
  vec3 topPos = vec3(0.0, 9.5 + topBob, 0.0);
  
  // Каменное основание
  float topPlat = sdCylinder(p - topPos, 2.5, 0.3);
  if (topPlat < d) {
    d = topPlat;
    materialId = 71;
  }
  
  // Бронзовый ободок по краю (снизу)
  float topRim = sdTorus(p - topPos - vec3(0.0, 0.2, 0.0), vec2(2.5, 0.08));
  if (topRim < d) {
    d = topRim;
    materialId = 72;
  }
  
  // Декоративный бронзовый обод снизу платформы
  float bottomRim = sdTorus(p - topPos + vec3(0.0, 0.25, 0.0), vec2(2.3, 0.08));
  if (bottomRim < d) {
    d = bottomRim;
    materialId = 52; // Бронза
  }

  // === КРИСТАЛЛЫ СИЛЫ (только на волне 10, оптимизировано) ===
  if (u_wave == 10 && distFromCam < 40.0) {
    for (int i = 0; i < 3; i++) { // Оптимизация: было 6
      if (u_crystals[i].w > 0.5) { // active
        float cx = u_crystals[i].x;
        float cz = u_crystals[i].y;
        float ch = u_crystals[i].z;
        
        // Кристалл парит и вращается
        float bobOffset = sin(u_time * 2.0 + float(i)) * 0.15;
        float rotation = u_time * 1.5 + float(i) * 1.047; // Вращение
        
        vec3 crystalPos = vec3(cx, ch + bobOffset, cz);
        vec3 lp = p - crystalPos;
        
        // Вращаем вокруг Y
        float cosR = cos(rotation);
        float sinR = sin(rotation);
        lp.xz = mat2(cosR, -sinR, sinR, cosR) * lp.xz;
        
        // Октаэдр (кристалл)
        float crystal = sdOctahedron(lp, 0.5);
        
        if (crystal < d) {
          d = crystal;
          materialId = 18; // Чёрный кристалл
        }
      }
    }
  }
  
  // Портал в войд теперь отрисовывается в фонтане (статуя ангела уезжает)
  
  // === АЛТАРИ НА КРАЯХ КАРТЫ ===
  for (int i = 0; i < 2; i++) {
    vec4 altar = u_altars[i];
    vec3 altarPos = vec3(altar.x, 0.0, altar.z);
    vec3 ap = p - altarPos;
    
    // Основание алтаря (круглая платформа)
    float base = sdCylinder(ap - vec3(0.0, 0.2, 0.0), 2.5, 0.4);
    
    // Ступени (3 уровня)
    float step1 = sdCylinder(ap - vec3(0.0, 0.5, 0.0), 2.0, 0.15);
    float step2 = sdCylinder(ap - vec3(0.0, 0.75, 0.0), 1.5, 0.15);
    float step3 = sdCylinder(ap - vec3(0.0, 1.0, 0.0), 1.0, 0.15);
    
    // Центральный столб (тории-образный)
    float pillarL = sdBox(ap - vec3(-1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    float pillarR = sdBox(ap - vec3(1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    
    // Перекладина сверху
    float top = sdBox(ap - vec3(0.0, 4.0, 0.0), vec3(1.8, 0.2, 0.2));
    float topSub = sdBox(ap - vec3(0.0, 3.6, 0.0), vec3(1.5, 0.1, 0.15));
    
    // Чаша для очков (в центре)
    float bowl = sdTorus(ap - vec3(0.0, 1.3, 0.0), vec2(0.6, 0.15));
    float bowlInner = sdCylinder(ap - vec3(0.0, 1.4, 0.0), 0.5, 0.2);
    
    // Собираем алтарь
    float altarD = base;
    altarD = min(altarD, step1);
    altarD = min(altarD, step2);
    altarD = min(altarD, step3);
    altarD = min(altarD, pillarL);
    altarD = min(altarD, pillarR);
    altarD = min(altarD, top);
    altarD = min(altarD, topSub);
    altarD = min(altarD, bowl);
    
    if (altarD < d) {
      d = altarD;
      materialId = 32; // Камень алтаря
    }
    
    // Огонь в чаше (если есть очки)
    if (altar.w > 0.0) {
      float fireY = 1.5 + sin(u_time * 5.0 + float(i)) * 0.2;
      float fireSize = 0.3 + altar.w * 0.001; // Размер зависит от очков
      float fire = length(ap - vec3(0.0, fireY, 0.0)) - min(fireSize, 0.8);
      
      if (fire < d) {
        d = fire;
        materialId = 33; // Огонь в алтаре
      }
    }
    
    // Светящийся символ (кольцо вокруг чаши)
    float glow = sdTorus(ap - vec3(0.0, 1.2, 0.0), vec2(0.9, 0.05));
    if (glow < d) {
      d = glow;
      materialId = 34; // Светящийся символ
    }
  }
  
  // === ВОДА В БАССЕЙНЕ (замедляет игрока!) ===
  // Центральный бассейн с водой
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.05 + waterWaves(p.xz, u_time) * 0.05;
      // Плоскость воды как SDF
      float waterSdf = abs(p.y - waterY) - 0.02;
      if (waterSdf < d) {
        d = waterSdf;
        materialId = 30; // Вода!
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.45 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterSdf = abs(p.y - waterY) - 0.02;
    if (waterSdf < d) {
      d = waterSdf;
      materialId = 30; // Вода!
    }
  }
  
  // === ВРАГИ (всегда видны) ===
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 8) break; // Максимум 8 врагов для FPS
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      // Проверка на умирающего врага
      bool isDying = target.w >= 100.0;
      float baseW = isDying ? target.w - 100.0 : target.w;
      int enemyType = int(baseW / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper, 4=spiker, 5=boss_green, 6=boss_black, 7=boss_blue
      
      vec3 tp = p - target.xyz;
      
      // Для умирающих врагов - сплющивание + растекание
      float deathScale = 1.0;
      if (isDying) {
        // Прогресс смерти закодирован в дробной части (0-0.99)
        float deathProgress = fract(baseW) * 2.0; // 0-1.98
        deathProgress = clamp(deathProgress, 0.0, 1.0);
        
        // Сплющивание по Y (падение и растекание)
        float yScale = mix(1.0, 0.15, deathProgress);
        float xzScale = mix(1.0, 1.8, deathProgress);
        
        tp.y /= yScale;
        tp.x /= xzScale;
        tp.z /= xzScale;
        deathScale = yScale; // Для корректировки расстояния
      }
      
      float targetD;
      int matId;
      
      if (enemyType == 5) {
        // === ЗЕЛЁНЫЙ БОСС (огромная зелёная жижа) ===
        float wobble = sin(u_time * 2.0 + tp.x * 1.5) * 0.3
                     + sin(u_time * 1.5 + tp.y * 2.0) * 0.25
                     + sin(u_time * 2.5 + tp.z * 1.0) * 0.2;
        float radius = 2.5 + wobble;
        targetD = sdSphere(tp, radius);
        
        // Пузырящаяся поверхность
        float bubbles = sin(tp.x * 4.0 + u_time * 3.0) 
                      * sin(tp.y * 4.0 + u_time * 2.5) 
                      * sin(tp.z * 4.0 + u_time * 3.5) * 0.2;
        targetD += bubbles;
        
        // Щупальца
        for (int t = 0; t < 4; t++) {
          float angle = float(t) * 1.57 + u_time * 0.5;
          vec3 tentacle = tp - vec3(cos(angle) * 1.5, -1.0, sin(angle) * 1.5);
          targetD = smin(targetD, sdCylinder(tentacle, 0.3, 1.5), 0.3);
        }
        matId = 10; // Зелёный босс
        
      } else if (enemyType == 6) {
        // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
        // Искажённое пространство вокруг
        vec3 distorted = tp;
        float distortAmount = sin(u_time * 3.0) * 0.3;
        distorted.x += sin(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        distorted.z += cos(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        
        float radius = 2.0;
        targetD = sdSphere(distorted, radius);
        
        // Кольца тёмной энергии
        float ring1 = abs(sdTorus(tp, vec2(3.0, 0.1))) - 0.05;
        float ring2 = abs(sdTorus(tp * vec3(1.0, 0.7, 1.0), vec2(3.5, 0.08))) - 0.03;
        targetD = min(targetD, ring1);
        targetD = min(targetD, ring2);
        matId = 11; // Чёрный босс
        
      } else if (enemyType == 7) {
        // === СИНИЙ БОСС (телепортирующийся) ===
        // Мерцающая форма
        float flicker = abs(sin(u_time * 20.0)) * 0.3 + 0.7;
        float radius = 1.8 * flicker;
        targetD = sdSphere(tp, radius);
        
        // Электрические разряды
        float sparks = sin(tp.x * 15.0 + u_time * 30.0) 
                     * sin(tp.y * 15.0 + u_time * 25.0) * 0.1;
        targetD += sparks;
        
        // Призрачные копии
        vec3 ghost1 = tp - vec3(sin(u_time * 5.0) * 2.0, 0.0, cos(u_time * 5.0) * 2.0);
        vec3 ghost2 = tp + vec3(cos(u_time * 4.0) * 2.0, 0.0, sin(u_time * 4.0) * 2.0);
        targetD = min(targetD, sdSphere(ghost1, 0.5) - 0.1);
        targetD = min(targetD, sdSphere(ghost2, 0.5) - 0.1);
        matId = 12; // Синий босс
        
      } else if (enemyType == 1) {
        // === ФАНТОМ (чёрный шар) ===
        float distort = sin(u_time * 8.0 + tp.x * 5.0) * 0.08
                      + sin(u_time * 7.0 + tp.z * 6.0) * 0.06;
        float radius = 0.55 + distort;
        targetD = sdSphere(tp, radius);
        
        vec3 trail = tp + vec3(0.0, 0.0, 0.3);
        float trailD = sdSphere(trail, 0.3) - 0.1;
        targetD = min(targetD, trailD);
        matId = 5;
        
      } else if (enemyType == 2) {
        // === RUNNER (оранжевый, вытянутый) ===
        vec3 stretched = tp;
        stretched.x *= 0.6;
        float radius = 0.35;
        targetD = sdSphere(stretched, radius);
        
        float speedTrail = sdSphere(tp + vec3(0.3, 0.0, 0.0), 0.2);
        speedTrail = min(speedTrail, sdSphere(tp + vec3(0.5, 0.0, 0.0), 0.12));
        targetD = min(targetD, speedTrail);
        matId = 6;
        
      } else if (enemyType == 3) {
        // === HOPPER (синий, пружинистый) ===
        float squeeze = 1.0 + sin(u_time * 12.0) * 0.15;
        vec3 squashed = tp;
        squashed.y *= squeeze;
        float radius = 0.45;
        targetD = sdSphere(squashed, radius);
        
        vec3 ear1 = tp - vec3(0.2, 0.4, 0.0);
        vec3 ear2 = tp - vec3(-0.2, 0.4, 0.0);
        float ears = min(sdSphere(ear1, 0.12), sdSphere(ear2, 0.12));
        targetD = min(targetD, ears);
        matId = 7;
        
      } else if (enemyType == 4) {
        // === SPIKER (летающий шар с глазом-лазером) ===
        
        // Покачивание
        float bob = sin(u_time * 6.0 + float(i) * 2.0) * 0.2;
        vec3 bobbed = tp - vec3(0.0, bob, 0.0);
        
        // Вращение - глаз смотрит на камеру
        vec3 toCamera = normalize(u_cameraPos - target.xyz);
        
        // Основной шар тела
        float bodyRadius = 0.55;
        targetD = sdSphere(bobbed, bodyRadius);
        
        // Текстура на шаре - "прожилки"
        float veins = sin(bobbed.x * 15.0 + u_time * 2.0) 
                    * sin(bobbed.y * 12.0 + u_time * 1.5) 
                    * sin(bobbed.z * 15.0 + u_time * 2.5);
        targetD += veins * 0.02;
        
        // Пульсация
        float pulse = 1.0 + sin(u_time * 4.0 + float(i)) * 0.08;
        targetD *= pulse;
        
        // Глаз - выпуклость в направлении камеры
        vec3 eyeOffset = toCamera * 0.4;
        vec3 eyePos = bobbed - eyeOffset;
        float eyeBulge = sdSphere(eyePos, 0.35);
        targetD = min(targetD, eyeBulge);
        
        // Зрачок - в центре глаза (чёрный)
        vec3 pupilPos = bobbed - toCamera * 0.55;
        float pupilD = sdSphere(pupilPos, 0.15);
        
        // Радужка вокруг зрачка
        vec3 irisPos = bobbed - toCamera * 0.5;
        float irisD = sdSphere(irisPos, 0.25);
        
        // Маленькие шипы по краям
        for (int s = 0; s < 4; s++) {
          float angle = float(s) * 1.57 + u_time * 0.5;
          vec3 spikeDir = vec3(cos(angle), 0.0, sin(angle));
          vec3 spikePos = bobbed - spikeDir * 0.6;
          float spikeD = length(spikePos) - 0.08;
          targetD = min(targetD, spikeD);
        }
        
        // Определяем материал по расстоянию
        if (pupilD < 0.01) {
          matId = 28; // Зрачок (чёрный с красным свечением)
        } else if (irisD < eyeBulge) {
          matId = 29; // Радужка (красно-оранжевая)
        } else {
          matId = 26; // Тело спайкера
        }
        
      } else {
        // === БЕЙНЛИНГ (зелёная жижа) ===
        float wobble = sin(u_time * 4.0 + tp.x * 3.0) * 0.1
                     + sin(u_time * 3.0 + tp.y * 4.0) * 0.1
                     + sin(u_time * 5.0 + tp.z * 2.0) * 0.08;
        float radius = 0.7 + wobble;
        targetD = sdSphere(tp, radius);
        
        float bubbles = sin(tp.x * 8.0 + u_time * 2.0) 
                      * sin(tp.y * 8.0 + u_time * 1.5) 
                      * sin(tp.z * 8.0 + u_time * 2.5) * 0.05;
        targetD += bubbles;
        matId = 4;
      }
      
      if (targetD < d) {
        d = targetD;
        materialId = matId;
      }
    }
  }
  
  // === ФРАГМЕНТЫ ВРАГОВ (КАПЛИ ЖИЖИ) ===
  for (int i = 0; i < u_fragmentCount; i++) {
    if (i >= 4) break; // Оптимизация: было 16
    vec4 frag = u_fragments[i];
    if (frag.w > 0.0) {
      vec3 fp = p - frag.xyz;
      
      // Размер капли
      float dropSize = frag.w * 0.35;
      
      // Сфера (основа капли)
      float fragD = length(fp) - dropSize;
      
      // Деформация - вытянутая капля (больше вниз когда падает)
      float stretch = 1.0 + abs(fp.y) * 0.3; // Вытягивание
      vec3 stretched = vec3(fp.x, fp.y * 0.7, fp.z);
      fragD = length(stretched) - dropSize;
      
      // Волнистость поверхности (жижа колышется)
      float wobble = sin(fp.x * 15.0 + u_time * 8.0) * 
                     sin(fp.y * 12.0 + u_time * 6.0) * 
                     sin(fp.z * 15.0 + u_time * 7.0) * 0.02;
      fragD += wobble;
      
      if (fragD < d) {
        d = fragD;
        materialId = 200 + i; // Материал фрагмента
      }
    }
  }
  
  // === 4 КАМЕННЫХ ФОНАРЯ (ОПТИМИЗИРОВАНО) ===
  float lanternRadius = 28.0;
  
  // Проверяем близость к любому из 4 фонарей
  vec2 lp1 = p.xz - vec2(0.0, lanternRadius);
  vec2 lp2 = p.xz - vec2(0.0, -lanternRadius);
  vec2 lp3 = p.xz - vec2(lanternRadius, 0.0);
  vec2 lp4 = p.xz - vec2(-lanternRadius, 0.0);
  
  float dl1 = length(lp1);
  float dl2 = length(lp2);
  float dl3 = length(lp3);
  float dl4 = length(lp4);
  
  // Находим ближайший фонарь
  float minLDist = min(min(dl1, dl2), min(dl3, dl4));
  
  { // Фонари (всегда видны)
    // Определяем позицию ближайшего фонаря
    vec3 lPos = vec3(0.0, 0.0, lanternRadius);
    if (dl2 < dl1 && dl2 <= dl3 && dl2 <= dl4) lPos = vec3(0.0, 0.0, -lanternRadius);
    else if (dl3 <= dl1 && dl3 <= dl2 && dl3 <= dl4) lPos = vec3(lanternRadius, 0.0, 0.0);
    else if (dl4 <= dl1 && dl4 <= dl2 && dl4 <= dl3) lPos = vec3(-lanternRadius, 0.0, 0.0);
    
    vec3 lp = p - lPos;
    
    // Платформа (одна)
    float platform = sdBox(lp - vec3(0.0, 0.2, 0.0), vec3(1.0, 0.2, 1.0));
    if (platform < d) { d = platform; materialId = 64; }
    
    // Столб
    float pillar = sdBox(lp - vec3(0.0, 1.7, 0.0), vec3(0.25, 1.3, 0.25));
    if (pillar < d) { d = pillar; materialId = 60; }
    
    // Камера для огня (упрощённая)
    float chamber = sdBox(lp - vec3(0.0, 3.15, 0.0), vec3(0.4, 0.35, 0.4));
    if (chamber < d) { d = chamber; materialId = 60; }
    
    // Огонь (простой сферический)
    float flame = sdSphere(lp - vec3(0.0, 3.15, 0.0), 0.2);
    if (flame < d) { d = flame; materialId = 66; }
    
    // Крыша (упрощённая)
    float roof = sdBox(lp - vec3(0.0, 3.75, 0.0), vec3(0.6, 0.1, 0.6));
    if (roof < d) { d = roof; materialId = 60; }
  }
  
  return d;
}

// === RAY MARCHING (ТУРБО) ===
float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    
    if (dist < SURF_DIST) return d;
    if (d > MAX_DIST) break;
    
    // Консервативный шаг
    d += dist * 0.95;
  }
  
  // Финальная проверка пола на удалении (если луч направлен вниз)
  if (rd.y < -0.01 && ro.y > 0.0) {
    float floorT = -ro.y / rd.y;
    if (floorT > 0.0 && floorT < MAX_DIST && floorT > d * 0.8) {
      vec3 floorP = ro + rd * floorT;
      if (length(floorP.xz) < 40.0) {
        float floorDist = map(floorP);
        if (floorDist < 0.2) {
          return floorT;
        }
      }
    }
  }
  
  return MAX_DIST;
}

vec3 getNormal(vec3 p) {
  // Tetrahedron normals - 4 вызова вместо 6
  vec2 e = vec2(0.02, -0.02);
  return normalize(
    e.xyy * map(p + e.xyy) + 
    e.yyx * map(p + e.yyx) + 
    e.yxy * map(p + e.yxy) + 
    e.xxx * map(p + e.xxx)
  );
}

// === ДИНАМИЧЕСКИЕ ТЕНИ ОТ ВРАГОВ (оптимизировано) ===
float enemyShadow(vec3 p, vec4 targets[16], int targetCount) {
  // Только на полу (y < 0.5)
  if (p.y > 0.5) return 1.0;
  
  float shadow = 1.0;
  
  for (int i = 0; i < 4; i++) { // Оптимизация: было 8
    if (i >= targetCount) break;
    
    vec4 enemy = targets[i];
    if (enemy.w < 0.5) continue;
    
    vec2 toEnemy = p.xz - enemy.xz;
    float dist = length(toEnemy);
    if (dist > 3.0) continue; // Далеко - пропускаем
    
    float shadowStrength = smoothstep(1.5, 0.0, dist);
    shadow = min(shadow, 1.0 - shadowStrength * 0.5);
  }
  
  return shadow;
}

// === БЫСТРЫЕ ТЕНИ (2 шага) ===
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  // Один вызов map (оптимизация)
  float h = map(ro + rd * mint);
  return clamp(k * h / mint, 0.4, 1.0);
}

// === КОНТАКТНЫЕ ТЕНИ (2 шага) ===
float contactShadowRay(vec3 p, vec3 rd, float maxDist) {
  // Один вызов map (оптимизация)
  float h = map(p + rd * 0.2);
  return h < 0.05 ? 0.5 : 1.0;
}

// === FAKE ТЕНИ (дополнение) ===
float fakeShadow(vec3 p, float lightY) {
  float heightFade = smoothstep(0.0, 3.0, p.y);
  float distFromCenter = length(p.xz);
  float centerDark = smoothstep(10.0, 0.0, distFromCenter) * 0.2;
  return mix(0.5, 1.0, heightFade) - centerDark;
}

// === УЛУЧШЕННЫЙ AO (оптимизировано) ===
float calcAO(vec3 pos, vec3 nor) {
  // Фейковый AO без вызовов map() - на основе позиции
  float heightAO = smoothstep(-1.0, 3.0, pos.y) * 0.3 + 0.7;
  float cornerAO = 1.0 - abs(nor.y) * 0.2; // Углы темнее
  return heightAO * cornerAO;
}

// === КОНТАКТНЫЕ ТЕНИ ===
float contactShadow(vec3 p) {
  return smoothstep(-1.0, 2.0, p.y) * 0.5 + 0.5;
}

// === ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ (упрощённая) ===
float filmGrain(vec2 uv, float time) {
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  return fract(sin(seed) * 43758.5453) - 0.5;
}

// === КАУСТИКИ (упрощённые) ===
float caustics(vec2 p, float t) {
  vec2 uv = p * 1.5 + vec2(sin(t * 0.3), cos(t * 0.4)) * 0.5;
  return pow(0.5 + 0.5 * sin(uv.x * 3.0 + uv.y * 2.0 + t), 3.0);
}

// === КАТАНА 3D (viewmodel) - КЛАССИЧЕСКАЯ ДЕТАЛИЗИРОВАННАЯ ===

// SDF капсулы
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// SDF лезвия катаны - упрощённое для надёжного рендера
float sdKatanaBlade(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Длина лезвия
  float bladeLen = 2.0;
  
  // Лёгкий изгиб (сори)
  float curve = sp.y * sp.y * 0.015;
  sp.z -= curve;
  
  // Сужение к острию
  float taper = 1.0 - smoothstep(0.0, bladeLen, sp.y) * 0.5;
  
  // Простой бокс вместо треугольного сечения
  float width = 0.1 * taper;
  float thick = 0.02 * taper;
  
  // 2D бокс + ограничение по длине
  vec2 q = abs(sp.xz) - vec2(width, thick);
  float d2d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  
  float d = max(d2d, sp.y - bladeLen);  // Обрезать сверху
  d = max(d, -sp.y - 0.02);              // Обрезать снизу (начало)
  
  return d * scale;
}

// SDF рукояти (цука)
float sdKatanaHandle(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Овальное сечение рукояти
  float handleLen = 0.8;
  vec3 hp = sp - vec3(0.0, -handleLen * 0.5, 0.0);
  
  // Овал
  vec2 sz = vec2(0.055, 0.04);
  float d = length(hp.xz / sz) - 1.0;
  d = max(d * min(sz.x, sz.y), abs(hp.y) - handleLen * 0.5);
  
  // Касира (навершие) - торцевая крышка
  vec3 kashiraP = sp - vec3(0.0, -handleLen - 0.02, 0.0);
  float kashira = length(kashiraP / vec3(0.06, 0.03, 0.045)) - 1.0;
  kashira *= 0.03;
  d = min(d * scale, kashira * scale);
  
  return d;
}

// SDF цуба (гарда)
float sdKatanaGuard(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Круглая цуба с орнаментом
  float radius = 0.18;
  float thick = 0.015;
  
  // Основной диск
  float d = length(sp.xz) - radius;
  d = max(d, abs(sp.y) - thick);
  
  // Отверстие для лезвия
  float hole = length(sp.xz / vec2(0.13, 0.03)) - 1.0;
  d = max(d, -hole * 0.02);
  
  // Декоративные вырезы (сукаши)
  float angle = atan(sp.z, sp.x);
  float r = length(sp.xz);
  float pattern = sin(angle * 4.0) * 0.02;
  if (r > 0.12 && r < 0.16) {
    d = max(d, -abs(sp.y) + thick * 0.3 + pattern);
  }
  
  return d * scale;
}

// SDF хабаки (муфта между лезвием и гардой)
float sdKatanaHabaki(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  vec3 hp = sp - vec3(0.0, -0.02, 0.0);
  float d = length(hp.xz / vec2(0.08, 0.035)) - 1.0;
  d = max(d * 0.03, abs(hp.y) - 0.05);
  
  return d * scale;
}

// SDF сэппа (шайбы у гарды)
float sdKatanaSeppa(vec3 p, float yOffset) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  vec3 seppaP = sp - vec3(0.0, yOffset, 0.0);
  float d = length(seppaP.xz) - 0.1;
  d = max(d, abs(seppaP.y) - 0.008);
  
  return d * scale;
}

// Полная катана SDF
float sdKatana(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa1 = sdKatanaSeppa(p, 0.015);
  float seppa2 = sdKatanaSeppa(p, -0.015);
  
  float d = min(blade, handle);
  d = min(d, guard);
  d = min(d, habaki);
  d = min(d, seppa1);
  d = min(d, seppa2);
  
  return d;
}

// Материал катаны (0=лезвие, 1=рукоять, 2=гарда, 3=металл.детали)
int getKatanaMaterial(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa = min(sdKatanaSeppa(p, 0.015), sdKatanaSeppa(p, -0.015));
  
  float minD = blade;
  int mat = 0;
  
  if (handle < minD) { minD = handle; mat = 1; }
  if (guard < minD) { minD = guard; mat = 2; }
  if (habaki < minD || seppa < minD) { mat = 3; }
  
  return mat;
}

// Raymarching катаны (viewmodel - в экранном пространстве)
vec4 renderKatana(vec3 ro, vec3 rd, float attack, float bob, int charges, vec3 ambient, vec3 accentColor) {
  // Матрица камеры (из yaw и pitch) - такая же как в основном рендере
  float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
  
  // Базисные векторы камеры (совпадают с main)
  vec3 camForward = vec3(sy * cp, sp, -cy * cp);
  vec3 camRight = vec3(cy, 0.0, sy);
  vec3 camUp = cross(camRight, camForward);
  
  // Позиция катаны относительно камеры (ближе к центру)
  vec3 localOffset = vec3(0.06, -0.1, 0.32); // Почти по центру, чуть ниже
  
  // Покачивание при ходьбе
  localOffset.x += sin(bob) * 0.003;
  localOffset.y += abs(sin(bob * 2.0)) * 0.002;
  
  // Базовые углы катаны - ОСТРИЕ ВПЕРЁД
  float rotX = -1.5;  // Лезвие горизонтально, острие вперёд
  float rotZ = 0.08;  // Минимальный наклон
  float rotY = 0.05;  // Режущая кромка чуть вниз
  
  // === УПРЕЖДАЮЩИЙ ЗАМАХ - катана заносится ПРОТИВОПОЛОЖНО врагу! ===
  if (u_katanaTargetAngle > -0.5 && attack < 0.1) {
    // Враг в зоне (до 6м) - готовимся к удару
    float targetInfluence = smoothstep(6.0, 3.0, u_katanaTargetDist);
    
    // Угол к врагу определяет сторону замаха
    float angleOffset = u_katanaTargetAngle;
    angleOffset = clamp(angleOffset, -0.8, 0.8);
    
    // Чем ближе враг - тем сильнее замах (до 3м - почти полный замах)
    float windUpAmount = smoothstep(5.0, 3.0, u_katanaTargetDist);
    
    if (angleOffset < 0.0) {
      // ВРАГ СЛЕВА → заносим ВПРАВО (удар пойдёт справа налево)
      rotX += windUpAmount * 0.7;     // Острие вверх
      rotZ += windUpAmount * 0.6;     // Вправо!
      rotY += windUpAmount * 0.5;     // Ладонь наружу
      
      localOffset.y += windUpAmount * 0.12;  // Рука вверх
      localOffset.x += windUpAmount * 0.08;  // Вправо!
    } else {
      // ВРАГ СПРАВА → заносим ВЛЕВО (удар пойдёт слева направо)
      rotX += windUpAmount * 0.8;     // Острие вверх
      rotZ -= windUpAmount * 0.7;     // Влево!
      rotY -= windUpAmount * 0.5;     // Ладонь внутрь
      
      localOffset.y += windUpAmount * 0.14;  // Рука вверх
      localOffset.x -= windUpAmount * 0.1;   // Влево!
    }
    
    // Лёгкое напряжение - дрожание готовности
    float tension = sin(u_time * 12.0) * 0.01 * targetInfluence;
    rotZ += tension;
    rotX += tension * 0.5;
  }
  
  // РЕАЛИСТИЧНАЯ АНИМАЦИЯ АТАКИ - КАК РУКОЙ
  if (attack > 0.0) {
    float t = attack;
    
    // Фазы: замах (0-0.12), удар (0.12-0.4), возврат (0.4-1.0)
    float windUp = smoothstep(0.0, 0.12, t);      // Замах
    float strike = smoothstep(0.12, 0.38, t);     // Удар
    float recover = smoothstep(0.42, 1.0, t);     // Возврат
    
    // Агрессивный easing для удара
    float strikeEase = 1.0 - pow(1.0 - strike, 5.0);
    float swingPower = strikeEase * (1.0 - recover);
    float windUpPower = windUp * (1.0 - strike);
    
    if (u_katanaAttackType == 0) {
      // === ТИП 0: УДАР СПРАВА СВЕРХУ (кэса-гири) ===
      // Рука поднимается вверх, ладонь разворачивается наружу
      
      // ЗАМАХ: рука идёт вверх-вправо, ладонь разворачивается
      rotX += windUpPower * 1.1;    // Острие вверх (рука поднимается)
      rotZ += windUpPower * 0.6;    // Вправо (плечо отводится)
      rotY += windUpPower * 0.7;    // Ладонь разворачивается наружу!
      
      // Позиция руки при замахе
      localOffset.y += windUpPower * 0.18;  // Рука вверх
      localOffset.x += windUpPower * 0.1;   // Плечо вправо
      localOffset.z -= windUpPower * 0.05;  // Отводим назад
      
      // УДАР: мощный рубящий сверху вниз по диагонали
      rotX -= swingPower * 2.0;     // Острие вниз (рука опускается)
      rotZ -= swingPower * 1.4;     // Влево (плечо вперёд)
      rotY -= swingPower * 0.3;     // Ладонь возвращается
      
      // Выпад руки вперёд
      localOffset.y -= swingPower * 0.14;
      localOffset.x -= swingPower * 0.12;
      localOffset.z += swingPower * 0.12;
      
    } else if (u_katanaAttackType == 1) {
      // === ТИП 1: УДАР СЛЕВА (гяку-кэса) ===
      // Рука заносится высоко влево, локоть ведёт
      
      // ЗАМАХ: рука высоко влево над плечом!
      rotX += windUpPower * 1.2;    // Острие высоко вверх
      rotZ -= windUpPower * 1.1;    // СИЛЬНО влево!
      rotY -= windUpPower * 0.8;    // Ладонь внутрь
      
      // Позиция руки при замахе - высоко и влево
      localOffset.y += windUpPower * 0.2;   // Рука ВЫСОКО вверх
      localOffset.x -= windUpPower * 0.15;  // Сильно влево
      localOffset.z -= windUpPower * 0.06;  // Отводим назад
      
      // УДАР: мощный диагональный взмах вправо-вниз
      rotX -= swingPower * 2.0;     // Острие резко вниз
      rotZ += swingPower * 2.0;     // Сильно вправо
      rotY += swingPower * 0.6;     // Ладонь разворачивается
      
      // Выпад вперёд и вправо
      localOffset.y -= swingPower * 0.14;
      localOffset.x += swingPower * 0.16;
      localOffset.z += swingPower * 0.1;
      
    } else {
      // === ТИП 2: СПЛЕШ (ёко-гири - горизонтальный) ===
      // Широкий горизонтальный взмах обеими руками
      
      // ЗАМАХ: рука отводится вправо, ладонь разворачивается
      rotZ += windUpPower * 0.7;
      rotY += windUpPower * 0.4;    // Ладонь наружу
      localOffset.x += windUpPower * 0.08;
      localOffset.z -= windUpPower * 0.03;
      
      // УДАР: мощный горизонтальный рубящий
      rotZ -= swingPower * 2.6;
      rotX -= swingPower * 0.25;
      rotY -= swingPower * 0.3;     // Ладонь возвращается
      
      localOffset.x -= swingPower * 0.2;
      localOffset.z += swingPower * 0.1;
    }
    
    // Встряска при ударе (импакт)
    if (t > 0.28 && t < 0.48) {
      float shake = sin(t * 180.0) * 0.005 * (1.0 - smoothstep(0.28, 0.48, t));
      localOffset.x += shake;
      localOffset.y += shake * 0.5;
    }
  }
  
  // Позиция катаны в мировых координатах (относительно камеры)
  vec3 katanaWorldPos = ro + camRight * localOffset.x + camUp * localOffset.y + camForward * localOffset.z;
  
  // Матрица локального поворота катаны (XYZ euler)
  float cx = cos(rotX), sx = sin(rotX);
  float cy2 = cos(rotY), sy2 = sin(rotY);
  float cz = cos(rotZ), sz = sin(rotZ);
  
  // Комбинированная матрица поворота ZYX
  mat3 localRot = mat3(
    cz * cy2, -sz * cx + cz * sy2 * sx, sz * sx + cz * sy2 * cx,
    sz * cy2, cz * cx + sz * sy2 * sx, -cz * sx + sz * sy2 * cx,
    -sy2, cy2 * sx, cy2 * cx
  );
  
  // Комбинированная матрица: локальный поворот + ориентация камеры
  mat3 camMat = mat3(camRight, camUp, camForward);
  mat3 rotMat = camMat * localRot;
  
  float t = 0.0;
  float maxDist = 1.0;
  
  for (int i = 0; i < 24; i++) { // Больше шагов для тонкого лезвия
    vec3 p = ro + rd * t;
    
    // Трансформация в локальное пространство катаны
    vec3 localP = transpose(rotMat) * (p - katanaWorldPos);
    
    float d = sdKatana(localP);
    
    if (d < 0.001) { // Точнее для тонкого лезвия
      vec3 hitP = localP;
      int mat = getKatanaMaterial(hitP);
      
      // Нормаль
      vec2 e = vec2(0.0005, 0.0);
      vec3 n = normalize(vec3(
        sdKatana(hitP + e.xyy) - sdKatana(hitP - e.xyy),
        sdKatana(hitP + e.yxy) - sdKatana(hitP - e.yxy),
        sdKatana(hitP + e.yyx) - sdKatana(hitP - e.yyx)
      ));
      // Трансформация нормали в мировое пространство
      n = rotMat * n;
      
      // Освещение от камеры + сверху
      vec3 lightDir = normalize(vec3(0.2, 0.8, -0.5));
      vec3 viewLight = normalize(vec3(0.0, 0.0, -1.0)); // От камеры
      float diff = max(dot(n, lightDir), 0.0) * 0.5 + 0.3;
      diff += max(dot(n, viewLight), 0.0) * 0.3;
      float spec = pow(max(dot(reflect(rd, n), lightDir), 0.0), 64.0);
      float viewSpec = pow(max(dot(reflect(rd, n), viewLight), 0.0), 32.0);
      
      vec3 color;
      
      if (mat == 0) {
        // ЛЕЗВИЕ - полированная сталь с хамоном
        vec3 steelColor = vec3(0.85, 0.88, 0.92);
        
        // Хамон (волнистая линия закалки)
        float hamonY = hitP.y * 0.15; // Масштаб
        float hamonLine = sin(hamonY * 80.0 + sin(hamonY * 30.0) * 2.0) * 0.003;
        float hamon = smoothstep(0.002, -0.002, hitP.z - hamonLine - 0.002);
        
        // Дзи (основа) темнее, якиба (закалённая часть) светлее
        vec3 ji = vec3(0.6, 0.62, 0.65);
        vec3 yakiba = vec3(0.95, 0.97, 1.0);
        steelColor = mix(ji, yakiba, hamon);
        
        color = steelColor * diff * ambient * 4.0;
        color += vec3(1.0) * (spec + viewSpec) * 0.9;
        
        // Режущая кромка - яркая линия
        float edge = smoothstep(0.002, 0.0, abs(hitP.z) - 0.001);
        color += vec3(1.0, 0.98, 0.95) * edge * 0.4;
        
        // Неоновый акцент на кромке
        color += accentColor * edge * 0.2;
        
        // Заряды - свечение
        if (charges > 0) {
          float scale = 0.15;
          for (int j = 0; j < 3; j++) {
            if (j < charges) {
              float cy = (0.3 + float(j) * 0.25) * scale;
              float dist = abs(hitP.y - cy);
              float glow = smoothstep(0.03, 0.0, dist);
              color += accentColor * glow * 0.6;
            }
          }
        }
        
      } else if (mat == 1) {
        // РУКОЯТЬ - чёрная с ито (обмоткой)
        vec3 handleBase = vec3(0.02, 0.02, 0.02); // Самэ (кожа ската) под обмоткой
        vec3 itoColor = vec3(0.08, 0.05, 0.12); // Шёлковая обмотка
        
        // Ромбовидный узор обмотки
        float scale = 0.15;
        float wrapY = hitP.y / scale;
        float wrapAngle = atan(hitP.z, hitP.x);
        float wrap = step(0.5, fract(wrapY * 12.0 + wrapAngle * 0.5));
        
        vec3 handleColor = mix(handleBase, itoColor, wrap);
        color = handleColor * diff * ambient * 3.0;
        
        // Неоновые линии между обмоткой
        float wrapGlow = smoothstep(0.52, 0.48, fract(wrapY * 12.0));
        color += accentColor * wrapGlow * 0.1 * (0.6 + 0.4 * sin(u_time * 2.0));
        
      } else if (mat == 2) {
        // ЦУБА (гарда) - тёмный металл с узором
        vec3 tsubaColor = vec3(0.12, 0.1, 0.08);
        
        // Патина
        float patina = hash(hitP.xz * 100.0) * 0.1;
        tsubaColor += vec3(0.0, patina * 0.5, patina);
        
        color = tsubaColor * diff * ambient * 3.5;
        color += vec3(0.3, 0.25, 0.2) * spec * 0.2;
        
        // Неоновый край
        float edgeDist = length(hitP.xz) - 0.025;
        float tsubaEdge = smoothstep(0.003, 0.0, abs(edgeDist));
        color += accentColor * tsubaEdge * 0.3;
        
      } else {
        // МЕТАЛЛИЧЕСКИЕ ДЕТАЛИ (хабаки, сэппа)
        vec3 brassColor = vec3(0.7, 0.55, 0.3); // Латунь
        color = brassColor * diff * ambient * 4.0;
        color += vec3(1.0, 0.9, 0.6) * spec * 0.5;
      }
      
      // Вспышка атаки
      if (attack > 0.3 && attack < 0.8) {
        float flash = sin((attack - 0.3) / 0.5 * 3.14159);
        color += accentColor * flash * 0.5;
      }
      
      return vec4(color, t);
    }
    
    t += d * 0.7; // Меньший шаг для точности тонкого лезвия
    if (t > maxDist) break;
  }
  
  // Не попали - прозрачно
  return vec4(0.0, 0.0, 0.0, -1.0);
}

// === НЕБО И ГОРИЗОНТ ===
vec3 renderSky(vec3 rd) {
  // Базовый цвет неба
  vec3 color = vec3(0.04, 0.05, 0.1);
  
  // Плавный градиент от зенита к горизонту
  float horizonFade = 1.0 - abs(rd.y);
  float horizonPow = horizonFade * horizonFade * horizonFade;
  
  // Горизонт - светлее и с дымкой
  vec3 horizonColor = vec3(0.08, 0.07, 0.12);  // Фиолетово-серая дымка
  vec3 horizonGlow = vec3(0.04, 0.08, 0.1);    // Циановый отсвет
  
  color = mix(color, horizonColor, horizonPow);
  color += horizonGlow * horizonFade * 0.5;
  
  // ФАЗА 2 ЗЕЛЁНОГО БОССА - ТОКСИЧНОЕ НЕБО
  if (u_greenBossPhase2 == 1) {
    float heightFade = smoothstep(-0.2, 0.8, rd.y);
    vec3 toxicGreen = mix(vec3(0.04, 0.12, 0.02), vec3(0.08, 0.3, 0.04), heightFade);
    color = toxicGreen;
    float clouds = sin(rd.x * 3.0 + u_time * 0.5) * sin(rd.z * 2.0 + u_time * 0.3) * 0.5 + 0.5;
    color += vec3(0.0, 0.15, 0.0) * clouds * 0.2;
    color *= (sin(u_time * 2.0) * 0.15 + 0.85);
    return color;
  }
  
  // Звёзды (только вверху)
  if (rd.y > 0.1) {
    vec2 skyUV = rd.xz / (rd.y + 0.3);
    float stars = hash(floor(skyUV * 100.0));
    if (stars > 0.975) {
      float starBright = (stars - 0.975) * 20.0 * rd.y;
      color += vec3(0.8, 0.85, 1.0) * starBright;
    }
  }
  
  // Луна - большая оранжевая
  vec3 moonDir = normalize(vec3(0.4, 0.5, -0.4));
  float moonDot = dot(rd, moonDir);
  
  // Основной диск луны (больше и объёмнее)
  float moon = smoothstep(0.96, 0.97, moonDot);
  
  // Объёмное затемнение к краям (как у настоящей луны)
  float moonEdge = smoothstep(0.97, 0.99, moonDot);
  vec3 moonCore = vec3(1.0, 0.7, 0.3); // Яркий оранжевый центр
  vec3 moonRim = vec3(0.9, 0.4, 0.1);  // Тёмный оранжевый край
  vec3 moonColor = mix(moonRim, moonCore, moonEdge);
  
  // Текстура кратеров (шум)
  float moonNoise = noise(rd.xy * 30.0) * 0.15;
  moonColor *= (0.9 + moonNoise);
  
  color += moonColor * moon * 1.5;
  
  // Свечение вокруг луны
  float moonGlow = pow(max(0.0, moonDot), 8.0);
  color += vec3(0.4, 0.2, 0.05) * moonGlow * 0.6;
  
  return color;
}

// === ЭФФЕКТ ДОЖДЯ И МОЛНИЙ ===

// Функция для вертикальных линий дождя
float rainStreak(vec2 uv, float speed, float density, float seed) {
  vec2 st = uv * vec2(density, 1.0);
  st.y = st.y * 0.1 - u_time * speed;
  
  float id = floor(st.x);
  float x = fract(st.x);
  float y = fract(st.y + fract(sin(id * seed) * 1000.0));
  
  // Тонкая вертикальная линия
  float streak = smoothstep(0.45, 0.5, x) * smoothstep(0.55, 0.5, x);
  // Ограничиваем длину капли
  streak *= smoothstep(0.0, 0.02, y) * smoothstep(0.15, 0.08, y);
  // Случайность появления
  streak *= step(0.7, fract(sin(id * 127.1 + seed) * 43758.5453));
  
  return streak;
}

// Функция молнии
float lightning(vec2 uv, float time, float seed) {
  // Позиция молнии по X (меняется каждые несколько секунд)
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  
  // Фаза молнии (0-1 в пределах удара)
  float phase = fract(time * 0.3 + seed);
  
  // Молния видна только короткое время
  float visible = smoothstep(0.7, 0.75, phase) * smoothstep(0.95, 0.85, phase);
  
  // Основной канал молнии с зигзагами
  float bolt = 0.0;
  float x = strikeX;
  float segments = 4.0;
  
  for (float i = 0.0; i < segments; i++) {
    float segY = 1.0 - i / segments;
    float nextY = 1.0 - (i + 1.0) / segments;
    float nextX = x + (fract(sin((strikeTime + i) * 73.7) * 43758.5453) - 0.5) * 0.4;
    
    if (uv.y < segY && uv.y > nextY) {
      float t = (segY - uv.y) / (segY - nextY);
      float dist = abs(uv.x - mix(x, nextX, t));
      bolt += smoothstep(0.03, 0.0, dist) * 2.0;
    }
    x = nextX;
  }
  
  return bolt * visible;
}

// Предупреждающее свечение перед молнией
float lightningWarning(vec2 uv, float time, float seed) {
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  float phase = fract(time * 0.3 + seed);
  
  // Свечение появляется перед ударом (фаза 0.5-0.7)
  float warning = smoothstep(0.5, 0.6, phase) * smoothstep(0.75, 0.65, phase);
  
  // Пульсация
  warning *= 0.5 + 0.5 * sin(time * 20.0);
  
  // Область свечения сверху
  float glow = smoothstep(0.3, 1.0, uv.y);
  glow *= smoothstep(0.5, 0.0, abs(uv.x - strikeX));
  
  return glow * warning;
}

// Кислотный дождь - капли только когда игрок В зоне
vec3 renderAcidRain(vec2 uv, vec3 color, float time, vec3 camPos) {
  if (u_acidRainZoneCount == 0) return color;
  
  vec3 result = color;
  float inRainIntensity = 0.0; // Игрок ВНУТРИ зоны дождя
  
  // Проверяем находится ли игрок в зоне дождя
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 2) break; // Оптимизация: было 4
    vec4 zone = u_acidRainZones[i];
    if (zone.w >= 1.0) {
      float dist = length(camPos.xz - zone.xy);
      float zoneRadius = zone.z;
      // Только если игрок ВНУТРИ зоны (с небольшим запасом)
      if (dist < zoneRadius + 1.0) {
        inRainIntensity = max(inRainIntensity, 1.0 - dist / (zoneRadius + 1.0));
      }
    }
  }
  
  // Капли на экране ТОЛЬКО если игрок под дождём
  if (inRainIntensity > 0.01) {
    float drops = 0.0;
    
    // Толстые струи
    float y1 = fract(uv.y * 3.0 - time * 15.0);
    drops += step(0.0, y1) * step(y1, 0.5) * step(0.4, fract(uv.x * 3.0)) * step(fract(uv.x * 3.0), 0.6) * 0.5;
    
    float y1b = fract(uv.y * 3.0 - time * 18.0 + 0.33);
    drops += step(0.0, y1b) * step(y1b, 0.5) * step(0.4, fract(uv.x * 3.0 + 0.33)) * step(fract(uv.x * 3.0 + 0.33), 0.6) * 0.5;
    
    // Средние капли
    float y2 = fract(uv.y * 6.0 - time * 22.0);
    drops += step(0.1, y2) * step(y2, 0.4) * step(0.45, fract(uv.x * 6.0)) * step(fract(uv.x * 6.0), 0.55) * 0.3;
    
    // Мелкие капли
    float y3 = fract(uv.y * 10.0 - time * 28.0);
    drops += step(0.15, y3) * step(y3, 0.35) * step(0.47, fract(uv.x * 10.0)) * step(fract(uv.x * 10.0), 0.53) * 0.2;
    
    // Зелёные капли на экране
    result += vec3(0.2, 1.0, 0.1) * drops * inRainIntensity * 5.0;
    
    // Зелёная дымка когда под дождём
    result = mix(result, vec3(0.1, 0.5, 0.1), inRainIntensity * 0.35);
  }
  
  return result;
}

// === ЭФФЕКТ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
// Рендерит skybox который вращается с камерой
// voidVariant: 0=багровый, 1=изумрудный, 2=золотой, 3=ледяной
vec3 renderVoidSky(vec3 rd, float time) {
  // Базовые цвета для разных вариантов войда
  vec3 baseSky, upColor, nebulaColor1, nebulaColor2, starColor1, starColor2;
  
  if (u_voidVariant == 0) {
    // БАГРОВЫЙ войд
    baseSky = vec3(0.04, 0.01, 0.02);
    upColor = vec3(0.1, 0.02, 0.05);
    nebulaColor1 = vec3(0.15, 0.02, 0.05);
    nebulaColor2 = vec3(0.1, 0.0, 0.03);
    starColor1 = vec3(0.8, 0.3, 0.3);
    starColor2 = vec3(1.0, 0.5, 0.4);
  } else if (u_voidVariant == 1) {
    // ИЗУМРУДНЫЙ войд
    baseSky = vec3(0.01, 0.04, 0.02);
    upColor = vec3(0.02, 0.1, 0.05);
    nebulaColor1 = vec3(0.02, 0.15, 0.08);
    nebulaColor2 = vec3(0.0, 0.1, 0.05);
    starColor1 = vec3(0.3, 0.8, 0.5);
    starColor2 = vec3(0.5, 1.0, 0.7);
  } else if (u_voidVariant == 2) {
    // ЗОЛОТОЙ войд
    baseSky = vec3(0.04, 0.03, 0.01);
    upColor = vec3(0.1, 0.08, 0.02);
    nebulaColor1 = vec3(0.15, 0.1, 0.02);
    nebulaColor2 = vec3(0.1, 0.06, 0.0);
    starColor1 = vec3(1.0, 0.8, 0.3);
    starColor2 = vec3(1.0, 0.9, 0.5);
  } else {
    // ЛЕДЯНОЙ войд (по умолчанию)
    baseSky = vec3(0.01, 0.02, 0.04);
    upColor = vec3(0.02, 0.05, 0.1);
    nebulaColor1 = vec3(0.02, 0.08, 0.15);
    nebulaColor2 = vec3(0.0, 0.05, 0.1);
    starColor1 = vec3(0.3, 0.5, 0.8);
    starColor2 = vec3(0.6, 0.8, 1.0);
  }
  
  vec3 skyColor = baseSky;
  
  // Градиент вверх - немного светлее
  float upGrad = max(0.0, rd.y);
  skyColor += upColor * upGrad * 0.5;
  
  // Градиент вниз - бездна
  float downGrad = max(0.0, -rd.y);
  skyColor = mix(skyColor, baseSky * 0.3, downGrad);
  
  // === ЗВЁЗДЫ (оптимизировано) ===
  vec3 starDir = normalize(rd);
  
  for (float i = 0.0; i < 20.0; i++) {
    vec3 starPos = normalize(vec3(
      sin(i * 73.1) * cos(i * 127.3),
      sin(i * 91.7) * cos(i * 173.1),
      cos(i * 47.3) * sin(i * 311.7)
    ));
    
    float starDist = length(starDir - starPos);
    float star = smoothstep(0.02, 0.0, starDist);
    skyColor += mix(starColor1, starColor2, fract(i * 0.37)) * star * 0.4;
  }
  
  // === ТУМАННОСТИ (упрощённые) ===
  float nebula = sin(rd.x * 3.0 + rd.z * 2.0) * cos(rd.y * 4.0);
  skyColor += nebulaColor1 * smoothstep(-0.3, 0.5, nebula) * 0.25;
  
  return skyColor;
}

// Старая функция для совместимости (не используется в новом войде)
vec3 renderVoid(vec2 uv, float fallOffset) {
  return vec3(0.0);
}

vec3 renderRain(vec2 uv, vec3 color, float time) {
  // Нормализуем UV для эффектов
  vec2 screenUV = uv;
  
  // === ДОЖДЬ ===
  float rain = 0.0;
  
  // Слой 1 - крупные яркие капли (передний план)
  rain += rainStreak(screenUV, 3.0, 80.0, 1.0) * 0.8;
  rain += rainStreak(screenUV + vec2(0.1, 0.0), 3.5, 90.0, 2.0) * 0.7;
  
  // Слой 2 - средние капли
  rain += rainStreak(screenUV, 2.5, 120.0, 3.0) * 0.5;
  rain += rainStreak(screenUV + vec2(0.05, 0.0), 2.8, 140.0, 4.0) * 0.4;
  
  // Слой 3 - мелкие капли (задний план)
  rain += rainStreak(screenUV, 2.0, 200.0, 5.0) * 0.3;
  
  // Цвет дождя - яркий голубой
  vec3 rainColor = vec3(0.6, 0.8, 1.0);
  color += rainColor * rain;
  
  // === МОЛНИИ ===
  // Несколько независимых молний с разным таймингом
  float bolt1 = lightning(screenUV, time, 0.0);
  float bolt2 = lightning(screenUV, time, 3.7);
  float bolt3 = lightning(screenUV, time, 7.3);
  
  float totalBolt = bolt1 + bolt2 + bolt3;
  
  // Цвет молнии - яркий бело-голубой
  vec3 boltColor = vec3(0.8, 0.9, 1.0);
  color += boltColor * totalBolt;
  
  // Вспышка освещения при ударе молнии
  float flash = max(bolt1, max(bolt2, bolt3));
  color = mix(color, vec3(0.9, 0.95, 1.0), flash * 0.3);
  
  // === ПРЕДУПРЕЖДАЮЩЕЕ СВЕЧЕНИЕ ===
  float warn1 = lightningWarning(screenUV, time, 0.0);
  float warn2 = lightningWarning(screenUV, time, 3.7);
  float warn3 = lightningWarning(screenUV, time, 7.3);
  
  float totalWarning = warn1 + warn2 + warn3;
  
  // Жёлто-белое свечение предупреждения
  vec3 warningColor = vec3(1.0, 0.95, 0.7);
  color += warningColor * totalWarning * 0.4;
  
  // === АТМОСФЕРА ШТОРМА ===
  // Тёмное грозовое небо
  color = mix(color, vec3(0.08, 0.1, 0.15), 0.2);
  
  return color;
}

// === ГЛАВНАЯ (ОПТИМИЗИРОВАННАЯ) ===
void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;
  
  vec3 ro = u_cameraPos;
  
  float cy = cos(u_cameraYaw);
  float sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch);
  float sp = sin(u_cameraPitch);
  
  vec3 forward = vec3(sy * cp, sp, -cy * cp);
  vec3 right = vec3(cy, 0.0, sy);
  vec3 up = cross(right, forward);
  
  vec3 rd = normalize(forward + uv.x * right + uv.y * up);
  
  // === РЕЖИМ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
  if (u_voidMode == 1) {
    // Skybox - вращается с камерой
    vec3 voidSky = renderVoidSky(rd, u_time);
    
    // Рендерим врагов, портал и острова
    float d = MAX_DIST;
    int hitMat = 0;
    vec3 hitPos = ro;
    
    // Ray march
    float marchDist = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * marchDist;
      float minD = MAX_DIST;
      
      // === ОСТРОВА - несколько платформ ===
      // Главный остров под игроком (уменьшен!)
      float mainIsland = length(vec2(p.x, p.z)) - 10.0; // Радиус 10
      float mainHeight = p.y + 0.5; // Толщина острова
      float mainD = max(mainIsland, mainHeight);
      mainD = max(mainD, -(p.y + 2.0)); // Нижняя граница
      if (mainD < minD) {
        minD = mainD;
        hitMat = 100; // ground
      }
      
      // Остров у портала (маленький!)
      vec2 portalIslandPos = u_portalPos.xz;
      float portalIsland = length(p.xz - portalIslandPos) - 5.0; // Радиус 5
      float portalIslandH = p.y + 0.5;
      float portalIslandD = max(portalIsland, portalIslandH);
      portalIslandD = max(portalIslandD, -(p.y + 2.0));
      if (portalIslandD < minD) {
        minD = portalIslandD;
        hitMat = 100;
      }
      
      // Обломки между островами (прыгать!)
      vec2 toPortal = normalize(portalIslandPos);
      float bridgeLen = length(portalIslandPos) - 5.0 - 10.0; // Длина дорожки (портал 5 + главный 10)
      
      // 3 обломка (оптимизировано)
      for (int i = 0; i < 3; i++) { // Было 8
        // Позиция обломка вдоль дорожки (начинаем после главного острова)
        float fragmentPos = 12.0 + float(i) * (bridgeLen / 7.0);
        
        // Случайное смещение в стороны и по высоте
        float randX = sin(float(i) * 73.1) * 2.0;
        float randZ = cos(float(i) * 47.3) * 2.0;
        float randY = sin(float(i) * 91.7) * 0.8 - 0.3; // Разная высота
        
        // Случайный размер (2-4м)
        float fragmentSize = 2.0 + fract(sin(float(i) * 127.3) * 43758.5) * 2.0;
        
        // Позиция обломка
        vec3 fragmentCenter = vec3(
          toPortal.x * fragmentPos + randX,
          randY,
          toPortal.y * fragmentPos + randZ
        );
        
        // Неровная форма - используем смесь бокса и сферы
        vec3 fp = p - fragmentCenter;
        
        // Вращаем каждый обломок по-разному
        float rotAngle = float(i) * 0.7;
        vec3 rotFp = vec3(
          fp.x * cos(rotAngle) - fp.z * sin(rotAngle),
          fp.y,
          fp.x * sin(rotAngle) + fp.z * cos(rotAngle)
        );
        
        // Неровный бокс (разные размеры по осям)
        float sizeX = fragmentSize * (0.8 + fract(sin(float(i) * 31.7) * 100.0) * 0.4);
        float sizeZ = fragmentSize * (0.8 + fract(sin(float(i) * 57.3) * 100.0) * 0.4);
        float fragmentD = max(max(abs(rotFp.x) - sizeX, abs(rotFp.y) - 0.5), abs(rotFp.z) - sizeZ);
        
        if (fragmentD < minD) {
          minD = fragmentD;
          hitMat = 101; // Обломок
        }
      }
      
      // Портал выхода (светящаяся сфера)
      float portalD = length(p - u_portalPos) - 3.0;
      if (portalD < minD) {
        minD = portalD;
        hitMat = 99; // portal
      }
      
      // Враги в войде
      for (int j = 0; j < u_targetCount; j++) {
        if (j >= 16) break;
        vec4 target = u_targets[j];
        if (target.w > 0.5) {
          vec3 tp = p - target.xyz;
          float enemyD = length(tp) - 0.6;
          if (enemyD < minD) {
            minD = enemyD;
            hitMat = 5; // phantom
          }
        }
      }
      
      // === ГЛИТЧ-МОНЕТЫ ===
      for (int c = 0; c < u_bloodCoinCount; c++) {
        if (c >= 12) break;
        vec4 coin = u_bloodCoins[c];
        if (coin.w > 0.5) {
          vec3 coinPos = coin.xyz;
          vec3 cp = p - coinPos;
          
          // Маленький глитч-куб с искажением
          float glitchOffset = sin(u_time * 20.0 + float(c) * 10.0) * 0.05;
          vec3 glitchP = cp + vec3(glitchOffset, 0.0, -glitchOffset);
          
          // Маленький кубик (0.2м)
          float coinD = max(max(abs(glitchP.x), abs(glitchP.y)), abs(glitchP.z)) - 0.15;
          
          // Второй смещённый куб для глитч-эффекта
          vec3 glitchP2 = cp + vec3(-glitchOffset * 0.5, glitchOffset, glitchOffset * 0.3);
          float cube2 = max(max(abs(glitchP2.x), abs(glitchP2.y)), abs(glitchP2.z)) - 0.12;
          coinD = min(coinD, cube2);
          
          if (coinD < minD) {
            minD = coinD;
            hitMat = 102; // glitch coin
          }
          
          // Глитч-аура вокруг монеты (меньше)
          float glow = length(cp) - 0.4;
          if (glow < minD && glow > 0.0) {
            minD = glow;
            hitMat = 103; // glitch glow
          }
        }
      }
      
      marchDist += minD;
      if (minD < SURF_DIST) {
        hitPos = p;
        d = marchDist;
        break;
      }
      if (marchDist > MAX_DIST) break;
    }
    
    vec3 color = voidSky;
    
    // Рендерим то, во что попали
    if (d < MAX_DIST) {
      if (hitMat == 100 || hitMat == 101) {
        // === ОСТРОВА - тёмный камень с фиолетовым свечением ===
        vec3 rockBase = vec3(0.03, 0.02, 0.05);
        
        // Текстура камня
        float noise = sin(hitPos.x * 3.0) * sin(hitPos.z * 3.0) * 0.5 + 0.5;
        noise += sin(hitPos.x * 7.0 + hitPos.z * 5.0) * 0.2;
        
        vec3 rockColor = mix(rockBase, vec3(0.06, 0.03, 0.1), noise);
        
        // Светящиеся трещины (фиолетовые)
        float cracks = sin(hitPos.x * 5.0) * cos(hitPos.z * 4.0);
        cracks = smoothstep(0.7, 0.9, abs(cracks));
        rockColor += vec3(0.2, 0.05, 0.4) * cracks * 0.5;
        
        // Края острова светятся
        float edgeDist = length(hitPos.xz);
        if (hitMat == 100 && edgeDist > 12.0) {
          float edgeGlow = smoothstep(12.0, 15.0, edgeDist);
          rockColor += vec3(0.15, 0.05, 0.3) * edgeGlow;
        }
        
        // Мост немного другой цвет
        if (hitMat == 101) {
          rockColor = mix(rockColor, vec3(0.05, 0.02, 0.08), 0.3);
        }
        
        // Затухание с расстоянием
        float fogDist = d / 100.0;
        rockColor = mix(rockColor, voidSky, smoothstep(0.3, 1.0, fogDist));
        
        color = rockColor;
      } else if (hitMat == 99) {
        // === ПОРТАЛ ВЫХОДА - фиолетовое свечение ===
        float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
        vec3 portalCore = vec3(0.6, 0.2, 1.0) * pulse;
        vec3 portalEdge = vec3(0.3, 0.1, 0.6);
        
        // Fresnel
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 2.0);
        color = mix(portalCore, portalEdge, fresnel);
        
        // Искры
        float spark = sin(u_time * 15.0 + hitPos.y * 8.0 + hitPos.x * 6.0);
        if (spark > 0.85) {
          color += vec3(0.8, 0.5, 1.0) * 0.5;
        }
        
        // Свечение
        color += vec3(0.3, 0.1, 0.5) * (1.0 - fresnel) * 0.6;
      } else if (hitMat == 5) {
        // === ВРАГИ - как фантомы босса ===
        vec3 phantomBlack = vec3(0.01, 0.0, 0.02);
        vec3 phantomGlow = vec3(0.2, 0.05, 0.35);
        
        // Мерцание
        float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + hitPos.x * 5.0);
        vec3 enemyColor = phantomBlack * flicker;
        
        // Фиолетовое свечение по краям
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 3.0);
        color = mix(enemyColor, phantomGlow, fresnel * 0.8);
        
        // Тёмные искры
        float spark = sin(u_time * 10.0 + hitPos.y * 15.0);
        if (spark > 0.9) {
          color += vec3(0.3, 0.1, 0.5) * 0.3;
        }
      } else if (hitMat == 102) {
        // === ГЛИТЧ-МОНЕТА ===
        vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
        vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
        
        // Хаотичное мерцание между цветами
        float glitchNoise = fract(sin(dot(hitPos.xy + u_time * 30.0, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 coinColor = mix(glitchCyan, glitchMagenta, step(0.5, glitchNoise));
        
        // Белые вспышки
        if (glitchNoise > 0.85) {
          coinColor = glitchWhite;
        }
        
        // RGB сдвиг
        float rgbShift = sin(u_time * 40.0) * 0.3;
        coinColor.r *= 1.0 + rgbShift;
        coinColor.b *= 1.0 - rgbShift;
        
        // Scanlines
        float scanline = step(0.5, fract(hitPos.y * 30.0 + u_time * 50.0));
        coinColor *= 0.7 + scanline * 0.5;
        
        // Яркий
        coinColor *= 4.0;
        
        color = coinColor;
        
      } else if (hitMat == 103) {
        // === ГЛИТЧ-АУРА ===
        vec3 glitchCyan = vec3(0.0, 0.8, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 0.8);
        
        // Быстрое мерцание
        float flicker = fract(sin(u_time * 50.0 + hitPos.x * 20.0) * 100.0);
        color = mix(glitchCyan, glitchMagenta, step(0.5, flicker)) * 0.8;
        
        // Случайные пиксели
        float noise = fract(sin(dot(hitPos.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
        if (noise > 0.9) {
          color = vec3(1.0) * 2.0;
        }
      }
    }
    
    // Фиолетовая виньетка
    float vig = 1.0 - length(v_uv - 0.5) * 0.5;
    color *= vig;
    
    // Усиливаем фиолетовый
    color.b *= 1.1;
    
    // Тонмаппинг
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(0.9));
    
    fragColor = vec4(color, 1.0);
    return;
  }
  
  float d = rayMarch(ro, rd);
  
  // Небо как фон (полная яркость)
  vec3 skyColor = renderSky(rd);
  vec3 color = skyColor;
  
  if (d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = getNormal(p);
    
    map(p);
    int mat = materialId;
    
    // === ОСВЕЩЕНИЕ ПО ЭПОХАМ ===
    vec3 ambient;
    vec3 mainLight;
    vec3 accentColor;
    vec3 fogColor;
    
    if (u_era == 1) {
      // ЭПОХА 1: Кислотный киберпанк
      ambient = vec3(0.08, 0.12, 0.08);
      mainLight = vec3(0.4, 0.6, 0.4);
      accentColor = vec3(0.3, 1.0, 0.4);
      fogColor = vec3(0.03, 0.05, 0.03);
    } else if (u_era == 2) {
      // ЭПОХА 2: Фиолетовый киберпанк
      ambient = vec3(0.08, 0.06, 0.12);
      mainLight = vec3(0.4, 0.3, 0.55);
      accentColor = vec3(0.8, 0.2, 1.0);
      fogColor = vec3(0.04, 0.03, 0.06);
    } else {
      // ЭПОХА 3: Бирюзовый киберпанк
      ambient = vec3(0.06, 0.1, 0.12);
      mainLight = vec3(0.35, 0.5, 0.55);
      accentColor = vec3(0.0, 0.9, 1.0);
      fogColor = vec3(0.03, 0.05, 0.07);
    }
    
    // === ЕДИНАЯ СИСТЕМА ОСВЕЩЕНИЯ ===
    
    // Цветовая палитра
    vec3 cyan = vec3(0.2, 0.9, 1.0);
    vec3 magenta = vec3(1.0, 0.2, 0.6);
    vec3 warmLight = vec3(1.0, 0.85, 0.7);
    
    // AO
    float ao = calcAO(p, n);
    
    // --- KEY LIGHT (луна - тёплый оранжевый) ---
    vec3 keyDir = normalize(vec3(0.4, 0.5, -0.4)); // Совпадает с moonDir
    float keyDiff = max(dot(n, keyDir), 0.0);
    float keyWrap = max(dot(n, keyDir) * 0.5 + 0.5, 0.0); // Wrap lighting для мягкости
    float keyShadow = u_shadowsEnabled == 1 ? softShadow(p + n * 0.02, keyDir, 0.1, 30.0, 8.0) : 0.7;
    vec3 keyColor = vec3(1.0, 0.6, 0.25); // Тёплый оранжевый от луны
    vec3 keyLight = keyColor * mix(keyDiff, keyWrap, 0.3) * keyShadow * 0.9;
    
    // --- FILL LIGHT (тёплый снизу, сильнее) ---
    vec3 fillDir = normalize(vec3(-0.2, -0.6, 0.3));
    float fillDiff = max(dot(n, -fillDir), 0.0) * 0.4 + 0.15;
    vec3 fillColor = vec3(1.0, 0.7, 0.4); // Тёплый оранжевый
    vec3 fillLight = fillColor * fillDiff * 0.2;
    
    // --- RIM LIGHT (контурный свет сзади) ---
    vec3 rimDir = normalize(vec3(-0.5, 0.3, 0.8));
    float rimDot = 1.0 - max(dot(n, -rd), 0.0);
    float rimLight = pow(rimDot, 3.0) * max(dot(n, rimDir), 0.0);
    vec3 rimColor = mix(cyan, accentColor, 0.5) * rimLight * 0.4;
    
    // --- НЕОНОВЫЕ ИСТОЧНИКИ (4 столба) ---
    vec3 neonLight = vec3(0.0);
    float nR = 25.0, nH = 4.0;
    
    // Север - циан
    vec3 toN1 = vec3(0.0, nH, nR) - p;
    neonLight += cyan * max(dot(n, normalize(toN1)), 0.0) * 20.0 / (1.0 + length(toN1) * 0.1);
    
    // Юг - маджента
    vec3 toN2 = vec3(0.0, nH, -nR) - p;
    neonLight += magenta * max(dot(n, normalize(toN2)), 0.0) * 20.0 / (1.0 + length(toN2) * 0.1);
    
    // Восток/Запад - акцент
    vec3 toN3 = vec3(nR, nH, 0.0) - p;
    vec3 toN4 = vec3(-nR, nH, 0.0) - p;
    neonLight += accentColor * max(dot(n, normalize(toN3)), 0.0) * 18.0 / (1.0 + length(toN3) * 0.1);
    neonLight += accentColor * max(dot(n, normalize(toN4)), 0.0) * 18.0 / (1.0 + length(toN4) * 0.1);
    
    // --- ЦЕНТРАЛЬНЫЙ ИСТОЧНИК ---
    vec3 toCenter = vec3(0.0, 2.0, 0.0) - p;
    float centerPulse = 0.8 + 0.2 * sin(u_time * 2.5);
    vec3 centerLight = accentColor * max(dot(n, normalize(toCenter)), 0.0) * 15.0 / (1.0 + length(toCenter) * 0.08) * centerPulse;
    
    // --- SPECULAR ---
    vec3 halfVec = normalize(keyDir - rd);
    float spec = pow(max(dot(n, halfVec), 0.0), 48.0);
    vec3 specColor = vec3(1.0, 0.95, 0.9) * spec * keyShadow * 0.5;
    // Дополнительный блик от неона
    float neonSpec = pow(max(dot(n, normalize(vec3(0.0, 1.0, 0.0) - rd)), 0.0), 32.0);
    specColor += mix(cyan, magenta, 0.5) * neonSpec * 0.4;
    // Блик от rim
    specColor += accentColor * pow(rimDot, 5.0) * 0.25;
    // Блик от rimlight
    specColor += accentColor * pow(rimDot, 5.0) * 0.3;
    
    // --- СОБИРАЕМ ---
    ambient = vec3(0.04, 0.045, 0.06) * (0.4 + ao * 0.6);
    vec3 torchLight = keyLight + fillLight + rimColor + neonLight * 0.15 + centerLight * 0.25;
    torchLight *= ao;
    
    // mainDot для материалов
    float mainDot = keyDiff * keyShadow * 0.6 + 0.2;
    
    // Подсветка пола
    float distFromCenter = length(p.xz);
    vec3 poolLight = accentColor * smoothstep(20.0, 0.0, distFromCenter) * 0.3;
    
    // === МАТЕРИАЛЫ (упрощённые) ===
    if (mat == 1) {
      // === ВОДА (стилизованная) ===
      vec3 waterDeep = vec3(0.02, 0.08, 0.12);
      vec3 waterMid = vec3(0.05, 0.15, 0.2);
      vec3 waterSurface = vec3(0.1, 0.25, 0.3);
      
      // Глубина воды
      float depth = smoothstep(0.0, 2.0, -p.y + 1.0);
      vec3 waterColor = mix(waterDeep, waterMid, depth);
      
      // Волны на поверхности
      float wave = sin(p.x * 3.0 + u_time * 1.5) * sin(p.z * 2.5 + u_time * 1.2) * 0.5 + 0.5;
      waterColor = mix(waterColor, waterSurface, wave * 0.3);
      
      // Неоновые отражения
      waterColor += accentColor * 0.1 * smoothstep(5.0, 0.0, length(p.xz));
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color = waterColor;
      color += vec3(0.2, 0.3, 0.35) * fresnel * 0.4;
      
    } else if (mat >= 4 && mat <= 12) {
      // === ВРАГИ (стилизованные) ===
      
      vec3 enemyBase = vec3(0.15);
      vec3 enemyGlow = vec3(0.5);
      float glowStrength = 0.3;
      
      if (mat == 4) {
        // БЕЙНЛИНГ - токсичный зелёный
        float pulse = 0.8 + 0.2 * sin(u_time * 3.0 + p.x * 2.0);
        enemyBase = vec3(0.05, 0.2, 0.05) * pulse;
        enemyGlow = vec3(0.3, 0.8, 0.2);
        glowStrength = 0.4;
        
      } else if (mat == 5) {
        // ФАНТОМ - тёмный фиолетовый
        float flicker = 0.7 + 0.3 * sin(u_time * 8.0 + p.x * 4.0);
        enemyBase = vec3(0.04, 0.02, 0.08) * flicker;
        enemyGlow = vec3(0.4, 0.15, 0.6);
        glowStrength = 0.5;
      
    } else if (mat == 6) {
        // RUNNER - тёплый оранжевый
        float flame = 0.7 + 0.3 * sin(u_time * 12.0 + p.x * 6.0);
        enemyBase = vec3(0.4, 0.12, 0.02) * flame;
        enemyGlow = vec3(0.9, 0.5, 0.1);
        glowStrength = 0.35;
        
      } else if (mat == 7) {
        // HOPPER - холодный синий
        float spark = sin(u_time * 20.0 + p.y * 10.0) * 0.5 + 0.5;
        enemyBase = vec3(0.05, 0.15, 0.35) * (0.8 + spark * 0.2);
        enemyGlow = vec3(0.3, 0.6, 1.0);
        glowStrength = 0.4;
        
      } else if (mat == 8) {
        // SPIKER - пурпурный
        float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
        enemyBase = vec3(0.15, 0.03, 0.2) * pulse;
        enemyGlow = vec3(0.6, 0.2, 0.8);
        glowStrength = 0.35;
        
      } else {
        // БОССЫ
        float pulse = 0.85 + 0.15 * sin(u_time * 2.0);
        if (mat == 10) {
          enemyBase = vec3(0.08, 0.35, 0.06) * pulse;
          enemyGlow = vec3(0.3, 0.9, 0.2);
        } else if (mat == 11) {
          enemyBase = vec3(0.03, 0.01, 0.06) * pulse;
          enemyGlow = vec3(0.4, 0.1, 0.7);
        } else {
          enemyBase = vec3(0.06, 0.12, 0.4) * pulse;
          enemyGlow = vec3(0.2, 0.5, 0.9);
        }
        glowStrength = 0.5;
      }
      
      // Матовая поверхность + мягкое свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color = enemyBase + enemyGlow * fresnel * glowStrength;
      
    } else if (mat == 100) {
      // Placeholder для старого кода (не используется)
      vec3 blue = vec3(0.2, 0.4, 1.0);
      vec3 white = vec3(1.0);
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      float spark1 = sin(u_time * 30.0 + p.y * 15.0);
      float spark2 = sin(u_time * 35.0 + p.x * 12.0);
      float electric = spark1 * spark2;
      
      color = mix(blue, cyan, 0.5 + 0.5 * sin(u_time * 8.0));
      
      // Яркие вспышки
      if (electric > 0.8) {
        color = mix(color, white, 0.7);
      }
      color *= 1.5;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += vec3(0.3, 0.6, 1.0) * fresnel * 0.8;
      
    } else if (mat >= 200 && mat < 232) {
      // === КАПЛИ ЖИЖИ (слизь разлетается!) ===
      int fragIndex = mat - 200;
      
      // Цвет слизи в зависимости от эпохи
      vec3 slimeColor;
      vec3 coreGlow; // Внутреннее свечение
      if (u_era == 1) {
        // Токсичная зелёная слизь
        slimeColor = vec3(0.2, 0.85, 0.3);
        coreGlow = vec3(0.4, 1.0, 0.2);
      } else if (u_era == 2) {
        // Тёмная фиолетовая слизь
        slimeColor = vec3(0.5, 0.1, 0.7);
        coreGlow = vec3(0.8, 0.2, 1.0);
      } else {
        // Огненная оранжевая слизь
        slimeColor = vec3(0.9, 0.4, 0.05);
        coreGlow = vec3(1.0, 0.6, 0.1);
      }
      
      // Полупрозрачность и внутреннее свечение (как желе)
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      
      // Подповерхностное рассеивание
      float sss = pow(max(0.0, dot(n, vec3(0.0, -1.0, 0.0))), 1.5) * 0.4;
      
      // Базовый цвет с внутренним свечением
      color = slimeColor * 0.6;
      color += coreGlow * (0.3 + sss);
      
      // Яркий блик (мокрая поверхность)
      vec3 lightDir = normalize(vec3(0.3, 1.0, -0.2));
      float spec = pow(max(0.0, dot(reflect(rd, n), lightDir)), 32.0);
      color += vec3(1.0) * spec * 0.8;
      
      // Френель (края ярче - полупрозрачность)
      color += coreGlow * fresnel * 0.6;
      
      // Пульсация (живая слизь)
      float pulse = 0.9 + 0.1 * sin(u_time * 15.0 + float(fragIndex) * 2.5);
      color *= pulse;
      
    } else if (mat == 10) {
      // === ЗЕЛЁНЫЙ БОСС (огромная токсичная жижа) ===
      vec3 toxicGreen = vec3(0.1, 0.9, 0.2);
      vec3 darkGreen = vec3(0.0, 0.4, 0.1);
      vec3 yellow = vec3(0.8, 1.0, 0.0);
      
      // Пульсирующее ядовитое свечение
      float pulse = 0.6 + 0.4 * sin(u_time * 3.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри на поверхности
      float bubbles = sin(p.x * 6.0 + u_time * 4.0) * sin(p.z * 6.0 + u_time * 3.0);
      if (bubbles > 0.7) {
        color = mix(color, yellow, 0.5);
      }
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += toxicGreen * fresnel * 1.5;
      color *= 2.0; // Очень яркий!
      
    } else if (mat == 11) {
      // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
      vec3 voidBlack = vec3(0.02, 0.0, 0.05);
      vec3 purple = vec3(0.4, 0.0, 0.6);
      vec3 darkPurple = vec3(0.15, 0.0, 0.25);
      
      // Почти чёрный с пурпурным мерцанием
      float darkPulse = sin(u_time * 2.0 + p.y * 3.0) * 0.5 + 0.5;
      color = mix(voidBlack, darkPurple, darkPulse * 0.3);
      
      // Искривление видно как переливы
      float distortion = sin(u_time * 5.0 + p.x * 8.0) * sin(u_time * 4.0 + p.z * 8.0);
      if (distortion > 0.6) {
        color += purple * 0.3;
      }
      
      // Жуткое свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 4.0);
      color += purple * fresnel * 2.0;
      
      // Звёзды внутри (как чёрная дыра)
      float stars = sin(p.x * 30.0) * sin(p.y * 30.0) * sin(p.z * 30.0);
      if (stars > 0.95) {
        color += vec3(1.0, 1.0, 1.0) * 0.5;
      }
      
    } else if (mat == 12) {
      // === СИНИЙ БОСС (телепортирующийся) ===
      vec3 electricBlue = vec3(0.0, 0.5, 1.0);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 white = vec3(1.0, 1.0, 1.0);
      
      // Мерцание (телепорт эффект)
      float flicker = abs(sin(u_time * 25.0));
      color = mix(electricBlue, cyan, flicker);
      
      // Разряды
      float spark = sin(u_time * 50.0 + p.x * 20.0) * sin(u_time * 45.0 + p.y * 20.0);
      if (spark > 0.85) {
        color = white;
      }
      
      // Призрачность
      float ghost = sin(u_time * 8.0) * 0.3 + 0.7;
      color *= ghost;
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += cyan * fresnel * 1.5;
      color *= 1.8;
      
    } else if (mat == 13) {
      // === ТОКСИЧНАЯ ЛУЖА ===
      vec3 toxicGreen = vec3(0.2, 1.0, 0.3);
      vec3 darkGreen = vec3(0.0, 0.3, 0.1);
      
      // Пульсирующий эффект
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + p.x * 2.0 + p.z * 2.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри
      float bubbles = sin(p.x * 10.0 + u_time * 5.0) * sin(p.z * 10.0 + u_time * 4.0);
      if (bubbles > 0.7) {
        color += vec3(0.3, 0.5, 0.1);
      }
      
      // Яркое свечение
      color *= 2.0;
      
    } else if (mat == 14) {
      // === ЛЕПЕСТКИ РОЗЫ (красные, бархатные) ===
      vec3 roseRed = vec3(0.8, 0.1, 0.15);
      vec3 roseDark = vec3(0.5, 0.05, 0.1);
      vec3 rosePink = vec3(1.0, 0.3, 0.4);
      
      // Градиент от центра к краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color = mix(roseDark, roseRed, 0.5);
      color = mix(color, rosePink, fresnel * 0.3);
      
      // Бархатистая текстура
      float velvet = pow(max(0.0, dot(-rd, n)), 0.5);
      color *= (0.7 + velvet * 0.5);
      
      // Мягкая пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 2.0);
      color *= pulse;
      
      // Свечение
      color *= 1.8;
      
    } else if (mat == 15) {
      // === СТИМПАК ===
      // Жёлто-оранжевый энергетический шар
      vec3 stimYellow = vec3(1.0, 0.8, 0.2);
      vec3 stimOrange = vec3(1.0, 0.5, 0.1);
      
      // Быстрая пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 8.0);
      color = mix(stimOrange, stimYellow, pulse);
      
      // Электрические искры
      float spark = fract(sin(dot(p.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 1.0, 0.5);
      }
      
      // Яркое свечение
      color *= 2.5;
      
    } else if (mat == 16) {
      // === БАЛКОН ===
      vec3 balconyColor = vec3(0.3, 0.25, 0.4); // Тёмно-фиолетовый
      
      // Светящиеся линии
      float gridX = step(0.9, fract(p.x * 2.0));
      float gridZ = step(0.9, fract(p.z * 2.0));
      float grid = max(gridX, gridZ);
      
      color = mix(balconyColor, accentColor, grid * 0.5);
      color += accentColor * 0.1; // Лёгкое свечение
      
    } else if (mat == 17) {
      // === ЗАРЯД КАТАНЫ (энергетическая сфера) ===
      vec3 chargeColor1 = vec3(0.0, 0.8, 1.0); // Бирюзовый
      vec3 chargeColor2 = vec3(0.0, 1.0, 1.0); // Циан
      vec3 chargeColor3 = vec3(0.5, 0.8, 1.0); // Светло-голубой
      
      // Интенсивная пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 6.0);
      float pulse2 = 0.5 + 0.5 * sin(u_time * 8.0 + 1.0);
      color = mix(chargeColor1, chargeColor2, pulse);
      color = mix(color, chargeColor3, pulse2 * 0.3);
      
      // Электрические разряды
      float spark = fract(sin(dot(p.xy + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.85) {
        color += vec3(1.0, 1.0, 1.0); // Белые искры
      }
      
      // Вращающиеся кольца энергии
      float ring = sin(atan(p.y, p.x) * 3.0 + u_time * 5.0);
      color += chargeColor2 * max(0.0, ring) * 0.3;
      
      // Очень яркое свечение
      color *= 4.0;
      
    } else if (mat == 18) {
      // === ЧЁРНЫЙ КРИСТАЛЛ СИЛЫ ===
      vec3 crystalBase = vec3(0.05, 0.02, 0.1); // Очень тёмный фиолетовый
      vec3 crystalGlow = vec3(0.3, 0.0, 0.5); // Фиолетовое свечение
      vec3 crystalEdge = vec3(0.8, 0.2, 1.0); // Яркие края
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
      
      // Эффект внутреннего свечения
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);
      
      // Энергетические линии на гранях
      float edge = fract(p.x * 5.0 + p.y * 5.0 + u_time * 2.0);
      edge = smoothstep(0.8, 1.0, edge);
      
      color = crystalBase;
      color += crystalGlow * fresnel * 2.0;
      color += crystalEdge * edge * 0.5;
      color += crystalGlow * pulse * 0.3;
      
      // Искры внутри
      float spark = fract(sin(dot(p.xyz + u_time * 5.0, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 0.5, 1.0); // Розовые искры
      }
      
      // Общее свечение
      color *= 2.5;
      
    } else if (mat == 19) {
      // === СНАРЯД КИСЛОТЫ ===
      vec3 acidCore = vec3(0.2, 1.0, 0.3);
      vec3 acidGlow = vec3(0.5, 1.0, 0.2);
      vec3 acidDark = vec3(0.1, 0.4, 0.1);
      
      float bubble = sin(p.x * 20.0 + u_time * 15.0) * 
                    sin(p.y * 20.0 + u_time * 12.0) * 
                    sin(p.z * 20.0 + u_time * 18.0);
      bubble = bubble * 0.5 + 0.5;
      
      float veins = sin(p.x * 10.0 + p.y * 15.0 + u_time * 5.0);
      veins = smoothstep(0.7, 1.0, veins);
      
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 2.0);
      
      color = mix(acidDark, acidCore, bubble);
      color += acidGlow * veins * 0.5;
      color += acidGlow * fresnel * 2.0;
      
      float drip = sin(u_time * 8.0 + p.y * 10.0);
      color *= 0.8 + 0.2 * drip;
      color *= 3.0;
      
    } else if (mat == 20) {
      // === МЕТКА ДОЖДЯ ===
      float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
      color = mix(vec3(1.0, 0.2, 0.0), vec3(0.3, 1.0, 0.2), pulse);
      color *= 4.0;
      
    } else if (mat == 21) {
      // === ЗОНА ДОЖДЯ НА ЗЕМЛЕ ===
      float pulse = sin(u_time * 5.0) * 0.3 + 0.7;
      color = vec3(0.1, 0.8, 0.2) * pulse * 3.0;
      
    } else if (mat == 22) {
      // === СТРУИ КИСЛОТНОГО ДОЖДЯ ===
      float flicker = sin(u_time * 20.0 + p.y * 5.0) * 0.3 + 0.7;
      color = vec3(0.2, 1.0, 0.3) * flicker * 2.0;
      
    } else if (mat == 23) {
      // === РАМКА ПОРТАЛА (обсидиан с руническим свечением) ===
      vec3 obsidian = vec3(0.02, 0.02, 0.03); // Глубокий чёрный
      vec3 obsidianHighlight = vec3(0.08, 0.06, 0.1); // Лёгкий фиолетовый отлив
      
      // Гладкая полированная поверхность
      float polish = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(obsidian, obsidianHighlight, polish * 0.3);
      
      // Руны вдоль рамки (светящиеся символы)
      float runeY = sin(p.y * 3.0) * sin(p.z * 3.0 + u_time * 0.5);
      float runePattern = smoothstep(0.6, 0.8, abs(runeY));
      vec3 runeGlow = vec3(1.0, 0.5, 0.1); // Оранжевое свечение
      color += runeGlow * runePattern * 0.4;
      
      // Отблеск огня изнутри
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float innerGlow = 1.0 - min(1.0, abs(p.z) / 2.0);
      float pulse = sin(u_time * 3.0) * 0.2 + 0.8;
      color += fireGlow * innerGlow * pulse * 0.3;
      
      // Металлический блеск
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 30.0);
      color += vec3(1.0, 0.8, 0.6) * specular * 0.2;
      
    } else if (mat == 24) {
      // === ОГНЕННЫЙ ШАР ПОРТАЛА ===
      // Базовые цвета огня
      vec3 fireCore = vec3(1.0, 1.0, 0.8);    // Белое ядро
      vec3 fireYellow = vec3(1.0, 0.9, 0.3);  // Жёлтый
      vec3 fireOrange = vec3(1.0, 0.5, 0.1);  // Оранжевый
      vec3 fireRed = vec3(1.0, 0.2, 0.05);    // Красный
      vec3 fireDark = vec3(0.5, 0.1, 0.0);    // Тёмно-красный
      
      // Расстояние от центра шара
      float dist = length(p - vec3(sign(p.x) * 22.0, 2.0, 0.0));
      float normalDist = dist / 1.2; // 0 в центре, 1 на краю
      
      // Анимированные волны огня
      float flame1 = sin(p.y * 5.0 + p.z * 3.0 - u_time * 8.0) * 0.5 + 0.5;
      float flame2 = sin(p.y * 7.0 - p.z * 4.0 + u_time * 6.0) * 0.5 + 0.5;
      float flame3 = cos(p.y * 4.0 + p.z * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Градиент от центра к краям
      color = mix(fireCore, fireYellow, normalDist * 0.5);
      color = mix(color, fireOrange, normalDist * 0.8);
      color = mix(color, fireRed, normalDist);
      
      // Добавляем анимацию пламени
      color = mix(color, fireYellow, flames * (1.0 - normalDist) * 0.5);
      
      // Пульсация яркости
      float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
      float pulse2 = 0.9 + 0.1 * sin(u_time * 15.0 + p.y * 10.0);
      color *= pulse * pulse2;
      
      // Яркость (умеренная)
      color *= 2.5;
      
      // Искры (яркие точки)
      float spark = sin(p.x * 30.0 + u_time * 20.0) * sin(p.y * 25.0 - u_time * 15.0) * sin(p.z * 28.0 + u_time * 18.0);
      if (spark > 0.88) {
        color += vec3(1.0, 0.9, 0.5) * 1.5;
      }
      
    } else if (mat == 25) {
      // === ПОСТАМЕНТ ПОРТАЛА (каменные ступени) ===
      vec3 stoneLight = vec3(0.18, 0.15, 0.12); // Светлый камень
      vec3 stoneMid = vec3(0.12, 0.10, 0.08);   // Средний тон
      vec3 stoneDark = vec3(0.06, 0.05, 0.04);  // Тёмный камень
      
      // Текстура камня - слои и трещины
      float noise1 = sin(p.x * 8.0) * sin(p.y * 12.0) * sin(p.z * 8.0);
      float noise2 = sin(p.x * 20.0 + p.z * 15.0) * 0.3;
      float noise3 = cos(p.y * 25.0 + p.x * 10.0) * 0.2;
      float stoneTexture = noise1 * 0.15 + noise2 * 0.1 + noise3 * 0.1;
      
      // Базовый цвет с текстурой
      color = mix(stoneDark, stoneMid, 0.5 + stoneTexture);
      
      // Светлые грани (верхние поверхности)
      if (n.y > 0.5) {
        color = mix(color, stoneLight, 0.4);
      }
      
      // Тёмные грани (боковые и нижние)
      if (n.y < -0.3) {
        color = mix(color, stoneDark, 0.5);
      }
      
      // Отблеск огня от портала
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float glowIntensity = sin(u_time * 3.0) * 0.15 + 0.25;
      float distToCenter = abs(p.z) / 3.0; // Ближе к центру - ярче
      float fireInfluence = max(0.0, 1.0 - distToCenter) * glowIntensity;
      color += fireGlow * fireInfluence * 0.3;
      
      // Патина/мох в углублениях
      float moss = sin(p.x * 30.0) * sin(p.z * 30.0);
      if (moss > 0.7 && n.y > 0.3) {
        color = mix(color, vec3(0.05, 0.12, 0.05), 0.2); // Зеленоватый оттенок
      }
      
      // Блики на гранях
      float edgeHighlight = pow(max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5)))), 8.0);
      color += vec3(0.15, 0.12, 0.1) * edgeHighlight * 0.3;
      
    } else if (mat == 26) {
      // === ТЕЛО СПАЙКЕРА (органическая кожа с прожилками) ===
      vec3 skinBase = vec3(0.4, 0.15, 0.1);      // Тёмно-красная кожа
      vec3 skinLight = vec3(0.7, 0.25, 0.15);    // Светлые участки
      vec3 veinColor = vec3(0.2, 0.0, 0.05);     // Тёмные прожилки
      vec3 glowColor = vec3(1.0, 0.3, 0.1);      // Внутреннее свечение
      
      // Базовая текстура кожи - неровности
      float skinNoise = sin(p.x * 20.0 + u_time * 0.5) 
                      * sin(p.y * 18.0 + u_time * 0.3) 
                      * sin(p.z * 22.0 + u_time * 0.4);
      
      // Прожилки - сеть линий
      float veins = sin(p.x * 8.0 + p.y * 5.0) * sin(p.z * 7.0 + p.y * 3.0);
      veins = smoothstep(0.6, 0.9, abs(veins));
      
      // Пульсирующие "вены" под кожей
      float veinPulse = sin(u_time * 3.0 + length(p) * 5.0) * 0.5 + 0.5;
      
      // Собираем цвет
      color = mix(skinBase, skinLight, skinNoise * 0.3 + 0.3);
      color = mix(color, veinColor, veins * 0.4);
      
      // Внутреннее свечение (как будто внутри огонь)
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += glowColor * innerGlow * veinPulse * 0.5;
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 4.0);
      color *= pulse;
      
      // Шипы по краям темнее
      float distFromCenter = length(p.xz);
      if (distFromCenter > 0.5) {
        color = mix(color, veinColor, 0.3);
      }
      
      // Подсветка
      color *= 1.4;
      
      // Fresnel - красноватый отблеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowColor * fresnel * 0.4;
      
    } else if (mat == 27) {
      // === ЛАЗЕР СПАЙКЕРА ===
      vec3 laserCore = vec3(1.0, 1.0, 1.0);   // Яркое белое ядро
      vec3 laserRed = vec3(1.0, 0.1, 0.0);    // Красный
      vec3 laserOrange = vec3(1.0, 0.4, 0.0); // Оранжевый
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 30.0 + p.x * 20.0 + p.y * 25.0);
      
      // Электрические разряды вдоль луча
      float spark = sin(u_time * 50.0 + length(p) * 30.0);
      
      // Ядро белое, края красно-оранжевые
      color = mix(laserCore, laserRed, 0.3);
      if (spark > 0.7) {
        color = mix(color, laserCore, 0.5); // Яркие вспышки
      }
      
      color *= pulse;
      color *= 5.0; // Очень ярко!
      
      // Fresnel свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += laserOrange * fresnel * 2.0;
      
    } else if (mat == 28) {
      // === ЗРАЧОК СПАЙКЕРА (чёрный с красным свечением) ===
      vec3 pupilBlack = vec3(0.0, 0.0, 0.0);
      vec3 glowRed = vec3(1.0, 0.0, 0.0);
      
      color = pupilBlack;
      
      // Красное свечение изнутри
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color += glowRed * innerGlow * 2.0;
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0);
      color += glowRed * pulse * 0.3;
      
    } else if (mat == 29) {
      // === РАДУЖКА СПАЙКЕРА (красно-оранжевая, огненная) ===
      vec3 irisRed = vec3(0.9, 0.1, 0.0);
      vec3 irisOrange = vec3(1.0, 0.5, 0.0);
      vec3 irisYellow = vec3(1.0, 0.8, 0.2);
      
      // Радиальные полосы как в настоящем глазе
      float angle = atan(p.y, p.x);
      float radialPattern = sin(angle * 12.0 + u_time * 2.0) * 0.5 + 0.5;
      
      // Пульсирующие кольца
      float rings = sin(length(p) * 30.0 - u_time * 5.0) * 0.5 + 0.5;
      
      color = mix(irisRed, irisOrange, radialPattern);
      color = mix(color, irisYellow, rings * 0.3);
      
      // Огненное свечение
      color *= 2.0;
      
      // Блик
      float highlight = pow(max(0.0, dot(-rd, n)), 20.0);
      color += vec3(1.0, 0.9, 0.8) * highlight * 0.5;
      
    } else if (mat == 32) {
      // === КАМЕНЬ АЛТАРЯ ===
      vec3 stoneBase = vec3(0.2, 0.18, 0.15);     // Тёмный камень
      vec3 stoneLight = vec3(0.35, 0.3, 0.25);    // Светлые участки
      vec3 mossColor = vec3(0.1, 0.2, 0.1);       // Мох
      
      // Текстура камня
      float stoneNoise = sin(p.x * 10.0) * sin(p.y * 8.0) * sin(p.z * 12.0);
      
      color = mix(stoneBase, stoneLight, stoneNoise * 0.3 + 0.3);
      
      // Немного мха внизу
      float mossAmount = smoothstep(1.0, 0.0, p.y) * 0.3;
      color = mix(color, mossColor, mossAmount);
      
      // Резьба/узоры
      float carving = sin(p.y * 20.0) * sin(atan(p.x, p.z) * 8.0);
      color *= 0.9 + carving * 0.1;
      
      // Освещение
      float light = max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5))));
      color *= 0.6 + light * 0.6;
      
    } else if (mat == 33) {
      // === ОГОНЬ В АЛТАРЕ ===
      vec3 fireWhite = vec3(1.0, 1.0, 0.9);
      vec3 fireOrange = vec3(1.0, 0.6, 0.1);
      vec3 fireRed = vec3(1.0, 0.2, 0.0);
      
      // Динамическое пламя
      float flame = sin(u_time * 15.0 + p.y * 10.0 + p.x * 5.0);
      float flicker = sin(u_time * 20.0 + p.z * 8.0);
      
      // Цвет от центра к краям
      float gradient = smoothstep(0.0, 1.0, p.y);
      color = mix(fireWhite, fireOrange, gradient);
      color = mix(color, fireRed, gradient * 0.5);
      
      // Мерцание
      color *= 0.8 + flame * 0.2 + flicker * 0.1;
      
      // Очень яркий
      color *= 4.0;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += fireOrange * fresnel * 2.0;
      
    } else if (mat == 34) {
      // === СВЕТЯЩИЙСЯ СИМВОЛ АЛТАРЯ ===
      vec3 glowCyan = vec3(0.0, 1.0, 0.8);
      vec3 glowWhite = vec3(1.0, 1.0, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 3.0);
      
      color = mix(glowCyan, glowWhite, 0.3);
      color *= pulse * 3.0;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 1.5;
      
    } else if (mat == 35) {
      // === ЯДРО ЭНЕРГЕТИЧЕСКОГО ЛУЧА (ярко-белое) ===
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 coreBlue = vec3(0.8, 0.9, 1.0);
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 30.0);
      
      // Ярко-белое ядро
      color = mix(coreWhite, coreBlue, 0.1);
      color *= pulse;
      
      // ОЧЕНЬ яркое!
      color *= 8.0;
      
      // Дополнительное свечение от fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += coreWhite * fresnel * 3.0;
      
    } else if (mat == 36) {
      // === ВНЕШНЕЕ СВЕЧЕНИЕ ЛУЧА (голубое) ===
      vec3 glowCyan = vec3(0.3, 0.8, 1.0);
      vec3 glowWhite = vec3(0.9, 0.95, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 25.0 + p.x * 5.0);
      
      color = mix(glowCyan, glowWhite, 0.4);
      color *= pulse * 4.0;
      
      // Fresnel для объёма
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 2.0;
      
    } else if (mat == 37) {
      // === СЛЕД ЛУЧА (затухающий) ===
      vec3 trailCyan = vec3(0.2, 0.6, 1.0);
      vec3 trailPurple = vec3(0.5, 0.2, 1.0);
      
      // Мерцание
      float flicker = sin(u_time * 40.0 + p.y * 10.0 + p.x * 15.0);
      
      // Цвет меняется по следу
      color = mix(trailCyan, trailPurple, 0.3 + flicker * 0.2);
      
      // Яркость
      color *= 2.5;
      
      // Искры
      if (flicker > 0.8) {
        color += vec3(1.0) * 1.5;
      }
      
    } else if (mat == 38) {
      // === ЦЕНТРАЛЬНЫЙ ПОРТАЛ (огненный вихрь как боковые) ===
      
      // Расстояние от центра
      float distFromCenter = length(p.xz);
      float normalizedDist = distFromCenter / 0.9;
      
      // Базовые цвета огня
      vec3 fireCore = vec3(1.0, 1.0, 0.8);    // Белое ядро
      vec3 fireYellow = vec3(1.0, 0.9, 0.3);  // Жёлтый
      vec3 fireOrange = vec3(1.0, 0.5, 0.1);  // Оранжевый
      vec3 fireRed = vec3(1.0, 0.2, 0.05);    // Красный
      
      // Анимированные волны огня
      float angle = atan(p.z, p.x);
      float flame1 = sin(angle * 6.0 + p.y * 5.0 - u_time * 8.0) * 0.5 + 0.5;
      float flame2 = sin(angle * 8.0 - p.y * 3.0 + u_time * 6.0) * 0.5 + 0.5;
      float flame3 = cos(angle * 4.0 + p.y * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Градиент от центра к краям
      color = mix(fireCore, fireYellow, normalizedDist * 0.4);
      color = mix(color, fireOrange, normalizedDist * 0.6 + flames * 0.3);
      color = mix(color, fireRed, normalizedDist * 0.8);
      
      // Вихревой эффект
      float swirl = sin(angle * 12.0 - u_time * 5.0) * 0.5 + 0.5;
      color += vec3(1.0, 0.6, 0.2) * swirl * (1.0 - normalizedDist) * 0.5;
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 5.0);
      color *= pulse;
      
      // Яркость
      color *= 3.0 * (1.0 - normalizedDist * 0.5);
      
    } else if (mat == 39) {
      // === СВЕЧЕНИЕ ПОРТАЛА (фиолетовое) ===
      vec3 glowPurple = vec3(0.6, 0.2, 1.0);
      vec3 glowPink = vec3(1.0, 0.4, 0.8);
      
      // Пульсация
      float pulse = 0.6 + 0.4 * sin(u_time * 5.0 + p.y * 2.0);
      
      // Вращение
      float angle = atan(p.z, p.x);
      float spin = sin(angle * 8.0 - u_time * 3.0) * 0.5 + 0.5;
      
      color = mix(glowPurple, glowPink, spin * 0.5);
      color *= pulse * 2.5;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += glowPurple * fresnel * 1.5;
      
    } else if (mat == 40) {
      // === ЭНЕРГЕТИЧЕСКИЕ КОЛЬЦА ПОРТАЛА ===
      vec3 ringPurple = vec3(0.8, 0.3, 1.0);
      vec3 ringWhite = vec3(1.0, 0.9, 1.0);
      
      // Быстрая пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 15.0 + p.y * 5.0);
      
      color = mix(ringPurple, ringWhite, 0.3);
      color *= pulse * 4.0;
      
      // Искры
      float sparkle = sin(u_time * 30.0 + p.x * 10.0 + p.z * 12.0);
      if (sparkle > 0.85) {
        color += vec3(1.0) * 2.0;
      }
      
    } else if (mat == 41) {
      // === ГРАНАТА (обычная, зелёная) ===
      vec3 grenadeGreen = vec3(0.2, 0.5, 0.2);
      vec3 grenadeBlack = vec3(0.1, 0.1, 0.1);
      
      // Полоски на гранате
      float stripes = sin(p.y * 20.0);
      color = mix(grenadeGreen, grenadeBlack, stripes * 0.3 + 0.35);
      
      // Металлический блеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(0.4, 0.5, 0.4) * fresnel * 0.5;
      
    } else if (mat == 42) {
      // === ГРАНАТА (мигает перед взрывом) ===
      vec3 grenadeRed = vec3(1.0, 0.2, 0.1);
      vec3 grenadeYellow = vec3(1.0, 0.8, 0.2);
      
      // Быстрое мигание
      float blink = sin(u_time * 30.0) * 0.5 + 0.5;
      color = mix(grenadeRed, grenadeYellow, blink);
      
      // Яркое свечение
      color *= 3.0;
      
    } else if (mat == 43) {
      // === ВЗРЫВ (GLITCH ЭФФЕКТ) ===
      // Базовые цвета глитча
      vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
      vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
      vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
      vec3 glitchBlack = vec3(0.0, 0.0, 0.0);
      
      // Хаотичный шум для глитча
      float glitchNoise = fract(sin(dot(p.xy + u_time * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
      float blockNoise = floor(glitchNoise * 8.0) / 8.0;
      
      // Горизонтальные полосы сбоя
      float scanline = step(0.5, fract(p.y * 20.0 + u_time * 100.0));
      
      // RGB сдвиг
      float rgbShift = sin(u_time * 30.0 + p.y * 5.0) * 0.5;
      
      // Основной цвет - мерцание между циан и маджента
      color = mix(glitchCyan, glitchMagenta, blockNoise);
      
      // Добавляем белые вспышки
      if (glitchNoise > 0.8) {
        color = glitchWhite;
      }
      
      // Чёрные провалы
      if (glitchNoise < 0.15) {
        color = glitchBlack;
      }
      
      // Scanlines
      color *= 0.8 + scanline * 0.4;
      
      // RGB смещение
      color.r *= 1.0 + rgbShift * 0.3;
      color.b *= 1.0 - rgbShift * 0.3;
      
      // Очень яркий
      color *= 4.0;
      
      // Случайные яркие пиксели
      if (fract(sin(dot(floor(p.xz * 10.0), vec2(41.1, 67.3)) + u_time * 20.0) * 1000.0) > 0.95) {
        color = glitchWhite * 8.0;
      }
      
    } else if (mat == 44) {
      // === ГЛУБИНА ЖИЛЫ/ВОЙДА (тёмная бездна) ===
      vec3 voidDeep = vec3(0.02, 0.03, 0.05);
      vec3 voidGlow = vec3(0.08, 0.15, 0.2);
      
      // Глубинное затемнение
      float depth = abs(p.y + 5.0) / 10.0;
      color = mix(voidGlow, voidDeep, depth);
      
      // Еле заметные течения
      float flow = sin(p.x * 1.5 + u_time * 0.3) * sin(p.z * 1.5 + u_time * 0.2);
      color += vec3(0.03, 0.06, 0.08) * flow * 0.5;
      
      // Очень редкие блики
      float flash = fract(sin(dot(floor(p.xz * 0.3), vec2(12.9, 78.2)) + u_time * 0.5) * 43758.0);
      if (flash > 0.98) {
        color += vec3(0.1, 0.2, 0.25);
      }
      
    } else if (mat == 45) {
      // === ПОВЕРХНОСТЬ ВОЙДА (прозрачная дымка) ===
      vec3 surfaceCore = vec3(0.1, 0.2, 0.25);
      vec3 surfaceEdge = vec3(0.05, 0.08, 0.12);
      vec3 surfaceHighlight = vec3(0.3, 0.4, 0.5);
      
      // Мягкие волны
      float wave1 = sin(p.x * 2.0 + u_time * 1.0) * sin(p.z * 1.8 + u_time * 0.8);
      float wave2 = sin(p.x * 3.0 - u_time * 0.7) * sin(p.z * 2.5 + u_time * 0.5);
      float waves = (wave1 + wave2) * 0.5;
      
      // Прозрачный цвет
      color = mix(surfaceEdge, surfaceCore, 0.4 + waves * 0.2);
      
      // Редкие блики
      float highlight = pow(max(0.0, waves), 4.0);
      color = mix(color, surfaceHighlight, highlight * 0.3);
      
      // Редкие белые искры
      float glint = fract(sin(dot(p.xz + u_time * 3.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.96) {
        color = mix(color, vec3(0.4, 0.5, 0.6), 0.5);
      }
      
      // Умеренное свечение
      color *= 1.5;
      
    } else if (mat == 46) {
      // === БОРТИК ОБРЫВА ===
      vec3 stoneBase = vec3(0.15, 0.1, 0.2);
      vec3 voidGlow = vec3(0.4, 0.0, 0.8);
      
      // Грубая текстура камня
      float noise = fract(sin(dot(floor(p.xz * 5.0), vec2(12.9, 78.2))) * 43758.0);
      color = mix(stoneBase, stoneBase * 1.5, noise);
      
      // Фиолетовое свечение от реки войда
      float glowStrength = sin(u_time * 3.0) * 0.3 + 0.5;
      color = mix(color, voidGlow, glowStrength * 0.4);
      
      // Блестящие прожилки
      float vein = sin(p.x * 20.0 + p.z * 15.0) * sin(p.y * 30.0);
      if (vein > 0.85) {
        color += vec3(0.3, 0.0, 0.5);
      }
      
    } else if (mat == 47) {
      // === БОРТИК ЖИЛЫ (обветренный камень) ===
      vec3 darkStone = vec3(0.12, 0.11, 0.10);
      vec3 edgeGlow = vec3(0.15, 0.25, 0.3);
      
      // Тёмный обветренный камень
      float stoneNoise = noise(p.xz * 8.0);
      color = darkStone * (0.8 + stoneNoise * 0.4);
      
      // Тонкие прожилки энергии
      float vein1 = sin(p.x * 20.0) * sin(p.z * 18.0);
      if (vein1 > 0.9) {
        color = mix(color, edgeGlow, 0.5);
      }
      
      // Лёгкое голубоватое свечение от жилы
      color += edgeGlow * 0.05;
      
    } else if (mat == 48) {
      // === ПОВЕРХНОСТЬ ЖИЛЫ (прозрачная энергия) ===
      vec3 voidBlue = vec3(0.05, 0.1, 0.2);
      vec3 voidCyan = vec3(0.1, 0.3, 0.4);
      vec3 glitchWhite = vec3(0.5, 0.6, 0.7);
      
      // Мягкое течение
      float flow = sin(p.x * 2.0 + p.z * 2.0 - u_time * 1.5);
      flow = flow * 0.5 + 0.5;
      
      // Прозрачный голубоватый цвет
      color = mix(voidBlue, voidCyan, flow * 0.6);
      
      // Лёгкая пульсация
      float pulse = sin(u_time * 0.8) * 0.2 + 0.8;
      color *= pulse;
      
      // Редкие белые блики
      float glint = fract(sin(dot(p.xz + u_time * 2.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.97) {
        color = mix(color, glitchWhite, 0.4);
      }
      
      // Умеренное свечение
      color *= 1.2;
      
    } else if (mat == 31) {
      // === БОЛЬШАЯ АПТЕЧКА (на краях карты) ===
      vec3 healthWhite = vec3(1.0, 1.0, 1.0);
      vec3 healthGold = vec3(1.0, 0.85, 0.3);
      vec3 healthGreen = vec3(0.3, 1.0, 0.5);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 5.0);
      
      // Градиент от золотого к белому
      float gradient = p.y * 0.5 + 0.5;
      color = mix(healthGold, healthWhite, gradient);
      
      // Зелёный оттенок для "здоровья"
      color = mix(color, healthGreen, 0.2);
      
      // Очень яркое свечение
      color *= pulse * 2.5;
      
      // Fresnel аура
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += healthGold * fresnel * 1.5;
      
      // Искры
      float sparkle = sin(u_time * 20.0 + p.x * 10.0 + p.y * 15.0);
      if (sparkle > 0.9) {
        color += vec3(1.0) * 0.5;
      }
      
    } else if (mat == 30) {
      // === ВОДА В БАССЕЙНЕ (тёмная, атмосферная) ===
      vec3 waterDeep = vec3(0.01, 0.04, 0.06);
      vec3 waterMid = vec3(0.03, 0.08, 0.12);
      vec3 waterGlow = vec3(0.1, 0.25, 0.35);
      
      // Волны (медленные, плавные)
      float wave = sin(p.x * 2.0 + u_time * 0.8) * sin(p.z * 1.8 + u_time * 0.6);
      float ripple = sin(length(p.xz) * 4.0 - u_time * 1.5) * 0.5 + 0.5;
      
      // Глубина
      float depth = smoothstep(2.0, 8.0, length(p.xz));
      vec3 waterColor = mix(waterDeep, waterMid, depth);
      waterColor += waterGlow * wave * 0.15;
      
      // Неоновые отблески
      waterColor += accentColor * 0.08 * smoothstep(8.0, 2.0, length(p.xz));
      
      // Мягкие блики
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 16.0);
      
      color = waterColor;
      color += waterGlow * fresnel * 0.25;
      color += vec3(0.15, 0.2, 0.25) * spec * 0.3;
      color += waterGlow * ripple * 0.05;
      
    } else if (mat == 50) {
      // === ТЁМНЫЙ КАМЕНЬ (основание) ===
      vec3 stoneBase = vec3(0.06, 0.055, 0.05);
      vec3 stoneDark = vec3(0.025, 0.022, 0.02);
      vec3 stoneLight = vec3(0.09, 0.08, 0.07);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 6.0);
      float detailNoise = noise(p.xz * 20.0) * 0.3;
      
      vec3 stone = mix(stoneDark, stoneBase, stoneNoise * 0.6);
      stone = mix(stone, stoneLight, detailNoise);
      
      // Трещины
      float crack = sharpNoise(p.xz * 15.0);
      if (crack > 0.88) stone *= 0.6;
      
      // Грани
      float angle = atan(p.z, p.x);
      float edge = smoothstep(0.9, 1.0, abs(cos(angle * 8.0)));
      stone = mix(stone, stoneLight, edge * 0.2);
      
      color = stone * ambient * 1.3;
      color += stone * torchLight * 0.5;
      
    } else if (mat == 51) {
      // === МРАМОР (колонна) ===
      vec3 marbleBase = vec3(0.15, 0.14, 0.13);
      vec3 marbleLight = vec3(0.22, 0.2, 0.18);
      vec3 marbleVein = vec3(0.06, 0.055, 0.05);
      
      // Прожилки
      float vein1 = sin(p.x * 8.0 + p.y * 3.0 + noise(p.xz * 2.0) * 4.0);
      float vein2 = sin(p.z * 6.0 - p.y * 4.0 + noise(p.xy * 2.0) * 3.0);
      float veins = smoothstep(0.8, 0.95, abs(vein1)) + smoothstep(0.85, 0.98, abs(vein2)) * 0.5;
      
      // Базовый цвет
      vec3 marble = mix(marbleBase, marbleLight, noise(p.xz * 1.5) * 0.3);
      marble = mix(marble, marbleVein, veins * 0.6);
      
      // Мягкий блик
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 32.0);
      
      color = marble * ambient * 1.4;
      color += marble * torchLight * 0.4;
      color += vec3(0.15, 0.13, 0.12) * spec * 0.2;
      color += marbleLight * fresnel * 0.1;
      
    } else if (mat == 52) {
      // === БРОНЗА (декор) ===
      vec3 bronzeBase = vec3(0.12, 0.08, 0.04);
      vec3 bronzeHighlight = vec3(0.2, 0.14, 0.06);
      vec3 bronzePatina = vec3(0.05, 0.1, 0.08);
      
      // Патина
      float patina = noise(p.xz * 6.0);
      vec3 bronze = mix(bronzeBase, bronzePatina, patina * 0.4);
      
      // Металлический блеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 24.0);
      
      color = bronze * ambient * 1.3;
      color += bronze * torchLight * 0.5;
      color += bronzeHighlight * spec * 0.25;
      color += bronzeHighlight * fresnel * 0.15;
      
    } else if (mat == 53) {
      // === МОЗАИКА (центр арены) ===
      vec3 mosaicDark = vec3(0.04, 0.035, 0.05);
      vec3 mosaicMid = vec3(0.08, 0.07, 0.09);
      vec3 mosaicAccent = accentColor * 0.3;
      
      // Геометрический паттерн
      float angle = atan(p.z, p.x);
      float dist = length(p.xz);
      
      // Лучи + круги
      float rays = sin(angle * 8.0) * 0.5 + 0.5;
      float rings = sin(dist * 3.0) * 0.5 + 0.5;
      float pattern = rays * rings;
      
      vec3 mosaic = mix(mosaicDark, mosaicMid, pattern * 0.6);
      
      // Неоновые линии (редкие)
      float neonLine = smoothstep(0.94, 0.96, abs(sin(angle * 12.0)));
      neonLine += smoothstep(0.94, 0.96, abs(sin(dist * 5.0)));
      mosaic += mosaicAccent * neonLine * 0.5;
      
      color = mosaic * ambient * 1.4;
      color += mosaic * torchLight * 0.5;
      
    } else if (mat == 54) {
      // === ДЕКОРАТИВНОЕ КОЛЬЦО ===
      vec3 ringBase = vec3(0.05, 0.045, 0.04);
      vec3 ringLight = vec3(0.08, 0.07, 0.06);
      vec3 ringGlow = accentColor * 0.4;
      
      // Руны
      float angle = atan(p.z, p.x);
      float rune = sin(angle * 12.0) * sin(length(p.xz) * 3.0);
      
      vec3 ring = mix(ringBase, ringLight, noise(p.xz * 4.0) * 0.4);
      
      // Мягкое свечение рун
      float runeGlow = smoothstep(0.6, 0.8, abs(rune)) * (0.6 + 0.4 * sin(u_time * 1.5));
      ring += ringGlow * runeGlow * 0.3;
      
      color = ring * ambient * 1.3;
      color += ring * torchLight * 0.5;
      
    } else if (mat == 55) {
      // === ПОЛ (тёмный бетон с неоновыми акцентами) ===
      
      // Базовые цвета - тёмно-серый бетон
      vec3 concreteBase = vec3(0.08, 0.075, 0.07);
      vec3 concreteDark = vec3(0.04, 0.038, 0.035);
      vec3 concreteLight = vec3(0.12, 0.11, 0.1);
      
      // Большие плиты (2x2 метра)
      vec2 tileCoord = floor(p.xz * 0.5);
      vec2 tileFract = fract(p.xz * 0.5);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(concreteDark, concreteBase, tileId * 0.5);
      
      // Текстура бетона (шум)
      float concreteNoise = noise(p.xz * 8.0) * 0.3;
      tileColor = mix(tileColor, concreteLight, concreteNoise);
      
      // Мелкие трещины
      float cracks = sharpNoise(p.xz * 25.0);
      if (cracks > 0.85) {
        tileColor *= 0.7;
      }
      
      // Швы между плитами
      float seamX = smoothstep(0.02, 0.04, tileFract.x) * smoothstep(0.02, 0.04, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.04, tileFract.y) * smoothstep(0.02, 0.04, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.02), tileColor, seam);
      
      // Неоновые полосы на полу (редкие)
      float stripeX = smoothstep(0.48, 0.5, tileFract.x) * smoothstep(0.52, 0.5, tileFract.x);
      float stripeY = smoothstep(0.48, 0.5, tileFract.y) * smoothstep(0.52, 0.5, tileFract.y);
      float stripe = max(stripeX, stripeY) * step(0.8, tileId);
      
      // Мокрые отражения (приглушённые)
      vec3 reflDir = reflect(rd, n);
      float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 2.5);
      
      vec3 wetReflect = vec3(0.0);
      float ref1 = pow(max(dot(reflDir, vec3(0.0, 1.0, 0.0)), 0.0), 8.0);
      wetReflect += accentColor * ref1 * 0.15;
      
      // Собираем цвет
      color = tileColor * ambient * 1.2;
      color += tileColor * torchLight * 0.4;
      color += wetReflect * fresnel * 0.5;
      
      // Неоновые полосы
      color += accentColor * stripe * 0.3 * (0.7 + 0.3 * sin(u_time * 2.0));
      
    } else if (mat == 60) {
      // === КАМЕНЬ СТОЛБА ===
      vec3 stoneBase = vec3(0.07, 0.065, 0.06);
      vec3 stoneDark = vec3(0.035, 0.03, 0.028);
      vec3 stoneLight = vec3(0.1, 0.09, 0.08);
      
      // Текстура
      float stoneNoise = noise(p.xz * 3.0);
      vec3 stoneColor = mix(stoneDark, stoneBase, stoneNoise * 0.5);
      
      // Детали
      float detail = noise(p.xz * 10.0) * 0.3;
      stoneColor = mix(stoneColor, stoneLight, detail);
      
      // Мох (редкий)
      float moss = smoothstep(0.3, 1.0, p.y) * noise(p.xz * 2.0);
      stoneColor = mix(stoneColor, vec3(0.03, 0.06, 0.02), moss * 0.2);
      
      color = stoneColor * ambient * 1.3;
      color += stoneColor * torchLight * 0.5;
      
    } else if (mat == 61) {
      // === МЕТАЛЛ ЧАШИ (тёмная бронза) ===
      vec3 metalBase = vec3(0.08, 0.055, 0.03);
      vec3 metalHighlight = vec3(0.15, 0.1, 0.05);
      vec3 metalPatina = vec3(0.04, 0.07, 0.06);
      
      // Патина
      float patina = noise(p.xz * 5.0);
      vec3 metal = mix(metalBase, metalPatina, patina * 0.35);
      
      // Блик
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 20.0);
      
      color = metal * ambient * 1.3;
      color += metal * torchLight * 0.5;
      color += metalHighlight * spec * 0.2;
      color += metalHighlight * fresnel * 0.1;
      
      // Отсвет от огня (мягкий)
      color += accentColor * 0.05;
      
    } else if (mat == 62) {
      // === НЕОНОВЫЙ ИСТОЧНИК СВЕТА ===
      // Определяем цвет по позиции (север/юг/восток/запад)
      vec3 neonCol;
      float angle = atan(p.z, p.x);
      
      if (abs(p.z) > abs(p.x)) {
        // Север или юг
        neonCol = p.z > 0.0 ? vec3(0.0, 1.0, 0.9) : vec3(1.0, 0.1, 0.6);
      } else {
        // Восток или запад
        neonCol = p.x > 0.0 ? accentColor : vec3(1.0, 0.9, 0.2);
      }
      
      // Пульсация
      float pulse = 0.85 + 0.15 * sin(u_time * 4.0 + angle * 2.0);
      
      // Яркий неон (но не слишком)
      color = neonCol * 3.0 * pulse;
      
    } else if (mat == 63) {
      // === ДЕРЕВО (тёмное, состаренное) ===
      vec3 woodBase = vec3(0.08, 0.05, 0.03);
      vec3 woodDark = vec3(0.035, 0.02, 0.01);
      vec3 woodLight = vec3(0.12, 0.07, 0.04);
      
      // Текстура волокон
      float grain = sin(p.y * 15.0 + sin(p.x * 3.0) * 1.5) * 0.5 + 0.5;
      vec3 woodColor = mix(woodDark, woodBase, grain * 0.6);
      
      // Детали
      float detail = noise(p.xz * 8.0);
      woodColor = mix(woodColor, woodLight, detail * 0.2);
      
      // Старение
      float age = noise(p.xz * 3.0) * 0.15;
      woodColor *= 1.0 - age;
      
      color = woodColor * ambient * 1.3;
      color += woodColor * torchLight * 0.4;
      color += woodColor * torchLight * 1.2;
      color += rimColor * 0.2;
      
    } else if (mat == 64) {
      // === ТЁМНЫЙ КАМЕНЬ ПЛАТФОРМЫ ФОНАРЯ ===
      vec3 baseColor = vec3(0.04, 0.035, 0.03);
      vec3 darkColor = vec3(0.02, 0.018, 0.015);
      vec3 lightColor = vec3(0.08, 0.07, 0.06);
      
      // Плиты с швами
      vec2 tileCoord = floor(p.xz * 2.0);
      vec2 tileFract = fract(p.xz * 2.0);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(darkColor, baseColor, tileId * 0.4);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 8.0) * 0.2;
      tileColor = mix(tileColor, lightColor, stoneNoise);
      
      // Швы между плитами
      float seamX = smoothstep(0.03, 0.06, tileFract.x) * smoothstep(0.03, 0.06, 1.0 - tileFract.x);
      float seamY = smoothstep(0.03, 0.06, tileFract.y) * smoothstep(0.03, 0.06, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.01), tileColor, seam);
      
      // Трещины
      float crack = sharpNoise(p.xz * 20.0);
      if (crack > 0.88) {
        tileColor *= 0.6;
      }
      
      // Неоновое свечение в швах (редкое)
      float glowSeam = (1.0 - seam) * step(0.7, tileId);
      
      color = tileColor * ambient * 1.5;
      color += tileColor * torchLight * 0.8;
      color += accentColor * glowSeam * 0.15 * (0.7 + 0.3 * sin(u_time * 2.0));
      
    } else if (mat == 65) {
      // === БРОНЗА РЕШЁТОК ФОНАРЯ ===
      vec3 bronzeBase = vec3(0.45, 0.28, 0.12);
      vec3 bronzeHighlight = vec3(0.75, 0.55, 0.25);
      vec3 bronzePatina = vec3(0.15, 0.3, 0.25);
      
      // Кованая текстура
      float forged = sin(p.y * 30.0) * sin(p.x * 25.0 + p.z * 25.0) * 0.02;
      
      // Патина в углублениях
      float patinaMask = smoothstep(0.3, 0.6, noise(p.xz * 12.0));
      vec3 bronze = mix(bronzeBase, bronzePatina, patinaMask * 0.25);
      
      // Царапины
      float scratch = sharpNoise(p.xz * 40.0);
      if (scratch > 0.92) {
        bronze = mix(bronze, bronzeHighlight, 0.3);
      }
      
      // Металлический блеск
      float spec = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 50.0);
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      
      color = bronze * ambient * 2.0;
      color += bronze * torchLight * 1.5;
      color += bronzeHighlight * spec * 0.5;
      color += bronzeHighlight * fresnel * 0.2;
      
      // Отражение огня
      color += vec3(1.0, 0.5, 0.15) * 0.15;
      
    } else if (mat == 66) {
      // === ОГОНЬ ВНУТРИ ФОНАРЯ ===
      vec3 fireCore = vec3(1.0, 0.95, 0.7);
      vec3 fireYellow = vec3(1.0, 0.7, 0.2);
      vec3 fireOrange = vec3(1.0, 0.4, 0.08);
      vec3 fireRed = vec3(0.9, 0.15, 0.02);
      
      // Анимация пламени
      float flame1 = sin(p.y * 8.0 - u_time * 12.0 + p.x * 3.0) * 0.5 + 0.5;
      float flame2 = sin(p.y * 12.0 - u_time * 15.0 + p.z * 4.0) * 0.5 + 0.5;
      float flame3 = cos(p.y * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Расстояние от центра (для градиента)
      float dist = length(p.xz);
      float heightFade = smoothstep(0.0, 0.4, -p.y + 3.3);
      
      // Цвет от центра к краям
      color = mix(fireCore, fireYellow, dist * 2.0);
      color = mix(color, fireOrange, dist * 3.0);
      color = mix(color, fireRed, dist * 4.0);
      
      // Мерцание
      float flicker = 0.85 + 0.15 * sin(u_time * 25.0 + p.x * 10.0);
      color *= flicker;
      
      // Яркость
      color *= 4.0;
      
      // Языки пламени (яркие вспышки)
      if (flames > 0.7) {
        color = mix(color, fireCore * 5.0, (flames - 0.7) * 2.0);
      }
      
    } else if (mat == 68) {
      // === КАМЕНЬ ПЛАТФОРМЫ ПОРТАЛА ===
      vec3 stoneBase = vec3(0.06, 0.055, 0.05);
      vec3 stoneDark = vec3(0.03, 0.028, 0.025);
      vec3 stoneLight = vec3(0.1, 0.09, 0.08);
      
      // Плиты с швами
      vec2 tileCoord = floor(p.xz * 1.5);
      vec2 tileFract = fract(p.xz * 1.5);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(stoneDark, stoneBase, tileId * 0.5);
      
      // Текстура камня (многослойная)
      float stoneNoise = noise(p.xz * 6.0) * 0.3;
      float detailNoise = noise(p.xz * 15.0) * 0.15;
      tileColor = mix(tileColor, stoneLight, stoneNoise + detailNoise);
      
      // Швы между плитами
      float seamX = smoothstep(0.02, 0.05, tileFract.x) * smoothstep(0.02, 0.05, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.05, tileFract.y) * smoothstep(0.02, 0.05, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.015), tileColor, seam);
      
      // Трещины
      float crack = sharpNoise(p.xz * 25.0);
      if (crack > 0.9) {
        tileColor *= 0.5;
      }
      
      // Руны в швах (свечение)
      float runeGlow = (1.0 - seam) * step(0.75, tileId);
      float runePulse = 0.6 + 0.4 * sin(u_time * 2.0 + tileId * 6.28);
      
      color = tileColor * ambient * 1.8;
      color += tileColor * torchLight * 1.0;
      color += accentColor * runeGlow * 0.25 * runePulse;
      
      // Отблеск от портала
      float portalGlow = smoothstep(3.0, 0.0, length(p.xz - vec2(sign(p.x) * 22.0, 0.0)));
      color += vec3(1.0, 0.5, 0.2) * portalGlow * 0.15;
      
    } else if (mat == 69) {
      // === БРОНЗА ДЕКОРА ПОРТАЛА ===
      vec3 bronzeBase = vec3(0.5, 0.32, 0.15);
      vec3 bronzeHighlight = vec3(0.8, 0.6, 0.3);
      vec3 bronzePatina = vec3(0.18, 0.35, 0.28);
      
      // Кованая текстура
      float forged = sin(p.y * 25.0) * sin(p.x * 20.0 + p.z * 20.0) * 0.015;
      
      // Патина в углублениях
      float patinaMask = smoothstep(0.35, 0.65, noise(p.xz * 10.0));
      vec3 bronze = mix(bronzeBase, bronzePatina, patinaMask * 0.3);
      
      // Износ на углах
      float edgeWear = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      bronze = mix(bronze, bronzeHighlight, edgeWear * 0.2);
      
      // Металлический блеск
      float spec = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 60.0);
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      
      color = bronze * ambient * 2.2;
      color += bronze * torchLight * 1.5;
      color += bronzeHighlight * spec * 0.6;
      color += bronzeHighlight * fresnel * 0.25;
      
      // Отражение огня портала
      color += vec3(1.0, 0.5, 0.15) * 0.2;
      
    } else if (mat == 70) {
      // === СВЕЧЕНИЕ ПОРТАЛА (внешнее) ===
      vec3 glowCore = vec3(1.0, 0.6, 0.2);
      vec3 glowEdge = vec3(1.0, 0.3, 0.05);
      
      // Расстояние от центра портала
      float portalX = sign(p.x) * 22.0;
      vec3 toPortal = p - vec3(portalX, 2.8, 0.0);
      float dist = length(toPortal.yz);
      float normalizedDist = dist / 1.6;
      
      // Градиент от центра
      color = mix(glowCore, glowEdge, normalizedDist);
      
      // Вихревой эффект
      float swirl = sin(atan(toPortal.y, toPortal.z) * 6.0 - u_time * 4.0) * 0.5 + 0.5;
      color = mix(color, glowCore * 1.5, swirl * 0.3);
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 3.0);
      color *= pulse * 2.5;
      
      // Искры
      float spark = sin(u_time * 20.0 + p.y * 15.0 + p.z * 12.0);
      if (spark > 0.9) {
        color += vec3(1.0, 0.9, 0.7) * 2.0;
      }
      
    } else if (mat == 71) {
      // === КАМЕНЬ ПЛАТФОРМЫ ЗА ПОРТАЛОМ ===
      vec3 stoneBase = vec3(0.07, 0.065, 0.06);
      vec3 stoneDark = vec3(0.035, 0.032, 0.03);
      vec3 stoneLight = vec3(0.11, 0.1, 0.09);
      
      // Радиальные плиты
      float angle = atan(p.z, p.x);
      float dist = length(p.xz - vec2(sign(p.x) * BACK_PLATFORM_X, 0.0));
      
      // Концентрические кольца плит
      float ringId = floor(dist * 1.5);
      float ringFract = fract(dist * 1.5);
      
      // Секторы
      float sectorId = floor(angle * 4.0 / 3.14159);
      float sectorFract = fract(angle * 4.0 / 3.14159);
      
      float tileId = hash(vec2(ringId, sectorId));
      vec3 tileColor = mix(stoneDark, stoneBase, tileId * 0.5);
      
      // Текстура
      float stoneNoise = noise(p.xz * 5.0) * 0.25;
      tileColor = mix(tileColor, stoneLight, stoneNoise);
      
      // Швы (радиальные и концентрические)
      float seamRing = smoothstep(0.03, 0.08, ringFract) * smoothstep(0.03, 0.08, 1.0 - ringFract);
      float seamSector = smoothstep(0.02, 0.06, sectorFract) * smoothstep(0.02, 0.06, 1.0 - sectorFract);
      float seam = seamRing * seamSector;
      tileColor = mix(vec3(0.015), tileColor, seam);
      
      color = tileColor * ambient * 1.6;
      color += tileColor * torchLight * 0.9;
      
      // Свечение от портала
      float portalGlow = smoothstep(15.0, 5.0, dist);
      color += accentColor * portalGlow * 0.1;
      
    } else if (mat == 72) {
      // === БОРТИК/СТОЛБИКИ ПЛАТФОРМЫ ===
      vec3 stoneBase = vec3(0.09, 0.08, 0.07);
      vec3 stoneDark = vec3(0.04, 0.035, 0.03);
      vec3 stoneAccent = vec3(0.12, 0.1, 0.08);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 6.0) * 0.3 + noise(p.xz * 15.0) * 0.15;
      vec3 stoneColor = mix(stoneDark, stoneBase, stoneNoise);
      
      // Резной узор (вертикальные линии)
      float carving = sin(p.y * 20.0) * sin(atan(p.z, p.x) * 8.0);
      if (abs(carving) > 0.8) {
        stoneColor = mix(stoneColor, stoneAccent, 0.3);
      }
      
      color = stoneColor * ambient * 1.8;
      color += stoneColor * torchLight * 1.0;
      
      // Подсветка сверху
      color += accentColor * smoothstep(0.5, 0.7, p.y) * 0.08;
      
    } else if (mat == 73) {
      // === МАЛЕНЬКИЙ ОГОНЬ НА СТОЛБИКЕ ===
      vec3 fireCore = vec3(1.0, 0.9, 0.6);
      vec3 fireOuter = vec3(1.0, 0.4, 0.1);
      
      float flicker = 0.8 + 0.2 * sin(u_time * 15.0 + p.x * 8.0 + p.z * 8.0);
      
      color = mix(fireCore, fireOuter, 0.4);
      color *= flicker * 3.5;
      
    } else if (mat == 74) {
      // === СВЕТЯЩИЙСЯ СИМВОЛ НА ПЛАТФОРМЕ ===
      // Пульсирующее свечение в цвете эпохи
      float pulse = 0.6 + 0.4 * sin(u_time * 2.0);
      color = accentColor * pulse * 2.5;
      
      // Добавляем белый центр
      color += vec3(0.3, 0.3, 0.3) * pulse;
      
    } else if (mat == 75) {
      // === ГРАНИТ ОСНОВАНИЯ ФОНТАНА ===
      vec3 graniteBase = vec3(0.08, 0.075, 0.07);
      vec3 graniteDark = vec3(0.04, 0.038, 0.035);
      vec3 graniteLight = vec3(0.12, 0.11, 0.1);
      vec3 graniteSpeckle = vec3(0.15, 0.14, 0.13);
      
      // Многослойная текстура гранита
      float baseNoise = noise(p.xz * 4.0) * 0.4;
      float detailNoise = noise(p.xz * 12.0) * 0.2;
      float microNoise = noise(p.xz * 30.0) * 0.1;
      
      vec3 granite = mix(graniteDark, graniteBase, baseNoise);
      granite = mix(granite, graniteLight, detailNoise);
      
      // Крапинки (характерно для гранита)
      float speckle = sharpNoise(p.xz * 50.0);
      if (speckle > 0.85) {
        granite = mix(granite, graniteSpeckle, 0.4);
      }
      
      // Восьмиугольные грани (блики на рёбрах)
      float angle = atan(p.z, p.x);
      float edgeFactor = abs(cos(angle * 8.0));
      float edgeHighlight = smoothstep(0.9, 1.0, edgeFactor) * 0.1;
      granite += edgeHighlight;
      
      // Мокрые участки (около воды)
      float wetness = smoothstep(2.5, 1.5, length(p.xz)) * 0.15;
      granite *= 1.0 - wetness * 0.3;
      
      color = granite * ambient * 1.8;
      color += granite * torchLight * 0.9;
      
      // Отражение воды
      color += vec3(0.05, 0.08, 0.1) * wetness;
      
    } else if (mat == 76) {
      // === ВОДА СТРУИ ФОНТАНА ===
      vec3 waterCore = vec3(0.7, 0.85, 0.95);
      vec3 waterEdge = vec3(0.4, 0.6, 0.75);
      vec3 waterSparkle = vec3(1.0, 1.0, 1.0);
      
      // Прозрачная вода с бликами
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      
      // Анимация потока
      float flow = sin(p.y * 15.0 - u_time * 8.0) * 0.5 + 0.5;
      
      color = mix(waterCore, waterEdge, fresnel * 0.5);
      
      // Искрящиеся капли
      float sparkle = sin(p.y * 30.0 - u_time * 15.0 + p.x * 20.0 + p.z * 20.0);
      if (sparkle > 0.8) {
        color = mix(color, waterSparkle, (sparkle - 0.8) * 3.0);
      }
      
      // Яркость
      color *= 2.0;
      
      // Свечение в цвете эпохи
      color += accentColor * flow * 0.15;
      
    } else if (mat == 77) {
      // === ДНО БАССЕЙНА (мозаика) ===
      vec3 mosaicBlue = vec3(0.05, 0.15, 0.25);
      vec3 mosaicTeal = vec3(0.08, 0.2, 0.22);
      vec3 mosaicGold = vec3(0.4, 0.3, 0.1);
      vec3 mosaicWhite = vec3(0.2, 0.22, 0.25);
      
      // Мелкие плитки мозаики
      vec2 tileCoord = floor(p.xz * 4.0);
      vec2 tileFract = fract(p.xz * 4.0);
      float tileId = hash(tileCoord);
      
      // Выбор цвета плитки
      vec3 tileColor;
      if (tileId < 0.5) {
        tileColor = mix(mosaicBlue, mosaicTeal, fract(tileId * 4.0));
      } else if (tileId < 0.9) {
        tileColor = mosaicWhite;
      } else {
        tileColor = mosaicGold; // Редкие золотые плитки
      }
      
      // Швы между плитками
      float seamX = smoothstep(0.02, 0.05, tileFract.x) * smoothstep(0.02, 0.05, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.05, tileFract.y) * smoothstep(0.02, 0.05, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.02, 0.03, 0.04), tileColor, seam);
      
      // Узор в центре (круговой)
      float centerDist = length(p.xz);
      float centerPattern = sin(centerDist * 3.0) * sin(atan(p.z, p.x) * 8.0);
      if (abs(centerPattern) > 0.8 && centerDist < 2.0) {
        tileColor = mosaicGold;
      }
      
      // Подводное освещение
      color = tileColor * ambient * 1.2;
      
      // Каустики (световые узоры от воды)
      float caustic1 = sin(p.x * 8.0 + u_time * 2.0) * sin(p.z * 7.0 + u_time * 1.5);
      float caustic2 = sin(p.x * 6.0 - u_time * 1.8) * sin(p.z * 9.0 - u_time * 2.2);
      float caustics = (caustic1 + caustic2) * 0.5 + 0.5;
      color += vec3(0.1, 0.15, 0.2) * caustics * 0.3;
      
      // Свечение в цвете эпохи
      color += accentColor * 0.05;
      
    } else if (mat == 56) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 1 (основной цвет эпохи) ===
      float pulse = 0.8 + 0.2 * sin(u_time * 20.0);
      color = accentColor * 5.0 * pulse;
      // Ореол
      color += accentColor * 2.0;
      
    } else if (mat == 57) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 2 (оранжевый) ===
      vec3 fireOrange = vec3(1.0, 0.5, 0.0);
      float pulse = 0.8 + 0.2 * sin(u_time * 23.0 + 1.0);
      color = fireOrange * 5.0 * pulse;
      color += fireOrange * 2.0;
      
    } else if (mat == 58) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 3 (циан) ===
      vec3 fireCyan = vec3(0.0, 1.0, 0.8);
      float pulse = 0.8 + 0.2 * sin(u_time * 19.0 + 2.0);
      color = fireCyan * 5.0 * pulse;
      color += fireCyan * 2.0;
      
    } else if (mat == 59) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 4 (розовый) ===
      vec3 firePink = vec3(1.0, 0.2, 0.5);
      float pulse = 0.8 + 0.2 * sin(u_time * 17.0 + 3.0);
      color = firePink * 5.0 * pulse;
      color += firePink * 2.0;
      
    } else if (mat == 78) {
      // === ОРАНЖЕВЫЙ ШАР (как луна) ===
      float pulse = 0.85 + 0.15 * sin(u_time * 2.0);
      
      // Объёмное затемнение к краям (fresnel)
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      
      // Цвета как у луны
      vec3 orbCore = vec3(1.0, 0.7, 0.3) * 2.5;   // Яркий оранжевый центр
      vec3 orbRim = vec3(0.9, 0.35, 0.05) * 1.5;  // Тёмно-оранжевый край
      
      color = mix(orbCore, orbRim, fresnel) * pulse;
      
      // Текстура поверхности (пятна)
      float surfNoise = noise(p.xz * 8.0) * 0.2;
      color *= (0.9 + surfNoise);
      
      // Яркое свечение
      color += vec3(1.0, 0.5, 0.1) * 1.5;
      
    } else if (mat == 79) {
      // === СТЕБЕЛЬ РОЗЫ (зелёный) ===
      vec3 stemGreen = vec3(0.15, 0.4, 0.1);
      vec3 stemDark = vec3(0.08, 0.25, 0.05);
      
      // Текстура
      float stemNoise = noise(p.xy * 20.0) * 0.3;
      color = mix(stemDark, stemGreen, 0.5 + stemNoise);
      
      // Освещение
      color *= ambient * 1.5;
      color += stemGreen * mainLight * mainDot * 0.4;
      
    } else if (mat == 80) {
      // === ЯДРО ЭНЕРГЕТИЧЕСКОЙ СУЩНОСТИ ===
      float pulse = 0.7 + 0.3 * sin(u_time * 10.0);
      float pulse2 = 0.8 + 0.2 * sin(u_time * 15.0 + 1.5);
      
      // Градиент от белого ядра к золотому краю
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      vec3 coreWhite = vec3(1.0, 1.0, 0.95) * 4.0;
      vec3 coreGold = vec3(1.0, 0.7, 0.2) * 3.0;
      vec3 coreOrange = vec3(1.0, 0.4, 0.1) * 2.0;
      
      color = mix(coreWhite, coreGold, fresnel);
      color = mix(color, coreOrange, fresnel * fresnel);
      color *= pulse * pulse2;
      
      // Электрические разряды
      float spark = fract(sin(dot(p.xy + u_time * 20.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.92) {
        color += vec3(1.0, 1.0, 1.0) * 3.0;
      }
      
    } else if (mat == 81) {
      // === КОЛЬЦА ЭНЕРГИИ ===
      float pulse = 0.6 + 0.4 * sin(u_time * 8.0 + p.y * 5.0);
      
      // Переливающийся цвет
      float colorShift = sin(u_time * 3.0 + length(p) * 4.0) * 0.5 + 0.5;
      vec3 ringCyan = vec3(0.2, 0.9, 1.0);
      vec3 ringGold = vec3(1.0, 0.8, 0.3);
      vec3 ringMagenta = vec3(1.0, 0.3, 0.8);
      
      vec3 ringColor = mix(ringCyan, ringGold, colorShift);
      ringColor = mix(ringColor, ringMagenta, sin(u_time * 2.0) * 0.3 + 0.3);
      
      color = ringColor * pulse * 3.0;
      
      // Свечение
      color += ringColor * 1.5;
      
    } else {
      // === FALLBACK ===
      vec3 baseColor = vec3(0.2, 0.18, 0.15);
      color = baseColor * ambient * 2.0;
      color += baseColor * mainLight * mainDot * 0.5;
      color += baseColor * torchLight * 1.2;
      color += rimColor + specColor;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Мягкая атмосферная дымка (не скрывает, только добавляет цвет)
    float atmFade = smoothstep(70.0, MAX_DIST, d);
    vec3 atmColor = mix(fogColor, skyColor, 0.5);
    color = mix(color, atmColor, atmFade * 0.4);
    
    // Очень лёгкий туман
    float fog = 1.0 - exp(-d * 0.004);
    color = mix(color, fogColor * 1.2, fog * 0.1);
  }
  
  // Кислотный дождь от зелёного босса (всегда когда есть зоны)
  if (u_acidRainZoneCount > 0) {
    color = renderAcidRain(v_uv, color, u_time, u_cameraPos);
  }
  
  // Эффект дождя на волне 15+
  if (u_wave >= 15) {
    color = renderRain(v_uv, color, u_time);
  }
  
  // === АКЦЕНТНЫЕ ЦВЕТА ПО ЭПОХЕ ===
  vec3 volAccent;
  vec3 volSecondary;
  if (u_era == 1) {
    volAccent = vec3(0.3, 1.0, 0.4);
    volSecondary = vec3(0.0, 0.8, 0.6);
  } else if (u_era == 2) {
    volAccent = vec3(0.8, 0.2, 1.0);
    volSecondary = vec3(0.4, 0.0, 0.8);
  } else {
    volAccent = vec3(0.0, 0.9, 1.0);
    volSecondary = vec3(0.0, 0.5, 0.8);
  }
  
  vec2 screenPos = v_uv * 2.0 - 1.0;
  vec2 screenUV = gl_FragCoord.xy / u_resolution;
  
  // === GOD RAYS (упрощённые) ===
  vec2 moonScreenPos = vec2(0.35, 0.55);
  float rayDist = length(screenPos - moonScreenPos);
  float godRays = exp(-rayDist * 2.5) * 0.15 * smoothstep(0.8, 0.0, rayDist);
  color += vec3(0.8, 0.4, 0.1) * godRays;
  
  // === VOLUMETRIC (упрощённый) ===
  float depthFactor = 1.0 - smoothstep(0.0, 60.0, d);
  float beam = exp(-length(screenPos) * 3.0);
  color += volAccent * beam * depthFactor * 0.04;
  
  // === МИНИМАЛИСТИЧНЫЕ ЧАСТИЦЫ (оптимизировано) ===
  // Светлячки и пылинки убраны для производительности
  
  // Слой 5: Горизонтальные полосы света (сканлайны атмосферы)
  float scanY = fract(screenUV.y * 200.0 + u_time * 0.5);
  float scanLine = smoothstep(0.0, 0.02, scanY) * smoothstep(0.04, 0.02, scanY);
  color += volSecondary * scanLine * 0.015 * depthFactor;
  
  // === АТМОСФЕРНАЯ ДЫМКА С ГРАДИЕНТОМ ===
  float fogDist = d / MAX_DIST;
  
  // Верхняя дымка (небо просачивается)
  float skyHaze = smoothstep(0.3, 0.8, screenUV.y) * 0.1;
  color += vec3(0.05, 0.08, 0.15) * skyHaze;
  
  // Нижняя дымка (от пола)
  float groundHaze = smoothstep(0.5, 0.2, screenUV.y) * 0.08;
  color += volAccent * groundHaze * 0.3;
  
  // Дальняя дымка
  float hazeFade = smoothstep(0.5, 1.0, fogDist);
  vec3 hazeColor = mix(vec3(0.03, 0.04, 0.08), volSecondary * 0.2, 0.3);
  color = mix(color, hazeColor, hazeFade * 0.3);
  
  // === BLOOM (мягкое свечение ярких областей) ===
  float bloomLum = dot(color, vec3(0.299, 0.587, 0.114));
  if (bloomLum > 0.8) {
    float bloomAmt = (bloomLum - 0.8) * 0.4;
    vec3 bloomCol = color * (1.0 + bloomAmt);
    color = mix(color, bloomCol, 0.5);
  }
  
  // === ХРОМАТИЧЕСКАЯ АБЕРРАЦИЯ (лёгкая) ===
  float aberration = length(screenPos) * 0.003;
  color.r += hash(screenUV + 0.1) * aberration * 0.5;
  color.b -= hash(screenUV + 0.2) * aberration * 0.5;
  
  // === КАТАНА 3D ===
  // Определяем цвета освещения для катаны по эпохе
  vec3 katanaAmbient;
  vec3 katanaAccent;
  if (u_era == 1) {
    katanaAmbient = vec3(0.08, 0.12, 0.08);
    katanaAccent = vec3(0.4, 1.0, 0.2);
  } else if (u_era == 2) {
    katanaAmbient = vec3(0.07, 0.05, 0.12);
    katanaAccent = vec3(0.7, 0.15, 1.0);
  } else {
    katanaAmbient = vec3(0.08, 0.1, 0.14);
    katanaAccent = vec3(0.15, 0.7, 1.0);
  }
  
  // Рендерим катану (ro = позиция камеры) - только если включена
  if (u_katanaEnabled == 1) {
    vec4 katanaResult = renderKatana(u_cameraPos, rd, u_katanaAttack, u_katanaBob, u_katanaCharges, katanaAmbient, katanaAccent);
    if (katanaResult.w > 0.0) {
      // Катана попала - накладываем поверх сцены
      color = katanaResult.rgb;
    }
  }
  
  // === СОВРЕМЕННЫЙ AAA ПОСТ-ПРОЦЕСС ===
  
  // 1. EXPOSURE (экспозиция)
  color *= 1.3;
  
  // 2. ACES FILMIC TONEMAPPING (киношный вид)
  // Матрица преобразования в ACES
  mat3 aces_input = mat3(
    0.59719, 0.35458, 0.04823,
    0.07600, 0.90834, 0.01566,
    0.02840, 0.13383, 0.83777
  );
  mat3 aces_output = mat3(
    1.60475, -0.53108, -0.07367,
    -0.10208, 1.10813, -0.00605,
    -0.00327, -0.07276, 1.07602
  );
  color = aces_input * color;
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  color = a / b;
  color = aces_output * color;
  color = clamp(color, 0.0, 1.0);
  
  // 3. ГАММА КОРРЕКЦИЯ
  color = pow(color, vec3(0.9));
  
  // 4. ГЛУБОКИЙ COLOR GRADING (teal & orange киношный стиль)
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  
  // Тени → холодный циан/синий
  vec3 shadowTint = vec3(0.0, 0.12, 0.18);
  float shadowMask = 1.0 - smoothstep(0.0, 0.4, lum);
  color += shadowTint * shadowMask * 0.2;
  
  // Средние тона → слегка зеленоватый
  vec3 midTint = vec3(-0.02, 0.03, -0.02);
  float midMask = smoothstep(0.2, 0.5, lum) * smoothstep(0.8, 0.5, lum);
  color += midTint * midMask * 0.15;
  
  // Света → тёплый оранжевый
  vec3 highlightTint = vec3(0.12, 0.06, 0.0);
  float highlightMask = smoothstep(0.5, 1.0, lum);
  color += highlightTint * highlightMask * 0.15;
  
  // 5. НАСЫЩЕННОСТЬ (vibrance - больше на ненасыщенные цвета)
  float maxC = max(max(color.r, color.g), color.b);
  float minC = min(min(color.r, color.g), color.b);
  float saturation = (maxC - minC) / (maxC + 0.001);
  float vibranceAmt = 1.0 + (1.0 - saturation) * 0.25;
  vec3 grayCol = vec3(lum);
  color = mix(grayCol, color, vibranceAmt);
  
  // 6. МЯГКИЙ КОНТРАСТ (Cyberpunk стиль - серые тени)
  // Поднимаем чёрную точку - тени становятся серыми
  color = color * 0.85 + 0.08; // Чёрный → тёмно-серый
  // Лёгкий S-curve
  color = mix(color, color * color * (3.0 - 2.0 * color), 0.1);
  
  // === ПОСТЭФФЕКТЫ ПЕРЕНЕСЕНЫ В COMPOSITE PASS ===
  
  // Финальный clamp
  color = clamp(color, 0.0, 1.0);
  
  // Записываем цвет + нормализованную глубину в alpha для composite pass
  float normalizedDepth = clamp(d / MAX_DIST, 0.0, 1.0);
  fragColor = vec4(color, normalizedDepth);
}
`;

/** Composite shader - upscale + катана + постэффекты (второй проход) */
export const COMPOSITE_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_geometryTex;  // Текстура из geometry pass
uniform vec2 u_resolution;
uniform float u_time;

// Катана uniforms
uniform vec3 u_cameraPos;
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform float u_katanaAttack;
uniform float u_katanaBob;
uniform int u_katanaCharges;
uniform float u_katanaTargetAngle;
uniform float u_katanaTargetDist;
uniform int u_katanaAttackType;
uniform int u_katanaEnabled;
uniform int u_postfxEnabled;
uniform int u_era;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float filmGrain(vec2 uv, float time) {
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  return fract(sin(seed) * 43758.5453) - 0.5;
}

// === КАТАНА SDF ФУНКЦИИ (копия из основного шейдера) ===
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdKatanaBlade(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  float bladeLen = 2.0;
  float curve = sp.y * sp.y * 0.015;
  sp.z -= curve;
  float taper = 1.0 - smoothstep(0.0, bladeLen, sp.y) * 0.5;
  float width = 0.1 * taper;
  float thick = 0.02 * taper;
  vec2 q = abs(sp.xz) - vec2(width, thick);
  float d2d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float d = max(d2d, sp.y - bladeLen);
  d = max(d, -sp.y - 0.02);
  return d * scale;
}

float sdKatanaHandle(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  float handleLen = 0.8;
  vec3 hp = sp - vec3(0.0, -handleLen * 0.5, 0.0);
  vec2 sz = vec2(0.055, 0.04);
  float d = length(hp.xz / sz) - 1.0;
  d = max(d * min(sz.x, sz.y), abs(hp.y) - handleLen * 0.5);
  vec3 kashiraP = sp - vec3(0.0, -handleLen - 0.02, 0.0);
  float kashira = length(kashiraP / vec3(0.06, 0.03, 0.045)) - 1.0;
  kashira *= 0.03;
  d = min(d * scale, kashira * scale);
  return d;
}

float sdKatanaGuard(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  float radius = 0.18;
  float thick = 0.015;
  float d = length(sp.xz) - radius;
  d = max(d, abs(sp.y) - thick);
  float hole = length(sp.xz / vec2(0.13, 0.03)) - 1.0;
  d = max(d, -hole * 0.02);
  return d * scale;
}

float sdKatanaHabaki(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  vec3 hp = sp - vec3(0.0, -0.02, 0.0);
  float d = length(hp.xz / vec2(0.08, 0.035)) - 1.0;
  d = max(d * 0.03, abs(hp.y) - 0.05);
  return d * scale;
}

float sdKatanaSeppa(vec3 p, float yOffset) {
  float scale = 0.15;
  vec3 sp = p / scale;
  vec3 seppaP = sp - vec3(0.0, yOffset, 0.0);
  float d = length(seppaP.xz) - 0.1;
  d = max(d, abs(seppaP.y) - 0.008);
  return d * scale;
}

float sdKatana(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa1 = sdKatanaSeppa(p, 0.015);
  float seppa2 = sdKatanaSeppa(p, -0.015);
  float d = min(blade, handle);
  d = min(d, guard);
  d = min(d, habaki);
  d = min(d, seppa1);
  d = min(d, seppa2);
  return d;
}

int getKatanaMaterial(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa = min(sdKatanaSeppa(p, 0.015), sdKatanaSeppa(p, -0.015));
  float minD = blade;
  int mat = 0;
  if (handle < minD) { minD = handle; mat = 1; }
  if (guard < minD) { minD = guard; mat = 2; }
  if (habaki < minD || seppa < minD) { mat = 3; }
  return mat;
}

// Рендер катаны
vec4 renderKatana(vec3 ro, vec3 rd, float attack, float bob, int charges, vec3 ambient, vec3 accentColor) {
  float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
  
  vec3 camForward = vec3(sy * cp, sp, -cy * cp);
  vec3 camRight = vec3(cy, 0.0, sy);
  vec3 camUp = cross(camRight, camForward);
  
  vec3 localOffset = vec3(0.06, -0.1, 0.32);
  localOffset.x += sin(bob) * 0.003;
  localOffset.y += abs(sin(bob * 2.0)) * 0.002;
  
  float rotX = -1.5;
  float rotZ = 0.08;
  float rotY = 0.05;
  
  // Упреждающий замах
  if (u_katanaTargetAngle > -0.5 && attack < 0.1) {
    float targetInfluence = smoothstep(6.0, 3.0, u_katanaTargetDist);
    float angleOffset = clamp(u_katanaTargetAngle, -0.8, 0.8);
    float windUpAmount = smoothstep(5.0, 3.0, u_katanaTargetDist);
    
    if (angleOffset < 0.0) {
      rotX += windUpAmount * 0.7;
      rotZ += windUpAmount * 0.6;
      rotY += windUpAmount * 0.5;
      localOffset.y += windUpAmount * 0.12;
      localOffset.x += windUpAmount * 0.08;
    } else {
      rotX += windUpAmount * 0.8;
      rotZ -= windUpAmount * 0.7;
      rotY -= windUpAmount * 0.5;
      localOffset.y += windUpAmount * 0.14;
      localOffset.x -= windUpAmount * 0.1;
    }
    
    float tension = sin(u_time * 12.0) * 0.01 * targetInfluence;
    rotZ += tension;
    rotX += tension * 0.5;
  }
  
  // Анимация атаки
  if (attack > 0.0) {
    float t = attack;
    float windUp = smoothstep(0.0, 0.12, t);
    float strike = smoothstep(0.12, 0.38, t);
    float recover = smoothstep(0.42, 1.0, t);
    float strikeEase = 1.0 - pow(1.0 - strike, 5.0);
    float swingPower = strikeEase * (1.0 - recover);
    float windUpPower = windUp * (1.0 - strike);
    
    if (u_katanaAttackType == 0) {
      rotX += windUpPower * 1.1;
      rotZ += windUpPower * 0.6;
      rotY += windUpPower * 0.7;
      localOffset.y += windUpPower * 0.18;
      localOffset.x += windUpPower * 0.1;
      localOffset.z -= windUpPower * 0.05;
      rotX -= swingPower * 2.0;
      rotZ -= swingPower * 1.4;
      rotY -= swingPower * 0.3;
      localOffset.y -= swingPower * 0.14;
      localOffset.x -= swingPower * 0.12;
      localOffset.z += swingPower * 0.12;
    } else if (u_katanaAttackType == 1) {
      rotX += windUpPower * 1.2;
      rotZ -= windUpPower * 1.1;
      rotY -= windUpPower * 0.8;
      localOffset.y += windUpPower * 0.2;
      localOffset.x -= windUpPower * 0.15;
      localOffset.z -= windUpPower * 0.06;
      rotX -= swingPower * 2.0;
      rotZ += swingPower * 2.0;
      rotY += swingPower * 0.6;
      localOffset.y -= swingPower * 0.14;
      localOffset.x += swingPower * 0.16;
      localOffset.z += swingPower * 0.1;
    } else {
      rotZ += windUpPower * 0.7;
      rotY += windUpPower * 0.4;
      localOffset.x += windUpPower * 0.08;
      localOffset.z -= windUpPower * 0.03;
      rotZ -= swingPower * 2.6;
      rotX -= swingPower * 0.25;
      rotY -= swingPower * 0.3;
      localOffset.x -= swingPower * 0.2;
      localOffset.z += swingPower * 0.1;
    }
    
    if (t > 0.28 && t < 0.48) {
      float shake = sin(t * 180.0) * 0.005 * (1.0 - smoothstep(0.28, 0.48, t));
      localOffset.x += shake;
      localOffset.y += shake * 0.5;
    }
  }
  
  vec3 katanaWorldPos = ro + camRight * localOffset.x + camUp * localOffset.y + camForward * localOffset.z;
  
  float cx = cos(rotX), sx = sin(rotX);
  float cy2 = cos(rotY), sy2 = sin(rotY);
  float cz = cos(rotZ), sz = sin(rotZ);
  
  mat3 localRot = mat3(
    cz * cy2, -sz * cx + cz * sy2 * sx, sz * sx + cz * sy2 * cx,
    sz * cy2, cz * cx + sz * sy2 * sx, -cz * sx + sz * sy2 * cx,
    -sy2, cy2 * sx, cy2 * cx
  );
  
  mat3 camMat = mat3(camRight, camUp, camForward);
  mat3 rotMat = camMat * localRot;
  
  float t = 0.0;
  float maxDist = 1.0;
  
  for (int i = 0; i < 24; i++) {
    vec3 p = ro + rd * t;
    vec3 localP = transpose(rotMat) * (p - katanaWorldPos);
    float d = sdKatana(localP);
    
    if (d < 0.001) {
      vec3 hitP = localP;
      int mat = getKatanaMaterial(hitP);
      
      vec2 e = vec2(0.0005, 0.0);
      vec3 n = normalize(vec3(
        sdKatana(hitP + e.xyy) - sdKatana(hitP - e.xyy),
        sdKatana(hitP + e.yxy) - sdKatana(hitP - e.yxy),
        sdKatana(hitP + e.yyx) - sdKatana(hitP - e.yyx)
      ));
      n = rotMat * n;
      
      vec3 lightDir = normalize(vec3(0.2, 0.8, -0.5));
      vec3 viewLight = normalize(vec3(0.0, 0.0, -1.0));
      float diff = max(dot(n, lightDir), 0.0) * 0.5 + 0.3;
      diff += max(dot(n, viewLight), 0.0) * 0.3;
      float spec = pow(max(dot(reflect(rd, n), lightDir), 0.0), 64.0);
      float viewSpec = pow(max(dot(reflect(rd, n), viewLight), 0.0), 32.0);
      
      vec3 color;
      
      if (mat == 0) {
        vec3 steelColor = vec3(0.85, 0.88, 0.92);
        float hamonY = hitP.y * 0.15;
        float hamonLine = sin(hamonY * 80.0 + sin(hamonY * 30.0) * 2.0) * 0.003;
        float hamon = smoothstep(0.002, -0.002, hitP.z - hamonLine - 0.002);
        vec3 ji = vec3(0.6, 0.62, 0.65);
        vec3 yakiba = vec3(0.95, 0.97, 1.0);
        steelColor = mix(ji, yakiba, hamon);
        color = steelColor * diff * ambient * 4.0;
        color += vec3(1.0) * (spec + viewSpec) * 0.9;
        float edge = smoothstep(0.002, 0.0, abs(hitP.z) - 0.001);
        color += vec3(1.0, 0.98, 0.95) * edge * 0.4;
        color += accentColor * edge * 0.2;
        if (charges > 0) {
          float scale = 0.15;
          for (int j = 0; j < 3; j++) {
            if (j < charges) {
              float cy = (0.3 + float(j) * 0.25) * scale;
              float dist = abs(hitP.y - cy);
              float glow = smoothstep(0.03, 0.0, dist);
              color += accentColor * glow * 0.6;
            }
          }
        }
      } else if (mat == 1) {
        vec3 handleBase = vec3(0.02, 0.02, 0.02);
        vec3 itoColor = vec3(0.08, 0.05, 0.12);
        float scale = 0.15;
        float wrapY = hitP.y / scale;
        float wrapAngle = atan(hitP.z, hitP.x);
        float wrap = step(0.5, fract(wrapY * 12.0 + wrapAngle * 0.5));
        vec3 handleColor = mix(handleBase, itoColor, wrap);
        color = handleColor * diff * ambient * 3.0;
      } else if (mat == 2) {
        vec3 guardBase = vec3(0.15, 0.12, 0.08);
        color = guardBase * diff * ambient * 3.0;
        color += vec3(0.3, 0.25, 0.2) * spec * 0.5;
      } else {
        vec3 metalColor = vec3(0.5, 0.45, 0.35);
        color = metalColor * diff * ambient * 3.0;
        color += vec3(0.6, 0.55, 0.45) * (spec + viewSpec) * 0.6;
      }
      
      return vec4(color, 1.0);
    }
    
    t += d;
    if (t > maxDist) break;
  }
  
  return vec4(0.0);
}

void main() {
  // 1. Читаем geometry pass (автоматический bilinear upscale)
  vec4 geo = texture(u_geometryTex, v_uv);
  vec3 color = geo.rgb;
  float depth = geo.a;
  
  // 2. Рендерим катану (на полном разрешении)
  if (u_katanaEnabled == 1) {
    vec2 uv = (v_uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
    float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
    vec3 forward = vec3(sy * cp, sp, -cy * cp);
    vec3 right = vec3(cy, 0.0, sy);
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    
    vec3 katanaAmbient;
    vec3 katanaAccent;
    if (u_era == 1) {
      katanaAmbient = vec3(0.08, 0.12, 0.08);
      katanaAccent = vec3(0.4, 1.0, 0.2);
    } else if (u_era == 2) {
      katanaAmbient = vec3(0.07, 0.05, 0.12);
      katanaAccent = vec3(0.7, 0.15, 1.0);
    } else {
      katanaAmbient = vec3(0.08, 0.1, 0.14);
      katanaAccent = vec3(0.15, 0.7, 1.0);
    }
    
    vec4 katanaResult = renderKatana(u_cameraPos, rd, u_katanaAttack, u_katanaBob, u_katanaCharges, katanaAmbient, katanaAccent);
    if (katanaResult.w > 0.0) {
      color = katanaResult.rgb;
    }
  }
  
  // 3. ХОЛОДНЫЙ СЛЕД КАТАНЫ (серебристо-голубой)
  if (u_katanaAttack > 0.08 && u_katanaAttack < 0.65) {
    vec2 screenUV = v_uv;
    float swingProgress = smoothstep(0.08, 0.4, u_katanaAttack);
    float fadeOut = 1.0 - smoothstep(0.35, 0.65, u_katanaAttack);
    
    vec2 arcCenter;
    float arcStartAngle, arcEndAngle;
    
    if (u_katanaAttackType == 0) {
      arcCenter = vec2(0.75, 0.2);
      arcStartAngle = -0.8;
      arcEndAngle = 2.8;
    } else if (u_katanaAttackType == 1) {
      arcCenter = vec2(0.25, 0.2);
      arcStartAngle = 0.4;
      arcEndAngle = 4.0;
    } else {
      arcCenter = vec2(0.5, 0.45);
      arcStartAngle = -0.5;
      arcEndAngle = 3.6;
    }
    
    vec2 toPixel = screenUV - arcCenter;
    float dist = length(toPixel);
    float angle = atan(toPixel.y, toPixel.x);
    float currentAngle = mix(arcStartAngle, arcEndAngle, swingProgress);
    float angleDiff = abs(angle - currentAngle);
    if (angleDiff > 3.14159) angleDiff = 6.28318 - angleDiff;
    
    float arcRadius = 0.4;
    float radiusDiff = abs(dist - arcRadius);
    float trail = smoothstep(0.35, 0.0, angleDiff) * smoothstep(0.06, 0.01, radiusDiff);
    float tipGlow = smoothstep(0.15, 0.0, angleDiff) * smoothstep(0.04, 0.005, radiusDiff);
    
    vec3 steelBlue = vec3(0.7, 0.85, 1.0);
    vec3 sharpEdge = vec3(0.9, 0.95, 1.0);
    vec3 innerGlow = vec3(0.4, 0.6, 0.9);
    
    float trailFade = smoothstep(0.0, 0.3, angleDiff);
    vec3 trailColor = mix(sharpEdge, innerGlow, trailFade);
    
    float shimmer = 0.8 + 0.2 * sin(u_time * 30.0 + angle * 10.0);
    float intensity = (trail * 0.5 + tipGlow * 1.2) * fadeOut * shimmer;
    
    color += trailColor * intensity * 0.8;
    color = mix(color, sharpEdge, tipGlow * fadeOut * 0.6);
  }
  
  // 4. ПОСТЭФФЕКТЫ (опционально)
  if (u_postfxEnabled == 1) {
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    
    // BLOOM GLOW
    float bloomBright = max(max(color.r, color.g), color.b);
    if (bloomBright > 0.7) {
      float bloomStr = (bloomBright - 0.7) * 0.5;
      vec3 bloomCol = color * (1.0 + bloomStr);
      float bloomSpread = exp(-length(v_uv - 0.5) * 2.0);
      color = mix(color, bloomCol, bloomStr * bloomSpread);
    }
    
    // АНАМОРФНЫЕ БЛИКИ
    if (bloomBright > 0.75) {
      float streak = exp(-abs(v_uv.y - 0.5) * 6.0) * (bloomBright - 0.75) * 0.4;
      color += vec3(0.5, 0.7, 1.0) * streak;
    }
    
    // ХРОМАТИЧЕСКАЯ АБЕРРАЦИЯ (на краях)
    vec2 vigUV = v_uv - 0.5;
    float vigDist = length(vigUV);
    float aberr = vigDist * vigDist * 0.015;
    color.r += (hash(v_uv + 0.1) - 0.5) * aberr;
    color.b -= (hash(v_uv + 0.2) - 0.5) * aberr;
    
    // ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ
    float grain = filmGrain(v_uv * u_resolution, u_time * 60.0);
    float grainStr = mix(0.035, 0.01, lum);
    color += (grain - 0.5) * grainStr;
  }
  
  // 5. ВИНЬЕТКА (всегда)
  vec2 vigUV2 = v_uv - 0.5;
  float vigDist2 = length(vigUV2);
  float vig = 1.0 - vigDist2 * vigDist2 * 1.2;
  vig = smoothstep(0.0, 0.8, vig);
  color *= mix(0.7, 1.0, vig);
  
  // 6. DITHERING (устранение color banding)
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 128.0;
  color += dither;
  
  // Финальный clamp
  color = clamp(color, 0.0, 1.0);
  
  fragColor = vec4(color, 1.0);
}
`;
