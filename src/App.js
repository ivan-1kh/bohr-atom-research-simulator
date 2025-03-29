import React from 'react';
// import BabylonScene from './BabylonScene';
import './App.css';
import Scene2DNR from './Scenes/Scene2DNR/Scene2DNR';
import Scene2DR from './Scenes/Scene2DR/Scene2DR';
import Scene3DNR from './Scenes/Scene3DNR/Scene3DNR';
import Scene3DR from './Scenes/Scene3DR/Scene3DR';

const scenesDropdown = document.querySelector("#scenes");

function App() {

  const [scene, setScene] = React.useState("2DNR");

  const handleChange = (event) => {
    
    setScene(event.target.value);
  };

  return (
    <div className="App">
      <select className="scenesDropdown" id="scenes" onChange={handleChange}>
        <option defaultChecked value="2DNR">2D Non-Relativistic</option>
        <option value="2DR">2D Relativistic</option>
        <option value="3DNR">3D Non-Relativistic</option>
        <option value="3DR">3D Relativistic</option>
      </select>

      {scene == "2DNR" && <Scene2DNR />}
      {scene == "2DR" && <Scene2DR />}
      {scene == "3DNR" && <Scene3DNR />}
      {scene == "3DR" && <Scene3DR />}
    </div>
  );
}

export default App;
