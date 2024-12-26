import React from 'react';
import { Text } from '@react-three/drei';
import { MathUtils } from 'three'; 


const CompassText = ({ labelRadius, color = 0x000000 , fontSize = 0.6}) => {
    // Create an array to store the text components
    const textComponents = [];

    // Loop to create text at 30-degree intervals
    for (let deg = 0; deg < 360; deg += 30) {
        const angle = MathUtils.degToRad(deg - 90); // Adjust so 0 degrees is at the top
        const position = [
            labelRadius * Math.cos(angle), // x position
            0.1, // y position
            labelRadius * Math.sin(angle), // z position
        ];

        // Create a Text3D component for each label
        textComponents.push(
            <Text 
                key={deg}
                position={position}
                color={color}
                fontSize={fontSize} 
                rotation={[-Math.PI/2, 0 ,Math.PI/2 - angle]} // Rotate text to align correctly
                font="../../../fonts/Geist-VariableFont_wght.ttf"
                
            >
                {deg.toString()}
            </Text>
        );
    }

    return (
        <group >
            {textComponents}
        </group>
    );
};

export default CompassText;
