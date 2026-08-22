// Improved Player for Atrament

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 40;

    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = 5.1;
    this.jumpForce = -12.8;
    this.gravity = 0.47;
    this.maxFallSpeed = 13.5;

    this.onGround = false;
    this.coyoteTime = 0;
    this.coyoteMax = 9;
    this.jumpBuffer = 0;
    this.jumpBufferMax = 8;

    this.facing = 1;
    this.animTimer = 0;
  }

  update(platforms) {
    this.animTimer++;

    this.velocityY += this.gravity;
    if (this.velocityY > this.maxFallSpeed) this.velocityY = this.maxFallSpeed;

    this.x += this.velocityX;
    this.y += this.velocityY;

    this.onGround = false;
    this.handleCollisions(platforms);

    if (this.onGround) {
      this.coyoteTime = this.coyoteMax;
    } else {
      this.coyoteTime--;
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
      if (this.coyoteTime > 0) this.doJump();
    }

    if (this.velocityX > 0.3) this.facing = 1;
    if (this.velocityX < -0.3) this.facing = -1;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
  }

  handleCollisions(platforms) {
    for (let p of platforms) {
      if (this.intersects(p)) {
        if (this.velocityY > 0 && this.y + this.height - this.velocityY <= p.y + 12) {
          this.y = p.y - this.height;
          this.velocityY = 0;
          this.onGround = true;
        } else if (this.velocityY < 0 && this.y - this.velocityY >= p.y + p.height - 12) {
          this.y = p.y + p.height;
          this.velocityY = 0;
        } else {
          if (this.velocityX > 0) this.x = p.x - this.width;
          else if (this.velocityX < 0) this.x = p.x + p.width;
          this.velocityX = 0;
        }
      }
    }
  }

  intersects(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  jump() {
    this.jumpBuffer = this.jumpBufferMax;
    if (this.coyoteTime > 0) this.doJump();
  }

  doJump() {
    this.velocityY = this.jumpForce;
    this.onGround = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const bob = this.onGround ? Math.sin(this.animTimer * 0.12) * 1.2 : 0;

    // Cloak / body
    ctx.fillStyle = "#0f0f0f";
    ctx.beginPath();
    ctx.moveTo(this.x + 4, this.y + 14 + bob);
    ctx.quadraticCurveTo(cx, this.y + 8 + bob, this.x + this.width - 4, this.y + 14 + bob);
    ctx.lineTo(this.x + this.width - 2, this.y + this.height + bob);
    ctx.lineTo(this.x + 2, this.y + this.height + bob);
    ctx.closePath();
    ctx.fill();

    // Hood
    ctx.beginPath();
    ctx.arc(cx, this.y + 13 + bob, 14, Math.PI * 1.05, Math.PI * -0.05);
    ctx.fill();

    // Inner hood shadow
    ctx.fillStyle = "#080808";
    ctx.beginPath();
    ctx.arc(cx, this.y + 15 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eye glow
    ctx.fillStyle = "#e8d5b7";
    const eyeX = this.facing === 1 ? cx + 4 : cx - 4;
    ctx.beginPath();
    ctx.arc(eyeX, this.y + 15 + bob, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Soft glow around eye
    ctx.fillStyle = "rgba(232, 213, 183, 0.25)";
    ctx.beginPath();
    ctx.arc(eyeX, this.y + 15 + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
