import React, { useEffect, useState } from "react";
import BathymetryGrid from "./BathymetryGrid";
import TideChart from "./TideChart";

https://erddap.emodnet.eu/erddap/files/bathymetry_2022/

const App = () => {
  const [bathymetryData, setBathymetryData] = useState([]);
  const [tideData, setTideData] = useState([]);

  // Load data from API or localStorage
  useEffect(() => {
    // Bathymetry data
    const storedBathymetry = localStorage.getItem("bathymetry");
    if (storedBathymetry) {
      setBathymetryData(JSON.parse(storedBathymetry));
    } else {
      fetchBathymetryData();
    }

    // Tide data
    const storedTide = localStorage.getItem("tide");
    if (storedTide) {
      setTideData(JSON.parse(storedTide));
    } else {
      fetchTideData();
    }
  }, []);

  // Fetch bathymetry data (simulated)
  const fetchBathymetryData = async () => {
    const response = await fetch("/data/bathymetry_la_rochelle.csv");
    const text = await response.text();
    const parsedData = parseCSV(text).map(d => ({
      x: +d.x,
      y: -+d.depth,
      z: +d.y,
    }));
    localStorage.setItem("bathymetry", JSON.stringify(parsedData));
    setBathymetryData(parsedData);
  };

  // Fetch tide data (simulated)
  const fetchTideData = async () => {
    const response = await fetch("/data/tide_data_la_rochelle.csv");
    const text = await response.text();
    const parsedData = parseCSV(text).map(d => ({
      time: d.time,
      height: +d.height,
    }));
    localStorage.setItem("tide", JSON.stringify(parsedData));
    setTideData(parsedData);
  };

  // CSV Parsing Function
  const parseCSV = (csvText) => {
    const rows = csvText.split("\n");
    const headers = rows[0].split(",");
    return rows.slice(1).map(row => {
      const values = row.split(",");
      return headers.reduce((acc, header, i) => {
        acc[header.trim()] = values[i].trim();
        return acc;
      }, {});
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <h1>Bathymetry of La Rochelle</h1>
        <BathymetryGrid data={bathymetryData} />
      </div>
      <div style={{ flex: 1 }}>
        <h1>Tide Chart</h1>
        <TideChart data={tideData} />
      </div>
    </div>
  );
};

export default App;
