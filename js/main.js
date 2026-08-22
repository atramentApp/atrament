// Main game file for Atrament

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'menu'; // menu | playing | gameover
let player;
let inkSystem;
let enemies = [];

// Resize canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Initialize game
function initGame() {
  player = new Player(100, canvas.height - 150);
  inkSystem = new InkSystem();
  enemies = [];
}

// Game Loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'playing') {
    // Update
    player.update(canvas);
    inkSystem.update();

    for (let enemy of enemies) {
      enemy.update(player);
    }

    // Draw
    inkSystem.draw(ctx);
    player.draw(ctx);

    for (let enemy of enemies) {
      enemy.draw(ctx);
    }

    // Update ink meter UI
    const inkBar = document.getElementById('ink-bar');
    if (inkBar) {
      inkBar.style.width = inkSystem.getInkPercentage() + '%';
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

// Button events
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('menu').classList.add('hidden');
  gameState = 'playing';
  initGame();
});

document.getElementById('retry-btn').addEventListener('click', () => {
  document.getElementById('gameover').classList.add('hidden');
  gameState = 'playing';
  initGame();
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (gameState !== 'playing' || !player) return;

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.velocityX = -player.speed;
  }
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.velocityX = player.speed;
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
    player.jump();
  }
});

window.addEventListener('keyup', (e) => {
  if (!player) return;
  if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
    player.velocityX = 0;
  }
});

// Mouse & Touch drawing
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.startStroke(pos.x, pos.y);
});

canvas.addEventListener('mousemove', (e) => {
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.addPoint(pos.x, pos.y);
});

canvas.addEventListener('mouseup', () => {
  if (inkSystem) inkSystem.endStroke();
});

canvas.addEventListener('mouseleave', () => {
  if (inkSystem) inkSystem.endStroke();
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.startStroke(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.addPoint(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchend', () => {
  if (inkSystem) inkSystem.endStroke();
});
