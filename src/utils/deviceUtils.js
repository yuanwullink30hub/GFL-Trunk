/**
 * Device detection and capability utilities
 * Detects device type, OS, browser, and available features
 */

/**
 * Get device information
 * @returns {Object} Device info
 */
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  return {
    userAgent: ua,
    isMobile: /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isTablet: /iPad|Android(?!.*Phone)|Tablet/i.test(ua),
    isDesktop: !(/iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)),
    isIOS: /iPhone|iPad|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isWindows: /Windows/.test(ua),
    isMac: /Macintosh|Mac OS X/.test(ua),
    isLinux: /Linux/.test(ua),
    isChromeOS: /CrOS/.test(ua),
  };
};

/**
 * Get browser information
 * @returns {Object} Browser info
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    version = ua.substring(ua.indexOf('Firefox') + 8);
  } else if (ua.indexOf('SamsungBrowser') > -1) {
    browserName = 'Samsung';
    version = ua.substring(ua.indexOf('SamsungBrowser') + 15);
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    version = ua.substring(ua.indexOf('Chrome') + 7);
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    version = ua.substring(ua.indexOf('Safari') + 7);
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    version = ua.substring(ua.indexOf('Edge') + 5);
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera';
    version = ua.substring(ua.indexOf('Opera') + 6);
  }

  return {
    name: browserName,
    version: version.split(' ')[0],
    isChrome: browserName === 'Chrome',
    isFirefox: browserName === 'Firefox',
    isSafari: browserName === 'Safari',
    isEdge: browserName === 'Edge',
  };
};

/**
 * Get screen information
 * @returns {Object} Screen info
 */
export const getScreenInfo = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    isRetina: window.devicePixelRatio >= 2,
  };
};

/**
 * Check if specific features are supported
 * @returns {Object} Feature support flags
 */
export const getFeatureSupport = () => {
  return {
    localStorage: typeof (typeof Storage) !== 'undefined' && !!localStorage,
    sessionStorage: typeof (typeof Storage) !== 'undefined' && !!sessionStorage,
    serviceWorker: 'serviceWorker' in navigator,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    webGL2: !!document.createElement('canvas').getContext('webgl2'),
    webWorker: typeof (Worker) !== 'undefined',
    geolocation: 'geolocation' in navigator,
    vibration: 'vibrate' in navigator,
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    touchscreen: () => {
      return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
    },
    camera: !!navigator.mediaDevices?.enumerateDevices,
    microphone: !!navigator.mediaDevices?.enumerateDevices,
    requestIdleCallback: typeof requestIdleCallback !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
  };
};

/**
 * Get network information
 * @returns {Object} Network info
 */
export const getNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return { available: false };
  }

  return {
    available: true,
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mb/s
    rtt: connection.rtt, // ms
    saveData: connection.saveData || false,
    type: connection.type, // wifi, cellular, bluetooth, etc
  };
};

/**
 * Get memory information (if available)
 * @returns {Object} Memory info
 */
export const getMemoryInfo = () => {
  if (!performance.memory) {
    return { available: false };
  }

  const mem = performance.memory;
  return {
    available: true,
    usedJSHeapSize: mem.usedJSHeapSize,
    totalJSHeapSize: mem.totalJSHeapSize,
    jsHeapSizeLimit: mem.jsHeapSizeLimit,
    usagePercentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
  };
};

/**
 * Request full device info summary
 * @returns {Object} Complete device profile
 */
export const getDeviceProfile = () => {
  return {
    device: getDeviceInfo(),
    browser: getBrowserInfo(),
    screen: getScreenInfo(),
    features: getFeatureSupport(),
    network: getNetworkInfo(),
    memory: getMemoryInfo(),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Monitor for device changes (orientation, window resize, etc)
 * @param {Function} callback - Called when device state changes
 * @returns {Object} Controller with remove method
 */
export const monitorDeviceChanges = (callback) => {
  let lastProfile = getScreenInfo();

  const handleChange = () => {
    const newProfile = getScreenInfo();
    const changed = {
      orientationChanged: lastProfile.orientation !== newProfile.orientation,
      resized: lastProfile.width !== newProfile.width || lastProfile.height !== newProfile.height,
      pixelRatioChanged: lastProfile.devicePixelRatio !== newProfile.devicePixelRatio,
    };

    if (Object.values(changed).some(v => v)) {
      callback({ ...newProfile, changed });
      lastProfile = newProfile;
    }
  };

  window.addEventListener('resize', handleChange);
  window.addEventListener('orientationchange', handleChange);

  return {
    remove: () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    }
  };
};
