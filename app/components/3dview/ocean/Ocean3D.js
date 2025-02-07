import React, { useRef, useMemo } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

extend({ Water });

function Ocean3D() {
  const ref = useRef();
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  // Load and memoize waterNormals texture
  const waterNormals = useLoader(THREE.TextureLoader, "assets/waternormals.jpg");
  useMemo(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [waterNormals]);

  // Memoize plane geometry and water configuration to avoid unnecessary re-creations
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []); // Reduced plane size
  const config = useMemo(() => ({
    textureWidth: 600, // Use smaller textures if possible
    textureHeight: 450,
    waterNormals,
    sunDirection: new THREE.Vector3(0, 1, 0), // Sun direction moved to the top
    sunColor: 0xffffff, // White sun color
    waterColor: 0x0077be, // Sea blue water color
    distortionScale: 5, // Increased distortion for more waves
    format: gl.encoding,
    reflectivity: 0, // Disable reflections
  }), [waterNormals, gl.encoding]);

  // Disable environment map if present
  useMemo(() => {
    scene.environment = null;
    scene.background = null;
  }, [scene]);

  // Throttled frame update to reduce unnecessary updates
  let elapsedTime = 0;
  useFrame((state, delta) => {
    elapsedTime += delta;
    if (elapsedTime > 0.05) { // Update every 0.05 seconds
      if (ref.current) {
        ref.current.material.uniforms.time.value += elapsedTime;
      }
      elapsedTime = 0; // Reset the timer
    }
  });

  return (
    <water
      ref={ref}
      args={[geom, config]}
      rotation-x={-Math.PI / 2}
      position={[0, -0.1, 0]} // Lowered the water position
    />
  );
}

export default Ocean3D;
