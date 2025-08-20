import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import helperMethods from "../../helperMethods";

const Scene2DNR = ({ speed }) => {
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

  // NEW: State to toggle axes and grid visibility
  const [showAxesAndGrid, setShowAxesAndGrid] = useState(true);

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
      "/2d_3_1_d100.csv",
      setIsLoading,
      setError,
      setTrajectoryData,
      ["r", "psi"]
    );
  }, []);

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
      -Math.PI / 2,
      Math.PI / 2,
      20,
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

    // Add a light source
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1;

    // Electron mesh and material
    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron",
      { diameter: 0.2, segments: 16 },
      scene
    );
    const electronMaterial = new BABYLON.StandardMaterial(
      "electronMaterial",
      scene
    );
    electronMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue
    electronMaterial.alpha = 1;
    electronMaterial.backFaceCulling = false;
    electron.material = electronMaterial;

    const initialData = trajectoryData[0];
    const initialPos = sphericalToCartesian(initialData.r, initialData.psi);
    electron.position = initialPos;

    // Ground with GridMaterial
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
    ground.rotation.x = Math.PI / 2;

    // Utility function to create text labels
    function createTextLabel(text, position, scene) {
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
      plane.material = new BABYLON.StandardMaterial("textPlaneMaterial", scene);
      plane.material.diffuseTexture = dynamicTexture;
      plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
      plane.material.backFaceCulling = false;
      plane.position = position.clone();
      plane.position.z += 0.1;
      return plane;
    }


    const axisLength = 100;

    // Store all axis and tick meshes in an array for easy toggling
    const axisMeshes = [];

    // X Axis
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

    for (let i = -axisLength; i <= axisLength; i++) {
      if (i === 0) continue;
      const tick = BABYLON.MeshBuilder.CreateLines(
        "tickX" + i,
        {
          points: [
            new BABYLON.Vector3(i, -0.1, 0),
            new BABYLON.Vector3(i, 0.1, 0),
          ],
        },
        scene
      );
      tick.color = new BABYLON.Color3(1, 0, 0);
      axisMeshes.push(tick);
      const label = createTextLabel(
        `${i}`,
        new BABYLON.Vector3(i, 0.2, 0),
        scene
      );
      axisMeshes.push(label);
    }

    // Y Axis
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

    for (let i = -axisLength; i <= axisLength; i++) {
      if (i === 0) continue;
      const tick = BABYLON.MeshBuilder.CreateLines(
        "tickY" + i,
        {
          points: [
            new BABYLON.Vector3(-0.1, i, 0),
            new BABYLON.Vector3(0.1, i, 0),
          ],
        },
        scene
      );
      tick.color = new BABYLON.Color3(0, 1, 0);
      axisMeshes.push(tick);
      const label = createTextLabel(
        `${i}`,
        new BABYLON.Vector3(0.2, i, 0),
        scene
      );
      axisMeshes.push(label);
    }

    function sphericalToCartesian(r, psi) {
      const x = r * Math.cos(psi);
      const y = r * Math.sin(psi);
      return new BABYLON.Vector3(x, y, 0);
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

      const currentPos = sphericalToCartesian(currentData.r, currentData.psi);
      const nextPos = sphericalToCartesian(nextData.r, nextData.psi);

      const interpolatedPos = BABYLON.Vector3.Lerp(currentPos, nextPos, t);

      electron.position = interpolatedPos;
    });

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

    // Function to toggle visibility of axes and grid
    function toggleAxesAndGrid(show) {
      axisMeshes.forEach((mesh) => {
        mesh.setEnabled(show);
      });
      ground.setEnabled(show);
    }

    // Initialize visibility based on state
    toggleAxesAndGrid(showAxesAndGrid);

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isLoading, error, trajectoryData, showAxesAndGrid]);

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

      {/* NEW: Toggle button for axes and grid */}
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

      <canvas
        ref={reactCanvas}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
    </>
  );
};

export default Scene2DNR;
