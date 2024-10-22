import React, { useState, useEffect, useRef } from 'react';
import SvgWindCompass from './SvgWindCompass';
import SvgWindIndicator from './SvgWindIndicator';
import SvgWindLayLines from './SvgWindLayLines';
import SvgWindBackground from './SvgWindBackground';
import SvgWindSailSetup from './SvgWindSailSetup';
import SvgWindShiftSector from './SvgWindShiftSector';
//import styles from './SvgWindComponent.module.css'; // Import the CSS module

// Helper function for angle calculation
const angle = ([a, b], [c, d], [e, f]) => (Math.atan2(f - d, e - c) - Math.atan2(b - d, a - c) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

const SvgWindComponent = ({
    compassHeading,
    courseOverGroundAngle,
    courseOverGroundEnable,
    trueWindAngle,
    trueWindSpeed,
    appWindAngle,
    appWindSpeed,
    laylineAngle,
    closeHauledLineEnable,
    sailSetupEnable,
    windSectorEnable,
    waypointAngle,
    waypointEnable,
    trueWindMinHistoric,
    trueWindMidHistoric,
    trueWindMaxHistoric,
}) => {
    // Refs for animation elements
    // Refs for animation elements
    const compassAnimateRef = useRef(null);
    const appWindAnimateRef = useRef(null);
    const appWindValueAnimateRef = useRef(null);
    const trueWindAnimateRef = useRef(null);
    const trueWindValueAnimateRef = useRef(null);
    const waypointAnimateRef = useRef(null);
    const courseOverGroundAnimateRef = useRef(null);

    // States for different values
    const [compassFaceplate, setCompassFaceplate] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [appWind, setAppWind] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [appWindValue, setAppWindValue] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [trueWind, setTrueWind] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [trueWindValue, setTrueWindValue] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [waypoint, setWaypoint] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });
    const [courseOverGround, setCourseOverGround] = useState({ oldDegreeIndicator: '0', newDegreeIndicator: '0' });

    const [headingValue, setHeadingValue] = useState('--');
    const [appWindSpeedDisplay, setAppWindSpeedDisplay] = useState('--');
    const [trueWindSpeedDisplay, setTrueWindSpeedDisplay] = useState('--');
    const [waypointActive, setWaypointActive] = useState(false);
    const [courseOverGroundActive, setCourseOverGroundActive] = useState(false);
    const [changes, setChanges] = useState({}); // Update this with your changes object as needed


    // Path examples for laylines
    const closeHauledLinePortPath = "M 231,231 231,90";
    const closeHauledLineStbdPath = "M 231,231 231,90";
    const portWindSectorPath = "none";
    const stbdWindSectorPath = "none";

    useEffect(() => {
        // Handle compass heading changes
        if (changes.compassHeading && !changes.compassHeading.firstChange) {
            const currentValue = changes.compassHeading.currentValue;
            if (currentValue !== null) {
                setCompassFaceplate(prevState => ({
                    ...prevState,
                    oldDegreeIndicator: prevState.newDegreeIndicator,
                    newDegreeIndicator: currentValue.toFixed(0),
                }));
                setHeadingValue(currentValue.toFixed(0));

                // Rotate with heading change
                smoothCircularRotation(compassFaceplate);
                updateClauseHauledLines();
                updateWindSectors();
            }
        }
    }, [changes.compassHeading]);

    useEffect(() => {
        // Handle Course Over Ground Angle changes
        if (changes.courseOverGroundAngle && !changes.courseOverGroundAngle.firstChange) {
            const currentValue = changes.courseOverGroundAngle.currentValue;
            if (courseOverGroundEnable) {
                if (currentValue !== null) {
                    setCourseOverGround(prevState => ({
                        ...prevState,
                        oldDegreeIndicator: prevState.newDegreeIndicator,
                        newDegreeIndicator: currentValue.toFixed(0),
                    }));
                    setCourseOverGroundActive(true);
                    smoothCircularRotation(courseOverGround);
                } else {
                    setCourseOverGroundActive(false);
                }
            } else {
                setCourseOverGroundActive(false);
            }
        }
    }, [changes.courseOverGroundAngle, courseOverGroundEnable]);

    useEffect(() => {
        // Handle Waypoint Angle changes
        if (changes.waypointAngle && !changes.waypointAngle.firstChange) {
            const currentValue = changes.waypointAngle.currentValue;
            if (waypointEnable) {
                if (currentValue !== null) {
                    setWaypoint(prevState => ({
                        ...prevState,
                        oldDegreeIndicator: prevState.newDegreeIndicator,
                        newDegreeIndicator: currentValue.toFixed(0),
                    }));
                    setWaypointActive(true);
                    smoothCircularRotation(waypoint);
                } else {
                    setWaypointActive(false);
                }
            } else {
                setWaypointActive(false);
            }
        }
    }, [changes.waypointAngle, waypointEnable]);

    useEffect(() => {
        // Handle App Wind Angle changes
        if (changes.appWindAngle && !changes.appWindAngle.firstChange) {
            const currentValue = changes.appWindAngle.currentValue;
            if (currentValue !== null) {
                setAppWind(prevState => ({
                    ...prevState,
                    oldDegreeIndicator: prevState.newDegreeIndicator,
                    newDegreeIndicator: currentValue.toFixed(0),
                }));

                setAppWindValue(prevState => ({
                    ...prevState,
                    oldDegreeIndicator: prevState.newDegreeIndicator,
                    newDegreeIndicator: (currentValue * -1).toFixed(0),
                }));

                smoothCircularRotation(appWind, appWindValue);
            }
        }
    }, [changes.appWindAngle]);

    useEffect(() => {
        // Handle True Wind Angle changes
        if (changes.trueWindAngle && !changes.trueWindAngle.firstChange) {
            const currentValue = changes.trueWindAngle.currentValue;
            if (currentValue !== null) {
                setTrueWind(prevState => ({
                    ...prevState,
                    oldDegreeIndicator: prevState.newDegreeIndicator,
                    newDegreeIndicator: addHeading(currentValue, (Number(compassFaceplate.newDegreeIndicator) * -1)).toFixed(0),
                }));

                setTrueWindValue(prevState => ({
                    ...prevState,
                    oldDegreeIndicator: prevState.newDegreeIndicator,
                    newDegreeIndicator: (Number(currentValue) * -1).toFixed(0),
                }));

                smoothCircularRotation(trueWind, trueWindValue);
                updateClauseHauledLines();
            }
        }
    }, [changes.trueWindAngle, compassFaceplate]);

    useEffect(() => {
        // Handle App Wind Speed changes
        if (changes.appWindSpeed && !changes.appWindSpeed.firstChange) {
            const currentValue = changes.appWindSpeed.currentValue;
            if (currentValue !== null) {
                setAppWindSpeedDisplay(currentValue.toFixed(1));
            }
        }
    }, [changes.appWindSpeed]);

    useEffect(() => {
        // Handle True Wind Speed changes
        if (changes.trueWindSpeed && !changes.trueWindSpeed.firstChange) {
            const currentValue = changes.trueWindSpeed.currentValue;
            if (currentValue !== null) {
                setTrueWindSpeedDisplay(currentValue.toFixed(1));
            }
        }
    }, [changes.trueWindSpeed]);

    useEffect(() => {
        // Handle Min/Max True Wind updates
        if (
            (changes.trueWindMinHistoric && !changes.trueWindMinHistoric.firstChange) || 
            (changes.trueWindMaxHistoric && !changes.trueWindMaxHistoric.firstChange)
        ) {
            if (isNaN(Number(trueWindMinHistoric)) && isNaN(Number(trueWindMaxHistoric))) {
                updateWindSectors();
            }
        }
    }, [changes.trueWindMinHistoric, changes.trueWindMaxHistoric]);
    const addHeading = (h1 = 0, h2 = 0) => {
        let h3 = h1 + h2;
        while (h3 > 359) h3 = h3 - 359;
        while (h3 < 0) h3 = h3 + 359;
        return h3;
    };


    const updateClauseHauledLines = (trueWindAngle, laylineAngle, setCloseHauledLinePortPath, setCloseHauledLineStbdPath) => {
        const centerX = 231; // Center of the circle
        const centerY = 231;
        const radius = 160; // Radius of the inner circle

        // Function to calculate new heading
        const addHeading = (h1 = 0, h2 = 0) => {
            return (h1 + h2 + 360) % 360;
        };

        // Port layline rotation and coordinates
        const portLaylineRotate = addHeading(Number(trueWindAngle), laylineAngle * -1);
        const portX = radius * Math.sin((portLaylineRotate * Math.PI) / 180) + centerX;
        const portY = radius * Math.cos((portLaylineRotate * Math.PI) / 180) * -1 + centerY; // SVG Y-axis starts at the top
        const portPath = `M ${centerX},${centerY} ${portX},${portY}`;
        setCloseHauledLinePortPath(portPath);

        // Starboard layline rotation and coordinates
        const stbdLaylineRotate = addHeading(Number(trueWindAngle), laylineAngle);
        const stbdX = radius * Math.sin((stbdLaylineRotate * Math.PI) / 180) + centerX;
        const stbdY = radius * Math.cos((stbdLaylineRotate * Math.PI) / 180) * -1 + centerY;
        const stbdPath = `M ${centerX},${centerY} ${stbdX},${stbdY}`;
        setCloseHauledLineStbdPath(stbdPath);
    };


    const updateWindSectors = (
        trueWindMinHistoric,
        trueWindMidHistoric,
        trueWindMaxHistoric,
        compassDegreeIndicator,
        laylineAngle,
        setPortWindSectorPath,
        setStbdWindSectorPath,
        calculateAngle
    ) => {
        const centerX = 231; // Center of the circle
        const centerY = 231;
        const radius = 160; // Radius of the inner circle

        // Helper function to calculate new heading
        const addHeading = (h1 = 0, h2 = 0) => {
            return (h1 + h2 + 360) % 360;
        };

        // Port wind sector calculations
        const portMin = addHeading(addHeading(trueWindMinHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle * -1);
        const portMid = addHeading(addHeading(trueWindMidHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle * -1);
        const portMax = addHeading(addHeading(trueWindMaxHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle * -1);

        const portMinX = radius * Math.sin((portMin * Math.PI) / 180) + centerX;
        const portMinY = radius * Math.cos((portMin * Math.PI) / 180) * -1 + centerY;
        const portMidX = radius * Math.sin((portMid * Math.PI) / 180) + centerX;
        const portMidY = radius * Math.cos((portMid * Math.PI) / 180) * -1 + centerY;
        const portMaxX = radius * Math.sin((portMax * Math.PI) / 180) + centerX;
        const portMaxY = radius * Math.cos((portMax * Math.PI) / 180) * -1 + centerY;

        const portLgArcFl = Math.abs(calculateAngle([portMinX, portMinY], [portMidX, portMidY], [portMaxX, portMaxY])) > Math.PI / 2 ? 0 : 1;
        const portSweepFl = calculateAngle([portMaxX, portMaxY], [portMinX, portMinY], [portMidX, portMidY]) > 0 ? 0 : 1;

        const portWindSectorPath = `M ${centerX},${centerY} L ${portMinX},${portMinY} A ${radius},${radius} 0 ${portLgArcFl} ${portSweepFl} ${portMaxX},${portMaxY} z`;
        setPortWindSectorPath(portWindSectorPath);

        // Starboard wind sector calculations
        const stbdMin = addHeading(addHeading(trueWindMinHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle);
        const stbdMid = addHeading(addHeading(trueWindMidHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle);
        const stbdMax = addHeading(addHeading(trueWindMaxHistoric, (Number(compassDegreeIndicator) * -1)), laylineAngle);

        const stbdMinX = radius * Math.sin((stbdMin * Math.PI) / 180) + centerX;
        const stbdMinY = radius * Math.cos((stbdMin * Math.PI) / 180) * -1 + centerY;
        const stbdMidX = radius * Math.sin((stbdMid * Math.PI) / 180) + centerX;
        const stbdMidY = radius * Math.cos((stbdMid * Math.PI) / 180) * -1 + centerY;
        const stbdMaxX = radius * Math.sin((stbdMax * Math.PI) / 180) + centerX;
        const stbdMaxY = radius * Math.cos((stbdMax * Math.PI) / 180) * -1 + centerY;

        const stbdLgArcFl = Math.abs(calculateAngle([stbdMinX, stbdMinY], [stbdMidX, stbdMidY], [stbdMaxX, stbdMaxY])) > Math.PI / 2 ? 0 : 1;
        const stbdSweepFl = calculateAngle([stbdMaxX, stbdMaxY], [stbdMinX, stbdMinY], [stbdMidX, stbdMidY]) > 0 ? 0 : 1;

        const stbdWindSectorPath = `M ${centerX},${centerY} L ${stbdMinX},${stbdMinY} A ${radius},${radius} 0 ${stbdLgArcFl} ${stbdSweepFl} ${stbdMaxX},${stbdMaxY} z`;
        setStbdWindSectorPath(stbdWindSectorPath);
    };


    // Smooth circular rotation function
    const smoothCircularRotation = (rotationElement, countRotationElement) => {
        const oldAngle = Number(rotationElement.oldDegreeIndicator);
        const newAngle = Number(rotationElement.newDegreeIndicator);
        const diff = oldAngle - newAngle;

        // Only update if there's a change in angle and the element is present on the DOM
        if (rotationElement.animationElement && diff !== 0) {
            // Handle the special cases where rotation crosses from 359 to 0 or vice versa
            if (Math.abs(diff) > 180) {
                if (Math.sign(diff) === 1) { // Moving clockwise
                    if (oldAngle === 359) { // Crossing over from 359 to 0
                        handleCrossingOverZero(rotationElement, countRotationElement, true);
                    } else { // Otherwise going from 0 to 359
                        handleCrossingOver359(rotationElement, countRotationElement, true, newAngle);
                    }
                } else { // Moving counter-clockwise
                    if (oldAngle === 0) { // Crossing over from 0 to 359
                        handleCrossingOverZero(rotationElement, countRotationElement, false);
                    } else { // Otherwise going from 359 to 0
                        handleCrossingOver359(rotationElement, countRotationElement, false, newAngle);
                    }
                }
            } else {
                // Normal rotation (no need for special cases)
                animateElement(rotationElement);
                if (countRotationElement) {
                    animateElement(countRotationElement);
                }
            }
        }
    };

    // Helper function to handle crossing from 359 to 0 or vice versa
    const handleCrossingOverZero = (rotationElement, countRotationElement, clockwise) => {
        const zeroValue = clockwise ? "0" : "359";
        const countZeroValue = clockwise ? "0" : "-359";

        rotationElement.oldDegreeIndicator = zeroValue;
        animateElement(rotationElement);

        if (countRotationElement) {
            countRotationElement.oldDegreeIndicator = countZeroValue;
            animateElement(countRotationElement);
        }
    };

    // Helper function to handle crossing over 0 to 359 or vice versa
    const handleCrossingOver359 = (rotationElement, countRotationElement, clockwise, newAngle) => {
        const crossValue = clockwise ? "359" : "0";
        const countCrossValue = clockwise ? "-359" : "0";

        rotationElement.newDegreeIndicator = crossValue;
        animateElement(rotationElement);

        if (countRotationElement) {
            countRotationElement.newDegreeIndicator = countCrossValue;
            animateElement(countRotationElement);
        }

        rotationElement.oldDegreeIndicator = clockwise ? "0" : "359";
        rotationElement.newDegreeIndicator = newAngle.toFixed(0);
        animateElement(rotationElement);

        if (countRotationElement) {
            countRotationElement.oldDegreeIndicator = rotationElement.oldDegreeIndicator;
            countRotationElement.newDegreeIndicator = (newAngle * (clockwise ? 1 : -1)).toFixed(0);
            animateElement(countRotationElement);
        }
    };

    // Helper function to animate element
    const animateElement = (element) => {
        element.animationElement.nativeElement.beginElement();
    };

    // The JSX SVG can be dynamically rendered based on these states
    return (
        <div className="svg-wind-container">
            {/* SVG elements, animations, and various paths */}
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 462 462"
                version="1.1"
                id="svg8"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs id="defs2">
                    <linearGradient id="linearGradient14212">
                        <stop className="boatBackground" style={{ stopOpacity: 1 }} offset="0" id="stop14208" />
                        <stop className="boatBackground" style={{ stopOpacity: 0 }} offset="1" id="stop14210" />
                    </linearGradient>
                    <linearGradient id="linearGradient7154">
                        <stop className="port" style={{ stopOpacity: 1 }} offset="0" id="stop7150" />
                        <stop className="boatBackground" style={{ stopOpacity: 0.56470591 }} offset="0.39871383" id="stop7152" />
                    </linearGradient>
                    <linearGradient id="linearGradient1133">
                        <stop className="starboard" style={{ stopOpacity: 1 }} offset="0" id="stop1129" />
                        <stop className="boatBackground" style={{ stopOpacity: 0.56603771 }} offset="0.39871383" id="stop1131" />
                    </linearGradient>
                    <linearGradient
                        href="#linearGradient1133"
                        id="linearGradient1135"
                        x1="472.6088"
                        y1="531.48444"
                        x2="472.49197"
                        y2="879.10449"
                        gradientUnits="userSpaceOnUse"
                        spreadMethod="pad"
                        gradientTransform="matrix(-1,0,0,1,703.32731,-474.28644)"
                    />
                    <linearGradient
                        href="#linearGradient7154"
                        id="linearGradient7156"
                        x1="-472.64746"
                        y1="531.50549"
                        x2="-472.46103"
                        y2="879.07489"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(703.32731,-474.28644)"
                    />
                    <linearGradient
                        href="#linearGradient14212"
                        id="linearGradient14214"
                        x1="250.36952"
                        y1="296.6875"
                        x2="252.56253"
                        y2="512.70984"
                        gradientUnits="userSpaceOnUse"
                    />
                    <linearGradient
                        href="#linearGradient14212"
                        id="linearGradient20477"
                        gradientUnits="userSpaceOnUse"
                        className="boatBackground"
                        x1="250.84233"
                        y1="382.58936"
                        x2="249.67986"
                        y2="510.65265"
                        gradientTransform="matrix(1.0960272,0,0,0.99845438,-43.954738,-169.73034)"
                    />
                    <linearGradient
                        href="#linearGradient14212"
                        id="linearGradient24749"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="matrix(-1.0960272,0,0,0.99845438,505.95474,-169.73034)"
                        x1="250.84233"
                        y1="382.58936"
                        x2="249.67986"
                        y2="510.65265"
                    />
                </defs>
                {/* sail setup 
                <SvgWindSailSetup sailSetupEnable={sailSetupEnable} /> */}
                {/* background 
                <SvgWindBackground />*/}
                {/* Laylines */}
                <SvgWindLayLines
                    closeHauledLineEnable={closeHauledLineEnable}
                    trueWindAngle={trueWindAngle}
                    closeHauledLineStbdPath={closeHauledLineStbdPath}
                    closeHauledLinePortPath={closeHauledLinePortPath}
                />
                {/* wind shift sector */}
                <SvgWindShiftSector
                    windSectorEnable={windSectorEnable}
                    portWindSectorPath={portWindSectorPath}
                    stbdWindSectorPath={stbdWindSectorPath}
                />
                {/* Compass */}
                <SvgWindCompass ref={compassAnimateRef} />
                {/* Wind indicator */}
                <SvgWindIndicator
                    windSpeed={trueWindSpeed}
                    oldDegreeIndicator={trueWind.oldDegreeIndicator}
                    newDegreeIndicator={trueWind.newDegreeIndicator}
                />

                <svg x="0" y="0" width="33" height="53" viewBox="0 0 33 53" style={{ overflow: 'visible' }} id="TrueWindCoord">
                    <g>
                        <path
                            id="NeddleTWA"
                            className="true-wind"
                            style={{
                                display: 'inline',
                                fillOpacity: 0.996078,
                                stroke: '#000000',
                                strokeWidth: 0,
                                strokeDasharray: 'none',
                                strokeOpacity: 1,
                            }}
                            d="m 231,7.25 a 16.122065,16.122065 0 0 0 -16.12109,16.121093 16.122065,16.122065 0 0 0 4.70117,11.322266 l 11.52148,24.009766 0.008,0.0059 11.41015,-24.115234 A 16.122065,16.122065 0 0 0 247.12109,23.371093 16.122065,16.122065 0 0 0 231,7.25 Z"
                        />
                        <text
                            xmlSpace="preserve"
                            className="wind-text"
                            style={{
                                fontStyle: 'normal',
                                fontVariant: 'normal',
                                fontWeight: 'bold',
                                fontStretch: 'normal',
                                fontSize: '12px',
                                fontFamily: 'Arial',
                                textAnchor: 'middle',
                                display: 'inline',
                                fillOpacity: 1,
                                stroke: 'none',
                                strokeWidth: 0,
                                strokeDasharray: 'none',
                                strokeOpacity: 1,
                            }}
                            x="232.99219"
                            y="52.227623"
                            id="LabelTWS"
                        >
                            T
                        </text>
                        <svg viewBox="-231.5 -24 33 53" style={{ overflow: 'visible' }} id="TWSCoord">
                            <g>
                                <text
                                    xmlSpace="preserve"
                                    className="wind-text"
                                    alignmentBaseline="middle"
                                    style={{
                                        fontStyle: 'normal',
                                        fontVariant: 'normal',
                                        fontWeight: 'bold',
                                        fontStretch: 'normal',
                                        fontSize: '14.3px',
                                        fontFamily: 'Arial',
                                        textAnchor: 'middle',
                                        display: 'inline',
                                        fillOpacity: 1,
                                        stroke: 'none',
                                        strokeWidth: 0,
                                        strokeDasharray: 'none',
                                        strokeOpacity: 1,
                                    }}
                                    x="0"
                                    y="0"
                                    id="ValueTWS"
                                >
                                    {trueWindSpeedDisplay}
                                </text>
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from={trueWindValue.oldDegreeIndicator}
                                    to={trueWindValue.newDegreeIndicator}
                                    begin="indefinite"
                                    dur="0.5s"
                                    additive="replace"
                                    fill="freeze"
                                />
                            </g>
                        </svg>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={trueWind.oldDegreeIndicator + ' 231 231'}
                            to={trueWind.newDegreeIndicator + ' 231 231'}
                            begin="indefinite"
                            dur="0.5s"
                            additive="replace"
                            fill="freeze"
                        />
                    </g>
                </svg>
                {/* Heading */}
                <g id="LayerHeadingIndicator" style={{ display: 'inline' }} transform="translate(4,8)">
                    <path
                        className="heading-background"
                        style={{
                            display: 'inline',
                            opacity: 1,
                            fillOpacity: 1,
                            strokeWidth: 2.5,
                            strokeLinecap: 'butt',
                            strokeLinejoin: 'round',
                            strokeDasharray: 'none',
                            strokeOpacity: 1,
                        }}
                        id="FaceplateHeading"
                        width="67.073669"
                        height="38.361046"
                        x="194.46938"
                        y="30.8176"
                        d="m 225.64754,33.805625 1.6301,0.0048 c 17.39931,0.05072 31.39725,3.329857 31.38553,7.35232 l -0.0685,23.494107 c -0.0117,4.022464 -14.02856,7.21993 -31.42786,7.169208 l -1.63011,-0.0048 c -17.3993,-0.05072 -31.39725,-3.329857 -31.38552,-7.352321 l 0.0685,-23.494107 c 0.0117,-4.022463 14.02855,-7.219929 31.42786,-7.169207 z"
                        ry="7.3267355"
                        rx="32.688519"
                        transform="matrix(1.002028,0,0,0.77009941,-0.86633959,3.237595)"
                    />
                    <text
                        className="wind-text"
                        xmlSpace="preserve"
                        style={{
                            fontStyle: 'normal',
                            fontVariant: 'normal',
                            fontWeight: 'bold',
                            fontStretch: 'normal',
                            fontSize: '24px',
                            fontFamily: 'Arial',
                            textAnchor: 'middle',
                            display: 'inline',
                        }}
                        x="226.14061"
                        y="52.178043"
                        id="ValueHeading"
                    >
                        <tspan id="tspan349" x="226.14061" y="52.178043">
                            {headingValue}
                        </tspan>
                    </text>
                </g>
            </svg>
        </div>
    );
};

export default SvgWindComponent;
