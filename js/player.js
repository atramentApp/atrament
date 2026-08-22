// Player character for Atrament

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 40;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 4.5;
    this.jumpForce = -11;
    this.onGround = false;
    this.color = "#1a1a1a";
  }

  update(canvas) {
    // Gravity
    this.velocityY += 0.45;

    // Apply velocity
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Temporary ground
    if (this.y + this.height > canvas.height - 80) {
      this.y = canvas.height - 80 - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Screen bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }
  }

  draw(ctx) {
    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Hood
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 10, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  jump() {
    if (this.onGround) {
      this.velocityY = this.jumpForce;
      this.onGround = false;
    }
  }
}
