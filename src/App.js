import React from 'react';
import './App.css';
import Scene2DNR from './Scenes/Scene2DNR/Scene2DNR';
import Scene2DR from './Scenes/Scene2DR/Scene2DR';
import Scene3DNR from './Scenes/Scene3DNR/Scene3DNR';
import Scene3DR from './Scenes/Scene3DR/Scene3DR';
import QuantumNumberControls from './QuantumNumberControls/QuantumNumberControls';

function App() {
  const [speed, setSpeed] = React.useState(1.0);
  const [scene, setScene] = React.useState("2DNR");
  const [quantumNumbers, setQuantumNumbers] = React.useState({ n: 1, k: 0 });

  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    setSpeed(newSpeed);
  };

  const handleSceneChange = (event) => {
    setScene(event.target.value);
  };

  const handleQuantumNumberChange = (newQuantumNumbers) => {
    setQuantumNumbers(newQuantumNumbers);
  };

  React.useEffect(() => {
    const handleWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="App">
      <div className='topLeftMenu'>
        <select className="scenesDropdown" id="scenes" onChange={handleSceneChange}>
          <option value="2DNR">2D Non-Relativistic</option>
          <option value="2DR">2D Relativistic</option>
          <option value="3DNR">3D Non-Relativistic</option>
          <option value="3DR">3D Relativistic</option>
        </select>
        <label style={{ color: "white", marginTop: "1rem" }} htmlFor="speedSlider">Speed:</label>
        <input
          style={{ width: "20rem" }}
          type="range"
          id="speedSlider"
          min="0.1"
          max="100"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
        />
        <span style={{ color: "white" }}>{speed.toFixed(1)}</span>
        <QuantumNumberControls onChange={handleQuantumNumberChange} />
      </div>

      {scene === "2DNR" && <Scene2DNR speed={speed} quantumNumbers={quantumNumbers} />}
      {scene === "2DR" && <Scene2DR speed={speed} quantumNumbers={quantumNumbers} />}
      {scene === "3DNR" && <Scene3DNR speed={speed} quantumNumbers={quantumNumbers} />}
      {scene === "3DR" && <Scene3DR speed={speed} quantumNumbers={quantumNumbers} />}
    </div>
  );
}

export default App;
