import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 80;
const MAX_DIST = 150;

export function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0b0f14, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    camera.position.z = 400;

    // Nodes
    type NodeData = { mesh: THREE.Mesh; vel: THREE.Vector3 };
    const nodes: NodeData[] = [];
    const nodeGeo = new THREE.SphereGeometry(2, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x38e6c6,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < NODE_COUNT; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 200,
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        0,
      );
      nodes.push({ mesh, vel });
      scene.add(mesh);
    }

    // Lines geometry (dynamic)
    const maxLines = NODE_COUNT * NODE_COUNT;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3),
    );
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
      }),
    );
    scene.add(lineMat);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Move nodes
      for (const n of nodes) {
        n.mesh.position.add(n.vel);
        if (Math.abs(n.mesh.position.x) > 410) n.vel.x *= -1;
        if (Math.abs(n.mesh.position.y) > 310) n.vel.y *= -1;
      }

      // Update lines
      let lineIdx = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = nodes[i].mesh.position.distanceTo(
            nodes[j].mesh.position,
          );
          if (dist < MAX_DIST) {
            const alpha = 1 - dist / MAX_DIST;
            const base = lineIdx * 6;
            linePositions[base] = nodes[i].mesh.position.x;
            linePositions[base + 1] = nodes[i].mesh.position.y;
            linePositions[base + 2] = nodes[i].mesh.position.z;
            linePositions[base + 3] = nodes[j].mesh.position.x;
            linePositions[base + 4] = nodes[j].mesh.position.y;
            linePositions[base + 5] = nodes[j].mesh.position.z;
            // Color: teal to green
            lineColors[base] = 0.145 * alpha;
            lineColors[base + 1] = 0.9 * alpha;
            lineColors[base + 2] = 0.776 * alpha;
            lineColors[base + 3] = 0.145 * alpha;
            lineColors[base + 4] = 0.9 * alpha;
            lineColors[base + 5] = 0.776 * alpha;
            lineIdx++;
          }
        }
      }

      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="three-bg" />;
}
