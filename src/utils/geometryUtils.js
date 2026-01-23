/**
 * 3D Geometry and Vector utilities for Three.js
 * Helpful for calculations with Vector3, quaternions, and transformations
 */

/**
 * Vector3 utilities
 */
export const Vector3Utils = {
  /**
   * Lerp between two vectors
   * @param {THREE.Vector3} a - Start vector
   * @param {THREE.Vector3} b - End vector
   * @param {number} t - Progress (0-1)
   * @returns {THREE.Vector3} Lerped vector
   */
  lerp: (a, b, t) => {
    return a.clone().lerp(b, t);
  },

  /**
   * Get distance between two vectors
   * @param {THREE.Vector3} a - First vector
   * @param {THREE.Vector3} b - Second vector
   * @returns {number} Distance
   */
  distance: (a, b) => {
    return a.distanceTo(b);
  },

  /**
   * Midpoint between two vectors
   * @param {THREE.Vector3} a - First vector
   * @param {THREE.Vector3} b - Second vector
   * @returns {THREE.Vector3} Midpoint
   */
  midpoint: (a, b) => {
    return new a.constructor((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  },

  /**
   * Rotate vector around axis
   * @param {THREE.Vector3} vector - Vector to rotate
   * @param {THREE.Vector3} axis - Rotation axis
   * @param {number} angle - Angle in radians
   * @returns {THREE.Vector3} Rotated vector
   */
  rotateAroundAxis: (vector, axis, angle) => {
    return vector.clone().applyAxisAngle(axis, angle);
  }
};

/**
 * Quaternion utilities
 */
export const QuaternionUtils = {
  /**
   * Slerp (spherical linear interpolation) between quaternions
   * @param {THREE.Quaternion} a - Start quaternion
   * @param {THREE.Quaternion} b - End quaternion
   * @param {number} t - Progress (0-1)
   * @returns {THREE.Quaternion} Slerped quaternion
   */
  slerp: (a, b, t) => {
    return a.clone().slerp(b, t);
  },

  /**
   * Create quaternion from euler angles
   * @param {number} x - X rotation in radians
   * @param {number} y - Y rotation in radians
   * @param {number} z - Z rotation in radians
   * @param {string} order - Rotation order (default 'XYZ')
   * @returns {THREE.Quaternion}
   */
  fromEuler: (x, y, z, order = 'XYZ') => {
    const THREE = require('three');
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order));
  }
};

/**
 * Angle utilities
 */
export const AngleUtils = {
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  degreesToRadians: (degrees) => degrees * (Math.PI / 180),

  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} Angle in degrees
   */
  radiansToDegrees: (radians) => radians * (180 / Math.PI),

  /**
   * Normalize angle to 0-360 degrees
   * @param {number} degrees - Angle in degrees
   * @returns {number} Normalized angle
   */
  normalizeAngle: (degrees) => ((degrees % 360) + 360) % 360,

  /**
   * Get shortest angle difference
   * @param {number} from - Start angle in degrees
   * @param {number} to - End angle in degrees
   * @returns {number} Shortest difference
   */
  angleDifference: (from, to) => {
    let diff = to - from;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }
};

/**
 * Matrix utilities
 */
export const MatrixUtils = {
  /**
   * Get position from matrix
   * @param {THREE.Matrix4} matrix - Transformation matrix
   * @returns {THREE.Vector3} Position
   */
  getPosition: (matrix) => {
    return new matrix.constructor().getPosition?.(new (matrix.constructor === require('three').Matrix4 ? require('three').Vector3 : matrix.constructor)());
  },

  /**
   * Compose matrix from position, rotation, scale
   * @param {THREE.Vector3} position - Position
   * @param {THREE.Quaternion} rotation - Rotation as quaternion
   * @param {THREE.Vector3} scale - Scale
   * @returns {THREE.Matrix4}
   */
  compose: (position, rotation, scale) => {
    const THREE = require('three');
    const matrix = new THREE.Matrix4();
    matrix.compose(position, rotation, scale);
    return matrix;
  }
};

/**
 * Geometry calculations
 */
export const GeometryUtils = {
  /**
   * Calculate face normal
   * @param {THREE.Vector3} a - Vertex A
   * @param {THREE.Vector3} b - Vertex B
   * @param {THREE.Vector3} c - Vertex C
   * @returns {THREE.Vector3} Face normal
   */
  computeFaceNormal: (a, b, c) => {
    const cb = c.clone().sub(b);
    const ab = a.clone().sub(b);
    return cb.cross(ab).normalize();
  },

  /**
   * Check if point is inside triangle
   * @param {THREE.Vector3} p - Point
   * @param {THREE.Vector3} a - Triangle vertex A
   * @param {THREE.Vector3} b - Triangle vertex B
   * @param {THREE.Vector3} c - Triangle vertex C
   * @returns {boolean} Is inside
   */
  pointInTriangle: (p, a, b, c) => {
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const ap = p.clone().sub(a);

    const dotAB = ab.dot(ab);
    const dotAC = ac.dot(ac);
    const dotAB_AP = ab.dot(ap);
    const dotAC_AP = ac.dot(ap);

    const invDenom = 1 / (dotAB * dotAC - dotAC * dotAB);
    const u = (dotAC * dotAB_AP - dotAB * dotAC_AP) * invDenom;
    const v = (dotAB * dotAC_AP - dotAC * dotAB_AP) * invDenom;

    return u >= 0 && v >= 0 && u + v < 1;
  },

  /**
   * Calculate bounding sphere radius
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @returns {Object} { center: Vector3, radius: number }
   */
  boundingSphere: (vertices) => {
    const THREE = require('three');
    const center = new THREE.Vector3();
    vertices.forEach(v => center.add(v));
    center.divideScalar(vertices.length);

    let radius = 0;
    vertices.forEach(v => {
      radius = Math.max(radius, center.distanceTo(v));
    });

    return { center, radius };
  }
};

/**
 * Ray casting utilities
 */
export const RayCastUtils = {
  /**
   * Get ray from camera through screen point
   * @param {THREE.Camera} camera - Camera
   * @param {number} x - Screen X (normalized -1 to 1)
   * @param {number} y - Screen Y (normalized -1 to 1)
   * @returns {THREE.Raycaster}
   */
  getRayFromCamera: (camera, x, y) => {
    const THREE = require('three');
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    return raycaster;
  }
};
