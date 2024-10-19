import SvgWindComponent from './3dview/SvgWindComponent';

const RightPane = () => {
    // Set static values
    const compassHeading = 45; // Example static value
    const courseOverGroundAngle = 90; // Example static value
    const courseOverGroundEnable = true; // Example static value
    const trueWindAngle = 120; // Example static value
    const trueWindSpeed = 20; // Example static value
    const appWindAngle = 60; // Example static value
    const appWindSpeed = 15; // Example static value
    const waypointAngle = 270; // Example static value
    const waypointEnable = true; // Example static value
    const laylineAngle = 0; // Example static value
    const closeHauledLineEnable = true; // Example static value
    const windSectorEnable = true; // Example static value
    const trueWindMinHistoric = 5; // Example static value
    const trueWindMidHistoric = 10; // Example static value
    const trueWindMaxHistoric = 15; // Example static value
    const sailSetupEnable = true; // Example static value

    return (
        <div className="flex flex-col w-full h-full"> {/* Use flex for layout */}
            <iframe
                className="flex-grow border-none"
                src="https://example.com"
                title="External Application"
            />
            <SvgWindComponent
                compassHeading={compassHeading}
                courseOverGroundAngle={courseOverGroundAngle}
                courseOverGroundEnable={courseOverGroundEnable}
                trueWindAngle={trueWindAngle}
                trueWindSpeed={trueWindSpeed}
                appWindAngle={appWindAngle}
                appWindSpeed={appWindSpeed}
                waypointAngle={waypointAngle}
                waypointEnable={waypointEnable}
                laylineAngle={laylineAngle}              
                closeHauledLineEnable={closeHauledLineEnable}  
                windSectorEnable={windSectorEnable}          
                trueWindMinHistoric={trueWindMinHistoric}    
                trueWindMidHistoric={trueWindMidHistoric}    
                trueWindMaxHistoric={trueWindMaxHistoric}    
                sailSetupEnable={sailSetupEnable}            
            />
        </div>
    );
};

export default RightPane;
