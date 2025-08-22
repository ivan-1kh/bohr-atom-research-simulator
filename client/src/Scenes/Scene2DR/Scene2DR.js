import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import helperMethods from "../../helperMethods";

/**
 * Renders a 2D particle trajectory simulation using Babylon.js.
 * The scene displays a central nucleus and an orbiting electron, whose path is traced.
 * Camera controls are locked to 2D panning only.
 *
 * @param {object} props - The component props.
 * @param {number} props.speed - The playback speed of the simulation.
 * @returns {JSX.Element} The canvas element for the Babylon.js scene and UI controls.
 */
const Scene2DR = ({ speed, quantumNumbers, setIncludeM, reload }) => {
  // A reference to the canvas element where the scene will be rendered.
  const reactCanvas = useRef(null);

  // State for storing the parsed trajectory data from the CSV file.
  const [trajectoryData, setTrajectoryData] = useState([]);
  // State to manage the loading status while fetching data.
  const [isLoading, setIsLoading] = useState(true);
  // State to hold any potential errors during data fetching.
  const [error, setError] = useState(null);
  // State to toggle the visibility of the grid and axes.
  const [showAxesAndGrid, setShowAxesAndGrid] = useState(true);
  // State to control the pause/resume functionality of the animation.
  const [paused, setPaused] = useState(false);
  // State for the real-time psi graph data
  const [psiGraphData, setPsiGraphData] = useState([]);

  // Refs to hold values that can change without re-rendering the component.
  const speedRef = useRef(speed); // Holds the current animation speed.
  const pausedRef = useRef(paused); // Holds the current paused state.

  // Refs for managing pause timing to ensure smooth resume.
  const pauseStartTimeRef = useRef(null); // Timestamp when pause began.
  const pausedDurationRef = useRef(0); // Total accumulated duration of all pauses.
  const startTimeRef = useRef(performance.now()); // Timestamp when the animation started.

  // Ref to track r_max for the graph
  const rMaxRef = useRef(0);

  // Effect to synchronize the `paused` state with its ref equivalent.
  // This allows the render loop (which is not a React component) to access the current pause state.
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
    setIncludeM(false);
    helperMethods.fetchAndParseTrajectory(
      `/trajectory_data/2d/rel/${quantumNumbers.n}_${quantumNumbers.k}.csv`,
      setIsLoading,
      setError,
      setTrajectoryData,
      ["r", "psi", "delta_psi"] // Columns to parse from the CSV.
    );
  }, [reload]);

  // Calculate r_max when trajectory data changes
  useEffect(() => {
    if (trajectoryData.length > 0) {
      const maxR = Math.max(...trajectoryData.map(point => point.r));
      rMaxRef.current = maxR;
      // Reset graph data when new trajectory is loaded
      setPsiGraphData([]);
    }
  }, [trajectoryData]);
  
  // Effect to update the speed ref whenever the `speed` prop changes.
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Main effect for initializing and running the Babylon.js scene.
  // This effect re-runs if data loading completes or if the grid visibility changes.
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

    // Initialize the Babylon.js engine.
    const engine = new BABYLON.Engine(reactCanvas.current, true);
    // Create a new scene.
    const scene = new BABYLON.Scene(engine);
    // Set a dark blue background color.
    scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1);

    // --- Camera Setup: 2D Panning Only ---

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2, // Horizontal angle (alpha)
      Math.PI / 2,  // Vertical angle (beta) -> top-down view
      20,           // Radius (distance from target)
      BABYLON.Vector3.Zero(), // Target point
      scene
    );

    // **Lock camera to 2D panning.**
    // By setting the lower and upper limits of rotation and zoom to the same value,
    // we effectively disable those actions, leaving only panning enabled.
    camera.lowerAlphaLimit = -Math.PI / 2;
    camera.upperAlphaLimit = -Math.PI / 2;
    camera.lowerBetaLimit = Math.PI / 2;
    camera.upperBetaLimit = Math.PI / 2;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 200;

    // Attach camera controls to the canvas. Panning is typically done with
    // the middle mouse button or Ctrl + left mouse button.
    camera.attachControl(reactCanvas.current, true);

    // --- Lighting ---

    // Add a hemispheric light to illuminate the scene evenly.
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1;

    // --- Mesh Creation ---

    // Create the central nucleus sphere.
    const nucleus = BABYLON.MeshBuilder.CreateSphere(
      "nucleus",
      { diameter: 0.5, segments: 16 },
      scene
    );
    nucleus.material = new BABYLON.StandardMaterial("nucleusMaterial", scene);
    nucleus.material.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue color

    // Create the electron sphere.
    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron",
      { diameter: 0.2, segments: 16 },
      scene
    );
    const electronMaterial = new BABYLON.StandardMaterial(
      "electronMaterial",
      scene
    );
    electronMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue color
    electron.material = electronMaterial;

    // Set the initial position of the electron based on the first data point.
    const initialData = trajectoryData[0];
    electron.position = sphericalToCartesian(initialData.r, initialData.psi);
    electron.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
    

    // Create a ground plane with a grid material to serve as a reference.
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 200, height: 200 },
      scene
    );
    const gridMaterial = new GridMaterial("gridMaterial", scene);
    gridMaterial.majorUnitFrequency = 1;
    gridMaterial.minorUnitVisibility = 0.45;
    gridMaterial.gridRatio = 1;
    gridMaterial.backFaceCulling = false;
    gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    gridMaterial.lineColor = new BABYLON.Color3(1, 1, 1);
    gridMaterial.opacity = 0.98;
    ground.material = gridMaterial;
    ground.rotation.x = Math.PI / 2; // Rotate to be flat on the X-Y plane.

    // --- Axes and Labels ---

    // An array to hold all meshes related to axes for easy visibility toggling.
    const axisMeshes = [];
    const axisLength = 100;

    // Create X-Axis (Red)
    const axisX = BABYLON.MeshBuilder.CreateLines(
      "axisX", {
        points: [
          new BABYLON.Vector3(-axisLength, 0, 0),
          new BABYLON.Vector3(axisLength, 0, 0),
        ],
      }, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    axisMeshes.push(axisX);

    // Create Y-Axis (Green)
    const axisY = BABYLON.MeshBuilder.CreateLines(
      "axisY", {
        points: [
          new BABYLON.Vector3(0, -axisLength, 0),
          new BABYLON.Vector3(0, axisLength, 0),
        ],
      }, scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    axisMeshes.push(axisY);
    
    // Add ticks and labels to the axes.
    for (let i = -axisLength; i <= axisLength; i++) {
        if (i === 0) continue;
        // X-axis ticks and labels
        const tickX = BABYLON.MeshBuilder.CreateLines("tickX" + i, { points: [new BABYLON.Vector3(i, -0.1, 0), new BABYLON.Vector3(i, 0.1, 0)]}, scene);
        tickX.color = new BABYLON.Color3(1, 0, 0);
        axisMeshes.push(tickX);
        const labelX = createTextLabel(`${i}`, new BABYLON.Vector3(i, 0.2, 0), scene);
        axisMeshes.push(labelX);

        // Y-axis ticks and labels
        const tickY = BABYLON.MeshBuilder.CreateLines("tickY" + i, { points: [new BABYLON.Vector3(-0.1, i, 0), new BABYLON.Vector3(0.1, i, 0)]}, scene);
        tickY.color = new BABYLON.Color3(0, 1, 0);
        axisMeshes.push(tickY);
        const labelY = createTextLabel(`${i}`, new BABYLON.Vector3(0.2, i, 0), scene);
        axisMeshes.push(labelY);
    }

    // --- Helper Functions ---

    /**
     * Converts 2D spherical coordinates (r, psi) to Cartesian coordinates (x, y, z).
     * @param {number} r - The radial distance.
     * @param {number} psi - The angle in radians.
     * @returns {BABYLON.Vector3} The corresponding Cartesian vector.
     */
    function sphericalToCartesian(r, psi) {
      const x = r * Math.cos(psi);
      const y = r * Math.sin(psi);
      return new BABYLON.Vector3(x, y, 0); // Z is always 0 for 2D.
    }

    /**
     * Creates a text label on a plane in the scene.
     * @param {string} text - The text to display.
     * @param {BABYLON.Vector3} position - The position for the label.
     * @param {BABYLON.Scene} scene - The scene to add the label to.
     * @returns {BABYLON.Mesh} The plane mesh with the text texture.
     */
    function createTextLabel(text, position, scene) {
        const dynamicTexture = new BABYLON.DynamicTexture("dynamic texture", 64, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", "white", "transparent", true);

        const plane = BABYLON.MeshBuilder.CreatePlane("textPlane", { size: 0.5 }, scene);
        plane.material = new BABYLON.StandardMaterial("textPlaneMaterial", scene);
        plane.material.diffuseTexture = dynamicTexture;
        plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        plane.material.backFaceCulling = false;
        plane.position = position.clone();
        plane.position.z += 0.1; // Offset slightly to prevent z-fighting
        return plane;
    }

    /**
     * Toggles the visibility of the axes and the grid ground.
     * @param {boolean} show - True to show, false to hide.
     */
    function toggleAxesAndGrid(show) {
      axisMeshes.forEach((mesh) => {
        mesh.setEnabled(show);
      });
      ground.setEnabled(show);
    }

    // Set initial visibility based on the component's state.
    toggleAxesAndGrid(showAxesAndGrid);

    // --- Animation Loop ---

    // The core animation logic, registered to run before each frame is rendered.
    scene.registerBeforeRender(() => {
      // Do nothing if the animation is paused.
      if (pausedRef.current) return;

      // Calculate the elapsed time, accounting for pauses.
      const currentTime = performance.now();
      const elapsedTime =
        (currentTime - startTimeRef.current - pausedDurationRef.current) / 1000;

      // Determine the current position in the trajectory data based on elapsed time and speed.
      const totalSteps = trajectoryData.length;
      const stepsPerSecond = speedRef.current * 10;
      const totalProgress = elapsedTime * stepsPerSecond;
      
      // Get the current and next indices for interpolation.
      const index = Math.floor(totalProgress) % totalSteps;
      const nextIndex = (index + 1) % totalSteps;
      const t = totalProgress - Math.floor(totalProgress); // Interpolation factor (0 to 1)

      const currentData = trajectoryData[index];
      const nextData = trajectoryData[nextIndex];

      // Convert spherical coordinates to Cartesian.
      const currentPos = sphericalToCartesian(currentData.r, currentData.psi);
      const nextPos = sphericalToCartesian(nextData.r, nextData.psi);

      // Linearly interpolate between the two points for smooth animation.
      const interpolatedPos = BABYLON.Vector3.Lerp(currentPos, nextPos, t);
      electron.position = interpolatedPos;

      // Update the psi graph data in real-time
      // Only add data points when r is at or very close to r_max
      const currentR = BABYLON.Vector3.Lerp(
        new BABYLON.Vector3(currentData.r, 0, 0),
        new BABYLON.Vector3(nextData.r, 0, 0),
        t
      ).x;

      if (Math.abs(currentR - rMaxRef.current) < 0.1) { // tolerance for r_max
        const currentPsi = currentData.psi + t * (nextData.psi - currentData.psi);
        const psiAtRMax = Math.abs(currentPsi); // |psi(r = r_max)|
        
        setPsiGraphData(prevData => {
          const newData = [...prevData, { 
            time: elapsedTime, 
            psi: psiAtRMax,
            angle: currentPsi * 180 / Math.PI // for display purposes
          }];
          // Keep only last 200 points to prevent memory issues
          return newData.slice(-200);
        });
      }
    });

    // --- Render and Cleanup ---

    // Start the engine's render loop.
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    // Cleanup function to dispose of Babylon.js resources when the component unmounts.
    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isLoading, error, trajectoryData, showAxesAndGrid]); // Dependencies for the main effect.

  // --- JSX ---
  
  return (
    <>
      <button
        onClick={() => setPaused((prev) => !prev)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        {paused ? "Resume" : "Pause"}
      </button>

      <button
        onClick={() => setShowAxesAndGrid((prev) => !prev)}
        style={{
          position: "absolute",
          top: "10px",
          left: "100px",
          zIndex: 1,
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {showAxesAndGrid ? "Hide Axes & Grid" : "Show Axes & Grid"}
      </button>

      {/* Real-time Psi Graph */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "300px",
          height: "200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "5px",
          padding: "10px",
          zIndex: 1,
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: "center" }}>
          |ψ(r = r_max)| vs Time
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={psiGraphData}>
            <XAxis 
              dataKey="time" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10 }}
            />
            <Line 
              type="monotone" 
              dataKey="psi" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <canvas
        ref={reactCanvas}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
    </>
  );
};

export default Scene2DR;