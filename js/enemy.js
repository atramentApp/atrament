// Ink Creatures (Enemies) for Atrament

class InkCreature {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 1.2 + Math.random() * 0.8;
    this.angle = Math.random() * Math.PI * 2;
    this.alive = true;
    this.pulse = 0;
  }

  update(player) {
    this.pulse += 0.08;

    // Bergerak mendekati player
    const dx = player.x + player.width / 2 - this.x;
    const dy = player.y + player.height / 2 - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw(ctx) {
    const size = this.radius + Math.sin(this.pulse) * 2;

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#0d0d0d";
    ctx.fill();

    // Mata menyala
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(this.x + 5, this.y - 3, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#e8d5b7";
    ctx.fill();
  }
}
