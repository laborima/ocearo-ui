import React from "react";
import { Canvas } from "@react-three/fiber";

const BathymetryGrid = ({ data }) => {
  if (!data.length) return <p>Loading Bathymetry Data...</p>;

  const vertices = data.map(d => [d.x, d.y, d.z]).flat();

  return (
    <Canvas camera={{ position: [0, 50, 100], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(vertices)}
            count={vertices.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <meshBasicMaterial wireframe color="blue" />
      </mesh>
    </Canvas>
  );
};

export default BathymetryGrid;
