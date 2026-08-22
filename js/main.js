// Atrament - Main Game (Visual + Juice + Sound)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'menu';
let player;
let inkSystem;
let enemies = [];
let depth = 1;
let bestDepth = parseInt(localStorage.getItem('atrament_best') || '1');
let gameTime = 0;
let safeTime = 220;
let tutorialTimer = 0;

// Screen shake
let shakeTime = 0;
let shakeIntensity = 0;

// Audio Context
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'jump') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  if (type === 'absorb') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  if (type === 'draw') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  if (type === 'death') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.41);
  }

  if (type === 'land') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}

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

document.getElementById('best-depth').textContent = `Best: ${bestDepth}`;

function initGame() {
  player = new Player(140, canvas.height - 230);
  inkSystem = new InkSystem();
  enemies = [];
  depth = 1;
  gameTime = 0;
  safeTime = 220;
  tutorialTimer = 380;
  shakeTime = 0;

  createStartingGround();
  document.getElementById('depth').textContent = `Depth ${depth}`;
  document.getElementById('tutorial').classList.remove('hidden');
}

function createStartingGround() {
  const groundY = canvas.height - 65;

  inkSystem.platforms.push({
    x: -50,
    y: groundY,
    width: canvas.width + 100,
    height: 50,
    age: 0,
    maxAge: 999999,
    isAlive: false
  });

  inkSystem.platforms.push({
    x: 90,
    y: canvas.height - 170,
    width: 150,
    height: 18,
    age: 0,
    maxAge: 999999,
    isAlive: false
  });
}

function triggerShake(intensity = 6, duration = 12) {
  shakeIntensity = intensity;
  shakeTime = duration;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Screen shake
  ctx.save();
  if (shakeTime > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeTime--;
  }

  drawBackground();

  if (gameState === 'playing') {
    gameTime++;
    if (safeTime > 0) safeTime--;

    if (tutorialTimer > 0) {
      tutorialTimer--;
      if (tutorialTimer <= 0) {
        document.getElementById('tutorial').classList.add('hidden');
      }
    }

    const platforms = inkSystem.getPlatforms();
    const wasOnGround = player.onGround;

    player.update(platforms);
    inkSystem.update(enemies);

    // Land sound
    if (!wasOnGround && player.onGround) {
      playSound('land');
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update(player, canvas.height);
      if (safeTime <= 0 && e.hits(player)) {
        playSound('death');
        triggerShake(10, 18);
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

    if (gameTime > 0 && gameTime % 1000 === 0) {
      depth++;
      document.getElementById('depth').textContent = `Depth ${depth}`;
    }

    if (joystick.active) {
      player.velocityX = joystick.dx * player.speed;
    }
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#3a2f24');
  g.addColorStop(0.5, '#2e251c');
  g.addColorStop(1, '#241c15');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(90, 70, 50, 0.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 24) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
}

function gameOver() {
  gameState = 'gameover';

  let isNewBest = false;
  if (depth > bestDepth) {
    bestDepth = depth;
    localStorage.setItem('atrament_best', bestDepth);
    isNewBest = true;
    document.getElementById('best-depth').textContent = `Best: ${bestDepth}`;
  }

  document.getElementById('final-depth').textContent = `Depth reached: ${depth}`;
  const newBestEl = document.getElementById('new-best');
  if (isNewBest) newBestEl.classList.remove('hidden');
  else newBestEl.classList.add('hidden');

  document.getElementById('gameover').classList.remove('hidden');
  document.getElementById('tutorial').classList.add('hidden');
}

// Buttons
document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  document.getElementById('menu').classList.add('hidden');
  gameState = 'playing';
  initGame();
});

document.getElementById('retry-btn').addEventListener('click', () => {
  initAudio();
  document.getElementById('gameover').classList.add('hidden');
  gameState = 'playing';
  initGame();
});

// Keyboard
window.addEventListener('keydown', (e) => {
  if (gameState !== 'playing' || !player) return;

  if (e.key === 'ArrowLeft' || e.key === 'a') player.velocityX = -player.speed;
  if (e.key === 'ArrowRight' || e.key === 'd') player.velocityX = player.speed;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
    player.jump();
    playSound('jump');
  }
  if (e.key === 'e' || e.key === 'E') {
    if (inkSystem.absorb(player)) playSound('absorb');
  }
});

window.addEventListener('keyup', (e) => {
  if (!player) return;
  if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
    player.velocityX = 0;
  }
});

// Drawing helpers
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
  initAudio();
  const pos = getPos(e);
  inkSystem.startStroke(pos.x, pos.y);
  playSound('draw');
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

// Touch drawing
canvas.addEventListener('touchstart', (e) => {
  if (e.target.closest('#mobile-controls')) return;
  e.preventDefault();
  if (gameState !== 'playing' || !inkSystem) return;
  initAudio();
  const pos = getPos(e);
  inkSystem.startStroke(pos.x, pos.y);
  playSound('draw');
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
  const maxDist = 36;
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

// Jump & Absorb
document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'playing' && player) {
    player.jump();
    playSound('jump');
  }
}, { passive: false });

document.getElementById('absorb-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'playing' && inkSystem && player) {
    if (inkSystem.absorb(player)) playSound('absorb');
  }
}, { passive: false });

// Start
gameLoop();
