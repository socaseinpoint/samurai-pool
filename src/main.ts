import { Game } from '@/core/Game';
import './styles.css';

/**
 * Точка входа приложения
 * Dungeon Synth Shooter
 */
function main(): void {
  // FPS на экране — только по ?fps=1 (отладка), игроку не показываем
  if (new URLSearchParams(location.search).get('fps') === '1') {
    document.body.classList.add('show-fps');
  }

  // Получаем canvas элементы
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const weaponCanvas = document.getElementById('weapon-canvas') as HTMLCanvasElement;

  if (!canvas || !weaponCanvas) {
    console.error('Canvas элементы не найдены!');
    return;
  }

  // Создаём игру
  const game = new Game(canvas, weaponCanvas);

  // Делаем доступной глобально для отладки
  (window as any).game = game;

  console.log('🎮 Dungeon Synth Shooter загружен');
  console.log('📖 Управление: WASD, SHIFT (бег), SPACE (прыжок), LMB (стрельба), R (перезарядка)');
  console.log('🔊 M - mute, F - fullscreen');
}

// Запускаем после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}









