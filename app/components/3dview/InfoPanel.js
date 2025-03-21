import React from 'react';

const InfoPanel = ({ content }) => {
    if (!content) return null;

    const infoPanelStyle = {
        position: 'absolute',
        top: '10px',
        right: '10px',  // Changed from left to right
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        border: '1px solid #444',
        borderRadius: '4px',
        padding: '10px',
        zIndex: 1000,  // Keep it above other elements
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        minWidth: '200px',
        maxWidth: '300px',
        textAlign: 'right'  // Right-align text for better appearance on right side
    };

    // Split content by newlines and create separate elements for each line
    const contentLines = content.split('\n').map((line, index) => (
        <div key={index} style={{ marginBottom: '4px' }}>
            {line}
        </div>
    ));

    return (
        <div style={infoPanelStyle}>
            {contentLines}
        </div>
    );
};

export default InfoPanel;
