import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { TrailMesh } from "@babylonjs/core/Meshes/trailMesh";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import helperMethods from "../../helperMethods";

const Scene2DNR = ({ speed }) => {
  const reactCanvas = useRef(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    helperMethods.fetchAndParseTrajectory(
      "/2d_3_1_d100.csv",
      setIsLoading,
      setError,
      setTrajectoryData,
      ["r", "psi"]
    );
  }, []);

  const speedRef = useRef(speed);
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
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

    // Dynamically determine initial radius and potentially grid size
    const initialMaxRadius = trajectoryData.reduce(
      (max, data) => Math.max(max, Math.abs(data.r || 0)),
      5
    );
    const initialRadius = initialMaxRadius * 1.5;

    const canvasWidth = reactCanvas.current.clientWidth;
    const canvasHeight = reactCanvas.current.clientHeight;

    const gridSize = Math.max(canvasWidth, canvasHeight) / 10;

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      (Math.PI / 2) * 0.99,
      initialRadius,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(reactCanvas.current, true);
    camera.lowerBetaLimit = (Math.PI / 2) * 0.99;
    camera.upperBetaLimit = (Math.PI / 2) * 0.99;
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = initialRadius * 2; // Adjust max zoom out
    camera.wheelDeltaPercentage = 0.02;

    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.9;

    const axisLength = gridSize / 2; // Adjust length as needed
    const axisMaterialX = new BABYLON.StandardMaterial("xAxisMat", scene);
    axisMaterialX.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red for X
    const axisMaterialY = new BABYLON.StandardMaterial("yAxisMat", scene);
    axisMaterialY.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green for Y

    // X-Axis
    const xAxisPoints = [
      new BABYLON.Vector3(-axisLength, 0, 0),
      new BABYLON.Vector3(axisLength, 0, 0),
    ];
    const xAxis = BABYLON.MeshBuilder.CreateLines(
      "xAxis",
      { points: xAxisPoints },
      scene
    );
    xAxis.material = axisMaterialX;

    // Y-Axis
    const yAxisPoints = [
      new BABYLON.Vector3(0, -axisLength, 0),
      new BABYLON.Vector3(0, axisLength, 0),
    ];
    const yAxis = BABYLON.MeshBuilder.CreateLines(
      "yAxis",
      { points: yAxisPoints },
      scene
    );
    yAxis.material = axisMaterialY;

    // --- 2D Grid ---
    const gridDivisions = 100;
    const gridSpacing = gridSize / gridDivisions;
    const gridMaterial = new BABYLON.StandardMaterial("gridMat", scene);
    gridMaterial.wireframe = true;
    gridMaterial.alpha = 0.5;

    // Horizontal lines
    for (let i = 0; i <= gridDivisions; i++) {
      const y = -gridSize / 2 + i * gridSpacing;
      const points = [
        new BABYLON.Vector3(-gridSize / 2, y, 0),
        new BABYLON.Vector3(gridSize / 2, y, 0),
      ];
      const line = BABYLON.MeshBuilder.CreateLines(
        `hLine${i}`,
        { points: points },
        scene
      );
      line.material = gridMaterial;
    }

    // Vertical lines
    for (let i = 0; i <= gridDivisions; i++) {
      const x = -gridSize / 2 + i * gridSpacing;
      const points = [
        new BABYLON.Vector3(x, -gridSize / 2, 0),
        new BABYLON.Vector3(x, gridSize / 2, 0),
      ];
      const line = BABYLON.MeshBuilder.CreateLines(
        `vLine${i}`,
        { points: points },
        scene
      );
      line.material = gridMaterial;
    }

    // --- Objects ---
    const nucleus = BABYLON.MeshBuilder.CreateSphere(
      "nucleus",
      { diameter: 0.5 },
      scene
    );
    const nucleusMaterial = new BABYLON.StandardMaterial("nucleusMat", scene);
    nucleusMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    nucleusMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    nucleus.material = nucleusMaterial;
    nucleus.position = BABYLON.Vector3.Zero();

    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron",
      { diameter: 0.2 },
      scene
    );
    const electronMaterial = new BABYLON.StandardMaterial("electronMat", scene);
    electronMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
    electronMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    electron.material = electronMaterial;

    const trail = new TrailMesh(
      "electronTrail",
      electron,
      scene,
      0.1,
      5000,
      true
    );
    const trailMaterial = new BABYLON.StandardMaterial("trailMat", scene);
    trailMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.7);
    trailMaterial.diffuseColor = trailMaterial.emissiveColor;
    trailMaterial.specularColor = BABYLON.Color3.Black();
    trailMaterial.alpha = 0.6;
    trail.material = trailMaterial;

    let dataIndex = 0;
    const positionScale = 1.0;

    let frameCounter = 0;

    scene.registerBeforeRender(() => {
      if (trajectoryData.length === 0) return;

      // Adjust the divisor to make the speed increase more dramatically
      const speedInterval = Math.max(1, Math.floor(100 / speedRef.current)); // Higher speed = smaller interval = faster movement

      if (frameCounter % speedInterval === 0) {
        const currentData = trajectoryData[dataIndex];
        const r = currentData.r * positionScale;
        const psi = currentData.psi;

        const x = r * Math.cos(psi);
        const y = r * Math.sin(psi);

        electron.position.x = x;
        electron.position.y = y;
        electron.position.z = 0;

        dataIndex = (dataIndex + 1) % trajectoryData.length;
      }
      frameCounter++;
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      console.log("Cleaning up Babylon scene (2DNR)");
      window.removeEventListener("resize", handleResize);
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
    };
  }, [isLoading, error, trajectoryData]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {isLoading && (
        <div style={loadingErrorStyle}>Loading trajectory data...</div>
      )}
      {error && <div style={loadingErrorStyle}>Error: {error}</div>}
      <canvas
        ref={reactCanvas}
        style={{
          width: "100%",
          height: "100%",
          display: isLoading || error ? "none" : "block",
          outline: "none",
        }}
        touch-action="none"
      />
    </div>
  );
};

const loadingErrorStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  color: "white",
  fontSize: "1.5em",
  backgroundColor: "rgba(0,0,0,0.7)",
  padding: "20px",
  borderRadius: "8px",
  zIndex: 10,
};

export default Scene2DNR;
