// Ink Creatures for Atrament

class InkCreature {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15 + Math.random() * 6;
    this.speed = 1.1 + Math.random() * 1.1;
    this.alive = true;
    this.pulse = Math.random() * Math.PI * 2;
    this.wobble = Math.random() * 100;
  }

  update(player, canvasHeight) {
    this.pulse += 0.09;
    this.wobble += 0.05;

    const dx = player.x + player.width / 2 - this.x;
    const dy = player.y + player.height / 2 - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed + Math.sin(this.wobble) * 0.4;
    }

    if (this.y > canvasHeight - 40) {
      this.y = canvasHeight - 40;
    }
  }

  draw(ctx) {
    const size = this.radius + Math.sin(this.pulse) * 2.5;

    // Shadow
    ctx.beginPath();
    ctx.arc(this.x, this.y + 4, size * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0b0b";
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, size + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(20,20,20,0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes
    const eyeOffset = size * 0.35;
    ctx.fillStyle = "#e8d5b7";
    ctx.beginPath();
    ctx.arc(this.x - eyeOffset, this.y - 3, 2.8, 0, Math.PI * 2);
    ctx.arc(this.x + eyeOffset, this.y - 3, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  hits(player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dist = Math.hypot(this.x - px, this.y - py);
    return dist < this.radius + 16;
  }
}
