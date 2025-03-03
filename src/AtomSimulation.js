// src/AtomSimulation.js
import React, { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  /*HemisphericLight,*/
  MeshBuilder,
  StandardMaterial,
  Color3,
  Animation,
  SineEase,
  EasingFunction
} from '@babylonjs/core';

const AtomSimulation = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const createScene = () => {
      if (!canvasRef.current) return;

      const engine = new Engine(canvasRef.current, true);
      engineRef.current = engine;
      const scene = new Scene(engine);

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 5;  // Prevent zooming too close
      camera.upperRadiusLimit = 50; // Prevent zooming too far

      // const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

      // --- Atom Creation ---

      // Nucleus (sphere)
      const nucleus = MeshBuilder.CreateSphere("nucleus", { diameter: 2 }, scene);
      const nucleusMaterial = new StandardMaterial("nucleusMat", scene);
      nucleusMaterial.diffuseColor = new Color3(1, 0, 0); // Red nucleus
      nucleusMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
      nucleus.material = nucleusMaterial;

      // Electrons (smaller spheres)
      const numElectrons = 3; // Change the number of electrons
      const electrons = [];
      const electronPaths = []; // Store the paths for animation

      for (let i = 0; i < numElectrons; i++) {
        const electron = MeshBuilder.CreateSphere(`electron${i}`, { diameter: 0.5 }, scene);
        const electronMaterial = new StandardMaterial(`electronMat${i}`, scene);
        electronMaterial.diffuseColor = new Color3(0, 0.5, 1); // Blue electrons
        electron.material = electronMaterial;
        electrons.push(electron);

        // Define an elliptical path for each electron
        const radiusX = 4 + i * 0.8; // Vary the radius for each electron
        const radiusZ = 2 + i * 0.4;
        const path = [];
        const numPoints = 50;  // Number of points to define the ellipse
        for (let j = 0; j <= numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const x = radiusX * Math.cos(angle);
          const z = radiusZ * Math.sin(angle);
          //Add a little variation to the y axis to separate the orbital paths
          const y = Math.sin(angle * (i + 1)) * 0.5;
          path.push(new Vector3(x, y, z));
        }
		electronPaths.push(path);

        // --- Animation ---
        const frameRate = 30; // Frames per second

        // Animate the electron along the defined path
        const electronAnimation = new Animation(
          `electronAnimation${i}`,
          "position",
          frameRate,
          Animation.ANIMATIONTYPE_VECTOR3,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keyFrames = [];
        for (let p = 0; p < path.length; p++) {
          keyFrames.push({ frame: p, value: path[p] });
        }

        electronAnimation.setKeys(keyFrames);

        // Add easing (optional, but makes the animation look nicer)
        const easingFunction = new SineEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        electronAnimation.setEasingFunction(easingFunction);


        electron.animations.push(electronAnimation);
        scene.beginAnimation(electron, 0, path.length, true); // Loop the animation

      }

       // --- Optional: Draw the orbital paths as lines (for visualization) ---
       for (const path of electronPaths){
            const lines = MeshBuilder.CreateLines("lines", {points: path}, scene);
            lines.color = new Color3(0.7, 0.7, 0.7);
       }

      engine.runRenderLoop(() => {
        if (scene) {
          scene.render();
        }
      });

      const handleResize = () => {
        if (engineRef.current) {
          engineRef.current.resize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (engineRef.current) {
          engineRef.current.dispose();
        }
      };
    };

    createScene();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
};

export default AtomSimulation;