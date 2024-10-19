import { createRoot } from 'react-dom/client'
import { useLayoutEffect } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, StatsGl } from '@react-three/drei'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';

//TODO : https://github.com/flyinggorilla/simulator.atterwind.info/blob/master/Water.js

/*function SailBoat3D({ url, color = 'black', ...props }) {
 const model = useLoader(Rhino3dmLoader, url, (loader) => loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/'))
  useLayoutEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) child.material.color.set(color)
      else if (child.isLine) child.material.color.set('white')
    })
  }, [model, color])
  return <primitive object={model} {...props} />
}

export default SailBoat3D;*/

export default function SailBoat3D() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}> {/* Rotate the boat to align with XY plane */}
        {/* Hull */}
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[2, 0.5, 1]} />
          <meshStandardMaterial color="brown" />
        </mesh>

        {/* Mast */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.1, 2, 0.1]} />
          <meshStandardMaterial color="grey" />
        </mesh>

        {/* Sail */}
        <mesh position={[0, 1.5, 0.5]}>
          <boxGeometry args={[0.1, 1, 0.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
  );
}