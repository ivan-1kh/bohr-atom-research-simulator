import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import helperMethods from "../../helperMethods";

const Scene3DNR = ({ speed }) => {
  const reactCanvas = useRef(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    helperMethods.fetchAndParseTrajectory(
      "/3d_1_1_1.csv", // Update with your CSV file path
      setIsLoading,
      setError,
      setTrajectoryData,
      ["t", "r", "phi", "theta"] // Headers in the CSV
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

    // Set the background color to dark blue
    scene.clearColor = new BABYLON.Color4(0, 0, 0.2, 1); // Dark blue background color

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 4, // 45 degrees around the z axis
      Math.PI / 4, // 45 degrees from the x axis
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(reactCanvas.current, true);

    // Create Nucleus and Electron Meshes
    const nucleus = BABYLON.MeshBuilder.CreateSphere(
      "nucleus",
      { diameter: 0.5, segments: 16 },
      scene
    );
    nucleus.material = new BABYLON.StandardMaterial("nucleusMaterial", scene);
    nucleus.material.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue color

    const electron = BABYLON.MeshBuilder.CreateSphere(
      "electron",
      { diameter: 0.2, segments: 16 },
      scene
    );
    electron.material = new BABYLON.StandardMaterial("electronMaterial", scene);
    electron.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red color

    // Create a grid with blue color
    const grid = BABYLON.MeshBuilder.CreateGround(
      "grid",
      { width: 20, height: 20, subdivisions: 20 },
      scene
    );

    // Ensure the grid material is visible and blue
    const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
    gridMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue grid color
    grid.material = gridMaterial;
    grid.isPickable = false; // Ensure the grid is not interactive

    // Create axes
    const axisX = BABYLON.MeshBuilder.CreateLines(
      "axisX",
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(10, 0, 0)],
      },
      scene
    );
    const axisY = BABYLON.MeshBuilder.CreateLines(
      "axisY",
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 10, 0)],
      },
      scene
    );
    const axisZ = BABYLON.MeshBuilder.CreateLines(
      "axisZ",
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 10)],
      },
      scene
    );

    axisX.color = new BABYLON.Color3(1, 0, 0); // Red axis
    axisY.color = new BABYLON.Color3(0, 1, 0); // Green axis
    axisZ.color = new BABYLON.Color3(0, 0, 1); // Blue axis

    let dataIndex = 0;

    function sphericalToCartesian(r, phi, theta) {
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);
      return new BABYLON.Vector3(x, y, z);
    }

    scene.registerBeforeRender(() => {
      if (trajectoryData.length === 0) return;

      const currentData = trajectoryData[dataIndex];
      const r = currentData.r;
      const phi = currentData.phi;
      const theta = currentData.theta;

      // Convert spherical coordinates (r, phi, theta) to Cartesian coordinates (x, y, z)
      const position = sphericalToCartesian(r, phi, theta);

      // Update the electron's position
      electron.position = position;

      // Increment the data index to move to the next data point in the trajectory
      dataIndex = (dataIndex + 1) % trajectoryData.length;
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isLoading, error, trajectoryData]);

  return (
    <canvas
      ref={reactCanvas}
      style={{ width: "100%", height: "100vh", display: "block" }}
    />
  );
};

export default Scene3DNR;
