import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';
import helperMethods from '../../helperMethods';

// --- React Component ---
const Scene2DNR = ({ speed }) => {

  const reactCanvas = useRef(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching and Parsing ---
  useEffect(() => {

    helperMethods.fetchAndParseTrajectory("/2d_3_1_d100.csv", setIsLoading, setError, setTrajectoryData, ["r", "psi"]);
  }, []);

  // Add this outside your effect
  const speedRef = useRef(speed);

  // Update the ref when speed changes
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  

  // --- Babylon.js Scene Setup ---
  useEffect(() => {
    // Don't run setup until canvas is ready and data is loaded
    if (!reactCanvas.current || isLoading || error || trajectoryData.length === 0) {
      // If still loading or error, ensure engine isn't created/lingering
      // (Cleanup logic below handles disposal if component unmounts)
      return;
    }

    const engine = new BABYLON.Engine(reactCanvas.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1); // Slightly different background

    // --- Camera (2D View) ---
    // ArcRotateCamera looking straight down (along negative Z)
    const initialRadius = trajectoryData.length > 0 ? (trajectoryData[0].r || 5) * 1.5 : 10; // Sensible default radius
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,         // Alpha: Start facing positive X direction on the right
      0.01,                 // Beta: Look almost straight down (0 can cause issues)
      initialRadius,        // Radius: Initial distance, adjust based on data scale
      BABYLON.Vector3.Zero(),// Target: Origin
      scene
    );

    camera.attachControl(reactCanvas.current, true);
    // Lock camera to 2D view (allow zoom/pan, disable rotation)
    camera.lowerBetaLimit = 0.01; // Prevent looking under the XY plane
    camera.upperBetaLimit = Math.PI * 0.05; // Prevent looking too far up
    camera.lowerRadiusLimit = 1;    // Min zoom
    camera.upperRadiusLimit = 100;  // Max zoom (adjust as needed)
    camera.wheelDeltaPercentage = 0.02; // Zoom speed

    // --- Light ---
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.9;


    // --- Objects ---
    // Nucleus
    const nucleus = BABYLON.MeshBuilder.CreateSphere("nucleus", { diameter: 0.5 }, scene);
    const nucleusMaterial = new BABYLON.StandardMaterial("nucleusMat", scene);

    nucleusMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Reddish
    nucleusMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);

    nucleus.material = nucleusMaterial;
    nucleus.position = BABYLON.Vector3.Zero(); // Ensure it's at the origin

    // Electron
    const electron = BABYLON.MeshBuilder.CreateSphere("electron", { diameter: 0.2 }, scene);
    const electronMaterial = new BABYLON.StandardMaterial("electronMat", scene);
    electronMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1); // Bluish
    electronMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    electron.material = electronMaterial;
    // Initial position set in the animation loop


    // Electron Trail
    const trail = new TrailMesh("electronTrail", electron, scene, 0.1, 5000, true); // Diameter, length, auto-update
    const trailMaterial = new BABYLON.StandardMaterial("trailMat", scene);
    trailMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.7);
    trailMaterial.diffuseColor = trailMaterial.emissiveColor;
    trailMaterial.specularColor = BABYLON.Color3.Black();
    trailMaterial.alpha = 0.6;
    trail.material = trailMaterial;


    // --- Animation ---
    let dataIndex = 0;
    const positionScale = 1.0; // Adjust this multiplier if 'r' values are too small/large

    let frameCounter = 0;
    // const framesPerDataPoint = 1; // Adjust speed: Higher number = Slower

    scene.registerBeforeRender(() => {
      if (trajectoryData.length === 0) return; // Should not happen due to outer check, but safe

      frameCounter++;
      // const frameDelay = Math.max(1, Math.floor(10 / speedRef.current));
      // if (frameCounter >= frameDelay) {
      if (frameCounter >= (1 / speedRef.current)) { // Invert the speed logic
      // if (frameCounter >= speedRef.current) {
      // if (frameCounter >= framesPerDataPoint) {
        frameCounter = 0;

        const currentData = trajectoryData[dataIndex];
        const r = currentData.r * positionScale;
        const psi = currentData.psi; // Use psi angle

        // Convert 2D Polar (r, psi) to 2D Cartesian (x, y)
        // Z coordinate is kept at 0 for 2D
        const x = r * Math.cos(psi);
        const y = r * Math.sin(psi);

        // Update electron position in the XY plane
        electron.position.x = x;
        electron.position.y = y;
        electron.position.z = 0; // Keep Z fixed at 0

        dataIndex = (dataIndex + 1) % trajectoryData.length;
      }
    });

    // --- Render Loop ---
    engine.runRenderLoop(() => {
      scene.render();
    });

    // --- Resize Handling ---
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      console.log("Cleaning up Babylon scene (2DNR)");
      window.removeEventListener('resize', handleResize);
      // Ensure scene and engine exist before disposing
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
    };
    // Rerun effect if data loading finishes (isLoading changes) or if error state changes
  }, [isLoading, error, trajectoryData]); // Depend on loading/error state and data


  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && <div style={loadingErrorStyle}>Loading trajectory data...</div>}
      {error && <div style={loadingErrorStyle}>Error: {error}</div>}
      <canvas
        ref={reactCanvas}
        style={{ width: '100%', height: '100%', display: (isLoading || error) ? 'none' : 'block', outline: 'none' }}
        touch-action="none" // For better touch interaction with camera panning/zooming
      />
    </div>
  );
};

// Basic style for loading/error messages
const loadingErrorStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white',
  fontSize: '1.5em',
  backgroundColor: 'rgba(0,0,0,0.7)',
  padding: '20px',
  borderRadius: '8px',
  zIndex: 10
};


export default Scene2DNR;