import React, { Suspense, useRef, useMemo } from 'react';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import SailBoat3D from '../SailBoat3D';
import { useOcearoContext, convertWindSpeed } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import WindSector3D from '../compass/WindSector3D';
import BoatNavigationSystem from './BoatNavigationSystem';
import Current3D from '../compass/Current3D';

const ThreeDParkAssistBoat = ({ onUpdateInfoPanel }) => {
  const { nightMode } = useOcearoContext();
  const sailBoatRef = useRef();
  
  // Define paths for subscription
  const assistPaths = useMemo(() => [
    'steering.rudderAngle',
    'navigation.speedOverGround',
    'environment.wind.angleApparent',
    'environment.wind.speedApparent',
    'environment.current'
  ], []);

  const skValues = useSignalKPaths(assistPaths);

  // Get rudder and speed data from subscribed values
  const rudderAngle = skValues['steering.rudderAngle'] || 0;
  const sog = skValues['navigation.speedOverGround'] || 0;

  // Get apparent wind data
  const appWindAngle = skValues['environment.wind.angleApparent'] || 0;
  const appWindSpeed = useMemo(() => convertWindSpeed(skValues['environment.wind.speedApparent']) || 0, [skValues]);

  // Get current data
  const currentData = useMemo(() => skValues['environment.current'] || {
    setTrue: 0,
    drift: 0
  }, [skValues]);

  // Calculate leeway based on wind and boat characteristics
  // This is a simplified calculation - adjust coefficients based on your boat's characteristics
  const calculateLeeway = () => {
    const windAngleRad = Math.abs(appWindAngle * Math.PI / 180);
    const baseLeeway = Math.sin(windAngleRad) * appWindSpeed * 0.02;
    return Math.min(baseLeeway, 10); // Cap at 10 degrees
  };

  // Calculate drift factor based on current strength relative to boat speed
  const calculateDriftFactor = () => {
    if (sog < 0.1) return 0;
    return Math.min(currentData.drift / sog, 1);
  };

  return (
    <Suspense fallback={<Html center>Loading...</Html>}>
      <PerspectiveCamera
        makeDefault
        fov={60}
        near={1}
        far={1000}
        position={[0, 1, 10]}
      />

      <OrbitControls
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />

      <Environment files="./assets/ocearo_env.hdr" background={false} intensity={0.6} />

      <ambientLight intensity={0.2} />

      {/* Main directional light */}
      <directionalLight
        position={[15, 30, 20]}
        intensity={1.2}
        castShadow={false}
        color={nightMode ? "#b0d8ff" : "#ffffff"}
      />

      {/* Rim light for silhouette definition */}
      <spotLight
        position={[0, 50, 100]}
        intensity={0.8}
        angle={0.6}
        penumbra={1}
        color={nightMode ? "#4080ff" : "#ffffff"}
      />

      {/* Fill light */}
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      <group position={[0, -3, 0]}>
        <SailBoat3D
          position={[0, 0, 0.7]}
          scale={[0.5, 0.5, 0.5]}
          ref={sailBoatRef}
          showSail={false}
          onUpdateInfoPanel={onUpdateInfoPanel}
        />

        <WindSector3D outerRadius={5} />

        <Current3D outerRadius={5} />

        <group position={[0, 0, -5]} >
          <BoatNavigationSystem
            rudderAngle={rudderAngle}
            sog={sog}
            windSpeed={appWindSpeed}
            windDirection={appWindAngle}
            currentSpeed={currentData.drift}
            currentDirection={currentData.setTrue}
            boatWidth={2}
            leewayAngle={calculateLeeway()}
            driftFactor={calculateDriftFactor()}
            maxCurvePoints={100}
          />
        </group>
      </group>
    </Suspense>
  );
};

export default ThreeDParkAssistBoat;