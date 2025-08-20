import React, { useEffect, useRef, useState } from "react";

const Scene2DR = () => {
  const canvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const nucleusRadius = 10;
    const nucleusColor = "red";
    const electronRadius = 3;
    const electronColor = "blue";
    const numElectrons = 3;
    const orbitRadius = 50;
    const electronSpeed = 0.02;
    let electronAngles = Array(numElectrons)
      .fill(0)
      .map(() => Math.random() * 2 * Math.PI);

    function drawGrid() {
      const spacing = 50;
      ctx.strokeStyle = "#ddd";
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    function drawAxes() {
      ctx.strokeStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(Math.floor(width / 2), 0);
      ctx.lineTo(Math.floor(width / 2), height);
      ctx.moveTo(0, Math.floor(height / 2));
      ctx.lineTo(width, Math.floor(height / 2));
      ctx.stroke();
    }

    function drawNucleus() {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, nucleusRadius, 0, 2 * Math.PI);
      ctx.fillStyle = nucleusColor;
      ctx.fill();
    }

    function drawElectron(angle, orbitRadius) {
      const x = width / 2 + orbitRadius * Math.cos(angle);
      const y = height / 2 + orbitRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, electronRadius, 0, 2 * Math.PI);
      ctx.fillStyle = electronColor;
      ctx.fill();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      if (showGrid) drawGrid();
      if (showAxes) drawAxes();
      drawNucleus();
      for (let i = 0; i < numElectrons; i++) {
        electronAngles[i] += electronSpeed;
        const actualOrbitRadius = orbitRadius + i * 10;
        drawElectron(electronAngles[i], actualOrbitRadius);
      }
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [showGrid, showAxes]);

  return (
    <div>
      <button onClick={() => setShowGrid(!showGrid)}>Toggle Grid</button>
      <button onClick={() => setShowAxes(!showAxes)}>Toggle Axes</button>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
    </div>
  );
};

export default Scene2DR;
