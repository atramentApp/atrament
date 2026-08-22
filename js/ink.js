// Advanced Living Ink System + Absorb for Atrament

class InkSystem {
  constructor() {
    this.strokes = [];
    this.platforms = [];
    this.particles = [];

    this.maxInk = 100;
    this.currentInk = 100;
    this.inkRegen = 0.035;

    this.isDrawing = false;
    this.currentStroke = null;
    this.minDistance = 5;
  }

  startStroke(x, y) {
    if (this.currentInk <= 0) return;

    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      age: 0,
      maxAge: 520,
      isAlive: false,
      hasSpawned: false
    };
    this.strokes.push(this.currentStroke);
  }

  addPoint(x, y) {
    if (!this.isDrawing || !this.currentStroke) return;

    const last = this.currentStroke.points[this.currentStroke.points.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);

    if (dist >= this.minDistance) {
      this.currentStroke.points.push({ x, y });
      this.currentInk = Math.max(0, this.currentInk - 0.18);
    }
  }

  endStroke() {
    if (!this.currentStroke) return;
    this.createPlatformsFromStroke(this.currentStroke);
    this.isDrawing = false;
    this.currentStroke = null;
  }

  createPlatformsFromStroke(stroke) {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      // Platform lebih tebal & stabil
      this.platforms.push({
        x: midX - len / 2 - 6,
        y: midY - 9,
        width: Math.max(len + 12, 18),
        height: 18,
        age: 0,
        maxAge: stroke.maxAge,
        isAlive: false,
        strokeRef: stroke
      });
    }
  }

  // ===== ABSORB (Serap Tinta) =====
  absorb(player) {
    let absorbed = 0;
    const range = 70;

    // Serap platform di sekitar player
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const dist = Math.hypot(player.x + player.width/2 - cx, player.y + player.height/2 - cy);

      if (dist < range) {
        this.platforms.splice(i, 1);
        absorbed += 8;
        // particle efek
        for (let k = 0; k < 4; k++) {
          this.particles.push({
            x: cx + (Math.random()-0.5)*20,
            y: cy,
            vy: -1.5 - Math.random()*2,
            life: 30 + Math.random()*20,
            maxLife: 50,
            absorb: true
          });
        }
      }
    }

    // Serap stroke visual juga
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (s.points.length === 0) continue;
      const mid = s.points[Math.floor(s.points.length/2)];
      const dist = Math.hypot(player.x + player.width/2 - mid.x, player.y + player.height/2 - mid.y);
      if (dist < range) {
        this.strokes.splice(i, 1);
        absorbed += 5;
      }
    }

    this.currentInk = Math.min(this.maxInk, this.currentInk + absorbed);
    return absorbed > 0;
  }

  update(enemies) {
    // Regen
    if (this.currentInk < this.maxInk && !this.isDrawing) {
      this.currentInk = Math.min(this.maxInk, this.currentInk + this.inkRegen);
    }

    // Aging
    for (let stroke of this.strokes) {
      stroke.age++;
      if (stroke.age > stroke.maxAge && !stroke.isAlive) {
        stroke.isAlive = true;
      }

      // Spawn enemy dari tinta tua
      if (stroke.isAlive && !stroke.hasSpawned && stroke.age > stroke.maxAge + 110) {
        if (stroke.points.length > 2) {
          const mid = stroke.points[Math.floor(stroke.points.length / 2)];
          enemies.push(new InkCreature(mid.x, mid.y - 12));
          stroke.hasSpawned = true;
        }
      }
    }

    for (let p of this.platforms) {
      p.age++;
      if (p.age > p.maxAge) p.isAlive = true;
    }

    // Hapus platform yang sudah sangat tua
    this.platforms = this.platforms.filter(p => p.age < p.maxAge + 180);

    this.updateParticles();
  }

  updateParticles() {
    if (Math.random() < 0.12) {
      for (let stroke of this.strokes) {
        if (stroke.age > stroke.maxAge * 0.55 && stroke.points.length > 2) {
          const p = stroke.points[Math.floor(Math.random() * stroke.points.length)];
          this.particles.push({
            x: p.x + (Math.random()-0.5)*10,
            y: p.y,
            vy: 0.9 + Math.random()*1.4,
            life: 35 + Math.random()*25,
            maxLife: 60,
            absorb: false
          });
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.y += pt.vy;
      if (pt.absorb) pt.vy *= 0.95;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    // Strokes
    for (let stroke of this.strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      const progress = Math.min(1, stroke.age / stroke.maxAge);

      if (stroke.isAlive) {
        ctx.strokeStyle = "#080808";
        ctx.lineWidth = 10;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 10;
      } else {
        const dark = Math.floor(22 + progress * 55);
        ctx.strokeStyle = `rgb(${dark},${dark},${dark})`;
        ctx.lineWidth = 6 + progress * 2.5;
        ctx.shadowBlur = 0;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Particles
    for (let pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.absorb ? `rgba(180,160,130,${alpha})` : `rgba(12,12,12,${alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.absorb ? 3 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getPlatforms() {
    // Platform masih solid cukup lama
    return this.platforms.filter(p => p.age < p.maxAge + 80);
  }

  getInkPercentage() {
    return (this.currentInk / this.maxInk) * 100;
  }
}
