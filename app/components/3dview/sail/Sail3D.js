/**
 * Sail3D Component - 3D visualization of a sail with wind interaction physics
 * 
 * This component creates a realistic sail model that responds to apparent wind
 * conditions and simulates proper sail shape based on various parameters
 * including wind angle, wind speed, and sail controls like cunningham.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Wind from './Wind';
import SailShape from './SailShape';
import { useOcearoContext, oBlue } from '../../context/OcearoContext';

// Sail dimensions in millimeters
const SAIL_HEIGHT = 8000;                                      // Total sail height
const SAIL_LEVEL_HEIGHT = 50;                                // Height of each sail segment
const SAIL_VERTICES_PER_LEVEL = Math.floor(1000 / SAIL_LEVEL_HEIGHT); // Number of vertices per level
const SAIL_LEVELS = Math.ceil(SAIL_HEIGHT / SAIL_LEVEL_HEIGHT);       // Total number of levels
const SAIL_TACK_HEIGHT = 900;                                // Height of the tack (lower corner of sail)
const SAIL_TACK_MAST_DISTANCE = 3600;                       // Horizontal distance from mast to tack
const SAIL_MAST_WIDTH = 200;                                // Width of the mast
const SAIL_DECKSWEEPER_WIDTH = 3800;                        // Width of sail at deck level
const SAIL_TOP_MAST_DISTANCE = 390;                         // Horizontal distance from mast to head (top)
const SAIL_LEECH_CURVATURE = 600;                           // Leech curvature (trailing edge)

// Boat physical constraints
const BOAT_LIMITS = {
    waterlineToMastFootHeight: 0.45,                       // Height from waterline to mast foot in meters
    maxMastRotation: Math.PI / 2,                           // Maximum rotation angle of the mast
    maxChordRotationPerSailLevel: (Math.PI / 3) * 2,        // Maximum chord rotation between adjacent levels
};

/**
 * Sail3D Component
 * @param {Object} props - Component properties
 * @param {Object} props.windParams - Wind parameters
 * @param {number} props.windParams.speed - Wind speed in knots
 * @param {number} props.windParams.hellman - Hellman exponent for wind shear calculation
 * @param {Object} props.boatParams - Boat parameters
 * @param {number} props.boatParams.mastrotation - Current mast rotation in radians
 * @param {number} props.boatParams.heading - Boat heading in degrees
 * @param {number} props.boatParams.speed - Boat speed in knots
 * @param {Object} props.sailParams - Sail control parameters
 * @param {number} props.sailParams.mastArea - Mast area in square meters
 * @param {number} props.sailParams.sailArea - Sail area in square meters
 * @param {number} props.sailParams.cunningham - Cunningham tension (0-1)
 * @param {number} props.sailParams.angleOfAttack - Sail angle of attack in degrees
 */
