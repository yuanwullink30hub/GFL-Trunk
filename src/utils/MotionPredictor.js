// Motion Predictor utility for smooth momentum-based animations

export class MotionPredictor {
  constructor() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.positionX = 0;
    this.positionY = 0;
    this.friction = 0.95;
  }

  updateMotion(delta, deltaTime) {
    // Update velocity based on input delta
    this.velocityX = delta.x * (1000 / deltaTime);
    this.velocityY = delta.y * (1000 / deltaTime);
    
    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    
    // Update position
    this.positionX += delta.x;
    this.positionY += delta.y;
    
    return {
      velocity: { x: this.velocityX, y: this.velocityY },
      position: { x: this.positionX, y: this.positionY }
    };
  }

  getVelocity() {
    return { x: this.velocityX, y: this.velocityY };
  }

  getPosition() {
    return { x: this.positionX, y: this.positionY };
  }

  reset() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.positionX = 0;
    this.positionY = 0;
  }
}
