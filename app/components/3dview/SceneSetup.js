import React from 'react';
import { Environment } from '@react-three/drei';
import useTheme from '../theme/useTheme';
import configService from '../settings/ConfigService';
import BoatLighting from './BoatLighting';

/**
 * Backdrop shared by every 3D view: theme background, distance fog that
 * dissolves the horizon into it (Tesla FSD look), and the soft lighting rig.
 *
 * @param {boolean} backdrop - false when another component owns the background
 *        and fog (the realistic ocean draws its own sky)
 * @param {number} fogNear / fogFar - scene units
 */
const SceneSetup = ({ backdrop = true, fogNear = 40, fogFar = 420 }) => {
    const { scene } = useTheme();
    // A metallic hull needs something to reflect; the matte default doesn't
    const metallic = configService.get('metallicEffect') === true;

    return (
        <>
            {backdrop && <color attach="background" args={[scene.background]} />}
            {backdrop && <fog attach="fog" args={[scene.background, fogNear, fogFar]} />}
            <BoatLighting />
            {metallic && (
                <Environment files="./assets/ocearo_env.hdr" background={false} environmentIntensity={0.6} resolution={128} />
            )}
        </>
    );
};

export default SceneSetup;
