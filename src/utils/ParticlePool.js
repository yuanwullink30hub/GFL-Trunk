/**
 * Particle Pool Utility
 * Reuses particle objects instead of creating/destroying them
 * Improves performance by reducing garbage collection
 */

class ParticlePool {
  constructor(poolSize = 50) {
    this.poolSize = poolSize;
    this.available = [];
    this.inUse = [];
    
    // Pre-allocate particles
    for (let i = 0; i < poolSize; i++) {
      this.available.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: 0,
      y: 0,
      size: 0,
      vx: 0,
      vy: 0,
      life: 1,
      reset() {
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1;
      }
    };
  }

  acquire() {
    if (this.available.length > 0) {
      return this.available.pop();
    }
    // If pool is empty, create new particle (shouldn't happen with proper pooling)
    return this.createParticle();
  }

  release(particle) {
    particle.reset();
    this.available.push(particle);
  }

  releaseAll() {
    this.inUse.forEach(p => this.release(p));
    this.inUse = [];
  }

  getAll() {
    return this.inUse;
  }

  addToInUse(particle) {
    this.inUse.push(particle);
  }

  size() {
    return this.inUse.length;
  }
}

export default ParticlePool;
