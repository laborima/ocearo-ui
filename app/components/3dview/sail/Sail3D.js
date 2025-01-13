import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Wind from './Wind';
import SailShape from './SailShape';
import { useOcearoContext,convertWindSpeed,convertSpeed, oBlue  } from '../../context/OcearoContext';

const Sail3D = ({ windParams = { speed: 5.0, hellman: 0.27 }, 
                  boatParams = { 
                    mastrotation: 0.0,
                    heading: 130.0,
                    speed: 5.0
                  },
                  sailParams = {
                    mastArea: 0,
                    sailArea: 0,
                    cunningham: 1,
                    angleOfAttack: 20
                  }
                }) => {
                    

                 const { getSignalKValue} = useOcearoContext();
                  
    

    
  const sailRef = useRef();
  const flatSailGeometryRef = useRef(null);
  const lastMastRotationRef = useRef(0);
  const lastCunninghamRef = useRef(null);
  const sailShapeRef = useRef(null);
  

  // Constants
  const SAIL_HEIGHT = 8000; // mm (hauteur totale de la voile)
  const SAIL_LEVEL_HEIGHT = 50; // mm (hauteur d'un niveau de voile)
  const SAIL_VERTICES_PER_LEVEL = Math.floor(1000 / SAIL_LEVEL_HEIGHT);// (nombre de sommets par niveau)
  const SAIL_LEVELS = Math.ceil(SAIL_HEIGHT / SAIL_LEVEL_HEIGHT);// (nombre total de niveaux dans la voile)
  const SAIL_TACK_HEIGHT = 900; // mm (hauteur du point d'amure)
  const SAIL_TACK_MAST_DISTANCE = 3500; // mm (distance entre le point d'amure et le mât)
  const SAIL_MAST_WIDTH = 200; // mm (largeur du mât)
  const SAIL_DECKSWEEPER_WIDTH = 3500;  // mm (largeur du racleur de pont)
  const SAIL_TOP_MAST_DISTANCE = 390; // mm (distance du haut de la voile au mât supérieur)
  const SAIL_LEECH_CURVATURE = 500; // mm (courbure du bord de fuite de la voile)

  const BOAT_LIMITS = {
    waterlineToMastFootHeight: 0.45, // m
    maxMastRotation: Math.PI / 2,
    maxChordRotationPerSailLevel: (Math.PI / 3) * 2
  };

  
  const windGroupRef = useRef();
  const apparentWindFieldRef = useRef({});

  // Initialize wind visualization on mount
  useEffect(() => {
    const windGroup = new THREE.Group();
    const windcone = createWindCone();

    // Create apparentWindField
    const apparentWindField = {};
    for (let height = 0; height < 11; height += 0.5) {
      const clone = windcone.clone();
      clone.position.set(0, height, 0);
      apparentWindField[height * 2] = clone;
      windGroup.add(clone);
    }

    // Adjust windGroup position
    windGroup.position.set(7.5, 0, 0);

    // Add to scene
    if (windGroupRef.current) {
      windGroupRef.current.add(windGroup);
    }

    // Store references
    apparentWindFieldRef.current = apparentWindField;

    // Cleanup on unmount
    return () => {
      windGroup.clear();
    };
  }, []);

  // Function to recalculate apparent wind field
  const recalcApparentWindField = (appWindSpeed, appWindAngle, hellman) => {
    const apparentWindField = apparentWindFieldRef.current;

    if (!apparentWindField) {
      console.error("apparentWindField is not initialized.");
      return;
    }

    for (let height = 0; height < 11; height += 0.5) {
      const aws = Wind.windSheer(appWindSpeed, height, hellman);
      const awa = appWindAngle;

      const cone = apparentWindField[height * 2];
      if (!cone) {
        console.warn(`Apparent wind field cone at height ${height} is not defined.`);
        continue;
      }

      // Scale and rotate the cone
      cone.scale.set(aws * 0.1, aws, aws * 0.1);
      cone.rotation.set(0, -THREE.MathUtils.degToRad(awa), Math.PI / 2);
    }
  };


  
  const createSailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sailClipWidthPerLevel = [];
    
    // Create vertices
    for (let level = 0; level <= SAIL_LEVELS; level++) {
      let height = Math.min(level * SAIL_LEVEL_HEIGHT, SAIL_HEIGHT);
      
      // Calculate sail width at this level
      let sailWidth, clipOffWidth;
      if (height < SAIL_TACK_HEIGHT) {
        sailWidth = SAIL_TACK_MAST_DISTANCE;
        clipOffWidth = SAIL_DECKSWEEPER_WIDTH + 
          (SAIL_TACK_MAST_DISTANCE - SAIL_DECKSWEEPER_WIDTH) * height / SAIL_TACK_HEIGHT;
      } else {
        sailWidth = SAIL_TACK_MAST_DISTANCE - 
          (SAIL_TACK_MAST_DISTANCE - SAIL_TOP_MAST_DISTANCE) * 
          (height - SAIL_TACK_HEIGHT) / (SAIL_HEIGHT - SAIL_TACK_HEIGHT);
        sailWidth += Math.sin((height - SAIL_TACK_HEIGHT) / 
          (SAIL_HEIGHT - SAIL_TACK_HEIGHT) * Math.PI) * SAIL_LEECH_CURVATURE;
        clipOffWidth = sailWidth;
      }

      // Add vertices for this level
      let lastX = 0;
      for (let v = 0; v < SAIL_VERTICES_PER_LEVEL; v++) {
        const segWidth = sailWidth / (SAIL_VERTICES_PER_LEVEL - 1);
        let clipAway = segWidth * v - clipOffWidth;
        let finalSegWidth = segWidth;
        
        if (clipAway > 0.1) {
          finalSegWidth = clipAway > segWidth ? 0 : segWidth - clipAway;
        }

        vertices.push(
          v === 0 ? 0 : (lastX + finalSegWidth)/1000, // x
          height/1000,                              // y
          0                                    // z
        );
        
        lastX = v === 0 ? 0 : lastX + finalSegWidth;

        // Add colors (alternating dark grey and red stripes)
        const isRedStripe = Math.floor(level / Math.floor(SAIL_LEVELS / 10)) % 2 === 0;
        colors.push(
          isRedStripe ? 0.8 : 0.25, // r
          isRedStripe ? 0.2 : 0.25, // g
          isRedStripe ? 0.2 : 0.25  // b
        );
      }

      sailClipWidthPerLevel.push(clipOffWidth === sailWidth ? null : clipOffWidth);
    }

    // Create indices for triangles
    const indices = [];
    for (let level = 0; level < SAIL_LEVELS; level++) {
      for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
        const i = level * SAIL_VERTICES_PER_LEVEL + v;
        indices.push(
          i - 1, i, i + SAIL_VERTICES_PER_LEVEL - 1,
          i, i + SAIL_VERTICES_PER_LEVEL, i + SAIL_VERTICES_PER_LEVEL - 1
        );
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return { geometry, sailClipWidthPerLevel };
  }, []);

   const rad2grad = (rad) => rad * 180 / Math.PI;

    useFrame(() => {
      if (!sailRef.current ) return;
      
      const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue') || 10
      const appWindAngle = getSignalKValue('environment.wind.angleApparent') || 0;
      const appWindSpeed = convertWindSpeed(getSignalKValue('environment.wind.speedApparent')) || 0;

    

      const sailGeometry = sailRef.current.geometry;
      const positions = sailGeometry.attributes.position.array;
      
      // Initialize boat configuration calculations
      const boatHeadingRad = THREE.MathUtils.degToRad(courseOverGroundAngle);
      
      // Update sail shape if cunningham changed
      if (sailParams.cunningham !== lastCunninghamRef.current) {
        sailShapeRef.current = new SailShape(
          SAIL_TACK_MAST_DISTANCE,
          SAIL_TOP_MAST_DISTANCE,
          SAIL_MAST_WIDTH,
          sailParams.cunningham
        );
        lastCunninghamRef.current = sailParams.cunningham;
      }

      // Create flat sail geometry if it doesn't exist
      if (!flatSailGeometryRef.current) {
        flatSailGeometryRef.current = sailGeometry.clone();
      }

      const mastFootOverWaterHeight = BOAT_LIMITS.waterlineToMastFootHeight * 1000;
      const dirFact = boatHeadingRad < 0 ? -1.0 : 1.0;

      // Calculate apparent wind
      const aw = {"awa":appWindAngle,"aws":appWindSpeed };
      
      //Wind.apparentWind(speedOverGround, boatHeadingRad, trueWindSpeed, trueWindAngle);
      
      // Calculate angles
      let chordAngleOfAttackRad = THREE.MathUtils.degToRad(sailParams.angleOfAttack);
      const absAwaRad = Math.abs(aw.awa);
      const mastEntryAngleRad = sailShapeRef.current.mastAngleRad;
      
      if (absAwaRad < 0.01) {
        chordAngleOfAttackRad = 0;
      }
      
      const mastRotationRad = Math.min(
        absAwaRad - chordAngleOfAttackRad + mastEntryAngleRad,
        BOAT_LIMITS.maxMastRotation
      );

      //Wind
          recalcApparentWindField(appWindSpeed, appWindAngle, windParams.hellman);
          
      
      // Setup for sail shape adjustments
      const luffAxis = new THREE.Vector3(0, 1, 0);
      let lastChordRotationRad = null;
      let tackChordRotationRad = null;
      let topChordRotationRad = null;
      const sailTackLevel = Math.round(SAIL_TACK_HEIGHT / SAIL_LEVEL_HEIGHT) + 1;

      // Adjust sail shape for each level
      for (let level = 0; level <= SAIL_LEVELS; level++) {
        const overWaterHeight = level * SAIL_LEVEL_HEIGHT + mastFootOverWaterHeight;
      //  const tws = Wind.windSheer(trueWindSpeed, overWaterHeight / 1000.0, windParams.hellman);
        const levelAw = {"awa":appWindAngle,"aws": Wind.windSheer(appWindSpeed, overWaterHeight / 1000.0, windParams.hellman) } 
        //Wind.apparentWind(trueWindSpeed, boatHeadingRad, tws, trueWindAngle);
        const levelAbsAwaRad = Math.abs(levelAw.awa);

        // Calculate chord angles
        let chordAngleRad = levelAbsAwaRad - chordAngleOfAttackRad;
        if (chordAngleRad < 0) {
          chordAngleRad = 0;
        } else if (chordAngleRad > Math.PI / 2) {
          chordAngleRad = Math.PI / 2;
        }

        let chordRotationRad = chordAngleRad - mastRotationRad;
        if (lastChordRotationRad && 
            ((chordRotationRad - lastChordRotationRad) > BOAT_LIMITS.maxChordRotationPerSailLevel)) {
          chordRotationRad = lastChordRotationRad + BOAT_LIMITS.maxChordRotationPerSailLevel;
        }
        lastChordRotationRad = chordRotationRad;

        // Get vertex angles for this level
        const clipWidth = createSailGeometry.sailClipWidthPerLevel[level];
        const verticeAnglesRad = sailShapeRef.current.getVerticesAngles(
          SAIL_VERTICES_PER_LEVEL,
          SAIL_MAST_WIDTH,
          clipWidth
        );

        // Apply rotations to vertices
        for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
          const i = (level * SAIL_VERTICES_PER_LEVEL + v) * 3;
          const originalPos = new THREE.Vector3(
            flatSailGeometryRef.current.attributes.position.array[i],
            flatSailGeometryRef.current.attributes.position.array[i + 1],
            flatSailGeometryRef.current.attributes.position.array[i + 2]
          );

          // Apply rotation
          originalPos.applyAxisAngle(
            luffAxis,
            -(chordRotationRad + verticeAnglesRad[v]+ Math.PI/2) * dirFact
          );

          // Update positions
          positions[i] = originalPos.x;
          positions[i + 1] = originalPos.y;
          positions[i + 2] = originalPos.z;
        }

      
      }

      // Update geometry and boat parameters
      sailGeometry.attributes.position.needsUpdate = true;
      
      const newBoatParams = {
        ...boatParams,
        mastrotation: rad2grad(mastRotationRad) * dirFact
      };
      
      // Update mast rotation
      if (sailRef.current) {
        sailRef.current.rotateY(
          THREE.MathUtils.degToRad(lastMastRotationRef.current - newBoatParams.mastrotation)
        );
      }

      lastMastRotationRef.current = newBoatParams.mastrotation;
    },[getSignalKValue]);

  return (
    <>
    
    <mesh ref={sailRef} position={[0, 2, -1]}>
      <bufferGeometry {...createSailGeometry.geometry} />
      <group ref={windGroupRef} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
    </>
  );
};

export default Sail3D;

// Helper to create wind cone geometry and material
const createWindCone = () => {
  const windcone = new THREE.Group();
  const geometry = new THREE.ConeGeometry(0.1, 0.2, 12);
  const material = new THREE.MeshStandardMaterial({
    color: oBlue,
    opacity: 0.5,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -0.1, 0);
  windcone.add(mesh);
  return windcone;
};