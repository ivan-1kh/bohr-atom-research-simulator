import React, { useEffect, useRef } from 'react';

const Scene2DR = () => {
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const nucleusRadius = 10;
    const nucleusColor = 'red';
    const electronRadius = 3;
    const electronColor = 'blue';
    const numElectrons = 3; // You can change this
    const orbitRadius = 50;
    const electronSpeed = 0.02; // Adjust for speed
    let electronAngles = Array(numElectrons).fill(0).map(() => Math.random() * 2 * Math.PI); // Initial random angles

    function drawNucleus() {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, nucleusRadius, 0, 2 * Math.PI);
      ctx.fillStyle = nucleusColor;
      ctx.fill();
      ctx.closePath();
    }

    function drawElectron(angle, orbitRadius) {
        const x = width / 2 + orbitRadius * Math.cos(angle);
        const y = height / 2 + orbitRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, electronRadius, 0, 2 * Math.PI);
        ctx.fillStyle = electronColor;
        ctx.fill();
        ctx.closePath();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height); // Clear canvas before drawing

      drawNucleus();

      // Update electron positions and draw them
      for (let i = 0; i < numElectrons; i++) {
        electronAngles[i] += electronSpeed;
        // Vary the orbit radius a little for each electron.
        const actualOrbitRadius = orbitRadius + (i * 10);
        drawElectron(electronAngles[i], actualOrbitRadius);
      }

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100vh', display: 'block' }} // Important: display: block removes extra space
    />
  );
};

export default Scene2DR;
