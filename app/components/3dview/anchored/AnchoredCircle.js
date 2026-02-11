import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useOcearoContext, oYellow } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';

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
  const { subscribe, unsubscribe } = useOcearoContext();
  
  // Use subscription for position
  const skPosition = useSignalKPath('navigation.position');
  
  const radius = 50; // Size of circle in meters
  const segments = 64;

  // Store initial position when component mounts or data becomes available
  useEffect(() => {
    if (skPosition && !anchorPosition) {
      setAnchorPosition({
        latitude: skPosition.latitude,
        longitude: skPosition.longitude
      });
    }
  }, [skPosition, anchorPosition]);
  
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

  // Update circle position based on difference from anchor point using direct subscription
  // to avoid useFrame overhead and React re-renders
  useEffect(() => {
    if (!anchorPosition || !skPosition || !circleRef.current) return;

    // Calculate distance and bearing from anchor point
    const dX = haversineDistance(
      anchorPosition.latitude,
      anchorPosition.longitude,
      anchorPosition.latitude,
      skPosition.longitude
    );
    
    const dZ = haversineDistance(
      anchorPosition.latitude,
      anchorPosition.longitude,
      skPosition.latitude,
      anchorPosition.longitude
    );

    // Convert to scene coordinates (assuming 1 unit = 1 meter)
    // Adjust signs based on direction
    const x = skPosition.longitude > anchorPosition.longitude ? dX : -dX;
    const z = skPosition.latitude > anchorPosition.latitude ? dZ : -dZ;

    // Update circle position directly via ref
    circleRef.current.position.set(x, -6.9, z);
  }, [anchorPosition, skPosition]);

  return (
    <line ref={circleRef}>
      <lineBasicMaterial 
        attach="material" 
        color={oYellow} 
        linewidth={3} 
        transparent={true}
        opacity={0.6}
      />
    </line>
  );
};

export default AnchoredCircle;