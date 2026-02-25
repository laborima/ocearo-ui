import React from 'react';
import CompassDial from './compass/CompassDial';
import WindSector3D from './compass/WindSector3D';
import configService from '../settings/ConfigService';

const ThreeDCompassView = ({ visible = true, position, scale }) => {

    if (!visible || configService.get('hide3DCompass')) {
        return null;
    }

    const outerRadius = 5.6;
    const innerRadius = 5;
    return (
        <group position={position} scale={scale}>
            <CompassDial outerRadius={outerRadius} innerRadius={innerRadius} />
            <WindSector3D outerRadius={outerRadius + 1.1} />
        </group>
    );
};

export default ThreeDCompassView;
