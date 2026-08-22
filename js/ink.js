// Advanced Living Ink System for Atrament

class InkSystem {
  constructor() {
    this.strokes = [];          // semua goresan tinta
    this.platforms = [];        // platform solid yang bisa diinjak
    this.particles = [];        // efek tetesan

    this.maxInk = 100;
    this.currentInk = 100;
    this.inkRegen = 0.04;       // regenerasi pelan

    this.isDrawing = false;
    this.currentStroke = null;
    this.minDistance = 6;       // supaya tidak terlalu banyak point
  }

  startStroke(x, y) {
    if (this.currentInk <= 0) return;

    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      age: 0,
      maxAge: 480,               // semakin kecil = semakin cepat menua
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
      this.currentInk = Math.max(0, this.currentInk - 0.22);
    }
  }

  endStroke() {
    if (!this.currentStroke) return;

    // Setelah selesai digambar, buat platform solid dari stroke
    this.createPlatformsFromStroke(this.currentStroke);

    this.isDrawing = false;
    this.currentStroke = null;
  }

  createPlatformsFromStroke(stroke) {
    // Ubah garis menjadi beberapa kotak platform kecil
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);

      // Platform agak tebal supaya enak diinjak
      this.platforms.push({
        x: midX - len / 2 - 4,
        y: midY - 7,
        width: len + 8,
        height: 14,
        age: 0,
        maxAge: stroke.maxAge,
        isAlive: false,
        strokeRef: stroke
      });
    }
  }

  update(enemies) {
    // Regenerasi tinta pelan
    if (this.currentInk < this.maxInk && !this.isDrawing) {
      this.currentInk = Math.min(this.maxInk, this.currentInk + this.inkRegen);
    }

    // Update strokes & platforms
    for (let stroke of this.strokes) {
      stroke.age++;

      if (stroke.age > stroke.maxAge && !stroke.isAlive) {
        stroke.isAlive = true;
      }

      // Spawn enemy dari tinta yang sudah sangat tua
      if (stroke.isAlive && !stroke.hasSpawned && stroke.age > stroke.maxAge + 90) {
        if (stroke.points.length > 3) {
          const mid = stroke.points[Math.floor(stroke.points.length / 2)];
          enemies.push(new InkCreature(mid.x, mid.y - 10));
          stroke.hasSpawned = true;
        }
      }
    }

    // Update platform age
    for (let p of this.platforms) {
      p.age++;
      if (p.age > p.maxAge) {
        p.isAlive = true;
      }
    }

    // Hapus platform yang sudah terlalu tua (opsional)
    this.platforms = this.platforms.filter(p => p.age < p.maxAge + 200);

    // Particles (tetesan tinta)
    this.updateParticles();
  }

  updateParticles() {
    // Tambah particle dari tinta tua
    if (Math.random() < 0.15) {
      for (let stroke of this.strokes) {
        if (stroke.age > stroke.maxAge * 0.6 && stroke.points.length > 2) {
          const p = stroke.points[Math.floor(Math.random() * stroke.points.length)];
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 8,
            y: p.y,
            vy: 0.8 + Math.random() * 1.2,
            life: 40 + Math.random() * 30,
            maxLife: 70
          });
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw strokes
    for (let stroke of this.strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      const progress = Math.min(1, stroke.age / stroke.maxAge);

      if (stroke.isAlive) {
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 9;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 8;
      } else {
        const dark = Math.floor(25 + progress * 50);
        ctx.strokeStyle = `rgb(${dark},${dark},${dark})`;
        ctx.lineWidth = 6 + progress * 2;
        ctx.shadowBlur = 0;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw particles (tetesan)
    for (let pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = `rgba(15, 15, 15, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getPlatforms() {
    // Hanya platform yang masih relatif segar yang solid
    return this.platforms.filter(p => p.age < p.maxAge + 60);
  }

  getInkPercentage() {
    return (this.currentInk / this.maxInk) * 100;
  }
}
