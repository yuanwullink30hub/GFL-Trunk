/**
 * Motion Prediction Utility
 * Pre-calculates animation frames for smoother playback
 * Useful for drag interactions and physics-based animations
 */

export class MotionPredictor {
  constructor() {
    this.frameCache = new Map();
    this.lastPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
  }

  /**
   * Update motion based on current position
   * Returns predicted next position for smoother rendering
   */
  updateMotion(currentPos, deltaTime = 16) {
    // Calculate velocity (pixels per ms)
    const velocityX = (currentPos.x - this.lastPosition.x) / deltaTime;
    const velocityY = (currentPos.y - this.lastPosition.y) / deltaTime;

    // Calculate acceleration
    const accelX = (velocityX - this.velocity.x) / deltaTime;
    const accelY = (velocityY - this.velocity.y) / deltaTime;

    // Smooth acceleration changes
    this.acceleration.x = accelX * 0.5 + this.acceleration.x * 0.5;
    this.acceleration.y = accelY * 0.5 + this.acceleration.y * 0.5;

    this.velocity.x = velocityX;
    this.velocity.y = velocityY;
    this.lastPosition = { ...currentPos };

    return {
      current: currentPos,
      velocity: { ...this.velocity },
      acceleration: { ...this.acceleration }
    };
  }

  /**
   * Predict position N frames in the future
   * Useful for pre-rendering or anticipating movements
   */
  predictPosition(currentPos, framesAhead = 1, friction = 0.95) {
    let predictedX = currentPos.x + this.velocity.x * framesAhead;
    let predictedY = currentPos.y + this.velocity.y * framesAhead;

    // Apply friction
    let velX = this.velocity.x * Math.pow(friction, framesAhead);
    let velY = this.velocity.y * Math.pow(friction, framesAhead);

    return {
      x: predictedX,
      y: predictedY,
      vx: velX,
      vy: velY
    };
  }

  /**
   * Generate animation keyframes for smooth playback
   * Pre-calculates positions to avoid runtime computation
   */
  generateKeyframes(startPos, endPos, framesCount = 60) {
    const keyframes = [];
    const diffX = endPos.x - startPos.x;
    const diffY = endPos.y - startPos.y;

    for (let i = 0; i <= framesCount; i++) {
      // Ease-in-out easing
      const t = i / framesCount;
      const eased = t < 0.5 
        ? 2 * t * t 
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      keyframes.push({
        x: startPos.x + diffX * eased,
        y: startPos.y + diffY * eased,
        progress: eased
      });
    }

    return keyframes;
  }

  reset() {
    this.lastPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.frameCache.clear();
  }
}

export default MotionPredictor;
