"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Nuvola di punti molto più ampia, pensata per coprire l'intera pagina
    const COUNT = 420;
    const positions = new Float32Array(COUNT * 3);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12
      );
      points.push(p);
      positions.set([p.x, p.y, p.z], i * 3);
    }

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dotMaterial = new THREE.PointsMaterial({
      color: 0x5fb4dd,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const dots = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dots);

    // Linee tra punti sufficientemente vicini — effetto "rete/circuito"
    const linePositions: number[] = [];
    const MAX_DIST = 2.6;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < MAX_DIST) {
          linePositions.push(points[i].x, points[i].y, points[i].z);
          linePositions.push(points[j].x, points[j].y, points[j].z);
        }
      }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x24455f,
      transparent: true,
      opacity: 0.4,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const group = new THREE.Group();
    group.add(dots);
    group.add(lines);
    scene.add(group);

    let mouseX = 0;
    let mouseY = 0;
    function handleMouseMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", handleMouseMove);

    let frameId: number;
    function animate() {
      frameId = requestAnimationFrame(animate);
      group.rotation.y += 0.0006;
      group.rotation.x += (mouseY * 0.12 - group.rotation.x) * 0.02;
      group.rotation.y += mouseX * 0.0006;
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      dotGeometry.dispose();
      dotMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
