// Advanced Main + Absorb + Better Controls for Atrament

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'menu';
let player;
let inkSystem;
let enemies = [];
let depth = 1;
let gameTime = 0;
let safeTime = 180; // 3 detik aman di awal

// Joystick
let joystick = {
  active: false,
  dx: 0,
  dy: 0,
  baseX: 0,
  baseY: 0,
  knob: document.getElementById('joystick-knob')
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function initGame() {
  player = new Player(140, canvas.height - 220);
  inkSystem = new InkSystem();
  enemies = [];
  depth = 1;
  gameTime = 0;
  safeTime = 180;

  // Buat ground awal yang solid
  createStartingGround();

  document.getElementById('depth').textContent = `Depth ${depth}`;
}

function createStartingGround() {
  // Platform tanah di bawah
  const groundY = canvas.height - 70;
  inkSystem.platforms.push({
    x: 0,
    y: groundY,
    width: canvas.width,
    height: 40,
    age: 0,
    maxAge: 99999,
    isAlive: false
  });

  // Platform kecil di depan player
  inkSystem.platforms.push({
    x: 100,
    y: canvas.height - 160,
    width: 140,
    height: 18,
    age: 0,
    maxAge: 99999,
    isAlive: false
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (gameState === 'playing') {
    gameTime++;
    if (safeTime > 0) safeTime--;

    const platforms = inkSystem.getPlatforms();
    player.update(platforms);
    inkSystem.update(enemies);

    // Update enemies (hanya setelah safe time habis)
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update(player, canvas.height);

      if (safeTime <= 0 && e.hits(player)) {
        gameOver();
      }
    }

    // Draw
    inkSystem.draw(ctx);
    player.draw(ctx);
    for (let e of enemies) e.draw(ctx);

    // UI
    const inkFill = document.getElementById('ink-fill');
    if (inkFill) inkFill.style.width = inkSystem.getInkPercentage() + '%';

    // Depth
    if (gameTime % 1000 === 0) {
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
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#2c241c');
  g.addColorStop(1, '#1a140f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paper lines
  ctx.strokeStyle = 'rgba(70, 50, 35, 0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 26) {
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

// Buttons
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

// Keyboard
window.addEventListener('keydown', (e) => {
  if (gameState !== 'playing' || !player) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') player.velocityX = -player.speed;
  if (e.key === 'ArrowRight' || e.key === 'd') player.velocityX = player.speed;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') player.jump();
  if (e.key === 'e' || e.key === 'E') inkSystem.absorb(player); // Serap tinta
});

window.addEventListener('keyup', (e) => {
  if (!player) return;
  if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
    player.velocityX = 0;
  }
});

// Mouse drawing
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

// Touch drawing (hindari area kontrol)
canvas.addEventListener('touchstart', (e) => {
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

// Joystick
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

// Jump
jumpBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'playing' && player) player.jump();
}, { passive: false });

// Double tap untuk Absorb di HP (sementara)
let lastTap = 0;
canvas.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 300 && gameState === 'playing' && inkSystem) {
    inkSystem.absorb(player);
  }
  lastTap = now;
});

gameLoop();
