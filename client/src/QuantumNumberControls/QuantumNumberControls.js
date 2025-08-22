import React, { useState } from "react";

const QuantumNumberControls = ({ onChange, includeM }) => {
  const [n, setN] = useState(1);
  const [k, setK] = useState(1);
  const [m, setM] = useState(0);

  const handleNChange = (event) => {
    const newN = parseInt(event.target.value, 10);
    setN(newN);
    onChange({ n: newN, k, m });
  };

  const handleKChange = (event) => {
    const newK = parseInt(event.target.value, 10);
    if (!isNaN(newK)) {
      setK(newK);
      onChange({ n, k: newK, m });
    }
  };

  const handleMChange = (event) => {
    const newM = parseInt(event.target.value, 10);
    if (!isNaN(newM)) {
      setM(newM);
      onChange({ n, k, m: newM });
    }
  };

  return (
    <div style={{ color: "white", marginTop: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="nSlider">n</label>
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
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="kSlider">k</label>
        <input
          style={{ width: "20rem" }}
          type="range"
          id="kSlider"
          min="1"
          max="5"
          step="1"
          value={k}
          onChange={handleKChange}
        />
        <span>{k}</span>
      </div>
      {includeM &&
        <div>
          <label htmlFor="mSlider">m</label>
          <input
            style={{ width: "20rem" }}
            type="range"
            id="mSlider"
            min="0"
            max="5"
            step="1"
            value={m}
            onChange={handleMChange}
          />
          <span>{m}</span>
        </div>
      }
    </div>
  );
};

export default QuantumNumberControls;
