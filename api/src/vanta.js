import vanta from 'vanta';
import * as THREE from 'three';

// Vanta background effect for the time management system
export const initializeVanta = (element) => {
  return vanta({
    el: element,
    THREE: THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x0066cc,
    backgroundColor: 0x0a0a0a,
    pointsColor: 0x00ff88,
    pointSize: 2.0,
    spacing: 20.0,
    showLines: true,
    waveHeight: 15.0,
    waveSpeed: 0.5,
    zoom: 1.0,
    mode: 'waves',
  });
};

export default initializeVanta;