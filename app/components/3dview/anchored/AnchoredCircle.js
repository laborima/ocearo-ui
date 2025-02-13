import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOcearoContext } from '../../context/OcearoContext';

// Helper function to convert lat/lon difference to approximate meters
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const AnchoredCircle = () => {
  const circleRef = useRef();
  const [anchorPosition, setAnchorPosition] = useState(null);
  const {  getSignalKValue } = useOcearoContext();
  const radius = 50; // Size of circle in meters
  const segments = 64;

  // Store initial position when component mounts
  useEffect(() => {
    const initialPosition = getSignalKValue('navigation.position');
    if (initialPosition && !anchorPosition) {
      setAnchorPosition({
        latitude: initialPosition.latitude,
        longitude: initialPosition.longitude
      });
    }
  }, [getSignalKValue, anchorPosition]);
  
  // Create the circle geometry
  useEffect(() => {
    if (circleRef.current) {
      const geometry = new THREE.BufferGeometry();
      const points = [];
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(
          radius * Math.cos(theta),
          0,
          radius * Math.sin(theta)
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      circleRef.current.geometry = geometry;
    }
  }, []);

  // Update circle position based on difference from anchor point
  useFrame(() => {
    if (circleRef.current && anchorPosition) {
      const currentPosition = getSignalKValue('navigation.position');
      
      if (currentPosition) {
        // Calculate distance and bearing from anchor point
        const dX = haversineDistance(
          anchorPosition.latitude,
          anchorPosition.longitude,
          anchorPosition.latitude,
          currentPosition.longitude
        );
        
        const dZ = haversineDistance(
          anchorPosition.latitude,
          anchorPosition.longitude,
          currentPosition.latitude,
          anchorPosition.longitude
        );

        // Convert to scene coordinates (assuming 1 unit = 1 meter)
        // Adjust signs based on direction
        const x = currentPosition.longitude > anchorPosition.longitude ? dX : -dX;
        const z = currentPosition.latitude > anchorPosition.latitude ? dZ : -dZ;

        // Update circle position
        circleRef.current.position.set(x, -6.9, z);
      }
    }
  });

  return (
    <line ref={circleRef}>
      <lineBasicMaterial attach="material" color="green" linewidth={2} />
    </line>
  );
};

export default AnchoredCircle;