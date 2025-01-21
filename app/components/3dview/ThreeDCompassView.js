import React from 'react';
import CompassDial from './compass/CompassDial';
import WindSector3D from './compass/WindSector3D';



const ThreeDCompassView = () => {

    
    const outerRadius = 5.6;
    const innerRadius = 5;
    return (
        <>
            <CompassDial outerRadius={outerRadius} innerRadius={innerRadius} />
  
            
            <WindSector3D  outerRadius={outerRadius+1.1}  />
        </>
    );
};

export default ThreeDCompassView;
