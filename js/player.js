// Player character for Atrament

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 26;
    this.height = 38;

    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = 5.2;
    this.jumpForce = -12.5;
    this.gravity = 0.48;
    this.maxFallSpeed = 14;

    this.onGround = false;
    this.wasOnGround = false;

    // Coyote time & jump buffer
    this.coyoteTime = 0;
    this.coyoteMax = 8;
    this.jumpBuffer = 0;
    this.jumpBufferMax = 8;

    this.facing = 1;
    this.color = "#121212";
  }

  update(platforms) {
    this.wasOnGround = this.onGround;

    // Gravity
    this.velocityY += this.gravity;
    if (this.velocityY > this.maxFallSpeed) {
      this.velocityY = this.maxFallSpeed;
    }

    // Apply movement
    this.x += this.velocityX;
    this.y += this.velocityY;

    this.onGround = false;

    // Collision with platforms
    this.handleCollisions(platforms);

    // Coyote time
    if (this.onGround) {
      this.coyoteTime = this.coyoteMax;
    } else {
      this.coyoteTime--;
    }

    // Jump buffer
    if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
      if (this.coyoteTime > 0) {
        this.doJump();
      }
    }

    // Facing
    if (this.velocityX > 0.3) this.facing = 1;
    if (this.velocityX < -0.3) this.facing = -1;

    // Keep inside screen
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }
  }

  handleCollisions(platforms) {
    for (let p of platforms) {
      if (this.intersects(p)) {
        // Land on top
        if (this.velocityY > 0 && this.y + this.height - this.velocityY <= p.y + 10) {
          this.y = p.y - this.height;
          this.velocityY = 0;
          this.onGround = true;
        }
        // Hit ceiling
        else if (this.velocityY < 0 && this.y - this.velocityY >= p.y + p.height - 10) {
          this.y = p.y + p.height;
          this.velocityY = 0;
        }
        // Side collision
        else {
          if (this.velocityX > 0) {
            this.x = p.x - this.width;
          } else if (this.velocityX < 0) {
            this.x = p.x + p.width;
          }
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
    if (this.coyoteTime > 0) {
      this.doJump();
    }
  }

  doJump() {
    this.velocityY = this.jumpForce;
    this.onGround = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }

  draw(ctx) {
    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Hood
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 11, 13, Math.PI, 0);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#e8d5b7";
    const eyeX = this.facing === 1 ? this.x + 17 : this.x + 7;
    ctx.beginPath();
    ctx.arc(eyeX, this.y + 14, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
