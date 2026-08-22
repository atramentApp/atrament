// Advanced Main Game for Atrament

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'menu'; // menu | playing | gameover
let player;
let inkSystem;
let enemies = [];
let depth = 1;
let gameTime = 0;

// Joystick state
let joystick = {
  active: false,
  dx: 0,
  dy: 0,
  baseX: 0,
  baseY: 0,
  knob: document.getElementById('joystick-knob')
};

// Resize
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Initialize
function initGame() {
  player = new Player(120, canvas.height - 200);
  inkSystem = new InkSystem();
  enemies = [];
  depth = 1;
  gameTime = 0;
  document.getElementById('depth').textContent = `Depth ${depth}`;
}

// ===== Game Loop =====
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  drawBackground();

  if (gameState === 'playing') {
    gameTime++;

    // Update systems
    const platforms = inkSystem.getPlatforms();
    player.update(platforms);
    inkSystem.update(enemies);

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update(player, canvas.height);

      // Collision with player → Game Over
      if (e.hits(player)) {
        gameOver();
      }
    }

    // Draw everything
    inkSystem.draw(ctx);
    player.draw(ctx);

    for (let e of enemies) {
      e.draw(ctx);
    }

    // Update UI
    const inkFill = document.getElementById('ink-fill');
    if (inkFill) {
      inkFill.style.width = inkSystem.getInkPercentage() + '%';
    }

    // Depth increases over time
    if (gameTime % 900 === 0) {
      depth++;
      document.getElementById('depth').textContent = `Depth ${depth}`;
    }

    // Joystick movement
    if (joystick.active) {
      player.velocityX = joystick.dx * player.speed;
    }
  }

  requestAnimationFrame(gameLoop);
}

function drawBackground() {
  // Parchment-like gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#2c241c');
  gradient.addColorStop(1, '#1f1812');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper texture lines
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 28) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
}

function gameOver() {
  gameState = 'gameover';
  document.getElementById('final-depth').textContent = `Depth reached: ${depth}`;
  document.getElementById('gameover').classList.remove('hidden');
}

// ===== Buttons =====
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

// ===== Keyboard =====
window.addEventListener('keydown', (e) => {
  if (gameState !== 'playing' || !player) return;

  if (e.key === 'ArrowLeft' || e.key === 'a') player.velocityX = -player.speed;
  if (e.key === 'ArrowRight' || e.key === 'd') player.velocityX = player.speed;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') player.jump();
});

window.addEventListener('keyup', (e) => {
  if (!player) return;
  if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
    player.velocityX = 0;
  }
});

// ===== Drawing (Mouse) =====
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
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

// ===== Touch Drawing =====
canvas.addEventListener('touchstart', (e) => {
  // Jangan gambar kalau sentuh di area joystick / jump
  if (e.target.closest('#mobile-controls')) return;
  e.preventDefault();
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.startStroke(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (e.target.closest('#mobile-controls')) return;
  e.preventDefault();
  if (gameState !== 'playing' || !inkSystem) return;
  const pos = getPos(e);
  inkSystem.addPoint(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchend', () => {
  if (inkSystem) inkSystem.endStroke();
});

// ===== Virtual Joystick =====
const joystickZone = document.getElementById('joystick-zone');
const jumpBtn = document.getElementById('jump-btn');

function handleJoystickStart(e) {
  e.preventDefault();
  joystick.active = true;
  const touch = e.touches ? e.touches[0] : e;
  const rect = joystickZone.getBoundingClientRect();
  joystick.baseX = rect.left + rect.width / 2;
  joystick.baseY = rect.top + rect.height / 2;
}

function handleJoystickMove(e) {
  if (!joystick.active) return;
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  let dx = touch.clientX - joystick.baseX;
  let dy = touch.clientY - joystick.baseY;

  const maxDist = 38;
  const dist = Math.hypot(dx, dy);
  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }

  joystick.dx = dx / maxDist;
  joystick.dy = dy / maxDist;

  // Gerakkan knob
  joystick.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function handleJoystickEnd() {
  joystick.active = false;
  joystick.dx = 0;
  joystick.dy = 0;
  joystick.knob.style.transform = 'translate(-50%, -50%)';
  if (player) player.velocityX = 0;
}

joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
joystickZone.addEventListener('touchmove', handleJoystickMove, { passive: false });
joystickZone.addEventListener('touchend', handleJoystickEnd);
joystickZone.addEventListener('touchcancel', handleJoystickEnd);

// Jump button
jumpBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'playing' && player) player.jump();
}, { passive: false });

// Start loop
gameLoop();
