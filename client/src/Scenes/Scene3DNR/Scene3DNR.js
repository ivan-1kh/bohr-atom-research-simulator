import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import helperMethods from "../../helperMethods";

/**
 * Renders a 3D particle trajectory simulation using Babylon.js.
 * The scene displays a central nucleus and an orbiting electron, whose path is traced in 3D space.
 * The user can toggle the visibility of the coordinate axes and the ground grid.
 *
 * @param {object} props - The component props.
 * @param {number} props.speed - The playback speed of the simulation.
 * @returns {JSX.Element} The canvas element for the Babylon.js scene and UI controls.
 */
const Scene3DNR = ({ speed, quantumNumbers, setIncludeM, reload }) => {
  // A reference to the canvas element where the scene will be rendered.
  const reactCanvas = useRef(null);
  
  // --- State Management ---
  
  // State for storing the parsed 3D trajectory data from the CSV file.
  const [trajectoryData, setTrajectoryData] = useState([]);
  // State to manage the loading status while fetching data.
  const [isLoading, setIsLoading] = useState(true);
  // State to hold any potential errors during data fetching.
  const [error, setError] = useState(null);
  // State to control the pause/resume functionality of the animation.
  const [paused, setPaused] = useState(false);
  // State to toggle the visibility of the XYZ axes.
  const [showAxes, setShowAxes] = useState(true);
  // State to toggle the visibility of the ground grid.
  const [showGrid, setShowGrid] = useState(true);

  // --- Refs for Mutable Data and Scene Objects ---

  // Refs to hold values that can change without re-rendering the component.
  const speedRef = useRef(speed); // Holds the current animation speed.
  const pausedRef = useRef(paused); // Holds the current paused state for access within the render loop.

  // Refs for managing pause timing to ensure smooth resume.
  const pauseStartTimeRef = useRef(null); // Timestamp when pause began.
  const pausedDurationRef = useRef(0); // Total accumulated duration of all pauses.
  const startTimeRef = useRef(performance.now()); // Timestamp when the animation started.
  
  // Refs to hold references to Babylon.js meshes for manipulation outside the main setup effect.
  const axisMeshesRef = useRef([]); // Holds all meshes related to the axes.
  const groundRef = useRef(null); // Holds the ground mesh.

  // --- Effects ---

  // Effect to synchronize the `paused` state with its ref equivalent.
  // This allows the render loop to access the current pause state without re-running the effect.
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      // Record the time when the animation is paused.
      pauseStartTimeRef.current = performance.now();
    } else {
      // When resuming, calculate the duration of the pause and add it to the total.
      if (pauseStartTimeRef.current) {
        pausedDurationRef.current +=
          performance.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }
    }
  }, [paused]);

  // Effect to fetch and parse the trajectory data when the component mounts.
  useEffect(() => {
    setIncludeM(true);
    helperMethods.fetchAndParseTrajectory(
      `/trajectory_data/3d/nr/${quantumNumbers.n}_${quantumNumbers.k}_${quantumNumbers.m}.csv`,
      setIsLoading,
      setError,
      setTrajectoryData,
      ["r", "phi", "theta"] // Columns to parse from the CSV.
    );
  }, [reload]);
  
  // Effect to update the speed ref whenever the `speed` prop changes.
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Main effect for initializing and running the Babylon.js scene.
  // This effect re-runs only if the data loading state changes.
  useEffect(() => {
    // Exit if the canvas is not yet available or if data is not ready.
    if (
      !reactCanvas.current ||
      isLoading ||
      error ||
      trajectoryData.length === 0
    ) {
      return;
    }

    // --- Scene Setup ---

    const engine = new BABYLON.Engine(reactCanvas.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1);

    // --- Camera and Lighting ---

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 4, // Initial horizontal rotation
      Math.PI / 4, // Initial vertical rotation
      10, // Initial distance from the target
      BABYLON.Vector3.Zero(), // Target point
      scene
    );
    camera.attachControl(reactCanvas.current, true);

    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 200;


    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1;

    // --- Mesh Creation ---

    const nucleus = BABYLON.MeshBuilder.CreateSphere(
      "nucleus", { diameter: 0.5, segments: 16 }, scene
    );
    nucleus.material = new BABYLON.StandardMaterial("nucleusMaterial", scene);
    nucleus.material.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue

    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron", { diameter: 0.2, segments: 16 }, scene
    );
    electron.material = new BABYLON.StandardMaterial("electronMaterial", scene);
    electron.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

    // Create the ground plane with a grid material.
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground", { width: 200, height: 200 }, scene
    );
    groundRef.current = ground; // Store reference for toggling visibility.

    const gridMaterial = new GridMaterial("gridMaterial", scene);
    gridMaterial.majorUnitFrequency = 5;
    gridMaterial.gridRatio = 1;
    gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    gridMaterial.lineColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    gridMaterial.opacity = 0.98;
    ground.material = gridMaterial;

    // --- Axes and Labels ---
    
    const axisLength = 100;
    const axisMeshes = [];

    // X-Axis (Red)
    const axisX = BABYLON.MeshBuilder.CreateLines("axisX", { points: [ new BABYLON.Vector3(-axisLength, 0, 0), new BABYLON.Vector3(axisLength, 0, 0), ]}, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    axisMeshes.push(axisX);

    // Y-Axis (Green)
    const axisY = BABYLON.MeshBuilder.CreateLines("axisY", { points: [ new BABYLON.Vector3(0, -axisLength, 0), new BABYLON.Vector3(0, axisLength, 0), ]}, scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    axisMeshes.push(axisY);

    // Z-Axis (Blue)
    const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", { points: [ new BABYLON.Vector3(0, 0, -axisLength), new BABYLON.Vector3(0, 0, axisLength), ]}, scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    axisMeshes.push(axisZ);

    // Add ticks and labels to all axes.
    for (let i = -axisLength; i <= axisLength; i++) {
      if (i === 0) continue;

      // X-axis ticks & labels
      const tickX = BABYLON.MeshBuilder.CreateLines("tickX" + i, { points: [ new BABYLON.Vector3(i, -0.1, 0), new BABYLON.Vector3(i, 0.1, 0), ]}, scene);
      tickX.color = new BABYLON.Color3(1, 0, 0);
      axisMeshes.push(tickX);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(i, 0.2, 0)));

      // Y-axis ticks & labels
      const tickY = BABYLON.MeshBuilder.CreateLines("tickY" + i, { points: [ new BABYLON.Vector3(-0.1, i, 0), new BABYLON.Vector3(0.1, i, 0), ]}, scene);
      tickY.color = new BABYLON.Color3(0, 1, 0);
      axisMeshes.push(tickY);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(0.2, i, 0)));
      
      // Z-axis ticks & labels
      const tickZ = BABYLON.MeshBuilder.CreateLines("tickZ" + i, { points: [ new BABYLON.Vector3(0, -0.1, i), new BABYLON.Vector3(0, 0.1, i), ]}, scene);
      tickZ.color = new BABYLON.Color3(0, 0, 1);
      tickZ.rotation.y = Math.PI / 2; // Rotate to be perpendicular to Z-axis
      axisMeshes.push(tickZ);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(0.2, 0, i)));
    }
    axisMeshesRef.current = axisMeshes; // Store references for toggling visibility.


    // --- Helper Functions ---

    /**
     * Converts 3D spherical coordinates (r, phi, theta) to Cartesian coordinates (x, y, z).
     * @param {number} r - The radial distance (radius).
     * @param {number} phi - The azimuthal angle (rotation around Y-axis).
     * @param {number} theta - The polar angle (inclination from Y-axis).
     * @returns {BABYLON.Vector3} The corresponding Cartesian vector.
     */
    function sphericalToCartesian(r, phi, theta) {
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);
      return new BABYLON.Vector3(x, y, z);
    }

    /**
     * Creates a text label on a plane that always faces the camera.
     * @param {string} text - The text to display.
     * @param {BABYLON.Vector3} position - The position for the label.
     * @returns {BABYLON.Mesh} The plane mesh with the text texture.
     */
    function createTextLabel(text, position) {
      const dynamicTexture = new BABYLON.DynamicTexture("dynamic texture", 64, scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", "white", "transparent", true);

      const plane = BABYLON.MeshBuilder.CreatePlane("textPlane", { size: 0.5 }, scene);
      plane.material = new BABYLON.StandardMaterial("textPlaneMaterial", scene);
      plane.material.diffuseTexture = dynamicTexture;
      plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
      plane.material.backFaceCulling = false;
      plane.position = position.clone();
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // Ensures text always faces the camera
      return plane;
    }

    // --- Animation Loop ---

    scene.registerBeforeRender(() => {
      if (pausedRef.current) return;

      const currentTime = performance.now();
      const elapsedTime = (currentTime - startTimeRef.current - pausedDurationRef.current) / 1000;

      const totalSteps = trajectoryData.length;
      const stepsPerSecond = speedRef.current * 10;
      const totalProgress = elapsedTime * stepsPerSecond;
      
      const index = Math.floor(totalProgress) % totalSteps;
      const nextIndex = (index + 1) % totalSteps;
      const t = totalProgress - Math.floor(totalProgress); // Interpolation factor

      const currentData = trajectoryData[index];
      const nextData = trajectoryData[nextIndex];

      const currentPos = sphericalToCartesian(currentData.r, currentData.phi, currentData.theta);
      const nextPos = sphericalToCartesian(nextData.r, nextData.phi, nextData.theta);
      
      // Linearly interpolate between points for smooth motion.
      const interpolatedPos = BABYLON.Vector3.Lerp(currentPos, nextPos, t);
      electron.position = interpolatedPos;
    });

    // --- Render and Cleanup ---

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isLoading, error, trajectoryData]);

  // Effect to toggle axis visibility when the `showAxes` state changes.
  useEffect(() => {
    axisMeshesRef.current.forEach((mesh) => {
      mesh.setEnabled(showAxes);
    });
  }, [showAxes]);

  // Effect to toggle grid visibility when the `showGrid` state changes.
  useEffect(() => {
    if (groundRef.current) {
      groundRef.current.setEnabled(showGrid);
    }
  }, [showGrid]);

  // --- JSX ---
  
  return (
    <>
      {/* UI Controls */}
      <button onClick={() => setPaused((prev) => !prev)} style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, padding: "10px", cursor: "pointer" }} >
        {paused ? "Resume" : "Pause"}
      </button>
      <button onClick={() => setShowAxes((prev) => !prev)} style={{ position: "absolute", top: "60px", left: "10px", zIndex: 10, padding: "10px", cursor: "pointer" }} >
        {showAxes ? "Hide Axes" : "Show Axes"}
      </button>
      <button onClick={() => setShowGrid((prev) => !prev)} style={{ position: "absolute", top: "110px", left: "10px", zIndex: 10, padding: "10px", cursor: "pointer" }} >
        {showGrid ? "Hide Grid" : "Show Grid"}
      </button>

      {/* Canvas for Babylon.js Scene */}
      <canvas
        ref={reactCanvas}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
    </>
  );
};

export default Scene3DNR;