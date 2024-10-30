import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOcearoContext } from '../context/OcearoContext';
import useBoat from './helpers/BoatLoader';


export default function SailBoat3D() {
    const boatRef = useRef(); // Ref to access and control the boat object
    //const [boat, setBoat] = useState(null); // Store the boat group
    const { getSignalKValue } = useOcearoContext(); // Use the context to get SignalK values
 
    // Load the boat model with `useBoat` default 1O meter
     const boat = useBoat("default", 10, null, true);

    
    
    // Get inclination from SignalK (use 'heel' data as an example)
    const inclination = getSignalKValue('navigation.attitude.roll') || 0; // Get inclination (heel angle) from SignalK, fallback to 0 if unavailable

    
    // Update boat inclination or position
    useFrame(() => {
        if (boatRef.current && boatRef.current.rotation.z !== inclination) {
            boatRef.current.rotation.z = inclination; // Apply the inclination to the boat's Z rotation
        }
    });

    // Ensure the boat config is loaded before rendering
    if (!boat) return null;

    return (
        <group ref={boatRef}>
            <primitive object={boat} />
        </group>
    );
}
