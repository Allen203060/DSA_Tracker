import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Defensive check to avoid throwing in headless/jsdom testing environments
function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Generate smooth circular particle glow texture with dual-ring halo (pure alpha mask)
function createCircleTexture() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  } catch {
    return null;
  }
}

export default function ThreeBackground({ theme = 'dark' }) {
  const containerRef = useRef(null);
  const materialsRef = useRef({ points: null, lines: null });
  const pointGeometryRef = useRef(null);
  const sceneRef = useRef(null);
  const themeRef = useRef(theme);

  // Palettes: Saturated jewel-tones for light mode; luminous neon for dark mode
  const darkPalette = [
    new THREE.Color('#818cf8'), // Electric Indigo
    new THREE.Color('#38bdf8'), // Neon Cyan
    new THREE.Color('#c084fc'), // Soft Violet
    new THREE.Color('#34d399')  // Mint Emerald
  ];
  const lightPalette = [
    new THREE.Color('#4338ca'), // Rich Indigo 700 (High contrast against porcelain)
    new THREE.Color('#0369a1'), // Deep Sky 700
    new THREE.Color('#0f766e'), // Deep Teal 700
    new THREE.Color('#1e293b')  // Slate 800
  ];

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!isWebGLAvailable() || !containerRef.current) return;

    const container = containerRef.current;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene & Volumetric Fog Depth
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isInitialDark = themeRef.current === 'dark';
    scene.fog = new THREE.FogExp2(
      isInitialDark ? 0x07090e : 0xf4f6fb,
      isInitialDark ? 0.0016 : 0.0014
    );

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(52, width / height, 1, 2000);
    camera.position.z = 440;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Algorithmic Constellation Nodes (Extended 3D Z-Depth)
    const particleCount = 115;
    // Deep Z-boundary creates distinct foreground vs background depth planes
    const bounds = { x: 440, y: 280, z: 300 };
    const particlesData = [];
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const activePalette = isInitialDark ? darkPalette : lightPalette;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * bounds.x * 2;
      const y = (Math.random() - 0.5) * bounds.y * 2;
      const z = (Math.random() - 0.5) * bounds.z * 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = activePalette[i % activePalette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      // Z-speed variation gives multi-plane parallax drift
      const zFactor = (z + bounds.z) / (bounds.z * 2); // 0 (far) to 1 (near)
      particlesData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (0.28 + zFactor * 0.2),
          (Math.random() - 0.5) * (0.28 + zFactor * 0.2),
          (Math.random() - 0.5) * 0.24
        ),
        phase: Math.random() * Math.PI * 2
      });
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pointGeometryRef.current = pointGeometry;

    const circleTexture = createCircleTexture();

    const pointsMaterial = new THREE.PointsMaterial({
      size: isInitialDark ? 6.2 : 5.4,
      map: circleTexture || undefined,
      transparent: true,
      opacity: isInitialDark ? 0.88 : 0.82,
      vertexColors: true,
      blending: isInitialDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });
    materialsRef.current.points = pointsMaterial;

    const pointCloud = new THREE.Points(pointGeometry, pointsMaterial);
    scene.add(pointCloud);

    // 4. Dynamic Inter-Node Connection Lines with High Contrast
    const maxLineSegments = (particleCount * (particleCount - 1)) / 2;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
    );

    const linesMaterial = new THREE.LineBasicMaterial({
      color: isInitialDark ? 0x818cf8 : 0x4338ca,
      transparent: true,
      opacity: isInitialDark ? 0.34 : 0.38,
      blending: isInitialDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });
    materialsRef.current.lines = linesMaterial;

    const lineSegments = new THREE.LineSegments(lineGeometry, linesMaterial);
    scene.add(lineSegments);

    // 5. Mouse Reactivity with 3D Depth Orbit & Smooth Interpolation
    const mouse = { targetX: 0, targetY: 0, currentX: 0, currentY: 0 };

    const onPointerMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 6. Window Resize Handler
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop (60fps Optimized with 3D Depth Parallax)
    let animationFrameId;
    const clock = new THREE.Clock();
    const connectionDist = 145;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth exponential lerp on mouse tracking
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.055;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.055;

      // 3D Camera Orbit & Parallax Tilt: tilts across all 3 axes for authentic depth
      camera.position.x = mouse.currentX * 52;
      camera.position.y = mouse.currentY * 40;
      camera.position.z = 440 + (mouse.currentX * mouse.currentX + mouse.currentY * mouse.currentY) * 20;
      camera.lookAt(0, 0, 0);

      // Compute mouse position in 3D world space at z = 0
      const vFov = (camera.fov * Math.PI) / 180;
      const planeH = 2 * Math.tan(vFov / 2) * camera.position.z;
      const planeW = planeH * camera.aspect;
      const mouseWorldX = mouse.currentX * (planeW / 2);
      const mouseWorldY = mouse.currentY * (planeH / 2);

      let lineVertexIdx = 0;
      let connectedLines = 0;

      // Update node positions, boundary bounces & dynamic mouse interaction
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const data = particlesData[i];

        positions[i3] += data.velocity.x;
        positions[i3 + 1] += data.velocity.y + Math.sin(elapsedTime * 1.6 + data.phase) * 0.09;
        positions[i3 + 2] += data.velocity.z;

        // Soft bounce at bounds
        if (Math.abs(positions[i3]) > bounds.x) data.velocity.x *= -1;
        if (Math.abs(positions[i3 + 1]) > bounds.y) data.velocity.y *= -1;
        if (Math.abs(positions[i3 + 2]) > bounds.z) data.velocity.z *= -1;

        // Interactive mouse repulsion in 3D space
        const dx = positions[i3] - mouseWorldX;
        const dy = positions[i3 + 1] - mouseWorldY;
        const distToMouse = Math.hypot(dx, dy);
        if (distToMouse < 170 && distToMouse > 0.1) {
          const repulsion = (1 - distToMouse / 170) * 1.25;
          positions[i3] += (dx / distToMouse) * repulsion;
          positions[i3 + 1] += (dy / distToMouse) * repulsion;
        }

        // Connect nearby nodes with delicate lines
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3;
          const distNodes = Math.hypot(
            positions[i3] - positions[j3],
            positions[i3 + 1] - positions[j3 + 1],
            positions[i3 + 2] - positions[j3 + 2]
          );

          if (distNodes < connectionDist) {
            linePositions[lineVertexIdx++] = positions[i3];
            linePositions[lineVertexIdx++] = positions[i3 + 1];
            linePositions[lineVertexIdx++] = positions[i3 + 2];

            linePositions[lineVertexIdx++] = positions[j3];
            linePositions[lineVertexIdx++] = positions[j3 + 1];
            linePositions[lineVertexIdx++] = positions[j3 + 2];

            connectedLines++;
          }
        }
      }

      pointGeometry.attributes.position.needsUpdate = true;

      lineGeometry.setDrawRange(0, connectedLines * 2);
      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Teardown & Lifecycle Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      pointGeometry.dispose();
      lineGeometry.dispose();
      pointsMaterial.dispose();
      linesMaterial.dispose();
      if (circleTexture) circleTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // React to theme changes smoothly and update colors, fog, and blending
  useEffect(() => {
    const isDark = theme === 'dark';

    // 1. Update Volumetric Fog
    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(
        isDark ? 0x07090e : 0xf4f6fb,
        isDark ? 0.0016 : 0.0014
      );
    }

    // 2. Update Vertex Colors to High-Contrast Palette
    if (pointGeometryRef.current) {
      const targetPalette = isDark ? darkPalette : lightPalette;
      const colorAttr = pointGeometryRef.current.attributes.color;
      const count = colorAttr.count;
      for (let i = 0; i < count; i++) {
        const col = targetPalette[i % targetPalette.length];
        colorAttr.setXYZ(i, col.r, col.g, col.b);
      }
      colorAttr.needsUpdate = true;
    }

    // 3. Update Points Material Opacity & Blending
    if (materialsRef.current.points) {
      materialsRef.current.points.size = isDark ? 6.2 : 5.4;
      materialsRef.current.points.opacity = isDark ? 0.88 : 0.82;
      materialsRef.current.points.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
      materialsRef.current.points.needsUpdate = true;
    }

    // 4. Update Lines Material Opacity & Color
    if (materialsRef.current.lines) {
      materialsRef.current.lines.color.setHex(isDark ? 0x818cf8 : 0x4338ca);
      materialsRef.current.lines.opacity = isDark ? 0.34 : 0.38;
      materialsRef.current.lines.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
      materialsRef.current.lines.needsUpdate = true;
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    />
  );
}
