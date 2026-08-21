import { useMemo } from 'react';
import * as THREE from 'three';
import type { PenSpec } from '../game/pens';

/**
 * A procedural 90s ballpoint.
 *
 * The pen is built along its local +X axis with the nib at +X, so the physics
 * layer can treat "forward" as (1,0,0) and never think about model space.
 * Every part is a lathe of revolution around that axis, which is what a real
 * injection-moulded barrel is too.
 */

const SEG = 24;

function useRadialSegments(style: PenSpec['barrelStyle']) {
  // Hex barrels are the giveaway of a cheap pen, and they read instantly at
  // this camera distance, so it is worth the extra material.
  return style === 'hex' ? 6 : SEG;
}

export function PenModel({
  pen,
  highlight = false,
}: {
  pen: PenSpec;
  highlight?: boolean;
}) {
  const seg = useRadialSegments(pen.barrelStyle);
  const L = pen.length;
  const r = pen.radius;

  const materials = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(pen.bodyColor),
      roughness: pen.transparent ? 0.12 : 0.34,
      metalness: 0.02,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      transparent: pen.transparent,
      opacity: pen.transparent ? 0.62 : 1,
    });
    const cap = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(pen.capColor),
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.6,
    });
    const grip = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pen.gripColor),
      roughness: 0.85,
      metalness: 0.0,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pen.accentColor),
      roughness: 0.4,
      metalness: 0.25,
    });
    const metal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b9bcc4'),
      roughness: 0.28,
      metalness: 0.9,
    });
    const ink = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pen.inkColor),
      roughness: 0.5,
    });
    return { body, cap, grip, accent, metal, ink };
  }, [pen]);

  // Lengths of each section, measured from the nib (+X) backwards.
  const nibLen = L * 0.045;
  const coneLen = L * 0.07;
  const gripLen = pen.hasGrip ? L * 0.17 : L * 0.1;
  const capLen = L * 0.3;
  const barrelLen = L - nibLen - coneLen - gripLen - capLen * 0.42;

  const half = L / 2;
  // x positions of section centres, nib at +half.
  const xNib = half - nibLen / 2;
  const xCone = half - nibLen - coneLen / 2;
  const xGrip = half - nibLen - coneLen - gripLen / 2;
  const xBarrel = half - nibLen - coneLen - gripLen - barrelLen / 2;
  const xCap = -half + capLen / 2;

  const gripR = pen.hasGrip ? r * 1.16 : r * 0.94;
  const capR = r * 1.1;

  // Cylinders are Y-up by default; lay them along X.
  const lay: [number, number, number] = [0, 0, -Math.PI / 2];

  return (
    <group>
      {/* metal nib */}
      <mesh position={[xNib, 0, 0]} rotation={lay} material={materials.metal} castShadow>
        <cylinderGeometry args={[r * 0.14, r * 0.34, nibLen, 10]} />
      </mesh>

      {/* tapering cone into the grip */}
      <mesh position={[xCone, 0, 0]} rotation={lay} material={materials.ink} castShadow>
        <cylinderGeometry args={[r * 0.34, gripR * 0.96, coneLen, seg]} />
      </mesh>

      {/* grip section */}
      <mesh position={[xGrip, 0, 0]} rotation={lay} material={pen.hasGrip ? materials.grip : materials.body} castShadow>
        <cylinderGeometry
          args={[gripR * 0.96, gripR, gripLen, pen.barrelStyle === 'hex' ? 6 : seg]}
        />
      </mesh>

      {/* the barrel itself */}
      <mesh position={[xBarrel, 0, 0]} rotation={lay} material={materials.body} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            pen.barrelStyle === 'tapered' ? r * 0.92 : r,
            r,
            barrelLen,
            seg,
          ]}
        />
      </mesh>

      {/* brand ring — the little printed band every one of these had */}
      <mesh position={[xBarrel + barrelLen * 0.3, 0, 0]} rotation={lay} material={materials.accent}>
        <cylinderGeometry args={[r * 1.03, r * 1.03, L * 0.022, seg]} />
      </mesh>
      <mesh position={[xBarrel - barrelLen * 0.16, 0, 0]} rotation={lay} material={materials.accent}>
        <cylinderGeometry args={[r * 1.02, r * 1.02, L * 0.012, seg]} />
      </mesh>

      {/* posted cap at the tail */}
      <mesh position={[xCap, 0, 0]} rotation={lay} material={materials.cap} castShadow>
        <cylinderGeometry args={[capR, capR * 0.98, capLen, seg]} />
      </mesh>
      {/* rounded cap crown */}
      <mesh position={[-half + capLen * 0.04, 0, 0]} material={materials.cap} castShadow>
        <sphereGeometry args={[capR * 0.99, seg, 10]} />
      </mesh>

      {/* clip */}
      {pen.hasClip && (
        <group position={[xCap + capLen * 0.16, capR * 0.92, 0]}>
          <mesh material={materials.cap} castShadow>
            <boxGeometry args={[capLen * 0.62, r * 0.28, r * 0.7]} />
          </mesh>
          <mesh position={[-capLen * 0.3, -r * 0.2, 0]} material={materials.cap}>
            <boxGeometry args={[r * 0.5, r * 0.55, r * 0.7]} />
          </mesh>
        </group>
      )}

      {highlight && (
        <mesh rotation={lay} position={[0, 0, 0]}>
          <cylinderGeometry args={[r * 1.9, r * 1.9, L * 0.99, 16, 1, true]} />
          <meshBasicMaterial
            color="#ffd98a"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
