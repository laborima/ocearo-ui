import React from 'react';
import useTheme from '../theme/useTheme';

/**
 * Soft, shadowless studio lighting in the spirit of Tesla's FSD view: a
 * hemisphere light gives every surface a gentle top-to-bottom gradient, one key
 * light models the shapes, and nothing is glossy. Intensities and tints come
 * from the theme (dimmer and red at night).
 */
const BoatLighting = () => {
  const { scene } = useTheme();

  return (
    <>
      <hemisphereLight args={[scene.light, scene.ground, scene.ambient]} />
      <ambientLight intensity={scene.ambient * 0.5} color={scene.light} />

      {/* Key light, high and slightly behind the camera */}
      <directionalLight
        position={[30, 80, 60]}
        intensity={scene.keyLight}
        color={scene.light}
        castShadow={false}
      />

      {/* Rim light from ahead to keep the hull silhouette readable */}
      <directionalLight
        position={[-20, 40, -100]}
        intensity={scene.fillLight}
        color={scene.rimLight}
      />
    </>
  );
};

export default BoatLighting;
