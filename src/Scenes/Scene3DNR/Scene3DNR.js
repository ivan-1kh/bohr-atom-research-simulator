import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';
import helperMethods from '../../helperMethods';

// --- React Component ---
const Scene3DNR = ({ speed }) => {

  const reactCanvas = useRef(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching and Parsing ---
  useEffect(() => {
    helperMethods.fetchAndParseTrajectory("/3d_1_1_1.csv", setIsLoading, setError, setTrajectoryData, ["r", "phi", "theta"]);
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
    // camera.lowerBetaLimit = Math.PI / 2; // Prevent looking under the XY plane
    // // camera.lowerBetaLimit = 0.01; // Prevent looking under the XY plane
    // camera.upperBetaLimit = Math.PI / 2; // * 0.05; // Prevent looking too far up

    // camera.lowerAlphaLimit = Math.PI / 2;
    // camera.upperAlphaLimit = Math.PI / 2;
    // camera.lowerAlphaLimit = Math.PI / 4;

    camera.lowerRadiusLimit = 5;    // Min zoom
    camera.upperRadiusLimit = 100;  // Max zoom (adjust as needed)
    camera.wheelDeltaPercentage = 0.02; // Zoom speed

    // --- Light ---
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // --- Create Coordinate Axes ---
    createCoordinateAxes(scene, initialRadius);

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
    const trail = new TrailMesh("electronTrail", electron, scene, 0.025, 5000, true); // Diameter, length, auto-update
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
      // Should not happen if this registration is conditional on trajectoryData.length > 0,
      // but it's a safe check.
      if (!trajectoryData || trajectoryData.length === 0) {
        return;
      }
    
      frameCounter++; // Assuming frameCounter is declared outside and persists between frames
    
      // Determine how many render frames to wait before advancing to the next data point.
      // This inverts the speed logic: higher speedRef means fewer frames per data point.
      // Ensure frameDelay is at least 1.
      const frameDelay = Math.max(1, Math.floor(1 / speedRef.current));
    
      if (frameCounter >= frameDelay) {
        frameCounter = 0; // Reset frame counter
    
        // Get the current data point for position update
        const currentData = trajectoryData[dataIndex];
    
        // Retrieve spherical coordinates from the data
        const r = currentData.r * positionScale; // Apply scaling to the radial distance
        const phi = currentData.phi;     // Azimuthal angle (typically in XY plane)
        const theta = currentData.theta; // Polar angle (typically from Z axis)
    
        // Convert 3D Spherical (r, phi, theta) to 3D Cartesian (x, y, z)
        // x = r * sin(theta) * cos(phi)
        // y = r * sin(theta) * sin(phi)
        // z = r * cos(theta)
        const sinTheta = Math.sin(theta);
        const x = r * sinTheta * Math.cos(phi);
        const y = r * sinTheta * Math.sin(phi);
        const z = r * Math.cos(theta);
    
        // Update electron position in 3D space
        electron.position.x = x;
        electron.position.y = y;
        electron.position.z = z;
    
        // Move to the next data point, wrapping around if necessary
        dataIndex = (dataIndex + 1) % trajectoryData.length; // Assuming dataIndex is declared outside
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

  // Function to create coordinate axes with grid
  const createCoordinateAxes = (scene, size) => {
    // Create grid in the XY plane (much larger area)
    createGrid(scene, 200); // Fixed large grid size of 200 units in each direction
  };
  
  // Function to create a grid in the XY plane
  const createGrid = (scene, size) => {
    // Grid parameters
    const gridSize = size; // Fixed at 200 units
    const majorLineCount = 20; // Number of major grid lines in each direction (increased)
    const minorLinesPerMajor = 4; // Number of minor lines between major lines
    
    // Calculate spacing
    const majorSpacing = gridSize / majorLineCount;
    const minorSpacing = majorSpacing / (minorLinesPerMajor + 1);
    
    // Create materials
    const majorMaterial = new BABYLON.StandardMaterial("majorGridMat", scene);
    majorMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    majorMaterial.alpha = 0.5;
    
    const minorMaterial = new BABYLON.StandardMaterial("minorGridMat", scene);
    minorMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    minorMaterial.alpha = 0.15;
    
    // Calculate total lines (including negative space)
    const totalLines = majorLineCount * 2; // Cover both positive and negative space
    
    // Create grid lines
    const lines = [];
    
    // Create grid lines along X and Y axes
    for (let i = -majorLineCount; i <= majorLineCount; i++) {
      const isMajor = i % 1 === 0; // Every whole number is a major line
      
      if (isMajor) {
        // Create major line - along X axis
        const lineX = BABYLON.MeshBuilder.CreateLines(`gridLineX${i}`, {
          points: [
            new BABYLON.Vector3(i * majorSpacing, -gridSize, 0),
            new BABYLON.Vector3(i * majorSpacing, gridSize, 0)
          ]
        }, scene);
        
        // Create major line - along Y axis
        const lineY = BABYLON.MeshBuilder.CreateLines(`gridLineY${i}`, {
          points: [
            new BABYLON.Vector3(-gridSize, i * majorSpacing, 0),
            new BABYLON.Vector3(gridSize, i * majorSpacing, 0)
          ]
        }, scene);
        
        // Apply material
        lineX.color = majorMaterial.diffuseColor;
        lineY.color = majorMaterial.diffuseColor;
        
        // Make origin lines thicker and fully opaque
        if (i === 0) {
          lineX.color = new BABYLON.Color3(0.7, 0.7, 0.7);
          lineY.color = new BABYLON.Color3(0.7, 0.7, 0.7);
        }
        
        lines.push(lineX, lineY);
        
        // Add minor lines
        if (i < majorLineCount) {
          for (let j = 1; j <= minorLinesPerMajor; j++) {
            const minorPos = i * majorSpacing + j * minorSpacing;
            
            // Minor line - along X axis
            const minorLineX = BABYLON.MeshBuilder.CreateLines(`gridMinorLineX${i}_${j}`, {
              points: [
                new BABYLON.Vector3(minorPos, -gridSize, 0),
                new BABYLON.Vector3(minorPos, gridSize, 0)
              ]
            }, scene);
            
            // Minor line - along Y axis
            const minorLineY = BABYLON.MeshBuilder.CreateLines(`gridMinorLineY${i}_${j}`, {
              points: [
                new BABYLON.Vector3(-gridSize, minorPos, 0),
                new BABYLON.Vector3(gridSize, minorPos, 0)
              ]
            }, scene);
            
            // Apply material
            minorLineX.color = minorMaterial.diffuseColor;
            minorLineY.color = minorMaterial.diffuseColor;
            
            lines.push(minorLineX, minorLineY);
          }
        }
      }
    }
  };

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


export default Scene3DNR;