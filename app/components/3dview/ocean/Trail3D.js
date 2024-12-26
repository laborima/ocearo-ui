import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Improved Custom Shader Material with Transparency
const TrailShaderMaterial = shaderMaterial(
  {
    time: 0,
    speed: 1.0, // Speed of the trail animation
    scale: 3.0, // Scale of the noise pattern
    opacity: 0.5, // Base opacity of the trail
    color: new THREE.Color(0x787878), // Base color (gray)
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform float speed;
    uniform float scale;
    uniform float opacity;
    uniform vec3 color;

    varying vec2 vUv;

    // Smooth noise function
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // Dynamic noise movement
      float n = noise(vUv * scale + vec2(time * speed, 0.0));
      float intensity = smoothstep(0.2, 1.0, n); // Fade effect
      vec3 trailColor = mix(vec3(0.0), color, intensity);

      // Add opacity fade
      float alpha = opacity * intensity * (1.0 - vUv.y); // Fade towards the edges
      gl_FragColor = vec4(trailColor, alpha);
    }
  `
);

// Extend Three.js to use the custom shader material
extend({ TrailShaderMaterial });

// Trail Component
export const Trail = ({
  color = "white", // Trail color
  speed = 1.0, // Animation speed
  scale = 3.0, // Noise scale
  opacity = 0.5, // Base opacity
}) => {
  const trailRef = useRef();

  useFrame((state, delta) => {
    if (trailRef.current) {
      trailRef.current.uniforms.time.value += delta; // Animate the trail
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, 22.5]}>
      <planeGeometry args={[40, 2.2, 64, 64]} /> {/* Higher resolution geometry */}
      <trailShaderMaterial
        ref={trailRef}
        color={new THREE.Color(color)}
        speed={speed}
        scale={scale}
        opacity={opacity}
        transparent={true} // Enable transparency
        depthWrite={false} // Prevent transparency artifacts
        blending={THREE.AdditiveBlending} // Smooth additive blending for a glowing effect
      />
    </mesh>
  );
};

export default Trail;
