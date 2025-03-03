// src/BabylonScene.js
import React, { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, /*HemisphericLight,*/ MeshBuilder, StandardMaterial, Texture, Color3 } from '@babylonjs/core';
import "@babylonjs/loaders/glTF"; // Import glTF loader

const BabylonScene = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null); // Store the engine instance

    useEffect(() => {
      const createScene = async () => { // Use async/await for cleaner code
        if (!canvasRef.current) return;

        // Create the Babylon.js engine.  Use 'canvasRef.current' directly.
        const engine = new Engine(canvasRef.current, true);
        engineRef.current = engine; // Store engine in ref

        // Create a new scene.
        const scene = new Scene(engine);

        // Create a camera, and set its position.
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new Vector3(0, 0, 0), scene);
        camera.attachControl(canvasRef.current, true); // Attach the camera to the canvas

        // Create a light.
        // const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

        // Create a simple box (you can replace this with a loaded model).
        const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);

        //Optional, but highly recommended:  Add a material for better visuals.
        const material = new StandardMaterial("boxMat", scene);
        material.diffuseColor = new Color3(0.4, 0.4, 0.4);  // Gray color
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        box.material = material; // Assign the material to the box

        //Example of adding a simple ground plane
        const ground = MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
        const groundMat = new StandardMaterial("groundMat", scene);
        groundMat.diffuseTexture = new Texture("https://www.babylonjs-playground.com/textures/grass.png", scene); // Use an online texture
		ground.material = groundMat;

        //Import a glTF model (comment out the box creation if using this)
        //const { meshes } = await SceneLoader.ImportMeshAsync("", "path/to/your/model/", "model.glb", scene);

        // Start the Babylon.js engine's render loop.
        engine.runRenderLoop(() => {
          if (scene) {
            scene.render();
          }
        });
        // Handle window resize
        const handleResize = () => {
          if(engineRef.current) { // Check if engine exists before resizing
            engineRef.current.resize();
          }
        };
        window.addEventListener('resize', handleResize);

		// Cleanup on unmount.  Very important!
		return () => {
			window.removeEventListener('resize', handleResize);
			if (engineRef.current) {
				engineRef.current.dispose();
			}
		};
    }
    createScene();

  }, []); // The empty dependency array [] ensures this useEffect runs only once (on mount).

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100vh' }} // Make the canvas fill the window.
    />
  );
};

export default BabylonScene;