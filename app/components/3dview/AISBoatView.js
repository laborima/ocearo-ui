// src/App.js
import React, { useEffect } from 'react';
import * as THREE from 'three';

const App = () => {
  useEffect(() => {
    // Basic Three.js scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Central boat (your boat)
    const myBoatMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yourBoat = createBoat(5, 2, myBoatMaterial); // Example size: length 5m, width 2m
    scene.add(yourBoat);
    yourBoat.position.set(0, 0, 0); // Center of the scene (your boat)

    // Sample AIS data: [{ lat, lon, length, width, cog, sog }]
    const aisData = [
      { lat: 37.7749, lon: -122.4195, length: 30, width: 10, cog: 45, sog: 15 }, // Boat 1
      { lat: 37.7750, lon: -122.4196, length: 40, width: 12, cog: 90, sog: 10 }, // Boat 2
      { lat: 37.7755, lon: -122.4199, length: 25, width: 8, cog: 270, sog: 12 }, // Boat 3
    ];

    const yourBoatLat = 37.7749;
    const yourBoatLon = -122.4194;

    // Function to convert lat/lon to relative 3D coordinates
    function latLonToXY(lat1, lon1, lat2, lon2) {
      const R = 6371000; // Radius of Earth in meters
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const x = R * dLon * Math.cos(lat1 * Math.PI / 180);
      const y = R * dLat;
      return { x, y };
    }

    // Function to create a boat mesh with specified dimensions
    function createBoat(length, width, material) {
      const geometry = new THREE.BoxGeometry(width, 1, length);
      return new THREE.Mesh(geometry, material);
    }

    // Function to calculate the future position based on speed and direction (simple approximation)
    function calculateFuturePosition(position, cog, sog, deltaTime) {
      const angleRad = (cog * Math.PI) / 180;
      const dx = sog * deltaTime * Math.cos(angleRad);
      const dy = sog * deltaTime * Math.sin(angleRad);
      return {
        x: position.x + dx / 1000, // Scaled for visualization
        y: position.y + dy / 1000,
      };
    }

    // Function to check collision trajectory
    function isCollisionCourse(boat1, boat2, timeThreshold = 60) {
      const futurePos1 = calculateFuturePosition(
        boat1.position,
        boat1.cog,
        boat1.sog,
        timeThreshold
      );
      const futurePos2 = calculateFuturePosition(
        boat2.position,
        boat2.cog,
        boat2.sog,
        timeThreshold
      );

      // Simple distance check between future positions
      const distance = Math.sqrt(
        Math.pow(futurePos2.x - futurePos1.x, 2) +
        Math.pow(futurePos2.y - futurePos1.y, 2)
      );
      return distance < 1; // Collision if within 1 meter
    }

    // Add other boats based on AIS data
    aisData.forEach((boatData) => {
      const { lat, lon, length, width, cog, sog } = boatData;
      const { x, y } = latLonToXY(yourBoatLat, yourBoatLon, lat, lon);

      // Boat material
      let boatMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

      // Create boat mesh with AIS size (length, width)
      const otherBoat = createBoat(length / 10, width / 10, boatMaterial); // Scaled size for visualization
      otherBoat.position.set(x / 1000, 0, y / 1000); // Scale down for visualization
      otherBoat.cog = cog; // Course over ground (direction)
      otherBoat.sog = sog; // Speed over ground

      // Rotate boat based on COG (direction)
      otherBoat.rotation.y = (-cog * Math.PI) / 180; // Convert degrees to radians

      // Check for collision course
      if (isCollisionCourse(yourBoat, otherBoat)) {
        otherBoat.material.color.set(0xff0000); // Set to red if on collision course
      }

      scene.add(otherBoat);
    });

    // Set camera position and render the scene
    camera.position.z = 10;

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();

    // Cleanup on component unmount
    return () => {
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null; // No need to render anything
};

export default App;
