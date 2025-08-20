
import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import helperMethods from "../../helperMethods";

const Scene3DNR = ({ speed }) => {
  const reactCanvas = useRef(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const speedRef = useRef(speed);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const pauseStartTimeRef = useRef(null);
  const pausedDurationRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  // New states for toggles
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Refs to hold axis meshes and grid mesh/material
  const axisMeshesRef = useRef([]);
  const groundRef = useRef(null);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      pauseStartTimeRef.current = performance.now();
    } else {
      if (pauseStartTimeRef.current) {
        pausedDurationRef.current +=
          performance.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }
    }
  }, [paused]);

  useEffect(() => {
    helperMethods.fetchAndParseTrajectory(
      "/3d_1_1_1.csv",
      setIsLoading,
      setError,
      setTrajectoryData,
      ["t", "r", "phi", "theta"]
    );
  }, []);

  // --- Data Fetching and Parsing ---
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (
      !reactCanvas.current ||
      isLoading ||
      error ||
      trajectoryData.length === 0
    ) {
      return;
    }

    const engine = new BABYLON.Engine(reactCanvas.current, true);
    const scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 4,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );

    camera.attachControl(reactCanvas.current, true);

    const nucleus = BABYLON.MeshBuilder.CreateSphere(
      "nucleus",
      { diameter: 0.5, segments: 16 },
      scene
    );
    nucleus.material = new BABYLON.StandardMaterial("nucleusMaterial", scene);
    nucleus.material.diffuseColor = new BABYLON.Color3(0, 0, 1);

    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron",
      { diameter: 0.2, segments: 16 },
      scene
    );
    electron.material = new BABYLON.StandardMaterial("electronMaterial", scene);
    electron.material.diffuseColor = new BABYLON.Color3(1, 0, 0);

    // Ground and Grid Material
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 200, height: 200 },
      scene
    );
    groundRef.current = ground;

    const gridMaterial = new GridMaterial("gridMaterial", scene);
    gridMaterial.majorUnitFrequency = 5;
    gridMaterial.minorUnitVisibility = 0.45;
    gridMaterial.gridRatio = 1;
    gridMaterial.backFaceCulling = false;
    gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    gridMaterial.lineColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    gridMaterial.opacity = 0.98;
    ground.material = gridMaterial;

    function createTextLabel(text, position) {
      const dynamicTexture = new BABYLON.DynamicTexture(
        "dynamic texture",
        64,
        scene,
        true
      );
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(
        text,
        5,
        40,
        "bold 36px Arial",
        "white",
        "transparent",
        true
      );

      const plane = BABYLON.MeshBuilder.CreatePlane(
        "textPlane",
        { size: 0.5 },
        scene
      );
      const mat = new BABYLON.StandardMaterial("textPlaneMaterial", scene);
      mat.diffuseTexture = dynamicTexture;
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      mat.backFaceCulling = false;
      plane.material = mat;
      plane.position = position.clone();
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      plane.position.z += 0.05;
      return plane;
    }

    const axisLength = 100;
    const axisMeshes = [];

    // Axis lines
    const axisX = BABYLON.MeshBuilder.CreateLines(
      "axisX",
      {
        points: [
          new BABYLON.Vector3(-axisLength, 0, 0),
          new BABYLON.Vector3(axisLength, 0, 0),
        ],
      },
      scene
    );
    axisX.color = new BABYLON.Color3(1, 0, 0);
    axisMeshes.push(axisX);

    const axisY = BABYLON.MeshBuilder.CreateLines(
      "axisY",
      {
        points: [
          new BABYLON.Vector3(0, -axisLength, 0),
          new BABYLON.Vector3(0, axisLength, 0),
        ],
      },
      scene
    );
    axisY.color = new BABYLON.Color3(0, 1, 0);
    axisMeshes.push(axisY);

    const axisZ = BABYLON.MeshBuilder.CreateLines(
      "axisZ",
      {
        points: [
          new BABYLON.Vector3(0, 0, -axisLength),
          new BABYLON.Vector3(0, 0, axisLength),
        ],
      },
      scene
    );
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    axisMeshes.push(axisZ);

    // Ticks and labels for axes
    for (let i = -axisLength; i <= axisLength; i++) {
      if (i === 0) continue;

      // X-axis ticks & labels
      const tickX = BABYLON.MeshBuilder.CreateLines(
        "tickX" + i,
        {
          points: [
            new BABYLON.Vector3(i, -0.1, 0),
            new BABYLON.Vector3(i, 0.1, 0),
          ],
        },
        scene
      );
      tickX.color = new BABYLON.Color3(1, 0, 0);
      axisMeshes.push(tickX);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(i, 0.2, 0)));

      // Y-axis ticks & labels
      const tickY = BABYLON.MeshBuilder.CreateLines(
        "tickY" + i,
        {
          points: [
            new BABYLON.Vector3(-0.1, i, 0),
            new BABYLON.Vector3(0.1, i, 0),
          ],
        },
        scene
      );
      tickY.color = new BABYLON.Color3(0, 1, 0);
      axisMeshes.push(tickY);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(0.2, i, 0)));

      // Z-axis ticks & labels
      const tickZ = BABYLON.MeshBuilder.CreateLines(
        "tickZ" + i,
        {
          points: [
            new BABYLON.Vector3(0, -0.1, i),
            new BABYLON.Vector3(0, 0.1, i),
          ],
        },
        scene
      );
      tickZ.color = new BABYLON.Color3(0, 0, 1);
      axisMeshes.push(tickZ);
      axisMeshes.push(createTextLabel(`${i}`, new BABYLON.Vector3(0.2, 0, i)));
    }

    axisMeshesRef.current = axisMeshes;

    function sphericalToCartesian(r, phi, theta) {
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);
      return new BABYLON.Vector3(x, y, z);
    }

    scene.registerBeforeRender(() => {
      if (pausedRef.current) return;

      const currentTime = performance.now();
      const elapsedTime =
        (currentTime - startTimeRef.current - pausedDurationRef.current) / 1000;

      const totalSteps = trajectoryData.length;
      const stepsPerSecond = speedRef.current * 10;
      const totalProgress = elapsedTime * stepsPerSecond;
      const index = Math.floor(totalProgress) % totalSteps;
      const nextIndex = (index + 1) % totalSteps;
      const t = totalProgress - Math.floor(totalProgress);

      const currentData = trajectoryData[index];
      const nextData = trajectoryData[nextIndex];

      const currentPos = sphericalToCartesian(
        currentData.r,
        currentData.phi,
        currentData.theta
      );
      const nextPos = sphericalToCartesian(
        nextData.r,
        nextData.phi,
        nextData.theta
      );

      const interpolatedPos = BABYLON.Vector3.Lerp(currentPos, nextPos, t);

      electron.position = interpolatedPos;
    });

    // Add a light source
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1;

    const trail = new BABYLON.TrailMesh(
      "trail",
      electron,
      scene,
      0.1,
      600,
      true
    );
    trail.material = new BABYLON.StandardMaterial("trailMaterial", scene);
    trail.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    trail.material.alpha = 0.5;
    trail.material.backFaceCulling = false;
    trail.start();

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isLoading, error, trajectoryData]);

  // Toggle axis visibility
  useEffect(() => {
    axisMeshesRef.current.forEach((mesh) => {
      mesh.setEnabled(showAxes);
    });
  }, [showAxes]);

  // Toggle grid visibility (ground)
  useEffect(() => {
    if (groundRef.current) {
      groundRef.current.setEnabled(showGrid);
    }
  }, [showGrid]);

  return (
    <>
      <button
        onClick={() => setPaused((prevPaused) => !prevPaused)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 10,
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {paused ? "Resume" : "Pause"}
      </button>

      <button
        onClick={() => setShowAxes((prev) => !prev)}
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          zIndex: 10,
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {showAxes ? "Hide Axes" : "Show Axes"}
      </button>

      <button
        onClick={() => setShowGrid((prev) => !prev)}
        style={{
          position: "absolute",
          top: "90px",
          left: "10px",
          zIndex: 10,
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {showGrid ? "Hide Grid" : "Show Grid"}
      </button>

      <canvas
        ref={reactCanvas}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
    </>
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