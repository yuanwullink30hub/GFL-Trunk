/**
 * Texture Optimization Utilities
 * Handles texture loading, compression, and caching for performance
 */

import * as THREE from 'three';
import { getPerformanceSettings } from './performanceMonitor';

// Texture cache to avoid duplicate loads
const textureCache = new Map();

/**
 * Load and optimize a texture based on device performance
 * @param {string} url - Texture URL
 * @param {THREE.TextureLoader} loader - Three.js texture loader
 * @returns {Promise<THREE.Texture>} Optimized texture
 */
export const loadOptimizedTexture = async (url, loader) => {
  // Return cached texture if available
  if (textureCache.has(url)) {
    return textureCache.get(url);
  }

  const performanceSettings = getPerformanceSettings();
  
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        // Apply optimizations based on device tier
        if (performanceSettings.tier === 'LOW') {
          // Low-end: reduce texture quality
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;
          // Disable mipmapping for lower-end devices
          texture.generateMipmaps = false;
        } else {
          // High/medium-end: keep quality
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.generateMipmaps = true;
          texture.anisotropy = Math.min(8, performanceSettings.tier === 'HIGH' ? 16 : 8);
        }

        // Set encoding
        texture.colorSpace = THREE.SRGBColorSpace;

        // Cache the texture
        textureCache.set(url, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
};

/**
 * Preload critical textures
 * @param {string[]} urls - Array of texture URLs to preload
 * @param {THREE.TextureLoader} loader - Three.js texture loader
 */
export const preloadTextures = async (urls, loader) => {
  try {
    await Promise.all(
      urls.map((url) => loadOptimizedTexture(url, loader))
    );
    console.log('[Texture Optimizer] Preloaded textures:', urls.length);
  } catch (error) {
    console.error('[Texture Optimizer] Error preloading textures:', error);
  }
};

/**
 * Clear texture cache (useful for cleanup)
 */
export const clearTextureCache = () => {
  textureCache.forEach((texture) => {
    texture.dispose();
  });
  textureCache.clear();
  console.log('[Texture Optimizer] Texture cache cleared');
};

/**
 * Get texture cache size (for debugging)
 */
export const getTextureCacheSize = () => {
  return textureCache.size;
};
