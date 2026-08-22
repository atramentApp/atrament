// Improved Living Ink System for Atrament

class InkSystem {
  constructor() {
    this.strokes = [];
    this.platforms = [];
    this.particles = [];

    this.maxInk = 100;
    this.currentInk = 100;
    this.inkRegen = 0.045;        // slightly faster regen
    this.inkCost = 0.14;          // less expensive to draw

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
      maxAge: 580,                // lasts a bit longer
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
      this.currentInk = Math.max(0, this.currentInk - this.inkCost);
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

      this.platforms.push({
        x: midX - len / 2 - 7,
        y: midY - 10,
        width: Math.max(len + 14, 20),
        height: 20,
        age: 0,
        maxAge: stroke.maxAge,
        isAlive: false
      });
    }
  }

  absorb(player) {
    let absorbed = 0;
    const range = 75;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const dist = Math.hypot(player.x + player.width / 2 - cx, player.y + player.height / 2 - cy);

      if (dist < range) {
        this.platforms.splice(i, 1);
        absorbed += 9;

        for (let k = 0; k < 5; k++) {
          this.particles.push({
            x: cx + (Math.random() - 0.5) * 22,
            y: cy,
            vy: -1.8 - Math.random() * 2.2,
            life: 28 + Math.random() * 22,
            maxLife: 50,
            absorb: true
          });
        }
      }
    }

    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (s.points.length === 0) continue;
      const mid = s.points[Math.floor(s.points.length / 2)];
      const dist = Math.hypot(player.x + player.width / 2 - mid.x, player.y + player.height / 2 - mid.y);
      if (dist < range) {
        this.strokes.splice(i, 1);
        absorbed += 6;
      }
    }

    this.currentInk = Math.min(this.maxInk, this.currentInk + absorbed);
    return absorbed > 0;
  }

  update(enemies) {
    if (this.currentInk < this.maxInk && !this.isDrawing) {
      this.currentInk = Math.min(this.maxInk, this.currentInk + this.inkRegen);
    }

    for (let stroke of this.strokes) {
      stroke.age++;

      if (stroke.age > stroke.maxAge && !stroke.isAlive) {
        stroke.isAlive = true;
      }

      // Spawn enemy a bit later and less aggressively
      if (stroke.isAlive && !stroke.hasSpawned && stroke.age > stroke.maxAge + 140) {
        if (stroke.points.length > 2 && Math.random() < 0.7) {
          const mid = stroke.points[Math.floor(stroke.points.length / 2)];
          enemies.push(new InkCreature(mid.x, mid.y - 14));
          stroke.hasSpawned = true;
        }
      }
    }

    for (let p of this.platforms) {
      p.age++;
      if (p.age > p.maxAge) p.isAlive = true;
    }

    this.platforms = this.platforms.filter(p => p.age < p.maxAge + 200);
    this.updateParticles();
  }

  updateParticles() {
    if (Math.random() < 0.14) {
      for (let stroke of this.strokes) {
        if (stroke.age > stroke.maxAge * 0.5 && stroke.points.length > 2) {
          const p = stroke.points[Math.floor(Math.random() * stroke.points.length)];
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 12,
            y: p.y,
            vy: 0.8 + Math.random() * 1.5,
            life: 30 + Math.random() * 30,
            maxLife: 60,
            absorb: false
          });
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.y += pt.vy;
      if (pt.absorb) pt.vy *= 0.94;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (let stroke of this.strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      const progress = Math.min(1, stroke.age / stroke.maxAge);

      if (stroke.isAlive) {
        ctx.strokeStyle = "#060606";
        ctx.lineWidth = 11;
        ctx.shadowColor = "rgba(0,0,0,0.75)";
        ctx.shadowBlur = 12;
      } else {
        const dark = Math.floor(20 + progress * 60);
        ctx.strokeStyle = `rgb(${dark},${dark},${dark})`;
        ctx.lineWidth = 6.5 + progress * 3;
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
      ctx.fillStyle = pt.absorb ? `rgba(200,180,140,${alpha})` : `rgba(10,10,10,${alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.absorb ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getPlatforms() {
    return this.platforms.filter(p => p.age < p.maxAge + 90);
  }

  getInkPercentage() {
    return (this.currentInk / this.maxInk) * 100;
  }
}
