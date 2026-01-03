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
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec4 u_targets[16];
uniform int u_targetCount;
uniform float u_muzzleFlash;

in vec2 v_uv;
out vec4 fragColor;

// === ОПТИМИЗИРОВАННЫЕ ПАРАМЕТРЫ ===
#define MAX_STEPS 20
#define MAX_DIST 40.0
#define SURF_DIST 0.03
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 28.0
#define DOME_HEIGHT 12.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
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

// === СЦЕНА ===
float map(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  
  // === ПОЛ ===
  float floor_d = p.y;
  d = min(d, floor_d);
  
  // === КРУГЛЫЕ СТЕНЫ (цилиндр вовнутрь) ===
  float walls = -(length(p.xz) - ARENA_RADIUS);
  d = min(d, walls);
  
  // === КУПОЛ ===
  // Сферический купол над ареной
  float domeRadius = ARENA_RADIUS * 1.3;
  float dome = -(length(vec3(p.x, p.y - 3.0, p.z)) - domeRadius);
  dome = max(dome, p.y - DOME_HEIGHT);
  d = min(d, dome);
  
  // === ЦЕНТРАЛЬНАЯ КОЛОННА (фонтан) ===
  float centerCol = sdCylinder(p - vec3(0.0, 1.5, 0.0), 1.2, 1.5);
  d = min(d, centerCol);
  
  // Чаша фонтана
  float fountain = sdTorus(p - vec3(0.0, 0.3, 0.0), vec2(1.8, 0.25));
  d = min(d, fountain);
  
  // === ЦЕНТРАЛЬНЫЙ БАССЕЙН ===
  float poolDist = distFromCenter;
  if (poolDist < POOL_RADIUS + 1.0 && poolDist > 2.5 && p.y < 0.5) {
    // Дно бассейна
    float poolBottom = p.y + POOL_DEPTH;
    
    // Бортик бассейна
    float rim = sdTorus(p - vec3(0.0, 0.15, 0.0), vec2(POOL_RADIUS, 0.3));
    d = min(d, rim);
    
    // Не пробиваем дно если внутри бассейна
    if (poolDist < POOL_RADIUS - 0.3) {
      d = min(d, poolBottom);
    }
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
  
  // === ПЛАТФОРМЫ С ЛЕСТНИЦАМИ ===
  // Левая платформа (X от -17 до -23)
  float leftPlat = sdBox(p - vec3(-20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                         vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, leftPlat);
  
  // Лестница к левой платформе (X от -16 до -17, Z в центре)
  float stairsL = sdBox(p - vec3(-16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  // Рампа вместо ступенек для простоты
  d = min(d, stairsL);
  
  // Правая платформа (X от 17 до 23)
  float rightPlat = sdBox(p - vec3(20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                          vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, rightPlat);
  
  // Лестница к правой платформе (X от 16 до 17)
  float stairsR = sdBox(p - vec3(16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  d = min(d, stairsR);
  
  // Перила платформ
  float railL = sdBox(p - vec3(-17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  float railR = sdBox(p - vec3(17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  d = min(d, min(railL, railR));
  
  // === КОЛОННЫ (только 2 у платформ) ===
  float colD = sdCylinder(p - vec3(22.0, 4.0, 0.0), 0.5, 4.0);
  colD = min(colD, sdCylinder(p - vec3(-22.0, 4.0, 0.0), 0.5, 4.0));
  d = min(d, colD);
  
  // === ВОДА ===
  // Центральный бассейн (только визуально, не пройти - коллизия блокирует)
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.0 + waterWaves(p.xz, u_time) * 0.05;
      float waterPlane = p.y - waterY;
      if (waterPlane < d && waterPlane > -0.3) {
        d = max(waterPlane, 0.001);
        materialId = 1;
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.4 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterPlane = p.y - waterY;
    if (waterPlane < d && waterPlane > -0.1) {
      d = max(waterPlane, 0.001);
      materialId = 1;
    }
  }
  
  // === ВРАГИ ===
  // w: 0=неактивен, 1-2=бейнлинг, 3-4=фантом, 5-6=runner, 7-8=hopper
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 16) break;
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 tp = p - target.xyz;
      int enemyType = int(target.w / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper
      
      float targetD;
      int matId;
      
      if (enemyType == 1) {
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
        // Вытянутая форма для ощущения скорости
        vec3 stretched = tp;
        stretched.x *= 0.6; // Сжимаем по X
        float radius = 0.35;
        targetD = sdSphere(stretched, radius);
        
        // "Следы" скорости
        float speedTrail = sdSphere(tp + vec3(0.3, 0.0, 0.0), 0.2);
        speedTrail = min(speedTrail, sdSphere(tp + vec3(0.5, 0.0, 0.0), 0.12));
        targetD = min(targetD, speedTrail);
        matId = 6;
        
      } else if (enemyType == 3) {
        // === HOPPER (синий, пружинистый) ===
        // Основное тело
        float squeeze = 1.0 + sin(u_time * 12.0) * 0.15; // Пульсация
        vec3 squashed = tp;
        squashed.y *= squeeze;
        float radius = 0.45;
        targetD = sdSphere(squashed, radius);
        
        // "Уши" или антенны
        vec3 ear1 = tp - vec3(0.2, 0.4, 0.0);
        vec3 ear2 = tp - vec3(-0.2, 0.4, 0.0);
        float ears = min(sdSphere(ear1, 0.12), sdSphere(ear2, 0.12));
        targetD = min(targetD, ears);
        matId = 7;
        
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
  
  return d;
}

// === RAY MARCHING ===
float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    d += dist * 0.9; // Небольшой overrelaxation для скорости
    if (dist < SURF_DIST || d > MAX_DIST) break;
  }
  return d;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.02, 0.0); // Грубее но быстрее
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// === КАУСТИКИ ===
float caustics(vec2 p, float t) {
  float c = 0.0;
  for (float i = 1.0; i <= 3.0; i++) {
    vec2 uv = p * (1.0 + i * 0.3);
    uv += vec2(sin(t * 0.3 + i), cos(t * 0.4 + i * 1.1)) * 0.5;
    c += pow(0.5 + 0.5 * sin(noise(uv) * 6.0), 4.0);
  }
  return c / 3.0;
}

// === ЗВЁЗДНОЕ НЕБО (через купол) ===
vec3 renderSky(vec3 rd) {
  vec3 color = vec3(0.02, 0.03, 0.08);
  
  // Звёзды
  vec2 skyUV = rd.xz / (rd.y + 0.5);
  for (float i = 0.0; i < 50.0; i++) {
    vec2 starPos = vec2(hash(vec2(i, 0.0)), hash(vec2(i, 1.0))) * 4.0 - 2.0;
    float star = 0.002 / (length(skyUV - starPos) + 0.002);
    star *= step(0.7, hash(vec2(i, 2.0)));
    color += vec3(1.0, 0.95, 0.9) * star * 0.3;
  }
  
  // Луна
  vec3 moonDir = normalize(vec3(0.5, 0.8, -0.3));
  float moon = smoothstep(0.98, 0.99, dot(rd, moonDir));
  color += vec3(1.0, 0.98, 0.95) * moon * 2.0;
  
  // Свечение вокруг луны
  float moonGlow = pow(max(0.0, dot(rd, moonDir)), 32.0);
  color += vec3(0.3, 0.35, 0.5) * moonGlow * 0.5;
  
  return color;
}

// === ГЛАВНАЯ ===
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
  
  float d = rayMarch(ro, rd);
  
  // Фоновый цвет (небо через купол)
  vec3 color = renderSky(rd) * 0.3;
  
  if (d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = getNormal(p);
    
    map(p);
    int mat = materialId;
    
    // === ПРОСТОЕ ОСВЕЩЕНИЕ (оптимизация) ===
    vec3 ambient = vec3(0.12, 0.13, 0.16);
    
    // Лунный свет сверху
    vec3 moonLight = vec3(0.4, 0.45, 0.55);
    float moonDot = max(dot(n, vec3(0.3, 0.9, -0.2)), 0.0);
    
    // Один тёплый источник (факел)
    vec3 torchPos = vec3(0.0, 8.0, 0.0);
    vec3 toTorch = torchPos - p;
    float torchDist = length(toTorch);
    float atten = 25.0 / (1.0 + torchDist * 0.05 + torchDist * torchDist * 0.008);
    vec3 torchLight = vec3(1.0, 0.8, 0.5) * max(dot(n, normalize(toTorch)), 0.0) * atten;
    
    // Подсветка бассейна (простая)
    float distFromCenter = length(p.xz);
    float poolInfluence = 1.0 - smoothstep(0.0, 15.0, distFromCenter);
    vec3 poolLight = vec3(0.2, 0.6, 0.8) * poolInfluence * 2.0;
    
    // === МАТЕРИАЛЫ (упрощённые) ===
    if (mat == 1) {
      // === ВОДА (простая) ===
      vec3 waterColor = vec3(0.2, 0.55, 0.7);
      waterColor += poolLight;
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(waterColor, vec3(0.5, 0.8, 0.9), fresnel * 0.3);
      
    } else if (mat == 4) {
      // === БЕЙНЛИНГИ (зелёная кислотная жижа) ===
      vec3 acidGreen = vec3(0.2, 0.9, 0.1);
      vec3 darkGreen = vec3(0.0, 0.4, 0.0);
      
      float pulse = 0.7 + 0.3 * sin(u_time * 4.0 + p.x * 2.0);
      float pulse2 = 0.8 + 0.2 * sin(u_time * 6.0 + p.z * 3.0);
      float glow = 0.5 + 0.5 * sin(u_time * 3.0);
      
      color = mix(darkGreen, acidGreen, pulse * pulse2);
      color += vec3(0.3, 1.0, 0.2) * glow * 0.5;
      color *= 1.5;
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color = mix(color, vec3(0.5, 1.0, 0.3), fresnel * 0.4);
      
    } else if (mat == 5) {
      // === ФАНТОМ (чёрный шар с тёмной энергией) ===
      vec3 voidBlack = vec3(0.02, 0.02, 0.05);
      vec3 darkPurple = vec3(0.1, 0.0, 0.15);
      
      float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + p.x * 5.0);
      float flicker2 = 0.7 + 0.3 * sin(u_time * 15.0 + p.z * 4.0);
      
      color = mix(voidBlack, darkPurple, flicker * flicker2 * 0.3);
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      vec3 edgeGlow = vec3(0.3, 0.0, 0.5) * fresnel * 0.8;
      color += edgeGlow;
      
      float spark = sin(u_time * 20.0 + p.y * 10.0) * sin(u_time * 18.0 + p.x * 8.0);
      if (spark > 0.9) {
        color += vec3(0.5, 0.2, 0.8) * 0.5;
      }
      color *= 0.6;
      
    } else if (mat == 6) {
      // === RUNNER (оранжевый, огненный) ===
      vec3 orange = vec3(1.0, 0.5, 0.0);
      vec3 yellow = vec3(1.0, 0.9, 0.2);
      vec3 red = vec3(1.0, 0.2, 0.0);
      
      // Быстрое мерцание как пламя
      float flame = 0.5 + 0.5 * sin(u_time * 20.0 + p.x * 8.0);
      float flame2 = 0.6 + 0.4 * sin(u_time * 25.0 + p.z * 10.0);
      
      color = mix(red, orange, flame);
      color = mix(color, yellow, flame2 * 0.4);
      color *= 1.8; // Яркий!
      
      // Свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(1.0, 0.8, 0.3) * fresnel * 0.6;
      
    } else if (mat == 7) {
      // === HOPPER (синий, электрический) ===
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      vec3 blue = vec3(0.1, 0.3, 1.0);
      vec3 white = vec3(0.9, 0.95, 1.0);
      
      // Электрические разряды
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
      
    } else {
      // === ПОЛ / СТЕНЫ ===
      vec3 baseColor = vec3(0.15, 0.14, 0.12);
      
      // Простая плитка
      if (abs(n.y) > 0.9) {
        vec2 tile = fract(p.xz * 0.25);
        float tileEdge = step(0.04, min(min(tile.x, tile.y), min(1.0 - tile.x, 1.0 - tile.y)));
        baseColor *= 0.8 + 0.2 * tileEdge;
      }
      
      color = baseColor * ambient * 2.0;
      color += baseColor * moonLight * moonDot * 0.5;
      color += baseColor * torchLight * 1.2;
      color += baseColor * poolLight * 1.0;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Туман
    float fog = 1.0 - exp(-d * 0.02);
    color = mix(color, vec3(0.02, 0.03, 0.06), fog * 0.5);
  }
  
  // Тонмаппинг
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(0.9));
  
  // Цветокоррекция - добавляем голубой оттенок для ночной атмосферы
  color = mix(color, color * vec3(0.9, 0.95, 1.1), 0.25);
  
  // Небольшое насыщение
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, 1.15);
  
  // Виньетка
  float vig = 1.0 - length(v_uv - 0.5) * 0.4;
  color *= vig;
  
  fragColor = vec4(color, 1.0);
}
`;
