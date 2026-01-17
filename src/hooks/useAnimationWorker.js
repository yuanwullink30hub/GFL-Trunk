import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook to use animation worker
 * Offloads heavy computations to a background thread
 */
export const useAnimationWorker = () => {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const callbacksRef = useRef(new Map());
  let callIdCounter = useRef(0);

  // Initialize worker
  useEffect(() => {
    try {
      // Create worker from file
      workerRef.current = new Worker(
        new URL('../workers/animationWorker.js', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      workerRef.current.onmessage = (event) => {
        const { data, success, error, callId } = event.data;
        
        if (callId && callbacksRef.current.has(callId)) {
          const callback = callbacksRef.current.get(callId);
          callbacksRef.current.delete(callId);
          
          if (success) {
            callback.resolve(data);
          } else {
            callback.reject(new Error(error));
          }
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error.message);
      };

      setIsReady(true);
    } catch (error) {
      console.warn('Web Worker not supported or failed to initialize:', error.message);
      setIsReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Send message to worker and get promise
  const sendMessage = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const callId = ++callIdCounter.current;
      callbacksRef.current.set(callId, { resolve, reject });

      workerRef.current.postMessage({
        type,
        payload,
        callId,
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (callbacksRef.current.has(callId)) {
          callbacksRef.current.delete(callId);
          reject(new Error(`Worker timeout for ${type}`));
        }
      }, 10000);
    });
  }, []);

  return {
    isReady,
    generateBrain: useCallback(
      (count = 300) => sendMessage('GENERATE_BRAIN', { count }),
      [sendMessage]
    ),
    generateScatter: useCallback(
      (count = 25) => sendMessage('GENERATE_SCATTER', { count }),
      [sendMessage]
    ),
  };
};
