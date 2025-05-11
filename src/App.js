import React from 'react';
// import BabylonScene from './BabylonScene';
import './App.css';
import Scene2DNR from './Scenes/Scene2DNR/Scene2DNR';
import Scene2DR from './Scenes/Scene2DR/Scene2DR';
import Scene3DNR from './Scenes/Scene3DNR/Scene3DNR';
import Scene3DR from './Scenes/Scene3DR/Scene3DR';

const scenesDropdown = document.querySelector("#scenes");

function App() {

  const [speed, setSpeed] = React.useState(1.0); // Initialize speed to 1

  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    setSpeed(newSpeed);
  };


  React.useEffect(() => {
    document.addEventListener('wheel', function(event) {
      if (event.ctrlKey || event.metaKey) { // Check for Ctrl or Cmd key
        event.preventDefault(); // Prevent the default browser zoom
    
        // Optionally, you could implement your own custom zoom behavior here
        // using your Babylon.js camera. For example:
        // const zoomSpeed = 0.05;
        // if (event.deltaY < 0) {
        //   camera.radius -= camera.radius * zoomSpeed;
        // } else {
        //   camera.radius += camera.radius * zoomSpeed;
        // }
      }
    }, { passive: false }); // passive: false is important to allow preventDefault    
  }, []);

  const [scene, setScene] = React.useState("2DNR");

  const handleChange = (event) => {
    
    setScene(event.target.value);
  };

  return (
    <div className="App">
      <div className='topLeftMenu'>
      <select className="scenesDropdown" id="scenes" onChange={handleChange}>
        <option defaultChecked value="2DNR">2D Non-Relativistic</option>
        <option value="2DR">2D Relativistic</option>
        <option value="3DNR">3D Non-Relativistic</option>
        <option value="3DR">3D Relativistic</option>
      </select>
      <label style={{color: "white", marginTop: "1rem"}} htmlFor="speedSlider">Speed:</label>
      <input
        style={{width: "20rem"}}
        type="range"
        id="speedSlider"
        min="0.1"
        max="1000"
        step="0.1"
        value={speed}
        onChange={handleSpeedChange}
      />
      <span style={{color: "white"}}>{speed.toFixed(1)}</span> {/* Display the current speed value */}
      </div>

      {scene == "2DNR" && <Scene2DNR speed={speed} />}
      {scene == "2DR" && <Scene2DR speed={speed} />}
      {scene == "3DNR" && <Scene3DNR speed={speed} />}
      {scene == "3DR" && <Scene3DR speed={speed} />}
    </div>
  );
}

export default App;
