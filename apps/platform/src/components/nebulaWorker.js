// Nebula render worker — owns the OffscreenCanvas and runs the full engine here so
// Firefox's synchronous WebGL waits (shader compile: 5-15s cold) block THIS thread,
// never the main thread. The component pumps input snapshots; we render.
import { createNebulaEngine } from './nebulaEngine';

let engine = null;
// Mutable input snapshot the engine reads every frame (same object for its lifetime).
const inputs = { mouseX: 0.5, mouseY: 0.5, mapX: 0, mapY: 0, frame: 0, visible: true };

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'init') {
    Object.assign(inputs, m.inputs || {});
    engine = createNebulaEngine(m.canvas, {
      width: m.width,
      height: m.height,
      inputs,
      onReady: () => self.postMessage('ready'),
      onFail: () => self.postMessage('fail'),
    });
  } else if (m.type === 'inputs') {
    Object.assign(inputs, m.inputs);
  } else if (m.type === 'resize') {
    if (engine) engine.resize(m.width, m.height);
  } else if (m.type === 'destroy') {
    if (engine) engine.destroy();
    engine = null;
    self.close();
  }
};
