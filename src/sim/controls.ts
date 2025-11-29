import * as THREE from 'three';

export const inputState = { forward: 0, strafe: 0, jump: false };

export function setupControls(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera) {
  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  function update(dt: number) {
    inputState.forward = (keys.has('KeyW') ? 1 : 0) + (keys.has('KeyS') ? -1 : 0);
    inputState.strafe = (keys.has('KeyD') ? 1 : 0) + (keys.has('KeyA') ? -1 : 0);
    inputState.jump = keys.has('Space');
  }

  let yaw = 0;
  let pitch = 0.2;
  let dragging = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    yaw -= dx * 0.005;
    pitch = Math.max(-1.2, Math.min(1.2, pitch - dy * 0.005));
  });

  const target = new THREE.Vector3(0, 1, 0);
  function updateCamera() {
    const radius = 8;
    const x = target.x + Math.cos(yaw) * Math.cos(pitch) * radius;
    const y = target.y + Math.sin(pitch) * radius;
    const z = target.z + Math.sin(yaw) * Math.cos(pitch) * radius;
    camera.position.set(x, y, z);
    camera.lookAt(target);
  }

  return {
    update: (dt: number) => { update(dt); updateCamera(); },
    setTarget: (v: THREE.Vector3) => { target.copy(v); }
  };
}
