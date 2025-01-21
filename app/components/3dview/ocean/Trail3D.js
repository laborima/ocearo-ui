import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const TrailShaderMaterial = shaderMaterial(
  {
    time: 0,
    speed: 1.0,
    scale: 3.0,
    opacity: 0.5,
    color: new THREE.Color(0x787878),
    foamColor: new THREE.Color(0xffffff),
    waterColor: new THREE.Color(0x0066ff),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      // Add subtle vertex displacement for wave effect
      float elevation = sin(position.x * 0.2 + position.y * 0.3) * 0.1;
      vElevation = elevation;
      vec3 newPosition = position + normal * elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform float speed;
    uniform float scale;
    uniform float opacity;
    uniform vec3 color;
    uniform vec3 foamColor;
    uniform vec3 waterColor;

    varying vec2 vUv;
    varying float vElevation;

    // Improved noise functions
    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }

    vec2 fade(vec2 t) {
      return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
      Pi = mod(Pi, 289.0);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x,gy.x);
      vec2 g10 = vec2(gx.y,gy.y);
      vec2 g01 = vec2(gx.z,gy.z);
      vec2 g11 = vec2(gx.w,gy.w);
      vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00,g00), dot(g10,g10), dot(g01,g01), dot(g11,g11));
      g00 *= norm.x;
      g10 *= norm.y;
      g01 *= norm.z;
      g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
      return 2.3 * n_xy;
    }

    void main() {
      // Create multiple layers of noise for more complex water pattern
      float baseNoise = cnoise(vUv * scale + vec2(time * speed, 0.0));
      float detailNoise = cnoise(vUv * scale * 2.0 + vec2(time * speed * 1.5, 0.0)) * 0.5;
      float turbulence = cnoise(vUv * scale * 4.0 + vec2(time * speed * 2.0, 0.0)) * 0.25;
      
      // Combine noise layers
      float noise = baseNoise + detailNoise + turbulence;
      
      // Create wake pattern
      float wake = smoothstep(0.3, 0.7, 1.0 - abs(vUv.x - 0.5) * 2.0);
      
      // Create foam effect
      float foam = smoothstep(0.4, 0.6, noise + wake);
      
      // Combine colors for water effect
      vec3 finalColor = mix(waterColor, foamColor, foam);
      finalColor = mix(finalColor, color, wake * 0.5);
      
      // Dynamic opacity with wake and foam
      float alpha = opacity * (wake + foam * 0.5) * (1.0 - vUv.y);
      
      // Add wave highlights
      float highlight = smoothstep(0.2, 0.4, noise + wake) * (1.0 - smoothstep(0.4, 0.6, noise + wake));
      finalColor += highlight * foamColor * 0.5;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ TrailShaderMaterial });

export const Trail = ({
  color = "#787878",
  waterColor = "#0066ff",
  foamColor = "#ffffff",
  speed = 1.0,
  scale = 3.0,
  opacity = 0.5,
}) => {
  const trailRef = useRef();

  useFrame((state, delta) => {
    if (trailRef.current) {
      trailRef.current.uniforms.time.value += delta;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, 22.5]}>
      <planeGeometry args={[40, 2.2, 128, 32]} />
      <trailShaderMaterial
        ref={trailRef}
        color={new THREE.Color(color)}
        waterColor={new THREE.Color(waterColor)}
        foamColor={new THREE.Color(foamColor)}
        speed={speed}
        scale={scale}
        opacity={opacity}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export default Trail;