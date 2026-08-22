// Atrament - Main Game (Progression + Polish + Death Effect)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'menu';
let player;
let inkSystem;
let enemies = [];
let depth = 1;
let chapter = 1;
let bestDepth = parseInt(localStorage.getItem('atrament_best') || '1');
let gameTime = 0;
let safeTime = 220;
let tutorialTimer = 0;

// Screen shake & death effect
let shakeTime = 0;
let shakeIntensity = 0;
let deathFlash = 0;
let deathParticles = [];

// Audio
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
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.55);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.start(now);
    osc.stop(now + 0.56);
  }
  if (type === 'land') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  }
  if (type === 'chapter') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.31);
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
  chapter = 1;
  gameTime = 0;
  safeTime = 220;
  tutorialTimer = 380;
  shakeTime = 0;
  deathFlash = 0;
  deathParticles = [];

  createStartingGround();
  document.getElementById('depth').textContent = `Depth ${depth}`;
  document.getElementById('chapter').textContent = `Chapter ${chapter}`;
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

function spawnDeathParticles(x, y) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    deathParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 40 + Math.random() * 30,
      maxLife: 70,
      size: 2 + Math.random() * 3
    });
  }
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

    if (!wasOnGround && player.onGround) {
      playSound('land');
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update(player, canvas.height);
      if (safeTime <= 0 && e.hits(player)) {
        playSound('death');
        triggerShake(14, 22);
        deathFlash = 18;
        spawnDeathParticles(player.x + player.width / 2, player.y + player.height / 2);
        gameOver();
      }
    }

    // Draw world
    inkSystem.draw(ctx);
    player.draw(ctx);
    for (let e of enemies) e.draw(ctx);

    // Death particles
    for (let i = deathParticles.length - 1; i >= 0; i--) {
      const p = deathParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(20, 15, 10, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) deathParticles.splice(i, 1);
    }

    // Death flash
    if (deathFlash > 0) {
      ctx.fillStyle = `rgba(180, 40, 30, ${deathFlash / 25})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      deathFlash--;
    }

    // UI
    const inkFill = document.getElementById('ink-fill');
    if (inkFill) inkFill.style.width = inkSystem.getInkPercentage() + '%';

    // Progression: Depth & Chapter
    if (gameTime > 0 && gameTime % 1000 === 0) {
      depth++;
      document.getElementById('depth').textContent = `Depth ${depth}`;

      // Every 5 Depth = new Chapter
      if (depth % 5 === 1 && depth > 1) {
        chapter = Math.floor((depth - 1) / 5) + 1;
        document.getElementById('chapter').textContent = `Chapter ${chapter}`;
        playSound('chapter');
        triggerShake(5, 10);
      }
    }

    if (joystick.active) {
      player.velocityX = joystick.dx * player.speed;
    }
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

function drawBackground() {
  // Richer parchment atmosphere
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#3e3228');
  g.addColorStop(0.4, '#32281f');
  g.addColorStop(1, '#261e16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain
  ctx.strokeStyle = 'rgba(95, 75, 55, 0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 22) {
    ctx.beginPath();
    ctx.moveTo(0, i + Math.sin(i * 0.05) * 1.5);
    ctx.lineTo(canvas.width, i + Math.sin(i * 0.05) * 1.5);
    ctx.stroke();
  }

  // Soft ink stains in background
  ctx.fillStyle = 'rgba(10, 8, 6, 0.04)';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.15, canvas.height * 0.3, 90, 0, Math.PI * 2);
  ctx.arc(canvas.width * 0.8, canvas.height * 0.7, 120, 0, Math.PI * 2);
  ctx.arc(canvas.width * 0.5, canvas.height * 0.15, 70, 0, Math.PI * 2);
  ctx.fill();
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

  document.getElementById('final-depth').textContent = `Depth reached: ${depth}  •  Chapter ${chapter}`;
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

// Drawing
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
