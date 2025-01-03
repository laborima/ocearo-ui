/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 scene.gltf --transform 
Files: scene.gltf [17.79KB] > /home/matthieu/becpg-workspace/ocearo/ocearo-ui/public/boats/optimist/assets/scene-transformed.glb [18.61KB] (-5%)
Author: Shunsuke A. (https://sketchfab.com/ShunsukeA.)
License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
Source: https://sketchfab.com/3d-models/optimist-sailboat-8b145c47a10c40b195e79d07f7624e68
Title: optimist sailboat
*/

import React from 'react'
import { useGLTF } from '@react-three/drei'

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';
const modelPath = `${ASSET_PREFIX}/boats/optimist/assets/scene-transformed.glb`;

export function Model(props) {

    const { nodes, materials } = useGLTF(modelPath);
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.sail_sail_0.geometry} material={materials.sail} position={[-0.217, 2.849, 0.938]} rotation={[-Math.PI, 0, Math.PI / 2]} scale={[-5.728, 4.361, 4.361]} />
      <mesh geometry={nodes.tiller_extension_aluminium_0.geometry} material={materials.aluminium} position={[3.9, -4.369, 0.938]} rotation={[-Math.PI / 2, 1.511, Math.PI / 2]} scale={[0.032, 0.032, 1.374]} />
      <mesh geometry={nodes.rubber_joint__0.geometry} material={materials.rubber_joint__0} position={[2.537, -4.483, 0.938]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} scale={[-0.037, 0.056, 0.079]} />
      <mesh geometry={nodes.rudder_body_0.geometry} material={materials.body} position={[5.348, -6.032, 0.938]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[0.016, 1, 1.484]} />
    </group>
  )
}