const Sail3D = ({
    windParams = { speed: 5.0, hellman: 0.27 },
    boatParams = { mastrotation: 0.0, heading: 130.0, speed: 5.0 },
    sailParams = { mastArea: 0, sailArea: 0, cunningham: 1, angleOfAttack: 20 },
}) => {
    // Access to SignalK data through Ocearo context
    const { getSignalKValue } = useOcearoContext();

    // Component references
    const sailRef = useRef();                       // Reference to the sail mesh
    const flatSailGeometryRef = useRef(null);      // Stores the original flat sail geometry
    const lastMastRotationRef = useRef(0);         // Tracks previous mast rotation for animations
    const lastCunninghamRef = useRef(null);        // Tracks previous cunningham value for recalculation
    const sailShapeRef = useRef(null);             // Reference to the sail shape calculator
    const windGroupRef = useRef();                 // Reference to the wind visualization group
    const apparentWindFieldRef = useRef({});       // Stores the apparent wind field data

    /**
     * Creation of cones to visualize the apparent wind
     * These cones indicate the wind direction and strength at different heights
     */
    const createWindCone = useMemo(() => {
        // Create a group to contain all the wind cone elements
        const windcone = new THREE.Group();
        
        // Define the cone geometry and material
        const geometry = new THREE.ConeGeometry(0.1, 0.2, 12);
        const material = new THREE.MeshStandardMaterial({
            color: oBlue,               // Ocearo blue color
            opacity: 0.5,               // Semi-transparent
            transparent: true,
        });
        
        // Create the mesh and position it
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -0.1, 0);  // Place the cone base at the origin
        windcone.add(mesh);
        
        return windcone;
    }, []);

    /**
     * Initialization of the apparent wind field at different heights
     * Creates a visual representation of wind at different altitudes
     * to show the effect of wind shear
     */
    useEffect(() => {
        const windGroup = new THREE.Group();
        const apparentWindField = {};

        // Create a wind cone every 0.5 meters along the entire sail height
        for (let height = 0; height < SAIL_HEIGHT / 1000; height += 0.5) {
            const clone = createWindCone.clone();
            clone.position.set(0, height, 0);  // Position the cone at the correct height
            apparentWindField[height * 2] = clone;
            windGroup.add(clone);
        }

        windGroup.position.set(0, 0, 0);

        // Add the wind group to the reference
        if (windGroupRef.current) {
            windGroupRef.current.add(windGroup);
        }

        apparentWindFieldRef.current = apparentWindField;

        // Cleanup when the component unmounts
        return () => {
            windGroup.clear();
        };
    }, [createWindCone]);

    /**
     * Updates the apparent wind field based on wind speed and shear factor
     * 
     * @param {number} appWindSpeed - Apparent wind speed in knots
     * @param {number} hellman - Hellman exponent for wind shear calculation
     */
    const recalcApparentWindField = (appWindSpeed, hellman) => {
        const apparentWindField = apparentWindFieldRef.current;

        if (!apparentWindField) {
            console.error("apparentWindField is not initialized.");
            return;
        }

        // Update each cone in the wind field
        for (let height = 0; height < SAIL_HEIGHT / 1000; height += 0.5) {
            // Calculate wind speed at this height (shear effect)
            const aws = Wind.windSheer(appWindSpeed, height, hellman);
            const cone = apparentWindField[height * 2];

            if (!cone) {
                console.warn(`Apparent wind field cone at height ${height} is not defined.`);
                continue;
            }

            // Adjust cone scale based on wind speed
            cone.scale.set(aws * 0.1, aws, aws * 0.1);
            
            // Orient the cone in the wind direction
            cone.rotation.set(0, -Math.PI, Math.PI / 2);
        }
    };

    /**
     * Creation of the initial sail geometry
     * 
     * This function builds the basic shape of the sail by creating a triangular mesh geometry.
     * The sail is generated in horizontal levels, each with its own vertices.
     * The overall shape of the sail is determined by the width at different heights.
     */
    const createSailGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const sailClipWidthPerLevel = [];

        // Generate the sail geometry by horizontal levels
        for (let level = 0; level <= SAIL_LEVELS; level++) {
            const height = Math.min(level * SAIL_LEVEL_HEIGHT, SAIL_HEIGHT);
            let sailWidth, clipOffWidth;

            // Determine the sail width at this height
            if (height < SAIL_TACK_HEIGHT) {
                // Shape of the lower part of the sail (below the tack point)
                sailWidth = SAIL_TACK_MAST_DISTANCE;
                clipOffWidth = SAIL_DECKSWEEPER_WIDTH +
                    (SAIL_TACK_MAST_DISTANCE - SAIL_DECKSWEEPER_WIDTH) * height / SAIL_TACK_HEIGHT;
            } else {
                // Shape of the upper part of the sail (above the tack point)
                // Width decreases linearly with height
                sailWidth = SAIL_TACK_MAST_DISTANCE -
                    (SAIL_TACK_MAST_DISTANCE - SAIL_TOP_MAST_DISTANCE) *
                    (height - SAIL_TACK_HEIGHT) / (SAIL_HEIGHT - SAIL_TACK_HEIGHT);
                    
                // Add curvature to the leech of the sail (trailing edge)
                sailWidth += Math.sin((height - SAIL_TACK_HEIGHT) /
                    (SAIL_HEIGHT - SAIL_TACK_HEIGHT) * Math.PI) * SAIL_LEECH_CURVATURE;
                clipOffWidth = sailWidth;
            }

            // Generate vertices for this level
            let lastX = 0;
            for (let v = 0; v < SAIL_VERTICES_PER_LEVEL; v++) {
                const segWidth = sailWidth / (SAIL_VERTICES_PER_LEVEL - 1);
                let clipAway = segWidth * v - clipOffWidth;
                let finalSegWidth = segWidth;

                // Clip segments that exceed the sail limit
                if (clipAway > 0.1) {
                    finalSegWidth = clipAway > segWidth ? 0 : segWidth - clipAway;
                }

                // Add the vertex (converted from mm to m)
                vertices.push(
                    v === 0 ? 0 : (lastX + finalSegWidth) / 1000, // x (horizontal position)
                    height / 1000,                                // y (height)
                    0                                            // z (depth, initially flat)
                );

                lastX = v === 0 ? 0 : lastX + finalSegWidth;

                // Define vertex colors (alternating red and gray stripes)
                const sailStripeInterval = Math.floor(SAIL_LEVELS / 10);
                colors.push(...(level % sailStripeInterval === 0 ? 
                    [0.8, 0.0, 0.047] :   // Red for indicator stripes
                    [0.596, 0.596, 0.596]  // Gray for the rest of the sail
                ));
            }

            // Store the clipping width for this level
            sailClipWidthPerLevel.push(clipOffWidth === sailWidth ? null : clipOffWidth);
        }

        // Create triangles for the geometry by connecting vertices
        const indices = [];
        for (let level = 0; level < SAIL_LEVELS; level++) {
            for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
                const i = level * SAIL_VERTICES_PER_LEVEL + v;
                
                // Two triangles form a quad between adjacent levels
                indices.push(
                    i - 1, i, i + SAIL_VERTICES_PER_LEVEL - 1,                // First triangle
                    i, i + SAIL_VERTICES_PER_LEVEL, i + SAIL_VERTICES_PER_LEVEL - 1  // Second triangle
                );
            }
        }

        // Set the geometry attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Return the created geometry and information about the width per level
        return { geometry, sailClipWidthPerLevel };
    }, []);
    
    // Extract the results from the geometry creation function
    const { geometry, sailClipWidthPerLevel } = createSailGeometry;

    /**
     * Retrieve wind values from SignalK
     * The apparent wind angle and speed are used to determine
     * the shape and orientation of the sail
     */
    const appWindAngle = useMemo(() => getSignalKValue('environment.wind.angleApparent') || 0, [getSignalKValue]);
    const appWindSpeed = useMemo(() => getSignalKValue('environment.wind.speedApparent') || 0, [getSignalKValue]);

    /**
     * Main effect: Update sail geometry based on wind
     * 
     * This effect is responsible for:
     * 1. Recalculating the apparent wind field
     * 2. Updating the sail shape based on cunningham tension
     * 3. Normalizing the wind angle for consistent 360° handling
     * 4. Calculating sail rotations based on wind angle
     */
    useEffect(() => {
        if (!sailRef.current) return;

        // Update the wind field visualization
        recalcApparentWindField(appWindSpeed, windParams.hellman);

        // Get geometry references for modification
        const sailGeometry = sailRef.current.geometry;
        const positions = sailGeometry.attributes.position.array;

        // Create a new sail profile if cunningham has changed
        if (sailParams.cunningham !== lastCunninghamRef.current) {
            sailShapeRef.current = new SailShape(
                SAIL_TACK_MAST_DISTANCE,
                SAIL_TOP_MAST_DISTANCE,
                SAIL_MAST_WIDTH,
                sailParams.cunningham  // Cunningham tension (0-1)
            );
            lastCunninghamRef.current = sailParams.cunningham;
        }

        // Save the flat geometry if it's the first time
        if (!flatSailGeometryRef.current) {
            flatSailGeometryRef.current = sailGeometry.clone();
        }

        // Height of mast foot above water (convert m to mm)
        const mastFootOverWaterHeight = BOAT_LIMITS.waterlineToMastFootHeight * 1000;

        // --------------------------------
        // WIND ANGLE NORMALIZATION
        // --------------------------------
        
        /**
         * STEP 1: Normalize the angle to the range [0, 2π]
         * Ensure the angle is always positive and less than 360 degrees
         */
        let normalizedAngle = appWindAngle;
        while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
        while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
        
        /**
         * STEP 2: Determine which side the wind is coming from
         * - If angle is between 0 and 180°: wind from starboard (right)
         * - If angle is between 180° and 360°: wind from port (left)
         * 
         * The direction factor (dirFact) allows applying rotations in the correct direction
         */
        const isWindFromLeft = normalizedAngle > Math.PI;
        const dirFact = isWindFromLeft ? -1.0 : 1.0;
        
        /**
         * STEP 3: Convert the angle to a range of [0, π] (0-180°)
         * This normalization allows symmetric behavior of the sail
         * regardless of which side the wind is coming from
         */
        let normalizedWindAngle = normalizedAngle;
        if (normalizedWindAngle > Math.PI) {
            normalizedWindAngle = 2 * Math.PI - normalizedWindAngle;
        }
        
        // Convert the angle of attack from degrees to radians
        let chordAngleOfAttackRad = THREE.MathUtils.degToRad(sailParams.angleOfAttack);
        
        // Get the mast entry angle from the sail profile
        const mastEntryAngleRad = sailShapeRef.current.mastAngleRad;

        // Special case: if wind comes directly from the front, no angle of attack
        if (normalizedWindAngle < 0.01) {
            chordAngleOfAttackRad = 0;
        }

        /**
         * Calcul de la rotation du mât en fonction de l'angle du vent
         * 
         * La formule utilise :
         * - normalizedWindAngle : l'angle normalisé du vent (0-180°)
         * - chordAngleOfAttackRad : l'angle d'attaque de la voile
         * - mastEntryAngleRad : l'angle d'entrée du mât (dépendant du cunningham)
         * 
         * La rotation est limitée par BOAT_LIMITS.maxMastRotation pour des raisons physiques
         */
        const mastRotationRad = Math.min(
            normalizedWindAngle - chordAngleOfAttackRad + mastEntryAngleRad,
            BOAT_LIMITS.maxMastRotation
        );

        // Définir l'axe vertical pour les rotations (axe du guindant/bord d'attaque de la voile)
        const luffAxis = new THREE.Vector3(0, 1, 0);
        
        // Variable pour suivre la rotation précédente (utilisée pour limiter les changements brusques)
        let lastChordRotationRad = null;

        /**
         * SECTION CLÉ : Calcul de la forme de la voile pour chaque niveau
         * 
         * Cette boucle gère la forme 3D de la voile en calculant :
         * 1. Le cisaillement du vent à différentes hauteurs
         * 2. L'angle de la corde de la voile à chaque niveau
         * 3. La rotation de chaque vertex pour créer la forme curve
         */
        for (let level = 0; level <= SAIL_LEVELS; level++) {
            // Hauteur de ce niveau de voile au-dessus de l'eau
            const overWaterHeight = level * SAIL_LEVEL_HEIGHT + mastFootOverWaterHeight;
            
            // Calculer la vitesse du vent à cette hauteur (effets de cisaillement)
            const levelAws = Wind.windSheer(appWindSpeed, overWaterHeight / 1000.0, windParams.hellman);
            
            /**
             * Angle de la corde principale de la voile à ce niveau
             * Utilise l'angle normalisé pour garantir un comportement symétrique
             * quel que soit le côté d'où vient le vent (0-180° ou 180-360°)
             */
            let chordAngleRad = normalizedWindAngle - chordAngleOfAttackRad;
            
            /**
             * Contraindre l'angle dans des limites réalistes pour la forme de la voile
             * - Minimum 0 : la voile ne peut pas aller "devant" sa position neutre
             * - Maximum 90° : limite physique de la forme de la voile
             */
            if (chordAngleRad < 0) {
                chordAngleRad = 0;
            } else if (chordAngleRad > Math.PI / 2) {
                chordAngleRad = Math.PI / 2;
            }

            /**
             * Calcul de la rotation de la corde pour ce niveau
             * - On soustrait la rotation du mât pour obtenir l'angle relatif
             * - Limite la différence maximale entre niveaux successifs pour éviter des plis irréalistes
             */
            let chordRotationRad = chordAngleRad - mastRotationRad;
            if (lastChordRotationRad &&
                ((chordRotationRad - lastChordRotationRad) > BOAT_LIMITS.maxChordRotationPerSailLevel)) {
                // Limiter le changement de courbure entre niveaux adjacents
                chordRotationRad = lastChordRotationRad + BOAT_LIMITS.maxChordRotationPerSailLevel;
            }
            lastChordRotationRad = chordRotationRad;

            // Récupérer la largeur de découpage et les angles des vertex pour ce niveau
            const clipWidth = sailClipWidthPerLevel[level];
            const verticeAnglesRad = sailShapeRef.current.getVerticesAngles(
                SAIL_VERTICES_PER_LEVEL,
                SAIL_MAST_WIDTH,
                clipWidth
            );

            /**
             * Appliquer la rotation à chaque sommet (vertex) de ce niveau
             * On ignore le premier vertex (v=0) car c'est le point d'attache au mât
             */
            for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
                // Calcul de l'index dans le tableau de positions (3 composantes x,y,z par sommet)
                const i = (level * SAIL_VERTICES_PER_LEVEL + v) * 3;
                
                // Récupérer la position d'origine (la voile plate)
                const originalPos = new THREE.Vector3(
                    flatSailGeometryRef.current.attributes.position.array[i],     // x
                    flatSailGeometryRef.current.attributes.position.array[i + 1], // y
                    flatSailGeometryRef.current.attributes.position.array[i + 2]  // z
                );

                /**
                 * Appliquer la rotation autour de l'axe vertical (luffAxis)
                 * - Le signe négatif inverse la direction de rotation
                 * - dirFact (-1 ou 1) tient compte du côté d'où vient le vent
                 * - verticeAnglesRad[v] ajoute une rotation supplémentaire selon la position
                 *   du vertex pour créer la courbe du profil de la voile
                 */
                originalPos.applyAxisAngle(
                    luffAxis,
                    -(chordRotationRad + verticeAnglesRad[v]) * dirFact
                );

                // Mettre à jour les positions dans le tableau de la géométrie
                positions[i] = originalPos.x;     // Nouvelle position x
                positions[i + 1] = originalPos.y; // Nouvelle position y
                positions[i + 2] = originalPos.z; // Nouvelle position z
            }
        }

        // Indiquer que les positions des vertex ont changé et doivent être mises à jour
        sailGeometry.attributes.position.needsUpdate = true;

        // Mettre à jour les paramètres du bateau avec la nouvelle rotation du mât
        const newBoatParams = {
            ...boatParams,
            mastrotation: mastRotationRad * dirFact, // Appliquer le facteur de direction
        };

        /**
         * Appliquer la rotation du mât au mesh de la voile
         * Compare avec la rotation précédente pour ne faire que la différence
         * plutôt qu'une rotation complète à chaque frame
         */
        if (sailRef.current) {
            sailRef.current.rotateY(
                lastMastRotationRef.current - newBoatParams.mastrotation
            );
        }

        // Enregistrer la rotation actuelle pour la prochaine mise à jour
        lastMastRotationRef.current = newBoatParams.mastrotation;
    }, [
        /**
         * Dépendances de l'effet principal
         * Chacune de ces valeurs déclenchera une mise à jour de la géométrie
         * de la voile lorsqu'elle change
         */
        appWindSpeed,              // Vitesse du vent apparent
        appWindAngle,             // Angle du vent apparent
        windParams.hellman,       // Coefficient de cisaillement du vent
        sailParams.cunningham,    // Tension du cunningham (forme de la voile)
        sailParams.angleOfAttack, // Angle d'attaque de la voile
        boatParams,               // Paramètres du bateau (direction, vitesse, etc.)
        sailClipWidthPerLevel     // Largeurs de découpage par niveau
    ]);

    /**
     * Rendu 3D de la voile
     * 
     * Le composant retourne un mesh Three.js avec :
     * - Une position initiale 2 mètres au-dessus et 1 mètre derrière l'origine
     * - Une rotation de -90° (mettant la voile le long de l'axe Y)
     * - La géométrie de la voile créée précédemment
     * - Un groupe pour visualiser le vent
     * - Un matériau avec coloration par vertex et transparence
     */
    return (
        <mesh 
            ref={sailRef} 
            position={[0, 2, -1]} 
            rotation={[0, -Math.PI / 2, 0]}
        >
            <bufferGeometry {...geometry} />
            <group ref={windGroupRef} />
            <meshBasicMaterial
                vertexColors
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default Sail3D;