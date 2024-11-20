import React from 'react';
import CompassDial from './compass/CompassDial';
import LayLines3D from './compass/LayLines3D';
import WindSector3D from './compass/WindSector3D';



const ThreeDCompassView = () => {

    
    const outerRadius = 5.6;
    const innerRadius = 5;
    return (
        <>
            <CompassDial outerRadius={outerRadius} innerRadius={innerRadius} />
  
            
            <WindSector3D  outerRadius={outerRadius+1.1}  />
          {  /*<LayLines3D outerRadius={outerRadius}  />*/ }
        </>
    );
};

export default ThreeDCompassView;
