import React, { createContext, useState, useContext } from 'react';


const ThreeDViewContext = createContext();

export const ThreeDViewProvider = ({ children }) => {
    const [nightMode, setNightMode] = useState(false); // Night mode state
    const [states, setStates] = useState({}); // General state object for other toggles (e.g., autopilot, anchorWatch)
 
    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = (key) => {
        setStates((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    return (
        <ThreeDViewContext.Provider
            value={{
                nightMode,
                setNightMode,
                states,
                toggleState,
            }}
        >
            {children}
        </ThreeDViewContext.Provider>
    );
};

// Hook to use ThreeDViewContext
export const useThreeDView = () => useContext(ThreeDViewContext);
