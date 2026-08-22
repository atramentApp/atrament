// Living Ink system for Atrament

class InkSystem {
  constructor() {
    this.strokes = [];
    this.maxInk = 100;
    this.currentInk = 100;
    this.isDrawing = false;
    this.currentStroke = null;
  }

  startStroke(x, y) {
    if (this.currentInk <= 0) return;

    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      age: 0,
      maxAge: 600,
      isAlive: false
    };
    this.strokes.push(this.currentStroke);
  }

  addPoint(x, y) {
    if (!this.isDrawing || !this.currentStroke) return;

    this.currentStroke.points.push({ x, y });
    this.currentInk = Math.max(0, this.currentInk - 0.15);
  }

  endStroke() {
    this.isDrawing = false;
    this.currentStroke = null;
  }

  update() {
    for (let stroke of this.strokes) {
      stroke.age++;

      // Setelah cukup tua, tinta menjadi "hidup"
      if (stroke.age > stroke.maxAge && !stroke.isAlive) {
        stroke.isAlive = true;
      }
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

      if (stroke.isAlive) {
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 8;
      } else {
        const progress = stroke.age / stroke.maxAge;
        const darkness = Math.floor(30 + progress * 40);
        ctx.strokeStyle = `rgb(${darkness}, ${darkness}, ${darkness})`;
        ctx.lineWidth = 6;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }

  getInkPercentage() {
    return (this.currentInk / this.maxInk) * 100;
  }
}
