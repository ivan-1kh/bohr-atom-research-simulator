import React, { useState } from "react";

const QuantumNumberControls = ({ onChange }) => {
  const [n, setN] = useState(1);
  const [k, setK] = useState(0);

  const handleNChange = (event) => {
    const newN = parseInt(event.target.value, 10);
    setN(newN);
    onChange({ n: newN, k });
  };

  const handleKChange = (event) => {
    const newK = parseInt(event.target.value, 10);
    if (!isNaN(newK)) {
      setK(newK);
      onChange({ n, k: newK });
    }
  };

  return (
    <div style={{ color: "white", marginTop: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="nSlider">Principal Quantum Number (n):</label>
        <input
          style={{ width: "20rem" }}
          type="range"
          id="nSlider"
          min="1"
          max="5"
          step="1"
          value={n}
          onChange={handleNChange}
        />
        <span>{n}</span>
      </div>
      <div>
        <label htmlFor="kSlider">Azimuthal Quantum Number (k):</label>
        <input
          style={{ width: "20rem" }}
          type="range"
          id="kSlider"
          min="0"
          max="5"
          step="1"
          value={k}
          onChange={handleKChange}
        />
        <span>{k}</span>
      </div>
    </div>
  );
};

export default QuantumNumberControls;
