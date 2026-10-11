'use client';
import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { onRecenter, setCameraMoved } from './hud/viewStore';

/**
 * OrbitControls that tell the HUD when the crew moves the view (so the
 * recenter button can show) and go back to the view's home camera on request.
 *
 * @param {{ home: number[], homeTarget?: number[] }} props  plus OrbitControls props
 *   (homeTarget: the view's fixed orbit target, the origin when absent)
 */
const ORIGIN = [0, 0, 0];

const SceneControls = ({ home, homeTarget, ...props }) => {
    const ref = useRef();
    const { camera, invalidate } = useThree();

    useEffect(() => onRecenter(() => {
        const controls = ref.current;
        camera.position.set(...home);
        const target = homeTarget || ORIGIN;
        if (controls) {
            controls.target.set(...target);
            controls.update();
        } else {
            camera.lookAt(...target);
        }
        invalidate();
    }), [camera, invalidate, home, homeTarget]);

    // A new view starts centred
    useEffect(() => () => setCameraMoved(false), []);

    // `target` only when the view had one: drei applies it on every render,
    // which would undo the crew's panning
    // Moved only when the camera changes during a gesture: a tap (to select a
    // boat) starts a gesture too, and the recenter itself changes the camera
    const gesture = useRef(false);
    return (
        <OrbitControls ref={ref} {...(homeTarget ? { target: homeTarget } : {})}
            onStart={() => { gesture.current = true; }}
            onChange={() => { if (gesture.current) setCameraMoved(true); }}
            onEnd={() => { gesture.current = false; }}
            {...props} />
    );
};

export default SceneControls;
