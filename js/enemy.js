// Improved Ink Creatures for Atrament

class InkCreature {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14 + Math.random() * 7;
    this.speed = 1.05 + Math.random() * 1.15;
    this.pulse = Math.random() * Math.PI * 2;
    this.wobble = Math.random() * 100;
    this.alive = true;
  }

  update(player, canvasHeight) {
    this.pulse += 0.1;
    this.wobble += 0.06;

    const dx = player.x + player.width / 2 - this.x;
    const dy = player.y + player.height / 2 - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 12) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed + Math.sin(this.wobble) * 0.45;
    }

    if (this.y > canvasHeight - 45) {
      this.y = canvasHeight - 45;
    }
  }

  draw(ctx) {
    const size = this.radius + Math.sin(this.pulse) * 2.8;

    // Soft shadow
    ctx.beginPath();
    ctx.arc(this.x, this.y + 5, size * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();

    // Main body
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill();

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(15,15,15,0.6)";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Eyes
    const eyeOffset = size * 0.38;
    ctx.fillStyle = "#e8d5b7";
    ctx.beginPath();
    ctx.arc(this.x - eyeOffset, this.y - 4, 2.9, 0, Math.PI * 2);
    ctx.arc(this.x + eyeOffset, this.y - 4, 2.9, 0, Math.PI * 2);
    ctx.fill();

    // Eye glow
    ctx.fillStyle = "rgba(232,213,183,0.3)";
    ctx.beginPath();
    ctx.arc(this.x - eyeOffset, this.y - 4, 5, 0, Math.PI * 2);
    ctx.arc(this.x + eyeOffset, this.y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  hits(player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dist = Math.hypot(this.x - px, this.y - py);
    return dist < this.radius + 17;
  }
}
